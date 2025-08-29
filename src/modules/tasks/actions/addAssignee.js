const pool = require('../../../../database');
const touchTask = require('./touchTask');




const addAssignee = async (taskId, teamId, clientArg) => {
  const externalClient = !!clientArg
  const client = clientArg || await pool.connect()
  const query = `
  INSERT INTO task_team_assignments (task_id, team_id)
  VALUES ($1, $2);
  `
  try {

    if (!externalClient) await client.query('BEGIN')

    await client.query(query, [taskId, teamId])
    const updatedTask = await touchTask(taskId, client)

    if (!externalClient) await client.query('COMMIT')

    return updatedTask
  } catch (error) {
    if (!externalClient) await client.query('ROLLBACK')
    throw error
  } finally {
    if (!externalClient) client.release()
  }
}

module.exports = addAssignee