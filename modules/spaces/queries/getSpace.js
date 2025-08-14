const pool = require('../../../database')



const { NotFoundError } = require("../../../utilities/errorsUtilities");
const getSpaceTags = require('../../tags/queries/getSpaceTags');
const getTasksBySpaceId = require('../../tasks/quieries/getTasksBySpaceId');
const getSpaceTeams = require('../../teams/queries/getSpaceTeams');




const getSpace = async (spaceId) => {
  try {
    const spaceQuery = `
  SELECT *
  FROM spaces
  WHERE id = $1;
        `;
    const spaceResult = await pool.query(spaceQuery, [spaceId])

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
    const tasks = await getTasksBySpaceId(spaceId)
    const tags = await getSpaceTags(spaceId)
    const teams = await getSpaceTeams(spaceId)

    const membersResult = await pool.query(membersQuery, [spaceId])
    const tablesResult = await pool.query(tablesQuery, [spaceId])

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