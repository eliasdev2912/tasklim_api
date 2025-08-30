const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');
const touchTask = require('../../tasks/actions/touchTask');
const getTaskById = require('../../tasks/quieries/getTaskById');
const getCommentById = require('../queries/getCommentById');



const deleteCommentById = async (commentId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `DELETE FROM task_comments WHERE id = $1`

    await client.query(query, [commentId])

    return true
  })
}

module.exports = deleteCommentById