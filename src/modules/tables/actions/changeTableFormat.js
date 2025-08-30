const runTransaction = require('../../../utilities/runTransaction');
const findTableById = require('../queries/findTableById')
const Joi = require('joi')



const changeTableFormat = async (tableId, rawNewFormat, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    const schema = Joi.string().valid('minimalist', 'compact', 'standard', 'full').required()
    const { error, value: newFormat } = schema.validate(rawNewFormat)
    if (error) {
      throw error
    }

    const tableQuery = `
  UPDATE space_tables
      SET task_format = $1
      WHERE id = $2
  `

    await client.query(tableQuery, [newFormat, tableId])

    const updatedTable = await findTableById(tableId, client)
    return updatedTable
  })
}

module.exports = changeTableFormat