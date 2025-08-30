const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');


const findTagByName = async (tagName, spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `SELECT * FROM tags WHERE name = $1 AND space_id = $2`
    const result = await client.query(query, [tagName, spaceId])
    return result.rows[0]
  })
}

module.exports = findTagByName