const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');



const isMember = async (spaceId, userId) => {
    if (!spaceId || !userId) throw new Error('MISSING_ARGUMENTS')

    const query = `
     SELECT EXISTS (
      SELECT 1 FROM members_instances WHERE user_id = $1 AND space_id = $2
     );`

    try {
        const userExist = await pool.query(query, [userId, spaceId])
        return userExist.rows[0].exists;

    } catch (error) {
        throw error
    }
}

module.exports = {isMember}