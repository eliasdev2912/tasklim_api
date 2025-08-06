const pool = require('../../../database');
const tableExistsById = require('../../tables/validations/tableExistsById');
const getTaskById = require('../quieries/getTaskById');
const taskExistsById = require('../validations/taskExistsById');
const touchTask = require('./touchTask');



const changeTaskTable = async (taskId, newTableId) => {

    try {
        await Promise.all([
            taskExistsById.error(taskId),
            tableExistsById.error(newTableId)
        ])

        const query = `
  UPDATE tasks
SET table_id = $2
WHERE id = $1;
  `

        await pool.query(query, [taskId, newTableId])
        await touchTask(taskId)
        const updatedTask = await getTaskById(taskId)

        return updatedTask

    } catch (error) {
        throw error
    }
}

module.exports = changeTaskTable