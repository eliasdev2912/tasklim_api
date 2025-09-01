const Joi = require('joi');
const { spaceMemberSchema } = require('../member_instances/memberInstanceSchema');


const replySchema = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    body: Joi.string().required(),
    created_at: Joi.date().required(),
    created_by: spaceMemberSchema,
}).unknown(false); // no se permiten propiedades extra

const commentSchema = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    body: Joi.string().required(),
    task_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    created_at: Joi.date().required(),
    created_by: spaceMemberSchema,
    replies: Joi.array().items(replySchema).default([]) // si quieres siempre presente, aunque sea []
}).unknown(false);


module.exports = { commentSchema, replySchema }