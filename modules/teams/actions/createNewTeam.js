const pool = require('../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const userExistsById = require('../../users/validations/userExistsById');
const teamExistsByName = require('../validations/teamExistsByName');





const createNewTeam = async (spaceId, teamName, teamDescription, teamColor, teamBannerUrl, teamMembers) => {
  // Validar argumentos y existencias
  await spaceExistsById.error(spaceId)

  const teamExists = await teamExistsByName.bool(teamName, spaceId)
  if (teamExists) throw new ConflictError('Team already exists')

  if (!teamDescription) throw new BadRequestError('Missing arguments: team_description')
  if (!teamColor) throw new BadRequestError('Missing arguments: team_color')
  if (!teamBannerUrl) throw new BadRequestError('Missing arguments: team_banner_url')

  await Promise.all(teamMembers.map(userId => userExistsById.error(userId)));



  const client = await pool.connect();

  const newTeamQuery = `
    INSERT INTO teams (space_id, name, description, color, banner_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `;

  const newTeamMemberQuery = `
    INSERT INTO team_member_instances (team_id, user_id)
    VALUES ($1, $2);
  `;

  try {
    await client.query('BEGIN');

    const uppercaseTeamName = teamName.toUpperCase()
    const result = await client.query(newTeamQuery, [spaceId, uppercaseTeamName, teamDescription, teamColor, teamBannerUrl]);
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

module.exports = createNewTeam