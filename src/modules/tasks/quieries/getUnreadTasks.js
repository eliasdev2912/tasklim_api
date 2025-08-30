const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');


const getUnreadTasks = async (spaceId, userId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
  SELECT tu.*
  FROM task_unreads tu
  JOIN tasks t ON t.id = tu.task_id
  WHERE tu.user_id = $1
    AND t.space_id = $2;
`;
  const result = (await client.query(query, [userId, spaceId])).rows;
  return result;
  })
};

module.exports = getUnreadTasks