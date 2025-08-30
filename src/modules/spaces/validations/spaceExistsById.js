const pool = require('../../../../database');
const { NotFoundError } = require("../../../utilities/errorsUtilities");
const runTransaction = require('../../../utilities/runTransaction');


const spaceExistsById = async (spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const spaceRes = await client.query(
      'SELECT id FROM spaces WHERE id = $1 LIMIT 1;',
      [spaceId]
    );
    return spaceRes.rowCount > 0;
  })
};

spaceExistsById.bool = spaceExistsById;

spaceExistsById.error = async (spaceId, clientArg = pool) => {
  const exists = await spaceExistsById(spaceId, clientArg);
  if (!exists) {
    throw new NotFoundError(`space not found with id: ${spaceId}`);
  }
};

module.exports = spaceExistsById;
