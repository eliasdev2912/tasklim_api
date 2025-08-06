const pool = require('../../../database');
const tagExistsById = require('../validations/tagExistsById');



const getTagTaskCount = async (tagId) => {
  // Validar argumento y existencia
  await tagExistsById.error(tagId)

  const query = `
    SELECT COUNT(*) AS count
    FROM task_tags
    WHERE tag_id = $1;
  `;

  try {
    const result = await pool.query(query, [tagId]);
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    throw error
  }
};

module.exports = getTagTaskCount