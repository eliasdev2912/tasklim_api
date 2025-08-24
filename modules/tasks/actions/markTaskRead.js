const pool = require('../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const isTaskUnreadForUser = require('../validations/isTaskUnreadForUser');

const markTaskRead = async (taskId, userId) => {
    const isUnread = await isTaskUnreadForUser(taskId, userId)
    
    if(!isUnread) return
    try {
        const query = `
        DELETE FROM task_unreads
        WHERE task_id = $1 AND user_id = $2`
        
        const res = await pool.query(query, [taskId, userId])

        console.log(`tarea (${taskId}) marcada como leída para: ${userId}`)
        return res.rows[0]
    } catch (error) {
        throw error
    }
}

module.exports = markTaskRead