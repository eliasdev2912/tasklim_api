const express = require('express');
const router = express.Router();

require('dotenv').config();

var jwt = require('jsonwebtoken');

// Middlewares
const verifyToken = require('../../../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../../../middlewares/spaceMiddlewares.js')

// Functions
const { BadRequestError } = require('../../utilities/errorsUtilities.js');
const createSpace = require('./actions/createSpace.js');
const spaceExistsById = require('./validations/spaceExistsById.js');
const getSpace = require('./queries/getSpace.js');
const verifyInviteCode = require('./validations/verifyInviteCode.js');
const leaveSpace = require('./actions/leaveSpace.js');
const userExistsById = require('../users/validations/userExistsById.js');
const getUnreadTasks = require('../tasks/quieries/getUnreadTasks.js');




router.post('/create', verifyToken, async (req, res, next) => {
  const userId = req.user.id;
  const { spaceName, spaceDescription } = req.body

  try {
    //Crear space
    const {newSpace, newMemberInstance, newTables} = await createSpace(userId, spaceName, spaceDescription)

    return res.status(200).json({ newSpace, newMemberInstance, newTables })

  } catch (err) {
    console.log(err)
    next(err)
  }
});


router.get('/get/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const spaceId = req.params.space_id;  // o donde venga spaceId
  const userId = req.user.id

  try {
    if(!spaceId) throw new BadRequestError('Missing arguments: space_id')
      
    const space = await getSpace(spaceId)
    const unreadTasks = await getUnreadTasks(spaceId, userId)

    return res.json({...space, unreadTasks})

  } catch (error) {
    next(error)
  }
})

router.post('/create/invitation_code/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const spaceId = req.params.space_id;
  const expiresIn = '1h'; // o por minutos, horas, etc.

  try {
    if(!spaceId) throw new BadRequestError('Missing arguments: space_id')

  const token = jwt.sign(
    { spaceId },
    process.env.JWT_INVITE_SECRET,
    { expiresIn }
  );

  res.json({ code: token });
  } catch (error) {
    next(error)
  }
});

router.get('/verify/invitation/:token', verifyToken, async (req, res, next) => {
  const { token } = req.params;
  const userId = req.user.id;

  try {
    if(!token) throw new BadRequestError('Missing arguments: token')
    await userExistsById.error(userId)

    const payload = await verifyInviteCode(token, userId)

    return res.status(200).json({
      valid: true,
      spaceId: payload.spaceId,
      joined: true,
    }); 

  } catch (err) {
    next(err)
  }
});


router.delete('/leave/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const userId = req.user.id;
  const spaceId = req.params.space_id;

  try {
    await Promise.all([
      userExistsById.error(userId),
      spaceExistsById.error(spaceId)
    ])

    await leaveSpace(userId, spaceId)
    
    res.status(200).json({
      message: 'Successfully left the space'
    });
  } catch (error) {
    next(error)
  }
});



module.exports = router;
