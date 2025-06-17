const pool = require('../database.js')

const { v4: uuidv4 } = require('uuid');

const getTaskById = async (taskId) => {
  if (!taskId) throw new Error('MISSING_ARGUMENTS')

  const taskQuery = `
SELECT 
  t.id,
  t.space_id,
  t.title,
  t.description,
  t.body,
  t.created_at,
  t.updated_at,
  t.table_id,

  -- Tags: subquery aislada para evitar cross join con comments
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', tt.id,
          'color', tt.color,
          'name', tt.name,
          'task_id', tt.task_id
        )
      )
      FROM task_tags tt
      WHERE tt.task_id = t.id
    ),
    '[]'
  ) AS tags,

  -- Creador
  json_build_object(
    'id', u.id,
    'username', u.username,
    'role', mi.user_rol,
    'avatarurl', u.avatarurl
  ) AS created_by,

  -- Comments: subquery aislada para evitar cross join con tags
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', tc.id,
          'task_id', tc.task_id,
          'user_id', cu.id,
          'user_name', cu.username,
          'user_avatarurl', cu.avatarurl,
          'body', tc.body
        )
      )
      FROM task_comments tc
      JOIN users cu ON tc.user_id = cu.id
      WHERE tc.task_id = t.id
    ),
    '[]'
  ) AS comments

FROM tasks t
JOIN users u ON t.created_by = u.id
LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = t.space_id

WHERE t.id = $1;

        `

  try {
    const { rows } = await pool.query(taskQuery, [taskId]);
    return rows[0]; // Una sola tarea
  } catch (error) {
    throw error
  }
}
const getTasksBySpaceId = async (spaceId) => {
  if (!spaceId) throw new Error('MISSING_ARGUMENTS')


  const tasksQuery = `
SELECT 
  t.id,
  t.space_id,
  t.title,
  t.description,
  t.body,
  t.created_at,
  t.updated_at,
  t.table_id,

  -- Tags: subquery aislada
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', tt.id,
          'color', tt.color,
          'name', tt.name,
          'task_id', tt.task_id
        )
      )
      FROM task_tags tt
      WHERE tt.task_id = t.id
    ),
    '[]'
  ) AS tags,

  -- Creador de la tarea
  json_build_object(
    'id', u.id,
    'username', u.username,
    'role', mi.user_rol,
    'avatarurl', u.avatarurl
  ) AS created_by,

  -- Comments: subquery aislada
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', tc.id,
          'task_id', tc.task_id,
          'user_id', cu.id,
          'user_name', cu.username,
          'user_avatarurl', cu.avatarurl,
          'body', tc.body
        )
      )
      FROM task_comments tc
      JOIN users cu ON tc.user_id = cu.id
      WHERE tc.task_id = t.id
    ),
    '[]'
  ) AS comments

FROM tasks t
JOIN users u ON t.created_by = u.id
LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = t.space_id

WHERE t.space_id = $1::integer

ORDER BY t.updated_at DESC;

`

  try {
    const { rows } = await pool.query(tasksQuery, [spaceId]);
    return rows; // Lista de tareas
  } catch (error) {
    throw error
  }
}
const setNewComment = async (taskId, userId, body) => {
  if (!taskId || !userId || !body) throw new Error('MISSING_ARGUMENTS')


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
  if (!taskId) throw new Error('MISSING_ARGUMENTS')


  const query = `
    DELETE FROM tasks WHERE id = $1
  `

  try {
    await pool.query(query, [taskId])
  } catch (error) {
    throw error
  }
}

const createTaskTag = async (taskId, tagName, tagColor) => {
  if (!taskId || !tagName || !tagColor) throw new Error('MISSING_ARGUMENTS')

  const query =
    `
    INSERT INTO task_tags (id, name, color, task_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `
  const newTagId = uuidv4()

  try {

    const newTag = await pool.query(query, [newTagId, tagName, tagColor, taskId])
    return newTag.rows[0]

  } catch (error) {
    throw error
  }
}

module.exports = { getTaskById, getTasksBySpaceId, setNewComment, deleteTaskById, createTaskTag }; 
