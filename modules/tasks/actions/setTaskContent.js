const pool = require('../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const getTaskById = require('../quieries/getTaskById');
const taskExistsById = require('../validations/taskExistsById');







const setTaskContent = async (taskId, newTitle, newDescription, newBody) => {
    // Validar argumento taskId y existencia
  await taskExistsById.error(taskId)
  
  if (!newTitle) {
    throw new BadRequestError('Missing arguments: new_title')
  }

  const query = `
  UPDATE tasks
  SET 
   title = $2,
   description = $3,
   body = $4,
   updated_at = NOW()
  WHERE id = $1;
  `

  try {
    await pool.query(query, [taskId, newTitle, newDescription, newBody])
    const updatedTask = await getTaskById(taskId)
    return updatedTask
  } catch (error) {
    throw error
  }
}

module.exports = setTaskContent