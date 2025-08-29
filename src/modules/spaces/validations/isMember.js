const pool = require('../../../../database.js')

const isMember = async (spaceId, userId) => {
  try {
    // 3. Verificar si el usuario es miembro del espacio
    const memberRes = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM members_instances 
        WHERE user_id = $1 AND space_id = $2
      ) AS is_member;`,
      [userId, spaceId]
    );

    return memberRes.rows[0].is_member;

  } catch (err) {
    throw err;
  }
};


module.exports = isMember