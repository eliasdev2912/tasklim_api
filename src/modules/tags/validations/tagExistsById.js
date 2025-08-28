const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');



const tagExistsById = async (tagId) => {
  if (!tagId) throw new BadRequestError('Missing arguments: tag_id')

  try {
    const tagRed = await pool.query(
      'SELECT id FROM tags WHERE id = $1 LIMIT 1;',
      [tagId]
    );
    return tagRed.rowCount > 0
  } catch (error) {
    throw error
  }
}
tagExistsById.bool = tagExistsById
tagExistsById.error = async (tagId) => {
  const exists = await tagExistsById(tagId)
  if (!exists) {
    throw new NotFoundError(`tag not found with id: ${tagId}`)
  }
}


module.exports = tagExistsById