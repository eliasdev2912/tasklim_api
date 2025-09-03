// modules/tasks/listeners/notifyAdmins.js
const runTransaction = require('../../../utilities/runTransaction');
const eventBus = require('../../event_bus/eventBus');
const getSpaceMembers = require('../../member_instances/queries/getSpaceMembers');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const userExistsById = require('../../users/validations/userExistsById');
const markTaskUnread = require('../actions/markTaskUnread');
const taskExistsById = require('../validations/taskExistsById');

function onTaskCreatedSetUnreads() {
  eventBus.on('taskCreatedSetUnreads', async (payload) => {
    const { spaceId, task, clientArg } = payload

    return runTransaction(clientArg, async (client) => {
      // Validaciones
      await Promise.all([
        spaceExistsById.error(spaceId, client),
        taskExistsById.error(task.metadata.id, client)
      ])

      // Obtener todos los miembros del espacio
      const teamMembers = await getSpaceMembers(spaceId, client);

      // Validar existencia de todos los miembros
      await Promise.all(
        teamMembers.map(member => userExistsById.error(member.id, client))
      );

      // Filtrar al creador y crear registros "unread" para los demás
      const membersExceptCreator = teamMembers.filter(
        member => member.id !== task.metadata.created_by.id
      );

      // Insertar registros de manera paralela
      await Promise.all(
        membersExceptCreator.map(member =>
          markTaskUnread(task.metadata.id, member.id, 'created', client)
        )
      );
    })
  });
}


module.exports = onTaskCreatedSetUnreads;
