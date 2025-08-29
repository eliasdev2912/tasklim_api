const pool = require('../../../../database');
const { BadRequestError } = require('../../../utilities/errorsUtilities');
const findTableById = require('../queries/findTableById')
const Joi = require('joi')



const changeTableFormat = async (tableId, rawNewFormat) => {
  const schema = Joi.string().valid('minimalist', 'compact', 'standard', 'full').required()
  const {error, value: newFormat} = schema.validate(rawNewFormat)
  if (error) {
    throw error
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