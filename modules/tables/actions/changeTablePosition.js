const pool = require('../../../database');

const { BadRequestError } = require("../../../utilities/errorsUtilities");
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const tableExistsById = require('../validations/tableExistsById');
const normalizeTablePositions = require('./normalizeTablePositions');



const changeTablePosition = async (spaceId, tableId, tableFromIndex, tableToIndex, neighborTableId) => {
  // Validación individual de argumentos
  // (No se incluye spaceId, tableId y neighborId porque se validan desde <entidad>existsById.error)
  if (tableFromIndex == null) throw new BadRequestError('Missing argument: table_from_index');
  if (tableToIndex == null) throw new BadRequestError('Missing argument: table_to_index');

  // Validación de existencia
  await Promise.all([
    spaceExistsById.error(spaceId),
    tableExistsById.error(tableId),
    tableExistsById.error(neighborTableId)
  ]);


  // Transacción
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE space_tables SET table_position = $1 WHERE id = $2 AND space_id = $3`,
      [tableToIndex, tableId, spaceId]
    );

    await client.query(
      `UPDATE space_tables SET table_position = $1 WHERE id = $2 AND space_id = $3`,
      [tableFromIndex, neighborTableId, spaceId]
    );

    await normalizeTablePositions(spaceId, client)

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = changeTablePosition