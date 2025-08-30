const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');





const teamExistsByName = async (teamName, spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!teamName) throw new BadRequestError('Missing arguments: team_name')
    await spaceExistsById.error(spaceId, client)

      const teamRes = await client.query(
        'SELECT id FROM teams WHERE name = $1 AND space_id = $2 LIMIT 1;',
        [teamName, spaceId]
      );
      return teamRes.rowCount > 0
  })
}
teamExistsByName.bool = teamExistsByName
teamExistsByName.error = async (teamName, spaceId, clientArg = pool) => {
  const exists = await teamExistsByName(teamName, spaceId, clientArg)
  if (!exists) {
    throw new NotFoundError(`team not found with name: ${teamName} in the space with id ${spaceId}`)
  }
}

module.exports = teamExistsByName