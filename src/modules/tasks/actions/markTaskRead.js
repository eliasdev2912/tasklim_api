const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');
const isTaskUnreadForUser = require('../validations/isTaskUnreadForUser');

const markTaskRead = async (taskId, userId, clientArg = pool) => {
    return runTransaction(clientArg, async (client) => {
        const isUnread = await isTaskUnreadForUser(taskId, userId, client)
        if (!isUnread) return

        const query = `
        DELETE FROM task_unreads
        WHERE task_id = $1 AND user_id = $2`

        const res = await client.query(query, [taskId, userId])

        return res.rows[0]
    })
}

module.exports = markTaskRead