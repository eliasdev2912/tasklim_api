const runTransaction = require('../../../utilities/runTransaction');
const touchTask = require('./touchTask');
const getTaskTagsCount = require('../quieries/getTaskTagsCount');



const deleteTaskTag = async (taskId, tagId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    // 1️⃣ Borra SOLO la relación task-tag específica
    const deleteTaskTagQuery = `
      DELETE FROM task_tags 
      WHERE tag_id = $1 AND task_id = $2
    `;
    await client.query(deleteTaskTagQuery, [tagId, taskId]);

    // 2️⃣ Verifica cuántas quedan después de borrarla
    const tagTaskCount = await getTaskTagsCount(tagId, client);
    if (tagTaskCount == 0) {
      // Si quedó huérfano: eliminar tag
      const deleteTagQuery = `DELETE FROM tags WHERE id = $1`;
      await client.query(deleteTagQuery, [tagId]);
    }

    const updatedTask = await touchTask(taskId, client)
    return { updatedTask }
  })
};

module.exports = deleteTaskTag