const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');


const userExistsByEmail = async (email) => {
  if (!email) throw new BadRequestError('Missing arguments: email')

  try {
    const userRes = await pool.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1;',
      [email]
    );
    return userRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
userExistsByEmail.bool = userExistsByEmail
userExistsByEmail.error = async (email) => {
  const exists = await userExistsByEmail(email)
  if (!exists) {
    throw new NotFoundError(`User not found with email: ${email}`)
  }
}

module.exports = userExistsByEmail