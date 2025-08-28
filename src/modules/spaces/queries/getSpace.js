const pool = require('../../../../database')



const { NotFoundError } = require("../../../utilities/errorsUtilities");
const getSpaceTags = require('../../tags/queries/getSpaceTags');
const getTasksBySpaceId = require('../../tasks/quieries/getTasksBySpaceId');
const getSpaceTeams = require('../../teams/queries/getSpaceTeams');
const getSpaceMembers = require('./getSpaceMembers');




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

    
    const tablesQuery = `
      SELECT * FROM space_tables
      WHERE space_id = $1
      ORDER BY table_position ASC;      
    `
    const tasks = await getTasksBySpaceId(spaceId)
    const tags = await getSpaceTags(spaceId)
    const teams = await getSpaceTeams(spaceId)
    const members = await getSpaceMembers(spaceId)

    const tablesResult = await pool.query(tablesQuery, [spaceId])

    return {
      space: spaceResult.rows[0],
      members: members,
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