const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');



const userExistsByUsername = async (username, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
     if (!username) throw new BadRequestError('Missing arguments: username')

    const userRes = await client.query(
      'SELECT id FROM users WHERE username = $1 LIMIT 1;',
      [username]
    );
    return userRes.rowCount > 0
  })
}
userExistsByUsername.bool = userExistsByUsername
userExistsByUsername.error = async (username, clientArg = pool) => {
  const exists = await userExistsByUsername(username, clientArg)
  if (!exists) {
    throw new NotFoundError(`User not found with username: ${username}`)
  }
}

module.exports = userExistsByUsername