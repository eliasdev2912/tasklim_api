const pool = require('../../../../database');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');




const getSpaceTeams = async (spaceId) => {
  // Validar argumento y existencia
  await spaceExistsById.error(spaceId)

  const client = await pool.connect()

  const teamsQuery = `SELECT * FROM teams WHERE space_id = $1`;

  const membersQuery = `
  SELECT
    tmi.team_id,
    u.id AS user_id,
    u.username,
    u.avatarurl,
    mi.user_rol AS role
  FROM team_member_instances tmi
  JOIN users u ON tmi.user_id = u.id
  JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = $1
  WHERE tmi.team_id IN (
    SELECT id FROM teams WHERE space_id = $1
  );
`;

  try {
    await client.query('BEGIN')

    const teamsResult = await client.query(teamsQuery, [spaceId]);
    const teams = teamsResult.rows;

    const membersResult = await pool.query(membersQuery, [spaceId]);
    const allMembers = membersResult.rows;

    const teamsWithMembers = teams.map(team => {
      const members = allMembers.filter(m => m.team_id === team.id);
      return {
        ...team,
        members,
      };
    });

    await client.query('COMMIT')

    return teamsWithMembers

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}


module.exports = getSpaceTeams