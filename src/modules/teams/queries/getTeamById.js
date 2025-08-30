const { NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');



const getTeamById = async (teamId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
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

    // 1. Obtener el equipo
    const teamResult = await client.query(teamQuery, [teamId]);
    const team = teamResult.rows[0];

    if (!team) {
      throw new NotFoundError('Team not found')
    }

    // 2. Obtener los miembros
    const membersResult = await client.query(membersQuery, [teamId, team.space_id]);
    const members = membersResult.rows;

    return {
      ...team,
      members,
    };
  })
};



module.exports = getTeamById