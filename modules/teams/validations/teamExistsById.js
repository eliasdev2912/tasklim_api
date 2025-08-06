const pool = require('../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');



const teamExistsById = async (teamId) => {
  if (!teamId) throw new BadRequestError('Missing arguments: team_id')

  try {
    const teamRes = await pool.query(
      'SELECT id FROM teams WHERE id = $1 LIMIT 1;',
      [teamId]
    );
    return teamRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
teamExistsById.bool = teamExistsById
teamExistsById.error = async (teamId) => {
  const exists = await teamExistsById(teamId)
  if (!exists) {
    throw new NotFoundError(`team not found with id: ${teamId}`)
  }
}

module.exports = teamExistsById