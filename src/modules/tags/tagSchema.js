const Joi = require('joi');

const tagSchema = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    name: Joi.string()
        .trim()
        .min(1)
        .pattern(/^[A-Z0-9\-\/_]+$/) // letras mayúsculas, números y '-', '/', '_'
        .required(),
    color: Joi.string().trim().min(1).required(),
}).required()

module.exports = { tagSchema }