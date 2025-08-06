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

  const getTaskParts = () => {
    switch (newFormat) {
      case 'minimalist':
        return {
          show_title: true,
          show_description: false,
          show_tags: false,
          show_assignees: false,
          show_body: false,
          show_author: false,
          show_deadline: false,
          show_comments: false
        };
      case 'compact':
        return {
          show_title: false,
          show_description: true,
          show_tags: true,
          show_assignees: true,
          show_body: false,
          show_author: false,
          show_deadline: true,
          show_comments: false
        };
      case 'standard':
        return {
          show_title: true,
          show_description: true,
          show_tags: true,
          show_assignees: true,
          show_body: false,
          show_author: false,
          show_deadline: true,
          show_comments: true
        };
      case 'full':
        return {
          show_title: true,
          show_description: true,
          show_tags: true,
          show_assignees: true,
          show_body: true,
          show_author: true,
          show_deadline: true,
          show_comments: true
        };
      default:
        return {
          show_title: true,
          show_description: true,
          show_tags: true,
          show_assignees: true,
          show_body: false,
          show_author: false,
          show_deadline: true,
          show_comments: true
        };
    }
  }
  const parts = getTaskParts();
  const keys = Object.keys(parts);
  const values = Object.values(parts);

  const setClause = keys.map((key, idx) => `${key} = $${idx + 1}`).join(', ');

  const tableTaskFormatsQuery = `
  UPDATE table_task_formats
SET ${setClause}
WHERE table_id = $${keys.length + 1}
 `

  try {
    await client.query('BEGIN')

    await client.query(tableQuery, [newFormat, tableId])
    await client.query(tableTaskFormatsQuery, [...values, tableId]);

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