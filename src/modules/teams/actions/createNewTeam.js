const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const userExistsById = require('../../users/validations/userExistsById');
const getTeamById = require('../queries/getTeamById');
const teamExistsByName = require('../validations/teamExistsByName');





const createNewTeam = async (spaceId, teamName, teamDescription, teamColor, teamBannerUrl, teamMembers) => {
  const teamExists = await teamExistsByName.bool(teamName, spaceId)
  if (teamExists) throw new ConflictError('Team already exists')

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
    const newRawTeam = (await client.query(newTeamQuery, [spaceId, uppercaseTeamName, teamDescription, teamColor, teamBannerUrl])).rows[0];

    for (const userId of teamMembers) {
      await client.query(newTeamMemberQuery, [newTeamId, userId]);
    }

    const newTeam = await getTeamById(newRawTeam.id, client)

    await client.query('COMMIT');
    
    return newTeam;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = createNewTeam