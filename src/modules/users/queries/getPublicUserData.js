const runTransaction = require("../../../utilities/runTransaction")



const getPublicUserData = async (userId, clientArg) => {
    return runTransaction(clientArg, async (client) => {
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
        `

        const userResult = await client.query(userQuery, [userId])
        const spacesResult = await client.query(spacesQuery, [userId])

        return { user: userResult.rows[0], spaces: spacesResult.rows }
    })
}

module.exports = getPublicUserData