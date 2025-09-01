const Joi = require('joi')
const { spaceMemberSchema } = require('../member_instances/memberInstanceSchema')


const teamSchema = Joi.object({
    id: Joi.string().guid({version: 'uuidv4'}).required(),
    name: Joi.string()
            .trim()
            .min(1)
            .pattern(/^[A-Z0-9\-\/_]+$/) // letras mayúsculas, números y '-', '/', '_'
            .required(),
    color: Joi.string().trim().min(1).required(),
    description: Joi.string().trim().min(1).required(),
    banner_url: Joi.string().trim().min(1).required(),
    members: Joi.array().items(spaceMemberSchema).default([]).required()
})


module.exports = {teamSchema}