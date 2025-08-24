const pool = require('../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const { v4: uuidv4 } = require('uuid');
const getTaskById = require('../quieries/getTaskById');
const userExistsById = require('../../users/validations/userExistsById');
const tableExistsById = require('../../tables/validations/tableExistsById');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');

const eventBus = require('../../event_bus/eventBus.js')


const createTask = async (userId, tableId, spaceId, taskTitle) => {
  try {
    await Promise.all([
      userExistsById.error(userId),
      tableExistsById.error(tableId),
      spaceExistsById.error(spaceId)
    ])
    if (!taskTitle) throw new BadRequestError('Missing arguments: task_title')

    const taskQuery = `
      INSERT INTO tasks (
      created_by,
      space_id,
      table_id,
      title
      ) VALUES (
       $1, $2, $3, $4)
      RETURNING id
       `

    const taskId = (await pool.query(taskQuery, [userId, spaceId, tableId, taskTitle])).rows[0].id

    const newTask = await getTaskById(taskId)

    eventBus.emit('taskCreatedSetUnreads', {task: newTask, spaceId: spaceId});

    return newTask
  } catch (error) {
    throw error
  }
}

module.exports = createTask