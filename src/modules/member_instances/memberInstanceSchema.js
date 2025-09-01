const Joi = require('joi')


const spaceMemberSchema = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    username: Joi.string().trim().min(1).required(),
    avatarurl: Joi.string().trim().min(1).required(),
    email: Joi.string().email().required(),
    role: Joi.string().required()
}).unknown(false); 



module.exports = { spaceMemberSchema }