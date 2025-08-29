const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');
const getCommentById = require('../queries/getCommentById');




const createComment = async (taskId, userId, commentBody, parentCommentId, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    const commentQuery = `
      INSERT INTO task_comments (
        task_id, user_id, body, parent_comment_id
      ) VALUES ( $1, $2, $3, $4 )
      RETURNING *
    `
    const newCommentResult = await client.query(commentQuery, [taskId, userId, commentBody, parentCommentId])
    const newCommentId = newCommentResult.rows[0].id
    const newComment = await getCommentById(newCommentId, client)

    return newComment
  })
}


module.exports = createComment


