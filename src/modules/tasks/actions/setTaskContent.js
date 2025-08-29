const pool = require('../../../../database');
const eventBus = require('../../event_bus/eventBus');
const getTaskById = require('../quieries/getTaskById');







const setTaskContent = async (spaceId, taskId, newTitle, newDescription, newBody, updateAuthorId) => {
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
    eventBus.emit('taskUpdated', {task: updatedTask, updateAuthorId, spaceId})
    return updatedTask
  } catch (error) {
    throw error
  }
}

module.exports = setTaskContent