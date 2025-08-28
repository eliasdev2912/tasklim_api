const pool = require('../../../../database');

const { BadRequestError } = require("../../../utilities/errorsUtilities")





const getTaskComments = async (taskId, client = pool) => {
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
                'task_id', r.task_id,
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
WHERE tc.task_id = $1
  AND tc.parent_comment_id IS NULL;
`

    try {
        const comments = (await client.query(query, [taskId])).rows

        return comments
    } catch (error) {
        throw error
    }
}

module.exports = getTaskComments