const pool = require('../../../database');
const touchTask = require('../../tasks/actions/touchTask');
const taskExistsById = require('../../tasks/validations/taskExistsById');
const getTagTaskCount = require('../queries/getTagTaskCount');
const tagExistsById = require('../validations/tagExistsById');





const deleteTaskTag = async (taskId, tagId) => {
  // Validar argumentos y existencia
  await Promise.all([
    taskExistsById.error(taskId),
    tagExistsById.error(tagId)
  ])

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Borra SOLO la relación task-tag específica
    const deleteTaskTagQuery = `
      DELETE FROM task_tags 
      WHERE tag_id = $1 AND task_id = $2
    `;
    await client.query(deleteTaskTagQuery, [tagId, taskId]);


    await client.query('COMMIT');

    // 2️⃣ Verifica cuántas quedan después de borrarla
    const tagTaskCount = await getTagTaskCount(tagId);
    if (tagTaskCount == 0) {
      // Si quedó huérfano: eliminar tag
      const deleteTagQuery = `DELETE FROM tags WHERE id = $1`;
      await client.query(deleteTagQuery, [tagId]);
    }

    const updatedTask = await touchTask(taskId)
    return { updatedTask }

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = deleteTaskTag