const runTransaction = require('../../../utilities/runTransaction');


const getSpaceTeams = async (spaceId, clientArg) => {
  return runTransaction(clientArg, async (client) => {

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

    const teamsResult = await client.query(teamsQuery, [spaceId]);
    const teams = teamsResult.rows;

    const membersResult = await client.query(membersQuery, [spaceId]);
    const allMembers = membersResult.rows;

    const teamsWithMembers = teams.map(team => {
      const members = allMembers.filter(m => m.team_id === team.id);
      return {
        ...team,
        members,
      };
    });

    return teamsWithMembers
  })
}


module.exports = getSpaceTeams