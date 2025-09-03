const Joi = require('joi');
const pool = require('../../../../database.js')
const runTransaction = require('../../../utilities/runTransaction.js');
const { spaceMemberSchema } = require('../memberInstanceSchema.js');


const getSpaceMembers = async (spaceId, clientArg = pool) => {
    return runTransaction(clientArg, async (client) => {
        const membersQuery = `
  SELECT 
    u.id,
    u.username,
    u.email,
    u.avatarurl,
    m.user_rol AS role
  FROM members_instances m
  JOIN users u ON m.user_id = u.id
  WHERE m.space_id = $1;
            `;
        const rawMembers = await client.query(membersQuery, [spaceId])

        // Validar esquema spaceMember
        const membersArraySchema = Joi.array().items(spaceMemberSchema).default([]).required()
        const {error, value: members} = membersArraySchema.validate(rawMembers.rows)
        if(error) throw error

        return members
    })
}
module.exports = getSpaceMembers