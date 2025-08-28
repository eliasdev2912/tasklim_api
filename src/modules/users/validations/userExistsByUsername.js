const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');





const userExistsByUsername = async (username) => {
  if (!username) throw new BadRequestError('Missing arguments: username')

  try {
    const userRes = await pool.query(
      'SELECT id FROM users WHERE username = $1 LIMIT 1;',
      [username]
    );
    return userRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
userExistsByUsername.bool = userExistsByUsername
userExistsByUsername.error = async (username) => {
  const exists = await userExistsByUsername(username)
  if (!exists) {
    throw new NotFoundError(`User not found with username: ${username}`)
  }
}

module.exports = userExistsByUsername