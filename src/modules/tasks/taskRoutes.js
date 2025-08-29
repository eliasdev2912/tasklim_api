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
const verifyToken = require('../../../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../../../middlewares/spaceMiddlewares.js');
const teamExistsById = require('../teams/validations/teamExistsById.js');
const deleteAssignee = require('./actions/deleteAssignee.js');
const markTaskRead = require('./actions/markTaskRead.js');





router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const userId = req.user.id;
  const { taskTitle, tableId } = req.body;
  const spaceId = req.params.space_id

  try {
    await tableExistsById.error(tableId)

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
    return res.status(200).json({message: 'success'})

  } catch (error) {
    next(error)
  }
})

router.get('/get/:task_id/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const taskId = req.params.task_id

  try {
    await taskExistsById.error(taskId)

    const task = await getTaskById(taskId)

    return res.status(200).json(task)

  } catch (error) {
    next(error)
  }
})


router.post('/edit/content/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { taskId, newTitle, newDescription, newBody } = req.body
  const spaceId = req.params.space_id
  const clientId = req.user.id

  try {
    await taskExistsById.error(taskId)

    const updatedTask = await setTaskContent(spaceId, taskId, newTitle, newDescription, newBody, clientId)
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
    
    const updatedTask = await addAssignee(taskId, teamId)
    return res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
})


router.post('/delete/assignee/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const {taskId, teamId} = req.body

  try {
    await Promise.all([
      taskExistsById.error(taskId),
      teamExistsById.error(teamId)
    ])

    const updatedTask = await deleteAssignee(taskId, teamId)
    return res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
})

router.post('/set/read_task/:space_id/:task_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
    const userId = req.user.id
    const taskId = req.params.task_id

    try {
    await Promise.all([
      taskExistsById.error(taskId)
    ])

    await markTaskRead(taskId, userId)
    res.status(200).json({message: 'ok'})
  } catch (error) {
    next(error)
  }
})



module.exports = router;
