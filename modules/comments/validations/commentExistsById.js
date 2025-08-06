const pool = require('../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');



const commentExistsById = async (commetId) => {
  if (!commetId) throw new BadRequestError('Missing arguments: comment_id')

  try {
    const commentRes = await pool.query(
      'SELECT id FROM task_comments WHERE id = $1 LIMIT 1;',
      [commetId]
    );
    return commentRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
commentExistsById.bool = commentExistsById
commentExistsById.error = async (commentId) => {
  const exists = await commentExistsById(commentId)
  if (!exists) {
    throw new NotFoundError(`Comment not found with id: ${commentId}`)
  }
}

module.exports = commentExistsById