const pool = require('../../../../database');
const getTaskById = require('../quieries/getTaskById');

const eventBus = require('../../event_bus/eventBus.js')


const createTask = async (userId, tableId, spaceId, taskTitle) => {
  try {
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