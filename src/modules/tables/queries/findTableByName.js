const pool = require('../../../../database')
const runTransaction = require('../../../utilities/runTransaction')


const findTableByName = async (tableName, spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
        SELECT * FROM space_tables
        WHERE name = $1 AND space_id = $2
      `
    const result = await client.query(query, [tableName, spaceId])

    return result.rows[0]
  })
}

module.exports = findTableByName