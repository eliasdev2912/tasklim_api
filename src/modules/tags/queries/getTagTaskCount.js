const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');



const getTagTaskCount = async (tagId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
    SELECT COUNT(*) AS count
    FROM task_tags
    WHERE tag_id = $1;
  `;

    const result = await client.query(query, [tagId]);
    return parseInt(result.rows[0].count, 10);
  })
};

module.exports = getTagTaskCount