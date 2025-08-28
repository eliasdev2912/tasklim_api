const pool = require('../../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');




const findTagByName = async (tagName, spaceId) => {
  // Validar existencia
  await spaceExistsById.error(spaceId)

  // Validar argumentos 
  if (!tagName) throw new BadRequestError('Missing arguments: tag_name')

  try {
    const query = `SELECT * FROM tags WHERE name = $1 AND space_id = $2`
    const result = await pool.query(query, [tagName, spaceId])
    return result.rows[0]
  } catch (error) {
    throw error
  }
}

module.exports = findTagByName