const jwt = require('jsonwebtoken');
const { BadRequestError, ConflictError } = require('../../../utilities/errorsUtilities');
const isMember = require('./isMember');
const createMemberInstance = require('../../member_instances/actions/createMemberInstance');
const spaceExistsById = require('./spaceExistsById');


const verifyInviteCode = async (code, userId) => {
  try {
    // Verifica y extrae el payload
    let payload;
    try {
      payload = jwt.verify(code, process.env.JWT_INVITE_SECRET);
    } catch (err) {
      // Errores comunes: TokenExpiredError, JsonWebTokenError, NotBeforeError
      throw new BadRequestError('Invalid or expired invite code');
    }

    await spaceExistsById.error(payload.spaceId)

    // Verifica si ya es miembro
    const isAlreadyMember = await isMember(payload.spaceId, userId);
    if (isAlreadyMember) {
      throw new ConflictError(`User with id ${userId} is already a member of space with id ${payload.spaceId}`);
    }

    // Crea instancia de miembro
    await createMemberInstance(userId, payload.spaceId, 'member');

    return payload;
  } catch (err) {
    throw err; // Este catch puede quedarse o eliminarse, pero no hace falta si no lo vas a modificar
  }
}


module.exports = verifyInviteCode