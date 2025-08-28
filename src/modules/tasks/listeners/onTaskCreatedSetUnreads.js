// modules/tasks/listeners/notifyAdmins.js
const eventBus = require('../../event_bus/eventBus');
const getSpaceMembers = require('../../spaces/queries/getSpaceMembers');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const userExistsById = require('../../users/validations/userExistsById');
const markTaskUnread = require('../actions/markTaskUnread');
const taskExistsById = require('../validations/taskExistsById');

function onTaskCreatedSetUnreads() {
  eventBus.on('taskCreatedSetUnreads', async (payload) => {
    const {spaceId, task} = payload

    try {
      // Validaciones
      await Promise.all([
        spaceExistsById.error(spaceId),
        taskExistsById.error(task.metadata.id)
      ])

      // Obtener todos los miembros del espacio
      const teamMembers = await getSpaceMembers(spaceId);

      // Validar existencia de todos los miembros
      await Promise.all(
        teamMembers.map(member => userExistsById.error(member.id))
      );

      // Filtrar al creador y crear registros "unread" para los demás
      const membersExceptCreator = teamMembers.filter(
        member => member.id !== task.metadata.created_by.id
      );

      // Insertar registros de manera paralela
      await Promise.all(
        membersExceptCreator.map(member =>
          markTaskUnread(task.metadata.id, member.id, 'created')
        )
      );

    } catch (err) {
      throw err
    }
  });
}


module.exports = onTaskCreatedSetUnreads;
