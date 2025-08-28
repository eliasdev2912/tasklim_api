const pool = require('../../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const getCommentById = require('../queries/getCommentById');
const Joi = require('joi')



const editCommentBody = async (commentId, newBody, client = pool) => {
    const query = `UPDATE task_comments SET body = $1 WHERE id = $2`

    const { error: joiError, value: sanitizedBody } = Joi.string().trim().min(1).required().validate(newBody);
    if (joiError) throw new BadRequestError('Invalid argument: new_body')

    try {
        await client.query(query, [sanitizedBody, commentId])

        return await getCommentById(commentId, client != pool ? client : undefined)
    } catch (error) {
        throw error
    }
}

module.exports = editCommentBody