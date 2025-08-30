const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');


const getSpaceTags = async (spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async(client) => {
    const query = `
    SELECT * FROM tags WHERE space_id = $1;
    `
    const queryResult = await client.query(query, [spaceId])
    return queryResult.rows
  })
}


module.exports = getSpaceTags