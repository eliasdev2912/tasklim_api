const pool = require('../../../../database');
const getCommentById = require('../queries/getCommentById');




const createComment = async (taskId, userId, commentBody, parentCommentId, client = pool) => {
  const commentQuery = `
    INSERT INTO task_comments (
      task_id, user_id, body, parent_comment_id
    ) VALUES ( $1, $2, $3, $4 )
    RETURNING *
  `
  try {
    const newCommentResult = await client.query(commentQuery, [taskId, userId, commentBody, parentCommentId])
    const newCommentId = newCommentResult.rows[0].id
    const newComment = await getCommentById(newCommentId, client != pool ? client : undefined)
    return newComment

  } catch (error) {
    throw error
  }
}

module.exports = createComment