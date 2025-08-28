const pool = require('../../../../database');
const touchTask = require('../../tasks/actions/touchTask');
const getTaskById = require('../../tasks/quieries/getTaskById');
const getCommentById = require('../queries/getCommentById');



const deleteCommentById = async (commentId) => {
  const query = `DELETE FROM task_comments WHERE id = $1`

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const comment = await getCommentById(commentId, client)
    const taskId = comment.task_id

    await client.query(query, [commentId])
    await touchTask(taskId, client)

    await client.query('COMMIT');

    return await getTaskById(taskId)
  } catch (error) {
    await client.query('ROLLBACK');
    throw error
  } finally {
    client.release()
  }
}

module.exports = deleteCommentById