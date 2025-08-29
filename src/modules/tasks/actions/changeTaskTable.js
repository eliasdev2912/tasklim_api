const pool = require('../../../../database');
const getTaskById = require('../quieries/getTaskById');
const touchTask = require('./touchTask');



const changeTaskTable = async (taskId, newTableId, clientArg) => {
    const externalClient = !!clientArg
    const client = clientArg || await pool.connect()
    try {
        const query = `
  UPDATE tasks
SET table_id = $2
WHERE id = $1;
  `
        if (!externalClient) await client.query('BEGIN')
        await client.query(query, [taskId, newTableId])
        await touchTask(taskId, client)
        const updatedTask = await getTaskById(taskId, client)
        if (!externalClient) await client.query('COMMIT')

        return updatedTask

    } catch (error) {
        if (!externalClient) await client.query('ROLLBACK')
        throw error
    } finally {
        if (!externalClient) client.release()
    }
}

module.exports = changeTaskTable