const eventBus = require('../../event_bus/eventBus');
const getSpaceMembers = require('../../member_instances/queries/getSpaceMembers');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const userExistsById = require('../../users/validations/userExistsById');
const markTaskUnread = require('../actions/markTaskUnread');
const taskExistsById = require('../validations/taskExistsById');

function onTaskUpdatedSetUnreads() {
  eventBus.on('taskUpdated', async (payload) => {
    const { spaceId, task, updateAuthorId } = payload

    try {
      // Validaciones
      await Promise.all([
        spaceExistsById.error(spaceId),
        userExistsById.error(updateAuthorId),
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
        member => member.id !== updateAuthorId
      );


      // Insertar registros de manera paralela
      await Promise.all(
        membersExceptCreator.map(member =>
          markTaskUnread(task.metadata.id, member.id, 'updated')
        )
      );

    } catch (err) {
      throw err
    }
  });
}


module.exports = onTaskUpdatedSetUnreads;
