const pool = require('../database.js');
const { sendError } = require('../utilities/errorsUtilities.js');
const { isMember } = require('../utilities/spaceUtilities.js');

async function ensureSpaceMember(req, res, next) {
  const userId = req.user.id;  // viene del verifyToken
  const spaceId = req.params.space_id;

  if(!userId || !spaceId) {
    return sendError(res, 401, 'MISSING_ARGUMENTS', 'Missing required fields: space_id or user_id')
  }

  try {
    const memberCheck  = await isMember(spaceId, userId)

    if (!memberCheck) {
      return sendError(res, 403, 'ACCESS_DENIED', 'You are not a member of this space')
    }

    next();
  } catch (error) {
    console.error('Error en ensureSpaceMember', error);
    res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = ensureSpaceMember;
