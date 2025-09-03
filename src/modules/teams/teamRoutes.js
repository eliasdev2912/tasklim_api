const express = require('express');
const router = express.Router();

// Middlewares
const verifyToken = require('../../../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../../../middlewares/spaceMiddlewares.js');
const upload = require('../../../middlewares/s3Uploader.js'); // importa el middleware

const { BadRequestError } = require('../../utilities/errorsUtilities.js');
const createNewTeam = require('./actions/createNewTeam.js');
const getTeamsBySpaceId = require('./queries/getTeamsBySpaceId.js');
const userExistsById = require('../users/validations/userExistsById.js');





router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  try {
    // Promisificamos multer inline
    await new Promise((resolve, reject) => {
      upload.single('team-banner-file')(req, res, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    const meta = req.body.meta ? JSON.parse(req.body.meta) : null
    const spaceId = req.spaceId

    if (!meta) throw new BadRequestError('Missing or invalid meta payload')

    let teamBannerUrl
    if (req.file) {
      teamBannerUrl = req.file.location
    } else if (meta.teamBannerUrl) {
      teamBannerUrl = meta.teamBannerUrl
    } else {
      throw new BadRequestError('Missing arguments: team-banner')
    }

    // Validaciones
    await Promise.all(meta.teamMembers.map(userId => userExistsById.error(userId)))

    if (!meta.teamName) throw new BadRequestError('Missing arguments: team_name')
    if (!meta.teamDescription) throw new BadRequestError('Missing arguments: team_description')
    if (!meta.teamColor) throw new BadRequestError('Missing arguments: team_color')

    // Crear equipo
    const team = await createNewTeam(
      spaceId,
      meta.teamName,
      meta.teamDescription,
      meta.teamColor,
      teamBannerUrl,
      meta.teamMembers
    )

    res.status(200).json(team)
  } catch (error) {
    next(error)
  }
})



router.get('/get/space_teams/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const spaceId = req.spaceId

  try {
    const teams = getTeamsBySpaceId(spaceId)

    return res.status(200).json(teams)
  } catch (error) {
    next(error)
  }
})


module.exports = router;
