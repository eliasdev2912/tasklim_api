const pool = require('../../../../database');

const runTransaction = require('../../../utilities/runTransaction');
const { commentSchema } = require('../commentSchema');


const getCommentById = async (commentId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
SELECT 
    tc.id,
    tc.body,
    tc.created_at,
    tc.task_id,
    json_build_object(
        'id', u.id,
        'username', u.username,
        'avatarurl', u.avatarurl
    ) AS created_by,
    COALESCE((
        SELECT json_agg(
            json_build_object(
                'id', r.id,
                'body', r.body,
                'created_at', r.created_at,
                'created_by', json_build_object(
                    'id', ru.id,
                    'username', ru.username,
                    'avatarurl', ru.avatarurl
                )
            )
        )
        FROM task_comments r
        LEFT JOIN users ru ON ru.id = r.user_id
        WHERE r.parent_comment_id = tc.id
    ), '[]'::json) AS replies
FROM task_comments tc
LEFT JOIN users u ON u.id = tc.user_id
WHERE tc.id = $1
`
      const rawComment = (await client.query(query, [commentId])).rows[0]

      // Validar estructura del comentario
      const { error, value: comment } = commentSchema.validate(rawComment);
      if (error) throw error;
      return comment
  })
}

module.exports = getCommentById