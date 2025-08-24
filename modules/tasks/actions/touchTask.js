const pool = require('../../../database');
const getTaskById = require('../quieries/getTaskById');
const taskExistsById = require('../validations/taskExistsById');




const touchTask = async (taskId) => {
  // Validar argument taskId y existencia
  await taskExistsById.error(taskId)

  const updateTaskQuery = `
        UPDATE tasks
        SET updated_at = NOW()
        WHERE id = $1;
        
        `
  try {
    await pool.query(updateTaskQuery, [taskId])

    const updatedTask = await getTaskById(taskId)

    return updatedTask
  } catch (error) {
    throw error
  }
}

module.exports = touchTask