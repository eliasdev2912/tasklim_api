const pool = require('../../../../database.js');
const runTransaction = require('../../../utilities/runTransaction.js');

const isMember = async (spaceId, userId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const memberRes = await client.query(
      `SELECT EXISTS (
        SELECT 1 FROM members_instances 
        WHERE user_id = $1 AND space_id = $2
      ) AS is_member;`,
      [userId, spaceId]
    );

    return memberRes.rows[0].is_member;
  })
};


module.exports = isMember