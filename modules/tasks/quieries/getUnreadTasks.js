const pool = require('../../../database');
const getTaskById = require('./getTaskById');





const getUnreadTasks = async (spaceId, userId) => {
 const query = `
  SELECT tu.task_id
  FROM task_unreads tu
  JOIN tasks t ON t.id = tu.task_id
  WHERE tu.user_id = $1
    AND t.space_id = $2;
`;

try {
  const result = await pool.query(query, [userId, spaceId]);

  // mapear para obtener solo los IDs
  const taskIds = result.rows.map(row => row.task_id);

  return taskIds;

} catch (err) {
  throw err;
}

};

module.exports = getUnreadTasks