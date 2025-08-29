const pool = require('../../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const userExistsById = require('../../users/validations/userExistsById');

const Joi = require('joi')






const createMemberInstance = async (userId, spaceId, role, clientArg = null) => {
  const shouldReleaseClient = !clientArg;
  const client = clientArg || await pool.connect();

  try {
    if (!clientArg) await client.query('BEGIN');

    const memberInstanceQuery = `
      INSERT INTO members_instances (user_id, space_id, user_rol)
      VALUES ($1, $2, $3)
      RETURNING user_id, space_id, user_rol
    `;

    const result = await client.query(memberInstanceQuery, [userId, spaceId, role]);

    if (!clientArg) await client.query('COMMIT');

    return result.rows[0];

  } catch (error) {
    if (!clientArg) await client.query('ROLLBACK');
    throw error;
  } finally {
    if (shouldReleaseClient) client.release();
  }
};

module.exports = createMemberInstance