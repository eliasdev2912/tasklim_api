const { ConflictError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');

const isMember = require('../validations/isMember')

const leaveSpace = async (userId, spaceId, clientArg) => {
  return runTransaction(clientArg, async (client) => {

    const isMember_ = await isMember(spaceId, userId, client)
    if (!isMember_) throw new ConflictError(`This user (${userId}) is not a member of this space (${spaceId})`)

    const query = `
      DELETE FROM members_instances
      WHERE user_id = $1 AND space_id = $2
    `;
    await client.query(query, [userId, spaceId]);

    return true
  })
}

module.exports = leaveSpace