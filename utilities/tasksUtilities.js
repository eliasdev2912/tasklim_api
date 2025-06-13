const pool = require('../database.js')



const getTaskById = async (taskId) => {
  const taskQuery = `
SELECT 
  t.id,
  t.space_id,
  t.title,
  t.description,
  t.body,
  t.created_at,
  t.table_id,

  json_build_object(
    'id', u.id,
    'username', u.username,
    'role', mi.user_rol,
    'avatarurl', u.avatarurl
  ) AS created_by,

  COALESCE(
    json_agg(
      json_build_object(
        'id', tc.id,
        'task_id', tc.task_id,
        'user_id', cu.id,
        'user_name', cu.username,
        'user_avatarurl', cu.avatarurl,
        'body', tc.body
      )
    ) FILTER (WHERE tc.id IS NOT NULL),
    '[]'
  ) AS comments

FROM tasks t
JOIN users u ON t.created_by = u.id
LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = t.space_id
LEFT JOIN task_comments tc ON tc.task_id = t.id
LEFT JOIN users cu ON tc.user_id = cu.id

WHERE t.id = $1
GROUP BY t.id, t.space_id, t.body, t.created_at, u.id, u.username, u.avatarurl, mi.user_rol

        `

  try {
    const { rows } = await pool.query(taskQuery, [taskId]);
    return rows[0]; // Una sola tarea
  } catch (error) {
    throw error
  }
}
const getTasksBySpaceId = async (spaceId) => {
  const tasksQuery = `
SELECT 
  t.id,
  t.space_id,
  t.title,
  t.description,
  t.body,
  t.created_at,
  t.table_id,

  json_build_object(
    'id', u.id,
    'username', u.username,
    'role', mi.user_rol,
    'avatarurl', u.avatarurl
  ) AS created_by,

  COALESCE(
    json_agg(
      json_build_object(
        'id', tc.id,
        'task_id', tc.task_id,
        'user_id', cu.id,
        'user_name', cu.username,
        'user_avatarurl', cu.avatarurl,
        'body', tc.body
      )
    ) FILTER (WHERE tc.id IS NOT NULL),
    '[]'
  ) AS comments

FROM tasks t
JOIN users u ON t.created_by = u.id
LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = t.space_id
LEFT JOIN task_comments tc ON tc.task_id = t.id
LEFT JOIN users cu ON tc.user_id = cu.id

WHERE t.space_id = $1::integer
GROUP BY t.id, t.space_id, t.body, t.created_at, u.id, u.username, u.avatarurl, mi.user_rol
        `

  try {
    const { rows } = await pool.query(tasksQuery, [spaceId]);
    return rows; // Lista de tareas
  } catch (error) {
    throw error
  }
}
const setNewComment = async (taskId, userId, body) => {

  const commentQuery = `
    INSERT INTO task_comments (
      task_id, user_id, body
    ) VALUES ( $1, $2, $3 )
  `
  try {
    await pool.query(commentQuery, [taskId, userId, body])
    const task = await getTaskById(taskId)
    return task

  } catch (error) {
    throw error
  }
}
const deleteTaskById = async (taskId) => {
  const query = `
    DELETE FROM tasks WHERE id = $1
  `

  try {
    await pool.query(query, [taskId])
  } catch (error) {
    throw error
  }
}

module.exports = {getTaskById, getTasksBySpaceId, setNewComment, deleteTaskById}; 
