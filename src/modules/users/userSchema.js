const Joi = require('joi')


const userSchema = Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    username: Joi.string().trim().min(1).required(),
    avatarurl: Joi.string().trim().min(1).required(),
    email: Joi.string().email().required()
}).unknown(false); // no se permiten propiedades extra


module.exports = {userSchema}