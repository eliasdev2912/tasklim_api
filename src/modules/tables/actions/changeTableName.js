const pool = require('../../../../database');
const findTableById = require('../queries/findTableById');


const changeTableName = async (tableId, newTableName) => {
    try {
        const query = `
      UPDATE space_tables
      SET name = $1
      WHERE id = $2
      RETURNING *;
    `;

        await pool.query(query, [newTableName, tableId]);
        const updatedTable = await findTableById(tableId)

        return updatedTable
    } catch (error) {
        throw error
    }
}

module.exports = changeTableName