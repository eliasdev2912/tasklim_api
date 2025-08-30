const runTransaction = require('../../../utilities/runTransaction');




const getTasksBySpaceId = async (spaceId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
  // Queries base, se parametrizan con cada task.id individualmente
  const taskContentQuery = `
    SELECT title, description, body, due_date FROM tasks t WHERE id = $1;
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

    return results;
  })
};

module.exports = getTasksBySpaceId