const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');



const teamExistsById = async (teamId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!teamId) throw new BadRequestError('Missing arguments: team_id')

    const teamRes = await client.query(
      'SELECT id FROM teams WHERE id = $1 LIMIT 1;',
      [teamId]
    );
    return teamRes.rowCount > 0
  })
}

teamExistsById.bool = teamExistsById

teamExistsById.error = async (teamId, clientArg = pool) => {
  const exists = await teamExistsById(teamId, clientArg)
  if (!exists) {
    throw new NotFoundError(`team not found with id: ${teamId}`)
  }
}

module.exports = teamExistsById