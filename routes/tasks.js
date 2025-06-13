const express = require('express');
const router = express.Router();

const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

var jwt = require('jsonwebtoken');

// Middlewares
const verifyToken = require('../middlewares/authMiddleware.js');

const {
  getTaskById,
  setNewComment,
  deleteTaskById
} = require('../utilities/tasksUtilities.js');



router.post('/create', verifyToken, async (req, res) => {
  const userId = req.user.id;

  const { taskTitle, spaceId, tableId } = req.body;

  const taskId = 'task-' + uuidv4()
  try {
    const taskQuery = `
      INSERT INTO tasks (
      id,
      created_by,
      space_id,
      table_id,
      title
      ) VALUES (
       $1, $2, $3, $4, $5)
      RETURNING *
       `

    await pool.query(taskQuery, [taskId, userId, spaceId, tableId, taskTitle])

    const newTask = await getTaskById(taskId)


    return res.status(200).json(newTask)
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})


router.delete('/delete/:id', verifyToken, async (req, res) => {
  const taskId = req.params.id;

  try {
    deleteTaskById(taskId)
    return res.status(200).send('OK')

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})

router.post('/create/comment', verifyToken, async (req, res) => {
  const { taskId, userId, body } = req.body;

  try {
    const updatedTask = await setNewComment(taskId, userId, body)
    return res.status(200).json(updatedTask)
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})

router.get('/get/:task_id', verifyToken, async (req, res) => {
  const taskId = req.params.task_id
  try {

    const task = await getTaskById(taskId)

    return res.status(200).json(task)

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})
router.post('/edit/title', verifyToken, async (req, res) => {
  const { taskId, newTitle } = req.body

  try {
    const query = `
  UPDATE tasks
SET title = $2
WHERE id = $1;
  `

    await pool.query(query, [taskId, newTitle])

    const updatedTask = await getTaskById(taskId)
    return res.status(200).json(updatedTask)

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})
router.post('/edit/description', verifyToken, async (req, res) => {
  const { taskId, newDescription } = req.body

  try {
    const query = `
  UPDATE tasks
SET description = $2
WHERE id = $1;
  `

    await pool.query(query, [taskId, newDescription])

    const updatedTask = await getTaskById(taskId)
    return res.status(200).json(updatedTask)

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})
router.post('/edit/body', verifyToken, async (req, res) => {
  const { taskId, newBody } = req.body

  try {
    const query = `
  UPDATE tasks
SET body = $2
WHERE id = $1;
  `
    await pool.query(query, [taskId, newBody])

    const updatedTask = await getTaskById(taskId)
    return res.status(200).json(updatedTask)

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})

router.post('/edit/table', verifyToken, async (req, res) => {
  const { taskId, newTableId } = req.body

  try {
    const query = `
  UPDATE tasks
SET table_id = $2
WHERE id = $1;
  `

    const queryResult = await pool.query(query, [taskId, newTableId])
    return res.status(200).json(queryResult.rows[0])

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})



module.exports = router;
