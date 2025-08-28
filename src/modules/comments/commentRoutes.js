const express = require('express');
const router = express.Router();

require('dotenv').config();

const Joi = require('joi')
// Middlewares
const verifyToken = require('../../../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../../../middlewares/spaceMiddlewares.js');
const taskExistsById = require('../tasks/validations/taskExistsById.js');
const { BadRequestError } = require('../../utilities/errorsUtilities.js');
const createComment = require('./actions/createComment.js');
const commentExistsById = require('./validations/commentExistsById.js');
const deleteCommentById = require('./actions/deleteCommentById.js');
const userExistsById = require('../users/validations/userExistsById.js');
const editCommentBody = require('./actions/editCommentBody.js');








router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { taskId, commentBody, parentCommentId } = req.body;
  const userId = req.user.id;

  try {
    // Validaciónes
    await Promise.all([
      taskExistsById.error(taskId),
      parentCommentId ? commentExistsById.error(parentCommentId) : undefined
    ])

    // Core
    const newComment = await createComment(taskId, userId, commentBody, parentCommentId)
    return res.status(200).json(newComment)
  } catch (error) {
    next(error)
  }
})

router.post('/delete/:comment_id/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const commentId = req.params.comment_id;

  try {
    // Validaciones
    await commentExistsById.error(commentId)

    // Core
    const updatedTask = await deleteCommentById(commentId)
    return res.status(200).json({message: 'success'})

  } catch (error) {
    next(error)
  }
})

router.post('/edit/body/:comment_id/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const commentId = req.params.comment_id
  const { newBody } = req.body

  try {
    await commentExistsById.error(commentId)
    const updatedComment = await editCommentBody(commentId, newBody);

    res.status(200).json(updatedComment)
  } catch (error) {
    next(error)
  }
})

module.exports = router