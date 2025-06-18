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
  deleteTaskById,
  touchTask,
} = require('../utilities/tasksUtilities.js');

const {
  findOrCreateTag,
  deleteTaskTag
} = require('../utilities/tagsUtilities.js')
const { sendError } = require('../utilities/errorsUtilities.js')





router.post('/create', verifyToken, async (req, res) => {
  const userId = req.user.id;

  const { taskTitle, spaceId, tableId } = req.body;

  if (!taskTitle || !spaceId || !tableId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_title, space_id or table_id')
  }

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

  if (!taskId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id')
  }


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

  if (!taskId || !userId || !body) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id, user_id or comment_body')
  }

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

  if (!taskId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id')
  }


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

  if (!taskId || !newTitle) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id or new_title')
  }

  try {
    const query = `
  UPDATE tasks
  SET 
   title = $2,
   updated_at = NOW()
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

  if (!taskId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id')
  }


  try {
    const query = `
  UPDATE tasks
  SET 
   description = $2,
   updated_at = NOW()
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

  if (!taskId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id')
  }

  try {
    const query = `
  UPDATE tasks
  SET 
  body = $2,
  updated_at = NOW()
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

  if (!taskId || !newTableId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id or new_table_id')
  }
  try {
    const query = `
  UPDATE tasks
SET table_id = $2
WHERE id = $1;
  `

    await pool.query(query, [taskId, newTableId])
    await touchTask(taskId)
    const updatedTask = await getTaskById(taskId)

    return res.status(200).json(updatedTask)

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})


router.post('/find_or_create/tag', verifyToken, async (req, res) => {
  const { taskId, tagName, tagColor, spaceId } = req.body;

  if (!taskId || !tagName || !tagColor || !spaceId) {
    if (!taskId) {
      return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id')
    }
    else if (!tagName) {
      return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: tag_name')
    }
    else if (!tagColor) {
      return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: tag_color')
    }
    else {
      return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: space_id')
    }
  }

  try {
    const tag = await findOrCreateTag(spaceId, taskId, tagName, tagColor);
    return res.status(200).json(tag)
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})

router.post('/delete/tag', verifyToken, async (req, res) => {
  const { taskId, tagId } = req.body;

  if (!taskId || !tagId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id or tag_id')
  }

  try {
    const result = await deleteTaskTag(taskId, tagId)

    res.status(200).json(result);

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})



module.exports = router;
