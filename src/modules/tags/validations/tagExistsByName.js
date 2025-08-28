const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');




const tagExistsByName = async (tagName, spaceId) => {
  if (!tagName) throw new BadRequestError('Missing arguments: tag_name')
  await spaceExistsById.error(spaceId)

  try {
    const tagRes = await pool.query(
      'SELECT id FROM tags WHERE name = $1 AND space_id = $2 LIMIT 1;',
      [tagName, spaceId]
    );
    return tagRes.rowCount > 0
  } catch (error) {
    throw error
  }
}
tagExistsByName.bool = tagExistsByName
tagExistsByName.error = async (tagName, spaceId) => {
  const exists = await tagExistsByName(tagName, spaceId)
  if (!exists) {
    throw new NotFoundError(`tag not found with name: ${tagName}`)
  }
}

module.exports = tagExistsByName