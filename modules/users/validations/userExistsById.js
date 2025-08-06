const pool = require('../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');


const userExistsById = async (userId) => {
  if (!userId) throw new BadRequestError('Missing arguments: user_id')

  try {
    const userRes = await pool.query(
      'SELECT id FROM users WHERE id = $1 LIMIT 1;',
      [userId]
    );
    return userRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
userExistsById.bool = userExistsById
userExistsById.error = async (userId) => {
  const exists = await userExistsById(userId)
  if (!exists) {
    throw new NotFoundError(`User not found with id: ${userId}`)
  }
}

module.exports = userExistsById