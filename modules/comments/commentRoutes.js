const express = require('express');
const router = express.Router();

require('dotenv').config();

// Middlewares
const verifyToken = require('../../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../../middlewares/spaceMiddlewares.js');
const taskExistsById = require('../tasks/validations/taskExistsById.js');
const { BadRequestError } = require('../../utilities/errorsUtilities.js');
const setNewComment = require('./actions/setNewComment.js');
const commentExistsById = require('./validations/commentExistsById.js');
const deleteCommentById = require('./actions/deleteCommentById.js');
const userExistsById = require('../users/validations/userExistsById.js');








router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { taskId, body } = req.body;
  const userId = req.user.id;

  try {
    await Promise.all([
      userExistsById.error(userId),
      taskExistsById.error(taskId)
    ])
    if(!body) throw new BadRequestError('Missing arguments: body')
    
    
    const updatedTask = await setNewComment(taskId, userId, body)
    return res.status(200).json(updatedTask)
  } catch (error) {
    next(error)
  }
})

router.post('/delete/:comment_id/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const commentId = req.params.comment_id;

  try {
    await commentExistsById.error(commentId)

    const updatedTask = await deleteCommentById(commentId)
    return res.status(200).json(updatedTask)

  } catch (error) {
    next(error)
  }
})


module.exports = router