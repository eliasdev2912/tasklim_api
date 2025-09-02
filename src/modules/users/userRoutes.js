const express = require('express');
const router = express.Router();

const pool = require('../../../database.js')

require('dotenv').config();


// Middlewares
const verifyToken = require('../../../middlewares/authMiddlewares.js');
const getPublicUserData = require('./queries/getPublicUserData.js');
const userExistsById = require('./validations/userExistsById.js');




router.get('/get/public/:id', verifyToken, async (req, res, next) => {
    const userId = req.params.id
    
    try {
        await userExistsById.error(userId)
        const userData = await getPublicUserData(userId)

        res.status(200).json(userData)
    } catch (error) {
        next(error)
    }
});


module.exports = router