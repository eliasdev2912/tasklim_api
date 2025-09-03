const runTransaction = require('../../../utilities/runTransaction');
const getTableById = require('../queries/getTableById');


const changeTableColor = async (newColor, tableId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
    UPDATE space_tables
    SET color = $1
    WHERE id = $2
    `

    await client.query(query, [newColor, tableId])

    const updatedTable = await getTableById(tableId, client)

    return updatedTable
  })
}

module.exports = changeTableColor