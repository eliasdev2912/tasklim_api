const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');
const getCommentById = require('../queries/getCommentById');



const editCommentBody = async (commentId, newBody, clientArg) => {
    return runTransaction(clientArg, async (client) => {
        const query = `UPDATE task_comments SET body = $1 WHERE id = $2`

        await client.query(query, [newBody, commentId])

        return await getCommentById(commentId, client)
    })
}

module.exports = editCommentBody