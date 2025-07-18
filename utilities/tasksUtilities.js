const pool = require('../database.js')

const { v4: uuidv4 } = require('uuid');

// MAIN
const touchTask = async (taskId) => {
  if (!taskId) throw new Error('MISSING_ARGUMENTS')

  const updateTaskQuery = `
        UPDATE tasks
        SET updated_at = NOW()
        WHERE id = $1;
        
        `
  try {
    await pool.query(updateTaskQuery, [taskId])

    const updatedTask = await getTaskById(taskId)
    return updatedTask

  } catch (error) {
    throw error
  }
}
const taskExists = async (taskId) => {
  if (!taskId) throw new Error('TASK_ID_IS_REQUIRED');

  const query = `
    SELECT EXISTS (
      SELECT 1 FROM tasks WHERE id = $1
    )
  `;

  const result = await pool.query(query, [taskId]);
  return result.rows[0].exists; // ✅ esto es true o false
};
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
        'id', tg.id,
        'color', tg.color,
        'name', tg.name
      )
    )
    FROM task_tags tt
    JOIN tags tg ON tg.id = tt.tag_id
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
          'body', tc.body,
          'created_at', tc.created_at
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

-- Tags: solo los asociados a esta tarea
COALESCE(
  (
    SELECT json_agg(
      json_build_object(
        'id', tg.id,
        'color', tg.color,
        'name', tg.name
      )
    )
    FROM task_tags tt
    JOIN tags tg ON tg.id = tt.tag_id
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

// CONTENT
const setTaskContent = async (taskId, newTitle, newDescription, newBody) => {
  if (!taskId || !newTitle) {
    throw new Error('MISSING_REQUIRED_FIELDS')
  }

  const query = `
  UPDATE tasks
  SET 
   title = $2,
   description = $3,
   body = $4,
   updated_at = NOW()
  WHERE id = $1;
  `

  try {
    await pool.query(query, [taskId, newTitle, newDescription, newBody])
    const updatedTask = await getTaskById(taskId)
    return updatedTask
  } catch (error) {
    throw error
  }
}

// COMMENTS
const setNewComment = async (taskId, userId, body) => {
  if (!taskId || !userId || !body) throw new Error('MISSING_ARGUMENTS')

  const client = await pool.connect();

  const commentQuery = `
    INSERT INTO task_comments (
      task_id, user_id, body
    ) VALUES ( $1, $2, $3 )
  `
  try {

    await client.query('BEGIN');

    await client.query(commentQuery, [taskId, userId, body])
    await touchTask(taskId)

    await client.query('COMMIT');

    const task = await getTaskById(taskId)

    return task

  } catch (error) {
    await client.query('ROLLBACK');
    throw error
  } finally {
    client.release()
  }
}
const getCommentById = async (commentId) => {
  if (!commentId) throw new Error('MISSING_ARGUMENTS')

  const query = `SELECT * FROM task_comments WHERE id = $1`

  try {
    const comment = await pool.query(query, [commentId])
    return comment.rows[0]
  } catch (error) {
    throw error
  }
}
const deleteCommentById = async (commentId) => {
  if (!commentId) throw new Error('MISSING_ARGUMENTS')

  const query = `DELETE FROM task_comments WHERE id = $1`

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const comment = await getCommentById(commentId)
    const taskId = comment.task_id

    await pool.query(query, [commentId])
    await touchTask(taskId)

    await client.query('COMMIT');

    return await getTaskById(taskId)
  } catch (error) {
    await client.query('ROLLBACK');
    throw error
  } finally {
    client.release()
  }
}







module.exports = {
  getTaskById,
  getTasksBySpaceId,
  setNewComment,
  deleteCommentById,
  deleteTaskById,
  taskExists,
  touchTask,
  setTaskContent
}; 
