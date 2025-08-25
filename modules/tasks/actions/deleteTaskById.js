const pool = require('../../../database');
const taskExistsById = require('../validations/taskExistsById');




const deleteTaskById = async (taskId, client = pool) => {
  // Validar argumento taskId y existencia
  await taskExistsById.error(taskId)

  const query = `
    DELETE FROM tasks WHERE id = $1
  `

  try {
    await client.query(query, [taskId])

  } catch (error) {
    throw error
  }
}

module.exports = deleteTaskById