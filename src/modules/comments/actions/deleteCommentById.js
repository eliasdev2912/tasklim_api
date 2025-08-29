const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');
const touchTask = require('../../tasks/actions/touchTask');
const getTaskById = require('../../tasks/quieries/getTaskById');
const getCommentById = require('../queries/getCommentById');



const deleteCommentById = async (commentId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    const query = `DELETE FROM task_comments WHERE id = $1`

    const comment = await getCommentById(commentId, client)
    const taskId = comment.task_id

    await client.query(query, [commentId])
    await touchTask(taskId, client)

    return await getTaskById(taskId)
  })
}

module.exports = deleteCommentById