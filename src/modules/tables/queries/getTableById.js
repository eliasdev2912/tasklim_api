const pool = require('../../../../database')
const runTransaction = require('../../../utilities/runTransaction')
const { tableSchema } = require('../tableSchema')


const getTableById = async (tableId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
        SELECT * FROM space_tables
        WHERE id = $1
      `
    const rawTable = (await client.query(query, [tableId])).rows[0]

    // Validar esquema 
    const {error, value: table } = tableSchema.validate(rawTable)
    if(error) throw error

    return table
  })
}

module.exports = getTableById
