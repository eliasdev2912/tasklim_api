const pool = require('../../../database');
const { BadRequestError, NotFoundError } = require("../../../utilities/errorsUtilities");

const validator = require('validator')


const spaceExistsById = async (spaceId, client = pool) => {
  if (!spaceId) throw new BadRequestError('Missing arguments: space_id');
  if(!validator.isUUID(spaceId)) throw new BadRequestError('Invalid UUID: space_id')
    
  try {
    const spaceRes = await client.query(
      'SELECT id FROM spaces WHERE id = $1 LIMIT 1;',
      [spaceId]
    );
    return spaceRes.rowCount > 0;
  } catch (error) {
    throw error;
  }
};

spaceExistsById.bool = spaceExistsById;

spaceExistsById.error = async (spaceId, client = pool) => {
  const exists = await spaceExistsById(spaceId, client);
  if (!exists) {
    throw new NotFoundError(`space not found with id: ${spaceId}`);
  }
};

module.exports = spaceExistsById;
