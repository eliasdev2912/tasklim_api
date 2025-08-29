const pool = require('../../../../database');
const { NotFoundError } = require('../../../utilities/errorsUtilities');
const getTaskComments = require('../../comments/queries/getTaskComments');




const getTaskById = async (taskId, clientArg) => {
  const externalClient = !!clientArg
  const client = clientArg || await pool.connect();

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
        'avatarurl', u.avatarurl,
        'role', mi.user_rol
      )
      FROM users u
      LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = t.space_id
      WHERE u.id = t.created_by
    ) AS created_by

  FROM tasks t
  WHERE t.id = $1
`;

const tableQuery = `
SELECT table_id FROM tasks WHERE id = $1;
`
const tagsQuery = `
SELECT tg.id, tg.name, tg.color
FROM task_tags tt
JOIN tags tg ON tg.id = tt.tag_id
WHERE tt.task_id = $1;
`
const assigneesQuery = `
SELECT 
    tea.id,
    tea.name,
    tea.color,
    tea.description,
    tea.banner_url
FROM task_team_assignments tta
LEFT JOIN teams tea ON tta.team_id = tea.id
WHERE tta.task_id = $1;
`

  try {

    if (!externalClient) await client.query('BEGIN')

    const content = (await client.query(taskContentQuery, [taskId])).rows[0];
    const metadata = (await client.query(taskMetadataQuery, [taskId])).rows[0];
    const tableResult = (await client.query(tableQuery, [taskId])).rows[0].table_id
    const tagsResult = (await client.query(tagsQuery, [taskId])).rows
    const assigneesResult = (await client.query(assigneesQuery, [taskId])).rows
    const comments = await getTaskComments(taskId, client);

    const relations = {table_id: tableResult, tags: tagsResult, comments, assignees: assigneesResult}
    
    if (!externalClient) await client.query('COMMIT')

    if(!content ||  !metadata || !relations) {
      throw new NotFoundError('Task not found')
    } 

    return {content, metadata, relations};
  } catch (error) {
    if (!externalClient) await client.query('ROLLBACK')
    throw error
  } finally {
    if (!externalClient) client.release()
  }
}

module.exports = getTaskById