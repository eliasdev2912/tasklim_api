const runTransaction = require("../../../utilities/runTransaction")


const pool = require('../../../../database')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');


const signUp = async (username, email, password, clientArg = pool) => {
    return runTransaction(clientArg, async (client) => {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in the database (safe parameterized query)
        const result = await client.query(
            `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatarurl`,
            [username, email, hashedPassword]
        );
        const newUser = result.rows[0];

        // Generate token
        const token = jwt.sign(
            { id: newUser.id, username: newUser.username },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        return {
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                avatarurl: newUser.avatarurl,
            },
        }
    })
}

module.exports = signUp