const pool = require('../../../../database');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');







const getSpaceTags = async (spaceId) => {
  await spaceExistsById.error(spaceId)

  const query = `
    SELECT * FROM tags WHERE space_id = $1;
    `

  try {
    const queryResult = await pool.query(query, [spaceId])
    return queryResult.rows

  } catch (error) {
    throw error
  }

}


module.exports = getSpaceTags