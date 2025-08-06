const pool = require('../../../database');
const { ConflictError } = require('../../../utilities/errorsUtilities');

const isMember = require('../validations/isMember')

const leaveSpace = async (userId, spaceId) => {
  try {
    const isMember_ = await isMember(spaceId, userId)
    if(!isMember_) throw new ConflictError(`This user (${userId}) is not a member of this space (${spaceId})`)

    const query = `
      DELETE FROM members_instances
      WHERE user_id = $1 AND space_id = $2
    `;
    await pool.query(query, [userId, spaceId]);

    return true
  } catch (error) {
    throw error
  }
}

module.exports = leaveSpace