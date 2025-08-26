const isMember = require('../src/modules/spaces/validations/isMember.js');
const spaceExistsById = require('../src/modules/spaces/validations/spaceExistsById.js');
const userExistsById = require('../src/modules/users/validations/userExistsById.js');
const { ForbiddenError } = require('../src/utilities/errorsUtilities.js');


async function ensureSpaceMember(req, res, next) {
  const userId = req.user.id;  // viene del verifyToken
  const spaceId = req.params.space_id;
  try {
    await Promise.all([
      userExistsById.error(userId),
      spaceExistsById.error(spaceId)
    ])
    
    const memberCheck = await isMember(spaceId, userId)

    if (!memberCheck) {
      throw new ForbiddenError('You are not a member of this space')
    }

    req.spaceId = spaceId
    next();
  } catch (error) {
    next(error)
  }
}

module.exports = ensureSpaceMember;
