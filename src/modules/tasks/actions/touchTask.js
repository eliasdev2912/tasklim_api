const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');
const getTaskById = require('../quieries/getTaskById');



const touchTask = async (taskId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const updateTaskQuery = `
        UPDATE tasks
        SET updated_at = NOW()
        WHERE id = $1;
        
        `
    await client.query(updateTaskQuery, [taskId])

    const updatedTask = await getTaskById(taskId, client)

    return updatedTask
  })
}

module.exports = touchTask