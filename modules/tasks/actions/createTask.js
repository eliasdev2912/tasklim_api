const pool = require('../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const { v4: uuidv4 } = require('uuid');
const getTaskById = require('../quieries/getTaskById');
const userExistsById = require('../../users/validations/userExistsById');
const tableExistsById = require('../../tables/validations/tableExistsById');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');




const createTask = async (userId, tableId, spaceId, taskTitle) => {
  const taskId = 'task-' + uuidv4()
  try {
    await Promise.all([
      userExistsById.error(userId),
      tableExistsById.error(tableId),
      spaceExistsById.error(spaceId)
    ])
    if(!taskTitle) throw new BadRequestError('Missing arguments: task_title')
    
    const taskQuery = `
      INSERT INTO tasks (
      id,
      created_by,
      space_id,
      table_id,
      title
      ) VALUES (
       $1, $2, $3, $4, $5)
      RETURNING *
       `

    await pool.query(taskQuery, [taskId, userId, spaceId, tableId, taskTitle])

    const newTask = await getTaskById(taskId)


    return newTask
  } catch (error) {
    throw error
  }
}

module.exports = createTask