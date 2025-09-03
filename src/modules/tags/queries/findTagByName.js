const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');
const { tagSchema } = require('../tagSchema');


const findTagByName = async (tagName, spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `SELECT * FROM tags WHERE name = $1 AND space_id = $2`
    const rawTag = (await client.query(query, [tagName, spaceId])).rows[0]

    // Validar esquema 
    const {error, value: tag} = tagSchema.validate(rawTag)
    if(error) throw error

    return tag
  })
}

module.exports = findTagByName