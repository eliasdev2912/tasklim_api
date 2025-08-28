const pool = require('../../../../database');
const { BadRequestError, NotFoundError } = require('../../../utilities/errorsUtilities');



async function isTaskUnreadForUser(taskId, userId) {
  try {
    const query = `
    SELECT 1
    FROM task_unreads
    WHERE task_id = $1 AND user_id = $2
    LIMIT 1
  `;
  const values = [taskId, userId];

  const result = await pool.query(query, values);
  return result.rowCount > 0; // true si ya existe
  } catch (error) {
    throw error
  }
}


module.exports = isTaskUnreadForUser