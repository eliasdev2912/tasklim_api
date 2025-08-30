const getTaskById = require('../quieries/getTaskById');

const eventBus = require('../../event_bus/eventBus.js');
const runTransaction = require('../../../utilities/runTransaction');


const createTask = async (userId, tableId, spaceId, taskTitle, clientArg) => {
  return runTransaction(clientArg, async (client) => {
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

    const taskId = (await client.query(taskQuery, [userId, spaceId, tableId, taskTitle])).rows[0].id

    const newTask = await getTaskById(taskId, client)

    eventBus.emit('taskCreatedSetUnreads', {task: newTask, spaceId: spaceId});

    return newTask
  })
}

module.exports = createTask