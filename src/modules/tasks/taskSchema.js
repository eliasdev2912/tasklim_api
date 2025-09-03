const Joi = require('joi');
const { spaceMemberSchema } = require('../member_instances/memberInstanceSchema');
const { tagSchema } = require('../tags/tagSchema');
const { commentSchema } = require('../comments/commentSchema');
const { teamSchema } = require('../teams/teamSchema');


const taskSchema = Joi.object({
  metadata: Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
    created_at: Joi.date().required(),
    updated_at: Joi.date().required(),
    created_by: spaceMemberSchema.required()
  }).required(),
  content: Joi.object({
    title: Joi.string().trim().min(1).required(),
    description: Joi.string().allow('').required(),
    body: Joi.string().allow('').required(),
    due_date: Joi.date().allow(null).required()
  }).required(),
  relations: Joi.object({
    table_id: Joi.string().guid({version: 'uuidv4'}).required(),
    tags: Joi.array().items(tagSchema).default([]).required(),
    comments: Joi.array().items(commentSchema).default([]).required(),
    assignees: Joi.array().items(teamSchema).default([]).required()
  }).required()
}).unknown(false);


module.exports = {taskSchema}