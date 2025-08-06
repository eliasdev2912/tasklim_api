const pool = require('../../../database.js')
const userExistsById = require("../../users/validations/userExistsById");
const spaceExistsById = require("./spaceExistsById");

const isMember = async (spaceId, userId) => {
  // Validar existencia y argumentos
  await Promise.all([
    spaceExistsById.error(spaceId),
    userExistsById.error(userId)
  ])

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