const pool = require('../../../database');
const teamExistsById = require('../validations/teamExistsById');








const getTeamById = async (teamId) => {
  const client = await pool.connect();

  const teamQuery = `SELECT * FROM teams WHERE id = $1`;

  const membersQuery = `
    SELECT
      u.id AS user_id,
      u.username,
      u.avatarurl,
      mi.user_rol AS role
    FROM team_member_instances tmi
    JOIN users u ON u.id = tmi.user_id
    JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = $2
    WHERE tmi.team_id = $1
  `;

  try {
    await teamExistsById.error(teamId)

    await client.query('BEGIN');

    // 1. Obtener el equipo
    const teamResult = await client.query(teamQuery, [teamId]);
    const team = teamResult.rows[0];

    if (!team) {
    await client.query('ROLLBACK');
    return undefined;
  }

    // 2. Obtener los miembros del equipo usando el space_id del team
    const membersResult = await client.query(membersQuery, [teamId, team.space_id]);
    const members = membersResult.rows;

    await client.query('COMMIT');

    return {
      ...team,
      members,
    };

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};


module.exports = getTeamById