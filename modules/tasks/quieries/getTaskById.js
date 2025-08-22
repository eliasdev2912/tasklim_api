const pool = require('../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');




const getTaskById = async (taskId) => {
  // Validar argumentos
  if(!taskId) throw new BadRequestError('Missing arguments: task_id')

  const client = await pool.connect()

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

    if(!content ||  !metadata || !relations) {
      throw new NotFoundError('Task not found')
    } 

    return {content, metadata, relations};
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = getTaskById