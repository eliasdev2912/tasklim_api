const pool = require('../../../../database.js')
const runTransaction = require('../../../utilities/runTransaction.js')


const getSpaceMembers = async (spaceId, clientArg = pool) => {
    return runTransaction(clientArg, async (client) => {
        const membersQuery = `
  SELECT 
    u.id,
    u.username,
    u.avatarurl,
    m.user_rol AS role
  FROM members_instances m
  JOIN users u ON m.user_id = u.id
  WHERE m.space_id = $1;
            `;
        const members = await client.query(membersQuery, [spaceId])
        return members.rows
    })
}
module.exports = getSpaceMembers