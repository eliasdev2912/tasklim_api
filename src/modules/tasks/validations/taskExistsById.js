const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');


const taskExistsById = async (taskId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!taskId) throw new BadRequestError('Missing arguments: task_id')

    const tableRes = await client.query(
      'SELECT id FROM tasks WHERE id = $1 LIMIT 1;',
      [taskId]
    );
    return tableRes.rowCount > 0
  })
}

taskExistsById.bool = taskExistsById

taskExistsById.error = async (taskId, clientArg = pool) => {
  const exists = await taskExistsById(taskId, clientArg)
  if (!exists) {
    throw new NotFoundError(`Task not found with id: ${taskId}`)
  }
}


module.exports = taskExistsById