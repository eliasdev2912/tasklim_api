const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');


const userExistsByEmail = async (email, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!email) throw new BadRequestError('Missing arguments: email')

    const userRes = await client.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1;',
      [email]
    );
    return userRes.rowCount > 0
  })
}
userExistsByEmail.bool = userExistsByEmail
userExistsByEmail.error = async (email, clientArg = pool) => {
  const exists = await userExistsByEmail(email, clientArg)
  if (!exists) {
    throw new NotFoundError(`User not found with email: ${email}`)
  }
}

module.exports = userExistsByEmail