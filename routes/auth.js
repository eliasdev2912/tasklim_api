const express = require('express');
const router = express.Router();

const pool = require('../database')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

require('dotenv').config();


// Middlewares
const verifyToken = require('../middlewares/authMiddleware.js');




router.get('/validate_token', verifyToken, async (req, res) => {
    const clientId = req.user.id;

    try {
        const query = `
      SELECT id, username, email, avatarurl
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;

        const result = await pool.query(query, [clientId]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al consultar la base de datos', err);
        res.status(500).send('Internal server error')
    }
})

router.get('/user/:id', verifyToken, async (req, res) => {
    const userId = req.params.id

    const userQuery = `
    SELECT id, username, avatarurl, email
FROM users
WHERE id = $1;
`
       const spacesQuery = `
SELECT
  b.id AS space_id,
  b.space_name,
  b.space_description,
  b.created_at AS space_created_at,
  (
    SELECT json_agg(
      json_build_object(
        'member_id', u2.id,
        'member_username', u2.username,
        'member_avatarurl', u2.avatarurl,
        'member_rol', m2.user_rol
      )
    )
    FROM members_instances m2
    JOIN users u2 ON m2.user_id = u2.id
    WHERE m2.space_id = b.id
  ) AS space_members
FROM spaces b
JOIN members_instances m ON b.id = m.space_id
WHERE m.user_id = $1;
    `;

    try {
        const userResult = await pool.query(userQuery, [userId])
        const spacesResult = await pool.query(spacesQuery, [userId]);
        res.json({user: userResult.rows[0], spaces: spacesResult.rows});
    } catch (err) {
        console.error('Error fetching user spaces:', err);
        res.status(500).send('Internal server error');
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { username, email, password, passwordConfirm } = req.body;

        // Basic validation
        if (!username || !email || !password || !passwordConfirm) {
            return res.status(400).send('Required fields are missing');
        }

        if (password !== passwordConfirm) {
            return res.status(400).send('Passwords do not match');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in the database (safe parameterized query)
        const result = await pool.query(
            `INSERT INTO users (username, email, password, avatarurl)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, avatarurl`,
            [username, email, hashedPassword, 'placeholder-url']
        );

        const newUser = result.rows[0];

        // Generate token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        // Return token and public user data
        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                avatarurl: newUser.avatarurl,
            },
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Internal server error');
    }
});


router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).send('Required fields are missing');
        }

        const query = `
      SELECT id, username, email, password, avatarurl
      FROM users
      WHERE username = $1 OR email = $1
      LIMIT 1;
    `;

        const result = await pool.query(query, [identifier]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).send("User not found");
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).send("Invalid password");
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        res.status(200).json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarurl: user.avatarurl,
            },
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal server error');
    }
});




module.exports = router;
