const pool = require('../../../../database');
const getTaskById = require('./getTaskById');

const getTasksByTableId = async (tableId) => {
  const tasksIdsQuery = `
    SELECT id FROM tasks WHERE table_id = $1;
  `;

  try {
    const rawTasksIds = (await pool.query(tasksIdsQuery, [tableId])).rows;
    const tasksIds = rawTasksIds.map(t => t.id);

    const tasks = await Promise.all(
      tasksIds.map(taskId => getTaskById(taskId))
    );

    return tasks;
  } catch (error) {
    throw error;
  }
};


module.exports = getTasksByTableId