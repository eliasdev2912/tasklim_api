const runTransaction = require('../../../utilities/runTransaction');
const getSpaceTags = require('../../tags/queries/getSpaceTags');
const getTasksBySpaceId = require('../../tasks/quieries/getTasksBySpaceId');
const getSpaceTeams = require('../../teams/queries/getSpaceTeams');
const getSpaceMembers = require('../../member_instances/queries/getSpaceMembers');




const getSpace = async (spaceId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    const spaceQuery = `
  SELECT *
  FROM spaces
  WHERE id = $1;
        `;
    const spaceResult = await client.query(spaceQuery, [spaceId])

    const tablesQuery = `
      SELECT * FROM space_tables
      WHERE space_id = $1
      ORDER BY table_position ASC;      
    `
    const tasks = await getTasksBySpaceId(spaceId, client)
    const tags = await getSpaceTags(spaceId, client)
    const teams = await getSpaceTeams(spaceId, client)
    const members = await getSpaceMembers(spaceId, client)

    const tablesResult = await client.query(tablesQuery, [spaceId])

    return {
      space: spaceResult.rows[0],
      members: members,
      tables: tablesResult.rows,
      tasks: tasks,
      tags: tags,
      teams: teams
    }
  })
}

module.exports = getSpace