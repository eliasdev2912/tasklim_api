const pool = require('../../../database');
const teamExistsById = require('../../teams/validations/teamExistsById');
const taskExistsById = require('../validations/taskExistsById');




const addAssignee = async (taskId, teamId) => {
  // Validar existencias y argumentos
  await Promise.all([
    taskExistsById.error(taskId),
    teamExistsById.error(teamId)
  ])

  const query = `
  INSERT INTO task_team_assignments (task_id, team_id)
  VALUES ($1, $2);
  `
  try {
    await pool.query(query, [taskId, teamId])
  } catch (error) {
    throw error
  }
}

module.exports = addAssignee