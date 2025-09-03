const runTransaction = require('../../../utilities/runTransaction');
const getTaskById = require('./getTaskById');




const getTasksBySpaceId = async (spaceId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    // Obtener todas las tareas del espacio
    const rawTaskIds = (await client.query(`
      SELECT id FROM tasks WHERE space_id = $1 ORDER BY updated_at DESC;
    `, [spaceId])).rows;

    const taskIds = rawTaskIds.map(c => c.id)
    // Ejecutar consultas paralelas para cada tarea
    const tasks = await Promise.all(taskIds.map((id) => getTaskById(id)));


    return tasks;
  })
};

module.exports = getTasksBySpaceId