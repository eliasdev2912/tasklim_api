const pool = require('../../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const isTaskUnreadForUser = require('../validations/isTaskUnreadForUser');
const Joi = require('joi')

const markTaskUnread = async (taskId, userId, rawEventType) => {
    const isUnread = await isTaskUnreadForUser(taskId, userId);
    if (isUnread) return


    const eventTypeSchema = Joi.string().valid('created', 'updated').required()
    const {error, value: eventType} = eventTypeSchema.validate(rawEventType)
    if (error) throw new BadRequestError('Invalid argument: event_type')

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