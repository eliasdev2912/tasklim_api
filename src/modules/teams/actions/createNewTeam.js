const { ConflictError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');
const getTeamById = require('../queries/getTeamById');
const teamExistsByName = require('../validations/teamExistsByName');





const createNewTeam = async (spaceId, teamName, teamDescription, teamColor, teamBannerUrl, teamMembers, clientArg) => {
  return runTransaction(clientArg, async(client) => {
    const teamExists = await teamExistsByName.bool(teamName, spaceId, client)
  if (teamExists) throw new ConflictError('Team already exists')

  const newTeamQuery = `
    INSERT INTO teams (space_id, name, description, color, banner_url)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `;
  const newTeamMemberQuery = `
    INSERT INTO team_member_instances (team_id, user_id)
    VALUES ($1, $2);
  `;

    const uppercaseTeamName = teamName.toUpperCase()
    const newRawTeam = (await client.query(newTeamQuery, [spaceId, uppercaseTeamName, teamDescription, teamColor, teamBannerUrl])).rows[0];

    for (const userId of teamMembers) {
      await client.query(newTeamMemberQuery, [newRawTeam.id, userId]);
    }

    const newTeam = await getTeamById(newRawTeam.id, client)

    return newTeam;
  })
};

module.exports = createNewTeam