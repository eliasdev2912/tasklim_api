const { UnauthorizedError } = require("../../../utilities/errorsUtilities");
const runTransaction = require("../../../utilities/runTransaction")
const pool = require('../../../../database')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');


const logIn = async (identifier, password, clientArg = pool) => {
    return runTransaction(clientArg, async (client) => {
          const query = `
      SELECT id, username, email, password, avatarurl
      FROM users
      WHERE username = $1 OR email = $1
      LIMIT 1;
          `

        const result = await client.query(query, [identifier]);
        const user = result.rows[0];

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) throw new UnauthorizedError('Invalid password')

        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatarurl: user.avatarurl,
            },
        }
    })
}

module.exports = logIn