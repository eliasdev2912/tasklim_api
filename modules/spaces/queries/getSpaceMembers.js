const pool = require('../../../database.js')


const getSpaceMembers = async (spaceId) => {
    try {
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
    
        const members = await pool.query(membersQuery, [spaceId])
        return members.rows
    } catch (error) {
        throw error
    }
}
module.exports = getSpaceMembers