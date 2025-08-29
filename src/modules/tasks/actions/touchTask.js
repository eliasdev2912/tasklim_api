const pool = require('../../../../database');
const getTaskById = require('../quieries/getTaskById');
const taskExistsById = require('../validations/taskExistsById');




const touchTask = async (taskId, client = pool) => {
  const updateTaskQuery = `
        UPDATE tasks
        SET updated_at = NOW()
        WHERE id = $1;
        
        `
  try {
    await client.query(updateTaskQuery, [taskId])

    const updatedTask = await getTaskById(taskId)

    return updatedTask
  } catch (error) {
    throw error
  }
}

module.exports = touchTask