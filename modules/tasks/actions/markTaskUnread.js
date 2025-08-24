const pool = require('../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');

const markTaskUnread = async (taskId, userId, eventType) => {
    if(eventType != 'created' && eventType != 'updated') {
        throw new BadRequestError('Invalid argument: event_type')
    }
    try {
        const query = `
        INSERT INTO task_unreads (task_id, user_id, event_type)
        VALUES ($1, $2, $3)`
        
        const res = await pool.query(query, [taskId, userId, eventType])
        return res.rows[0]
    } catch (error) {
        throw error
    }
}

module.exports = markTaskUnread