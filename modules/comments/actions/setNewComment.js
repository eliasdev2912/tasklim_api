const pool = require('../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const taskExistsById = require('../../tasks/validations/taskExistsById');
const touchTask = require('../../tasks/actions/touchTask');
const getTaskById = require('../../tasks/quieries/getTaskById');
const userExistsById = require('../../users/validations/userExistsById');



const setNewComment = async (taskId, userId, body) => {
  // Validar argumentos y existencias
  Promise.all([
    taskExistsById.error(taskId), 
    userExistsById.error(userId)
  ])

  // Validar argumento body
  if(!body) throw new BadRequestError('Missing arguments: body')

  const client = await pool.connect();

  const commentQuery = `
    INSERT INTO task_comments (
      task_id, user_id, body
    ) VALUES ( $1, $2, $3 )
  `
  try {

    await client.query('BEGIN');

    await client.query(commentQuery, [taskId, userId, body])
    await touchTask(taskId)

    await client.query('COMMIT');

    const task = await getTaskById(taskId)

    return task

  } catch (error) {
    await client.query('ROLLBACK');
    throw error
  } finally {
    client.release()
  }
}

module.exports = setNewComment