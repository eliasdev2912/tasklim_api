const pool = require('../../../database');
const teamExistsById = require('../../teams/validations/teamExistsById');
const taskExistsById = require('../validations/taskExistsById');








const deleteAssignee = async (taskId, teamId) => {
  // Validar existencias y argumentos
  await Promise.all([
  taskExistsById.error(taskId),
  teamExistsById.error(teamId)
  ])


  const query = `
  DELETE FROM task_team_assignments WHERE task_id = $1 AND team_id = $2
  `
  try {
    await pool.query(query, [taskId, teamId])
  } catch (error) {
    throw error
  }
}

module.exports = deleteAssignee