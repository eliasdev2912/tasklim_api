const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');






const createMemberInstance = async (userId, spaceId, role, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const memberInstanceQuery = `
      INSERT INTO members_instances (user_id, space_id, user_rol)
      VALUES ($1, $2, $3)
      RETURNING user_id, space_id, user_rol
    `;

    const result = await client.query(memberInstanceQuery, [userId, spaceId, role]);
    return result.rows[0];
  })
};

module.exports = createMemberInstance