const Joi = require('joi');
const runTransaction = require('../../../utilities/runTransaction');
const { teamSchema } = require('../teamSchema');


const getTeamsBySpaceId = async (spaceId, clientArg) => {
  return runTransaction(clientArg, async (client) => {

    const teamsQuery = `
  SELECT
  t.id,
  t.name,
  t.color,
  t.description,
  t.banner_url,
  COALESCE(json_agg(
    json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'avatarurl', u.avatarurl,
      'role', mi.user_rol
    )
  ) FILTER (WHERE u.id IS NOT NULL), '[]') AS members
FROM teams t
LEFT JOIN team_member_instances tmi ON tmi.team_id = t.id
LEFT JOIN users u ON tmi.user_id = u.id
LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = $1
WHERE t.space_id = $1
GROUP BY t.id;
`;


    const teamsResult = await client.query(teamsQuery, [spaceId]);
    const rawTeams = teamsResult.rows;

    // Validar esquema de 'teams'
    const teamArraySchema = Joi.array().items(teamSchema).default([]).required()
    const {error, value: teams} = teamArraySchema.validate(rawTeams)
    if(error) throw error

    return teams
  })
}


module.exports = getTeamsBySpaceId