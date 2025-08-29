const pool = require('../../../../database');
const touchTask = require('./touchTask');








const deleteAssignee = async (taskId, teamId, clientArg) => {
  const externalClient = !!clientArg
  const client = clientArg || await pool.connect()

  const query = `
  DELETE FROM task_team_assignments WHERE task_id = $1 AND team_id = $2
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

module.exports = deleteAssignee