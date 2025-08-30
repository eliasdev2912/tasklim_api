const runTransaction = require('../../../utilities/runTransaction');
const getTaskById = require('../quieries/getTaskById');
const touchTask = require('./touchTask');



const changeTaskTable = async (taskId, newTableId, clientArg) => {
    return runTransaction(clientArg, async (client) => {
        const query = `
  UPDATE tasks
SET table_id = $2
WHERE id = $1;
  `
        await client.query(query, [taskId, newTableId])
        await touchTask(taskId, client)
        const updatedTask = await getTaskById(taskId, client)

        return updatedTask
    })
}

module.exports = changeTaskTable