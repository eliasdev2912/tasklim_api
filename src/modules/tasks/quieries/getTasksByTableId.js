const runTransaction = require('../../../utilities/runTransaction');
const getTaskById = require('./getTaskById');

const getTasksByTableId = async (tableId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    const tasksIdsQuery = `
    SELECT id FROM tasks WHERE table_id = $1;
  `;
    const rawTasksIds = (await client.query(tasksIdsQuery, [tableId])).rows;
    const tasksIds = rawTasksIds.map(t => t.id);

    const tasks = await Promise.all(
      tasksIds.map(taskId => getTaskById(taskId, client))
    );

    return tasks;
  })
};


module.exports = getTasksByTableId