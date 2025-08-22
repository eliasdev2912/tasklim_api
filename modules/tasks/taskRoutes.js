const express = require('express');
const router = express.Router();

require('dotenv').config();

const tableExistsById = require('../tables/validations/tableExistsById.js');
const spaceExistsById = require('../spaces/validations/spaceExistsById.js');
const { BadRequestError } = require('../../utilities/errorsUtilities.js');
const createTask = require('./actions/createTask.js');
const taskExistsById = require('./validations/taskExistsById.js');
const deleteTaskById = require('./actions/deleteTaskById.js');
const getTaskById = require('./quieries/getTaskById.js');
const setTaskContent = require('./actions/setTaskContent.js');
const changeTaskTable = require('./actions/changeTaskTable.js');
const addAssignee = require('./actions/addAssignee.js');
const touchTask = require('./actions/touchTask.js');
const userExistsById = require('../users/validations/userExistsById.js');
const verifyToken = require('../../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../../middlewares/spaceMiddlewares.js');
const teamExistsById = require('../teams/validations/teamExistsById.js');
const deleteAssignee = require('./actions/deleteAssignee.js');





router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const userId = req.user.id;
  const { taskTitle, tableId } = req.body;
  const spaceId = req.params.space_id

  try {
    await Promise.all([
      userExistsById.error(userId),
      tableExistsById.error(tableId),
      spaceExistsById.error(spaceId)
    ])
    if(!taskTitle) throw new BadRequestError('Missing arguments: task_title')

    const newRawTask = await createTask(userId, tableId, spaceId, taskTitle)
    const newTask = await getTaskById(newRawTask.metadata.id)


    return res.status(200).json(newTask)
  } catch (error) {
    next(error)
  }
})


router.delete('/delete/:id/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const taskId = req.params.id;

  try {
    await taskExistsById.error(taskId)

    await deleteTaskById(taskId)
    return res.status(200).send('OK')

  } catch (error) {
    next(error)
  }
})

router.get('/get/:task_id/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const taskId = req.params.task_id

  try {
    const task = await getTaskById(taskId)

    return res.status(200).json(task)

  } catch (error) {
    next(error)
  }
})


router.post('/edit/content/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { taskId, newTitle, newDescription, newBody } = req.body
  try {
    await taskExistsById.error(taskId)
    if(!newTitle) throw new BadRequestError('Missing arguments: new_title')

    const updatedTask = await setTaskContent(taskId, newTitle, newDescription, newBody)
    return res.status(200).json(updatedTask)

  } catch (error) {
    next(error)
  }
})


router.post('/edit/table/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { taskId, newTableId } = req.body

  try {
    await Promise.all([
      taskExistsById.error(taskId),
      tableExistsById.error(newTableId)
    ])

    const updatedTask = await changeTaskTable(taskId, newTableId)

    return res.status(200).json(updatedTask)

  } catch (error) {
    next(error)
  }
})


router.post('/create/assignee/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const {taskId, teamId} = req.body

  try {
    await Promise.all([
      taskExistsById.error(taskId),
      teamExistsById.error(teamId)
    ])
    await addAssignee(taskId, teamId)
    const updatedTask = await touchTask(taskId)
    return res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
})


router.post('/delete/assignee/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const {taskId, teamId} = req.body

  if(!taskId || !teamId) {
        return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id or team_id')
  }

  try {
    await Promise.all([
      taskExistsById.error(taskId),
      teamExistsById.error(teamId)
    ])

    await deleteAssignee(taskId, teamId)
    const updatedTask = await touchTask(taskId)
    return res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
})



module.exports = router;
