const pool = require('../../../../database');
const Joi = require('joi');
const { commentsArraySchema, commentSchema } = require('../commentSchema');
const runTransaction = require('../../../utilities/runTransaction');




const getTaskComments = async (taskId, clientArg = pool) => {
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
        'avatarurl', u.avatarurl,
        'email', u.email,
        'role', mi.user_rol
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
                    'avatarurl', ru.avatarurl,
                    'email', ru.email,
                    'role', rmi.user_rol
                )
            )
        )
        FROM task_comments r
        LEFT JOIN users ru ON ru.id = r.user_id
        LEFT JOIN members_instances rmi 
               ON rmi.user_id = ru.id 
              AND rmi.space_id = t.space_id
        WHERE r.parent_comment_id = tc.id
    ), '[]'::json) AS replies
FROM task_comments tc
LEFT JOIN users u ON u.id = tc.user_id
LEFT JOIN tasks t ON t.id = tc.task_id
LEFT JOIN members_instances mi 
       ON mi.user_id = u.id 
      AND mi.space_id = t.space_id
WHERE tc.task_id = $1
  AND tc.parent_comment_id IS NULL;

`
        const rawComments = (await client.query(query, [taskId])).rows;

        // validateAsync devuelve el array validado directamente
        const commentsArraySchema = Joi.array().items(commentSchema).default([]).required()
        const comments = await commentsArraySchema.validateAsync(rawComments);

        return comments;
    })
}

module.exports = getTaskComments