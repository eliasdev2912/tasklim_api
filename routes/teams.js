const express = require('express');
const router = express.Router();

const pool = require('../database.js')


// Middlewares
const verifyToken = require('../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../middlewares/spaceMiddlewares.js');
const upload = require('../middlewares/s3Uploader'); // importa el middleware

// Utilities
const { createNewTeam, getSpaceTeams, getTeamById } = require('../utilities/teamsUtilities.js');
const { sendError } = require('../utilities/errorsUtilities.js');






router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  // Usamos multer condicionalmente solo si se manda un archivo
  upload.single('team-banner-file')(req, res, async (err) => {
    if (err) {
      return sendError(res, 500, err, 'File upload error');
    }

    const meta = req.body.meta ? JSON.parse(req.body.meta) : null;
    const spaceId = req.spaceId;

    let teamBannerUrl;

    if (req.file) {
      // El usuario subió una imagen
      teamBannerUrl = req.file.location;
    } else if (meta?.teamBannerUrl) {
      // El usuario mandó un preset (URL string)
      teamBannerUrl = meta.teamBannerUrl;
    } else {
      teamBannerUrl = null; // opcional: podrías lanzar error si es obligatorio
    }

    try {
      const rawTeam = await createNewTeam(
        spaceId,
        meta.teamName,
        meta.teamDescription,
        meta.teamColor,
        teamBannerUrl,
        meta.teamMembers
      );

      const team = await getTeamById(rawTeam.id);
      return res.status(200).json(team);
    } catch (error) {
      return sendError(res, 500, error, 'Error querying the database');
    }
  });
});


router.get('/get/space_teams/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
    const spaceId = req.spaceId

    try {
        const teams = getSpaceTeams(spaceId)

        return res.status(200).json(teams)
    } catch (error) {
         return sendError(
      res, 500, error, 'Error querying the database',
    )
    }
})


module.exports = router;
