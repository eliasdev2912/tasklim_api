const { NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');
const getTaskComments = require('../../comments/queries/getTaskComments');
const { taskSchema } = require('../taskSchema');
const getTaskAssignees = require('./getTaskAssignees');




const getTaskById = async (taskId, clientArg) => {
  return runTransaction(clientArg, async (client) => {

    const taskContentQuery = `
    SELECT title, description, body, due_date FROM tasks WHERE id = $1;
    `
    const taskMetadataQuery = `
  SELECT 
    t.id,
    t.created_at,
    t.updated_at,

    (
      SELECT json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'avatarurl', u.avatarurl,
        'role', mi.user_rol
      )
      FROM users u
      LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = t.space_id
      WHERE u.id = t.created_by
    ) AS created_by

  FROM tasks t
  WHERE t.id = $1
    `

    const tableQuery = `
SELECT table_id FROM tasks WHERE id = $1;
    `
    const tagsQuery = `
SELECT tg.id, tg.name, tg.color, tg.space_id
FROM task_tags tt
JOIN tags tg ON tg.id = tt.tag_id
WHERE tt.task_id = $1;
    `
  

    const content = (await client.query(taskContentQuery, [taskId])).rows[0];
    const metadata = (await client.query(taskMetadataQuery, [taskId])).rows[0];
    const tableResult = (await client.query(tableQuery, [taskId])).rows[0].table_id
    const tagsResult = (await client.query(tagsQuery, [taskId])).rows
    const assignees = await getTaskAssignees(taskId, client)
    const comments = await getTaskComments(taskId, client);

    const relations = { table_id: tableResult, tags: tagsResult, comments, assignees }

    const rawTask = { content, metadata, relations }

    // Validar esquema 
    const { error, value: task } = taskSchema.validate(rawTask)
    if(error) throw error 

    return task;
  })
}

module.exports = getTaskById