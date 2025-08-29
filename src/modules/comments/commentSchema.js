const Joi = require('joi')


const replySchema = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    body: Joi.string().required(),
    created_at: Joi.date().required(),
    created_by: Joi.object({
        id: Joi.string().guid({ version: 'uuidv4' }).required(),
        username: Joi.string().required(),
        avatarurl: Joi.string().required()
    }).required()
}).unknown(false); // no se permiten propiedades extra

const commentSchema = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    body: Joi.string().required(),
    task_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    created_at: Joi.date().required(),
    created_by: Joi.object({
        id: Joi.string().guid({ version: 'uuidv4' }).required(),
        username: Joi.string().required(),
        avatarurl: Joi.string().required()
    }).required(),
    replies: Joi.array().items(replySchema).default([]) // si quieres siempre presente, aunque sea []
}).unknown(false);


const commentsArraySchema = Joi.array().items(commentSchema).default([]);

module.exports = { commentSchema, replySchema, commentsArraySchema }