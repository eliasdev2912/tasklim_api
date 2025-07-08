const express = require('express');
const router = express.Router();

const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

var jwt = require('jsonwebtoken');

// Middlewares
const verifyToken = require('../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../middlewares/spaceMiddlewares.js')

const {
  getTaskById,
  setNewComment,
  deleteTaskById,
  touchTask,
  deleteCommentById,
  setTaskContent,
} = require('../utilities/tasksUtilities.js');

const {
  findOrCreateTag,
  deleteTaskTag
} = require('../utilities/tagsUtilities.js')
const { sendError } = require('../utilities/errorsUtilities.js')





router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const userId = req.user.id;
  const { taskTitle, tableId } = req.body;
  const spaceId = req.params.space_id



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


router.delete('/delete/:id/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
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


router.post('/create/comment/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const { taskId, body } = req.body;
  const userId = req.user.id;

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

router.post('/delete/comment/:comment_id/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const commentId = req.params.comment_id;

   if (!commentId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: comment_id')
  }


  try {
    const updatedTask = await deleteCommentById(commentId)
    return res.status(200).json(updatedTask)

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})


router.get('/get/:task_id/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
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


router.post('/edit/content/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const { taskId, newTitle, newDescription, newBody } = req.body
  
  if (!taskId || !newTitle) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: task_id or new_title')
  }

  try {
    const updatedTask = await setTaskContent(taskId, newTitle, newDescription, newBody)
    return res.status(200).json(updatedTask)

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})


router.post('/edit/table/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
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


router.post('/find_or_create/tag/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const { taskId, tagName, tagColor } = req.body;
  const spaceId = req.params.space_id


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
    const result = await findOrCreateTag(spaceId, taskId, tagName, tagColor);
    const updatedTask = await getTaskById(taskId);

    return res.status(200).json({tag: result.tag, taskTag: result.taskTag, updatedTask})
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})

router.post('/delete/tag/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
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
