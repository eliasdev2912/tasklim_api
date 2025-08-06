const pool = require('../../../database');
const { ConflictError } = require('../../../utilities/errorsUtilities');
const findTableById = require('../queries/findTableById');
const findTableByName = require('../queries/findTableByName');


const changeTableName = async (tableId, newTableName, spaceId) => {
    try {
        const existingTable = await findTableByName(newTableName, spaceId)

        if (existingTable != null && existingTable.id != tableId) {
            throw new ConflictError('A column with that name already exists in this space')
        }

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