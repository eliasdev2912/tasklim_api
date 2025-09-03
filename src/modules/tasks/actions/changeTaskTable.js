const runTransaction = require('../../../utilities/runTransaction');
const getTaskById = require('../quieries/getTaskById');
const touchTask = require('./touchTask');
const eventBus = require('../../event_bus/eventBus')


const changeTaskTable = async (taskId, newTableId, updateAuthorId, spaceId, clientArg) => {
    return runTransaction(clientArg, async (client) => {
        const query = `
  UPDATE tasks
SET table_id = $2
WHERE id = $1;
        `
        await client.query(query, [taskId, newTableId])
        await touchTask(taskId, client)
        const updatedTask = await getTaskById(taskId, client)
        eventBus.emit('taskUpdated', { task: updatedTask, updateAuthorId, spaceId, clientArg: client })

        return updatedTask
    })
}

module.exports = changeTaskTable