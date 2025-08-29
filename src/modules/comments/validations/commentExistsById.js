const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');



const commentExistsById = async (commentId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!commentId) throw new BadRequestError('Missing arguments: comment_id')

    const commentRes = await client.query(
      'SELECT id FROM task_comments WHERE id = $1 LIMIT 1;',
      [commentId]
    );
    return commentRes.rowCount > 0
  })
}
commentExistsById.bool = commentExistsById
commentExistsById.error = async (commentId, clientArg = pool) => {
  const exists = await commentExistsById(commentId, clientArg)
  if (!exists) {
    throw new NotFoundError(`Comment not found with id: ${commentId}`)
  }
}

module.exports = commentExistsById