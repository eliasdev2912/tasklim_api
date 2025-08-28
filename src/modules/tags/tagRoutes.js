const express = require('express');
const router = express.Router();

require('dotenv').config();

const findOrCreateTag = require('./actions/findOrCreateTag.js')
const verifyToken = require('../../../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../../../middlewares/spaceMiddlewares.js');
const spaceExistsById = require('../spaces/validations/spaceExistsById.js');
const { BadRequestError } = require('../../utilities/errorsUtilities.js');
const tagExistsById = require('./validations/tagExistsById.js');
const taskExistsById = require('../tasks/validations/taskExistsById.js');
const getTaskById = require('../tasks/quieries/getTaskById.js');
const deleteTaskTag = require('./actions/deleteTaskTag.js');






router.post('/find_or_create/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { taskId, tagName, tagColor } = req.body;
  const spaceId = req.params.space_id

  try {
    await Promise.all([
      spaceExistsById.error(spaceId),
      taskExistsById.error(taskId)
    ])
    if(!tagName) throw new BadRequestError('Missing arguments: tag_name')
    if(!tagColor) throw new BadRequestError('Missing arguments: tag_color')


    const result = await findOrCreateTag(spaceId, taskId, tagName, tagColor);
    const updatedTask = await getTaskById(taskId);

    return res.status(200).json({tag: result.tag, taskTag: result.taskTag, updatedTask})
  } catch (error) {
    next(error)
  }
})

router.post('/delete/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { taskId, tagId } = req.body;

  try {
    await Promise.all([
      taskExistsById.error(taskId),
      tagExistsById.error(tagId)
    ])

    
    const result = await deleteTaskTag(taskId, tagId)

    res.status(200).json(result);

  } catch (error) {
    next(error)
  }
})


module.exports = router