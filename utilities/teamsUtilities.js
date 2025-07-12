const pool = require('../database.js')

const { sendError } = require('./errorsUtilities.js')


const checkTeamExistsByName = async (teamName) => {
  const query = `
    SELECT EXISTS (
      SELECT 1 FROM teams WHERE name = $1
    ) AS "exists";
  `;

  const result = await pool.query(query, [teamName]);
  return result.rows[0].exists; // true o false
};


const createNewTeam = async (spaceId, teamName, teamDescription, teamColor, teamMembers) => {
  if (!teamName || !teamDescription || !teamColor || !Array.isArray(teamMembers) || teamMembers.length === 0) {
    throw new Error('MISSING_ARGUMENTS');
  }
  if(await checkTeamExistsByName(teamName)) {
    throw new Error('ALREADY_EXIST')
  }

  const client = await pool.connect();

  const newTeamQuery = `
    INSERT INTO teams (space_id, name, description, color)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
  `;

  const newTeamMemberQuery = `
    INSERT INTO team_member_instances (team_id, user_id)
    VALUES ($1, $2);
  `;

  try {
    await client.query('BEGIN');

    const uppercaseTeamName = teamName.toUpperCase()
    const result = await client.query(newTeamQuery, [spaceId, uppercaseTeamName, teamDescription, teamColor]);
    const newTeamId = result.rows[0].id;

    for (const userId of teamMembers) {
      await client.query(newTeamMemberQuery, [newTeamId, userId]);
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getSpaceTeams = async (spaceId) => {
  if (!spaceId) {
    throw new Error('MISSING_ARGUMENTS');
  }

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


const getTeamById = async (teamId) => {
  if (!teamId) {
    throw new Error('MISSING_ARGUMENTS');
  }

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
    await client.query('BEGIN');

    // 1. Obtener el equipo
    const teamResult = await client.query(teamQuery, [teamId]);
    const team = teamResult.rows[0];

    if (!team) {
      throw new Error('TEAM_NOT_FOUND');
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



module.exports = { createNewTeam, getSpaceTeams, getTeamById }