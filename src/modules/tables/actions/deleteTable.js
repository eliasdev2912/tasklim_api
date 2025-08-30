const deleteTaskById = require("../../tasks/actions/deleteTaskById")
const getTasksByTableId = require("../../tasks/quieries/getTasksByTableId")
const normalizeTablePositions = require("./normalizeTablePositions")
const runTransaction = require("../../../utilities/runTransaction")


const deleteTable = async (tableId, spaceId, clientArg) => {
    return runTransaction(clientArg, async (client) => {
        const deleteTableQuery = `
        DELETE FROM space_tables WHERE id = $1;
    `
        const tableTasks = await getTasksByTableId(tableId, client)

        await Promise.all([
            tableTasks.forEach(task => deleteTaskById(task.metadata.id, client))
        ])

        await client.query(deleteTableQuery, [tableId])
        await normalizeTablePositions(spaceId, client)

        return true
    })
}

module.exports = deleteTable