const pool = require('../../../../database')
const runTransaction = require('../../../utilities/runTransaction')
const { tableSchema } = require('../tableSchema')


const findTableByName = async (tableName, spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
        SELECT * FROM space_tables
        WHERE name = $1 AND space_id = $2
      `
    const rawTable = await client.query(query, [tableName, spaceId]).rows[0]

    // Validar esquema
    const {error, value: table} = tableSchema.validate(rawTable)
    if(error) throw error
    
    return table
  })
}

module.exports = findTableByName