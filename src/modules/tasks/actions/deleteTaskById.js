const pool = require('../../../../database');

const deleteTaskById = async (taskId, client = pool) => {
  const query = `
    DELETE FROM tasks WHERE id = $1
  `

  try {
    await client.query(query, [taskId])

  } catch (error) {
    throw error
  }
}

module.exports = deleteTaskById