const runTransaction = require('../../../utilities/runTransaction');
const touchTask = require('./touchTask');


const deleteAssignee = async (taskId, teamId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
  const query = `
  DELETE FROM task_team_assignments WHERE task_id = $1 AND team_id = $2
  `

    await client.query(query, [taskId, teamId])
    const updatedTask = await touchTask(taskId, client)

    return updatedTask
  })
}

module.exports = deleteAssignee