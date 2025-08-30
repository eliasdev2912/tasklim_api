const pool = require('../../../../database')
const runTransaction = require('../../../utilities/runTransaction')


const findTableById = async (tableId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
        SELECT * FROM space_tables
        WHERE id = $1
      `
    const result = await client.query(query, [tableId])

    return result.rows[0]
  })
}

module.exports = findTableById
