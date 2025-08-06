const pool = require('../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');




const taskExistsById = async (taskId) => {
  if (!taskId) throw new BadRequestError('Missing arguments: task_id')

  try {
    const tableRes = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 LIMIT 1;',
      [taskId]
    );
    return tableRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
taskExistsById.bool = taskExistsById
taskExistsById.error = async (taskId) => {
  const exists = await taskExistsById(taskId)
  if (!exists) {
    throw new NotFoundError(`Task not found with id: ${taskId}`)
  }
}


module.exports = taskExistsById