const Joi = require("joi")
const runTransaction = require("../../../utilities/runTransaction")
const { teamSchema } = require("../../teams/teamSchema")


const getTaskAssignees = (taskId, clientArg) => {
    return runTransaction(clientArg, async (client) => {
        const assigneesQuery = `
SELECT
    tea.id,
    tea.name,
    tea.color,
    tea.description,
    tea.banner_url,
    COALESCE(
        json_agg(
            json_build_object(
                'id', u.id,
                'username', u.username,
                'avatarurl', u.avatarurl,
                'email', u.email,
                'role', mi.user_rol
            )
        ) FILTER (WHERE u.id IS NOT NULL),
        '[]'
    ) AS members
FROM task_team_assignments tta
LEFT JOIN teams tea ON tta.team_id = tea.id
LEFT JOIN team_member_instances tmi ON tmi.team_id = tea.id
LEFT JOIN users u ON u.id = tmi.user_id
LEFT JOIN members_instances mi ON mi.user_id = u.id
WHERE tta.task_id = $1
GROUP BY tea.id;

        `
        const rawAssignees = (await client.query(assigneesQuery, [taskId])).rows

        // Validar esquema teamSchema
        const assigneesArraySchema = Joi.array().items(teamSchema).default([]).required()
        const {error, value: assignees} = assigneesArraySchema.validate(rawAssignees)
        if(error) throw error

        return assignees
    })
}

module.exports = getTaskAssignees