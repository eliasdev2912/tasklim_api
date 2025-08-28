const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');





const teamExistsByName = async (teamName, spaceId) => {
  if (!teamName) throw new BadRequestError('Missing arguments: team_name')
  await spaceExistsById.error(spaceId)

  try {
    const teamRes = await pool.query(
      'SELECT id FROM teams WHERE name = $1 AND space_id = $2 LIMIT 1;',
      [teamName, spaceId]
    );
    return teamRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
teamExistsByName.bool = teamExistsByName
teamExistsByName.error = async (teamName, spaceId) => {
  const exists = await teamExistsByName(teamName, spaceId)
  if (!exists) {
    throw new NotFoundError(`team not found with name: ${teamName} in the space with id ${spaceId}`)
  }
}

module.exports = teamExistsByName