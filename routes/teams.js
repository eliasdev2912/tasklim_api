const express = require('express');
const router = express.Router();

const pool = require('../database.js')


// Middlewares
const verifyToken = require('../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../middlewares/spaceMiddlewares.js');
const { sendError } = require('../utilities/errorsUtilities.js');
const { createNewTeam, getSpaceTeams, getTeamById } = require('../utilities/teamsUtilities.js');



router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
    const {teamName, teamDescription, teamColor, teamMembers} = req.body;
    const spaceId = req.spaceId

    try {
        const rawTeam = await createNewTeam(spaceId, teamName, teamDescription, teamColor, teamMembers)
        const team = await getTeamById(rawTeam.id)

        return res.status(200).json(team)
    } catch (error) {
        return sendError(
      res, 500, error, 'Error querying the database',
    )
    }
})

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
