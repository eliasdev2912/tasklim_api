const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');



async function isTaskUnreadForUser(taskId, userId, clientArg = pool) {
  return runTransaction(clientArg, async (client) => {
    const query = `
    SELECT 1
    FROM task_unreads
    WHERE task_id = $1 AND user_id = $2
    LIMIT 1
  `;
  const values = [taskId, userId];

  const result = await client.query(query, values);
  return result.rowCount > 0; // true si ya existe
  })
}


module.exports = isTaskUnreadForUser