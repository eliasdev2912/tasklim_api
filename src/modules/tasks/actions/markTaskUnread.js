const pool = require('../../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');
const isTaskUnreadForUser = require('../validations/isTaskUnreadForUser');
const Joi = require('joi')

const markTaskUnread = async (taskId, userId, rawEventType, clientArg = pool) => {
    return runTransaction(clientArg, async (client) => {
        const isUnread = await isTaskUnreadForUser(taskId, userId, client);
    if (isUnread) return


    const eventTypeSchema = Joi.string().valid('created', 'updated').required()
    const {error, value: eventType} = eventTypeSchema.validate(rawEventType)
    if (error) throw new BadRequestError('Invalid argument: event_type')

        const query = `
        INSERT INTO task_unreads (task_id, user_id, event_type)
        VALUES ($1, $2, $3)`

        const res = await client.query(query, [taskId, userId, eventType])
        return res.rows[0]
    })
}

module.exports = markTaskUnread