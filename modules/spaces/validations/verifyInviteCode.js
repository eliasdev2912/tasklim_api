const jwt = require('jsonwebtoken');
const { BadRequestError, ConflictError } = require('../../../utilities/errorsUtilities');
const isMember = require('./isMember');
const createMemberInstance = require('../../member_instances/actions/createMemberInstance');
const spaceExistsById = require('./spaceExistsById');


const verifyInviteCode = async (code, userId) => {
  try {
    // Verifica y extrae el payload
    const payload = jwt.verify(code, process.env.JWT_INVITE_SECRET);

    await spaceExistsById.error(payload.spaceId)

    // Verifica si ya es miembro
    const isAlreadyMember = await isMember(payload.spaceId, userId);
    if (isAlreadyMember) throw new  ConflictError(`User with id ${userId} is already a member of space with id ${payload.spaceId}`)

    // Crea instancia de miembro
    await createMemberInstance(userId, payload.spaceId, 'member');

    return payload
  } catch (err) {
    throw err
  }
}

module.exports = verifyInviteCode