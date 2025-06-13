const pool = require('../database.js')

const {sendError} = require('./errorsUtilities.js')

const createMemberInstance = async (userId, spaceId, role) => {
    if(!userId || !spaceId || !role) {
        throw new Error('Missing fields: createMemberInstance() require three arguments: userId, spaceId, role')
    }
    try {
        const memberInstanceQuery = `
        INSERT INTO members_instances (user_id, space_id, user_rol)
        VALUES ($1, $2, $3)
        RETURNING user_id, space_id, user_rol
        `

    const result = await pool.query(memberInstanceQuery, [userId, spaceId, role])
    return result.rows[0]
    } catch (error) {
        throw error
    }
}

const isSpaceMember = async (userId, spaceId) => {
    if(!userId || !spaceId) {
    throw new Error('Missing arguments: isSpaceMember(userId, spaceId) expects both userId and spaceId.');
    }

    try {
        const query = `
    SELECT 1 FROM members_instances
    WHERE user_id = $1 AND space_id = $2
    LIMIT 1
  `;
        const result = await pool.query(query, [userId, spaceId])

        return result.rows.length > 0
    } catch (error) {
        throw error
    }
}

module.exports = {createMemberInstance, isSpaceMember}