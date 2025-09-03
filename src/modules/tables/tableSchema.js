const Joi = require('joi')



const tableSchema = Joi.object({
    id: Joi.string().guid({version: 'uuidv4'}).required(),
    name: Joi.string().trim().min(1).required(),
    color: Joi.string().trim().min(1).allow(null).required(),
    table_position: Joi.number().min(0).required(),
    task_format: Joi.string().valid('minimalist', 'compact', 'standard', 'full').required(),
    space_id: Joi.string().guid({version: 'uuidv4'}).required()
})

module.exports = {tableSchema}