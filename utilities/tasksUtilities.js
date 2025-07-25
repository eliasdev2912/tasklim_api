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

  const client = await pool.connect()

  const taskContentQuery = `
    SELECT title, description, body FROM tasks WHERE id = $1;
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

const taskRelationsQuery = `
  SELECT 
    t.table_id,

    -- TAGS
    COALESCE((
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
    ), '[]'::json) AS tags,

    -- COMMENTS
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', tc.id,
          'created_by', json_build_object(
            'id', u.id,
            'username', u.username,
            'avatarurl', u.avatarurl
          ),
          'body', tc.body,
          'created_at', tc.created_at
        )
      )
      FROM task_comments tc
      LEFT JOIN users u ON u.id = tc.user_id 
      WHERE tc.task_id = t.id
    ), '[]'::json) AS comments,

      -- ASSIGNEES
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', tea.id,
          'name', tea.name,
          'color', tea.color,
          'description', tea.description,
          'banner_url', tea.banner_url
        )
      )
      FROM task_team_assignments tta
      LEFT JOIN teams tea ON tta.team_id = tea.id 
      WHERE tta.task_id = t.id
    ), '[]'::json) AS assignees

  FROM tasks t
  WHERE t.id = $1
`

  try {

    await client.query('BEGIN')

    const content = (await client.query(taskContentQuery, [taskId])).rows[0];
    const metadata = (await client.query(taskMetadataQuery, [taskId])).rows[0];
    const relations = (await client.query(taskRelationsQuery, [taskId])).rows[0];
    
    await client.query('COMMIT')

    return {content, metadata, relations};
  } catch (error) {
    await client.query('ROLLBACK')
    console.log(error)
    throw error
  } finally {
    client.release()
  }
}
const getTasksBySpaceId = async (spaceId) => {
  if (!spaceId) throw new Error('MISSING_ARGUMENTS');

  const client = await pool.connect();

  // Queries base, se parametrizan con cada task.id individualmente
  const taskContentQuery = `
    SELECT title, description, body FROM tasks t WHERE id = $1;
  `;

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
        LEFT JOIN members_instances mi 
          ON mi.user_id = u.id AND mi.space_id = t.space_id
        WHERE u.id = t.created_by
      ) AS created_by

    FROM tasks t
    WHERE t.id = $1;
  `;

 const taskRelationsQuery = `
  SELECT 
    t.table_id,

    -- TAGS
    COALESCE((
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
    ), '[]'::json) AS tags,

    -- COMMENTS
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', tc.id,
          'created_by', json_build_object(
            'id', u.id,
            'username', u.username,
            'avatarurl', u.avatarurl
          ),
          'body', tc.body,
          'created_at', tc.created_at
        )
      )
      FROM task_comments tc
      LEFT JOIN users u ON u.id = tc.user_id 
      WHERE tc.task_id = t.id
    ), '[]'::json) AS comments,

    -- ASSIGNEES
    COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', tea.id,
          'name', tea.name,
          'color', tea.color,
          'description', tea.description,
          'banner_url', tea.banner_url
        )
      )
      FROM task_team_assignments tta
      LEFT JOIN teams tea ON tta.team_id = tea.id 
      WHERE tta.task_id = t.id
    ), '[]'::json) AS assignees

  FROM tasks t
  WHERE t.id = $1
`


  try {
    await client.query('BEGIN');

    // Obtener todas las tareas del espacio
    const tasks = (await client.query(`
      SELECT id FROM tasks WHERE space_id = $1 ORDER BY updated_at DESC;
    `, [spaceId])).rows;

    // Ejecutar consultas paralelas para cada tarea
    const results = await Promise.all(tasks.map(async ({ id }) => {
      const [contentRes, metadataRes, relationsRes] = await Promise.all([
        client.query(taskContentQuery, [id]),
        client.query(taskMetadataQuery, [id]),
        client.query(taskRelationsQuery, [id]),
      ]);

      return {
        content: contentRes.rows[0],
        metadata: metadataRes.rows[0],
        relations: relationsRes.rows[0],
      };
    }));

    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    throw error;
  } finally {
    client.release();
  }
};

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


// ASSIGNEES

const addAssignee = async (taskId, teamId) => {
  if(!taskId || !teamId) throw new Error('MISSING_ARGUMENTS')

  const query = `
  INSERT INTO task_team_assignments (task_id, team_id)
  VALUES ($1, $2);
  `
  try {
    await pool.query(query, [taskId, teamId])
  } catch (error) {
    throw error
  }
}
const deleteAssignee = async (taskId, teamId) => {
  if(!taskId || !teamId) throw new Error('MISSING_ARGUMENTS')

  const query = `
  DELETE FROM task_team_assignments WHERE task_id = $1 AND team_id = $2
  `
  try {
    await pool.query(query, [taskId, teamId])
  } catch (error) {
    throw error
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
  setTaskContent,
  addAssignee,
  deleteAssignee
}; 
