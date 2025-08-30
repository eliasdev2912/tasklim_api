const runTransaction = require('../../../utilities/runTransaction');
const touchTask = require('./touchTask');




const addAssignee = async (taskId, teamId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
  const query = `
  INSERT INTO task_team_assignments (task_id, team_id)
  VALUES ($1, $2);
  `

    await client.query(query, [taskId, teamId])
    const updatedTask = await touchTask(taskId, client)

    return updatedTask
  })
}

module.exports = addAssignee