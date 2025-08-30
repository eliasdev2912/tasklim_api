const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');



const tagExistsById = async (tagId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    if (!tagId) throw new BadRequestError('Missing arguments: tag_id')

    const tagRed = await client.query(
      'SELECT id FROM tags WHERE id = $1 LIMIT 1;',
      [tagId]
    );
    return tagRed.rowCount > 0
  })
}
tagExistsById.bool = tagExistsById
tagExistsById.error = async (tagId, clientArg = pool) => {
  const exists = await tagExistsById(tagId, clientArg)
  if (!exists) {
    throw new NotFoundError(`tag not found with id: ${tagId}`)
  }
}


module.exports = tagExistsById