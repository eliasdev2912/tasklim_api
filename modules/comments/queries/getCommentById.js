const pool = require('../../../database');

const { BadRequestError } = require("../../../utilities/errorsUtilities")





const getCommentById = async (commentId) => {
  if (!commentId) throw new BadRequestError('Missing arguments: comment_id')

  const query = `SELECT * FROM task_comments WHERE id = $1`

  try {
    const comment = await pool.query(query, [commentId])
    return comment.rows[0]
  } catch (error) {
    throw error
  }
}

module.exports = getCommentById