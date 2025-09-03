const runTransaction = require('../../../utilities/runTransaction');
const getTagsBySpaceId = require('../../tags/queries/getTagsBySpaceId');
const getTasksBySpaceId = require('../../tasks/quieries/getTasksBySpaceId');
const getTeamsBySpaceId = require('../../teams/queries/getTeamsBySpaceId');
const getSpaceMembers = require('../../member_instances/queries/getSpaceMembers');
const { spaceSchema } = require('../spaceSchema');




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
    const tags = await getTagsBySpaceId(spaceId, client)
    const teams = await getTeamsBySpaceId(spaceId, client)
    const members = await getSpaceMembers(spaceId, client)

    const tablesResult = await client.query(tablesQuery, [spaceId])

    const rawSpace = {
      space: spaceResult.rows[0],
      members: members,
      tables: tablesResult.rows,
      tasks: tasks,
      tags: tags,
      teams: teams
    }

    // Validar esquema de 'space'
    const {error, value: space} = spaceSchema.validate(rawSpace)
    if(error) throw error

    return space
  })
}

module.exports = getSpace