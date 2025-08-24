// modules/tasks/listeners/notifyAdmins.js
const eventBus = require('../../event_bus/eventBus');
const getSpaceMembers = require('../../spaces/queries/getSpaceMembers');
const userExistsById = require('../../users/validations/userExistsById');
const markTaskUnread = require('../actions/markTaskUnread');

function taskCreatedSetUnreads() {
  eventBus.on('taskCreatedSetUnreads', async (payload) => {
    try {
      // Obtener todos los miembros del espacio
      const teamMembers = await getSpaceMembers(payload.spaceId);

      // Validar existencia de todos los miembros
      await Promise.all(
        teamMembers.map(member => userExistsById.error(member.id))
      );

      // Filtrar al creador y crear registros "unread" para los demás
      const membersExceptCreator = teamMembers.filter(
        member => member.id !== payload.task.metadata.created_by.id
      );

      // Insertar registros de manera paralela
      await Promise.all(
        membersExceptCreator.map(member =>
          markTaskUnread(payload.task.metadata.id, member.id, 'created')
        )
      );

    } catch (err) {
      throw err
    }
  });
}


module.exports = taskCreatedSetUnreads;
