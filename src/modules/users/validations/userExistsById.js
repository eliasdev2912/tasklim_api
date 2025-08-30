const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');


const userExistsById = async (userId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!userId) throw new BadRequestError('Missing arguments: user_id')

    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 LIMIT 1;',
      [userId]
    );
    return userRes.rowCount > 0
  })
}
userExistsById.bool = userExistsById
userExistsById.error = async (userId) => {
  const exists = await userExistsById(userId)
  if (!exists) {
    throw new NotFoundError(`User not found with id: ${userId}`)
  }
}

module.exports = userExistsById