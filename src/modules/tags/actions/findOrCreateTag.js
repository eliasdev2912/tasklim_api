const { ConflictError } = require('../../../utilities/errorsUtilities');
const runTransaction = require('../../../utilities/runTransaction');
const touchTask = require('../../tasks/actions/touchTask');
const findTagByName = require('../queries/findTagByName');
const { v4: uuidv4 } = require('uuid');




const findOrCreateTag = async (spaceId, taskId, tagName, tagColor, clientArg) => {
  return runTransaction(clientArg, async (client) => {
    const upperCaseTagName = tagName.toUpperCase()

    const existingTag = await findTagByName(upperCaseTagName, spaceId, client)

    if (existingTag != null) {
      const tagInTaskQuery = `
            SELECT * FROM task_tags WHERE task_id = $1 AND tag_id = $2`

      const tagInTaskResult = await client.query(tagInTaskQuery, [taskId, existingTag.id])

      if (tagInTaskResult.rows.length > 0) {
        throw new ConflictError('Tag already exist in this task')
      }

      // Inserta la relación porque NO existe aún
      const insertTaskTagQuery = `
            INSERT INTO task_tags (task_id, tag_id)
            VALUES ($1, $2)
            RETURNING *
            `;

      const updatedTask = await touchTask(taskId, client)

      const newTaskTagResult = await client.query(insertTaskTagQuery, [taskId, existingTag.id]);

      return { tag: existingTag, taskTag: newTaskTagResult.rows[0], updatedTask };
    }

    const tagQuery = `
         INSERT INTO tags (space_id, name, color)
         VALUES ($1, $2, $3)
         RETURNING *
        `

    const taskTagQuery = `
         INSERT INTO task_tags (task_id, tag_id)
         VALUES ($1, $2)
         RETURNING *
        `

    const newTagResult = await client.query(tagQuery, [spaceId, upperCaseTagName, tagColor])
    const newTag = newTagResult.rows[0]

    const taskTagResult = await client.query(taskTagQuery, [taskId, newTag.id])
    const taskTag = taskTagResult.rows[0]

    await touchTask(taskId, client)

    return { tag: newTag, taskTag: taskTag }
  })
}

module.exports = findOrCreateTag