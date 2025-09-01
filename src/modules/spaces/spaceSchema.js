const Joi = require('joi')
const { spaceMemberSchema } = require('../member_instances/memberInstanceSchema')
const { tableSchema } = require('../tables/tableSchema')
const { taskSchema } = require('../tasks/taskSchema')
const { tagSchema } = require('../tags/tagSchema')
const { teamSchema } = require('../teams/teamSchema')


const spaceSchema = Joi.object({
    metadata: Joi.object({
        id: Joi.string().guid({version: 'uuidv4'}).required(),
        space_name: Joi.string().trim().min(1).required(),
        space_description: Joi.string().trim().min(1).required(),
        created_at: Joi.date().required(),
    }).required(),
    members: Joi.array().items(spaceMemberSchema).default([]).required(),
    tables: Joi.array().items(tableSchema).default([]).required(),
    tasks: Joi.array().items(taskSchema).default([]).required(),
    tags: Joi.array().items(tagSchema).default([]).required(),
    teams: Joi.array().items(teamSchema).default([]).required()
})

module.exports = {spaceSchema}