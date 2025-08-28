const deleteTaskById = require("../../tasks/actions/deleteTaskById")
const getTasksByTableId = require("../../tasks/quieries/getTasksByTableId")

const pool = require('../../../../database')
const normalizeTablePositions = require("./normalizeTablePositions")

const deleteTable = async (tableId, spaceId) => {
    const client = await pool.connect()

    const deleteTableQuery = `
        DELETE FROM space_tables WHERE id = $1;
    `
    try {
        await client.query('BEGIN')
        const tableTasks = await getTasksByTableId(tableId)

        await Promise.all([
            tableTasks.forEach(task => deleteTaskById(task.metadata.id, client))
        ])

        await client.query(deleteTableQuery, [tableId])
        await normalizeTablePositions(spaceId, client)

        await client.query('COMMIT')

        return true
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}

module.exports = deleteTable