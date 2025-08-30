const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');

const deleteTaskById = async (taskId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
    DELETE FROM tasks WHERE id = $1
  `
    await client.query(query, [taskId])
  })
}

module.exports = deleteTaskById