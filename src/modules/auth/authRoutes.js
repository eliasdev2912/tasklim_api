const express = require('express');
const router = express.Router();

const pool = require('../../../database.js')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

require('dotenv').config();


// Middlewares
const verifyToken = require('../../../middlewares/authMiddlewares.js');

// Functions

const { BadRequestError, ConflictError, NotFoundError } = require('../../utilities/errorsUtilities.js');
const userExistsByEmail = require('../users/validations/userExistsByEmail.js');
const userExistsByUsername = require('../users/validations/userExistsByUsername.js');
const signUp = require('./actions/singUp.js');
const logIn = require('./actions/logIn.js');


router.get('/validate_token', verifyToken, async (req, res, next) => {
    const clientId = req.user.id;

    try {
        const query = `
        SELECT id, username, email, avatarurl
        FROM users
        WHERE id = $1
        LIMIT 1;
        `

        const result = await pool.query(query, [clientId]);

        res.json(result.rows[0]);
    } catch (error) {
        next(error)
    }
})


router.post('/signup', async (req, res, next) => {
    const { username, email, password, passwordConfirm } = req.body;

    try {
        // Validación de argumentos
        if (!password) throw new BadRequestError('Missing arguments: password')
        if (!passwordConfirm) throw new BadRequestError('Missing arguments: password_confirm')

        // Validación de username
        const usernameAlreadyExists = await userExistsByUsername.bool(username)
        if (usernameAlreadyExists) throw new ConflictError('A user with this username already exists.')

        // Validación de email
        const userEmailAlreadyExists = await userExistsByEmail.bool(email)
        if (userEmailAlreadyExists) throw new ConflictError('A user with this email already exists.')

        // Validación de password
        if (password !== passwordConfirm) throw new BadRequestError('Password confirmation does not match')

        const result = await signUp(username, email, password)

        // Return token and public user data
        res.status(201).json(result);
    } catch (error) {
        next(error)
    }
});

router.post('/login', async (req, res, next) => {
    const { identifier, password } = req.body;
    try {
        const [existsByUsername, existsByEmail] = await Promise.all([
            userExistsByUsername.bool(identifier),
            userExistsByEmail.bool(identifier)
        ]);
        const userFound = existsByUsername || existsByEmail;
        if (!userFound) throw new NotFoundError('User not found')

        const loginResult = await logIn(identifier, password)
        res.status(200).json(loginResult);

    } catch (error) {
        next(error)
    }
});




module.exports = router;
