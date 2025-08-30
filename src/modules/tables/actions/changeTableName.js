const runTransaction = require('../../../utilities/runTransaction');
const findTableById = require('../queries/findTableById');


const changeTableName = async (tableId, newTableName, clientArg) => {
    return runTransaction(clientArg, async (client) => {
        const query = `
      UPDATE space_tables
      SET name = $1
      WHERE id = $2
      RETURNING *;
        `;
        await client.query(query, [newTableName, tableId]);
        const updatedTable = await findTableById(tableId, client)

        return updatedTable
    })
}

module.exports = changeTableName