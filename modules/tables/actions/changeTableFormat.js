const pool = require('../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const findTableById = require('../queries/findTableById')

const changeTableFormat = async (tableId, newFormat) => {
  // Validar argumento y formato
  if(!newFormat) throw new BadRequestError('Missing arguments: new_format')

  const validFormats = ['minimalist', 'compact', 'standard', 'full']
  if (!validFormats.includes(newFormat)) {
    throw new BadRequestError(`Invalid format: ${newFormat}`)
  }

  const client = await pool.connect(); // usa tu pool de pg

  const tableQuery = `
  UPDATE space_tables
      SET task_format = $1
      WHERE id = $2
  `

  try {
    await client.query('BEGIN')

    await client.query(tableQuery, [newFormat, tableId])

    await client.query('COMMIT')

    const updatedTable = await findTableById(tableId)
    return updatedTable

  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = changeTableFormat