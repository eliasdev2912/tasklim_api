const pool = require('../../../database')



const { NotFoundError } = require("../../../utilities/errorsUtilities");
const getSpaceTags = require('../../tags/queries/getSpaceTags');
const getTasksBySpaceId = require('../../tasks/quieries/getTasksBySpaceId');
const getSpaceTeams = require('../../teams/queries/getSpaceTeams');




const getSpace = async (spaceId) => {
    const parsedSpaceId = parseInt(spaceId, 10);

  try {
    const spaceQuery = `
  SELECT *
  FROM spaces
  WHERE id = $1;
        `;
    const spaceResult = await pool.query(spaceQuery, [parsedSpaceId])

    if (!spaceResult.rows[0] || spaceResult.rowCount == 0) {
      throw new NotFoundError('Space not found')
    }

    const membersQuery = `
  SELECT 
    u.id,
    u.username,
    u.avatarurl,
    m.user_rol AS role
  FROM members_instances m
  JOIN users u ON m.user_id = u.id
  WHERE m.space_id = $1;
`;
    const tablesQuery = `
      SELECT * FROM space_tables st
      JOIN table_task_formats ttf ON ttf.table_id = st.id 
      WHERE space_id = $1
      ORDER BY table_position ASC;      
    `
    const tasks = await getTasksBySpaceId(parsedSpaceId)
    const tags = await getSpaceTags(parsedSpaceId)
    const teams = await getSpaceTeams(parsedSpaceId)

    const membersResult = await pool.query(membersQuery, [parsedSpaceId])
    const tablesResult = await pool.query(tablesQuery, [parsedSpaceId])

    return {
      space: spaceResult.rows[0],
      members: membersResult.rows,
      tables: tablesResult.rows,
      tasks: tasks,
      tags: tags,
      teams: teams
    }

  } catch (error) {
    throw error
  }
}

module.exports = getSpace