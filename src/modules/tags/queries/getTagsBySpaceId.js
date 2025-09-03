const Joi = require('joi');
const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');
const { tagSchema } = require('../tagSchema');


const getTagsBySpaceId = async (spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async(client) => {
    const query = `
    SELECT * FROM tags WHERE space_id = $1;
    `
    const rawTags = await client.query(query, [spaceId])

    // Validar esquema tags
    const tagArraySchema = Joi.array().items(tagSchema).default([]).required()
    const {error, value: tags} = tagArraySchema.validate(rawTags.rows)
    if(error) throw error

    return tags 
  })
}


module.exports = getTagsBySpaceId