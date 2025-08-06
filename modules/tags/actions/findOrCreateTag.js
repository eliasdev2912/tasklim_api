const pool = require('../../../database');
const { ConflictError } = require('../../../utilities/errorsUtilities');
const spaceExistsById = require('../../spaces/validations/spaceExistsById');
const touchTask = require('../../tasks/actions/touchTask');
const taskExistsById = require('../../tasks/validations/taskExistsById');
const findTagByName = require('../queries/findTagByName');
const { v4: uuidv4 } = require('uuid');




const findOrCreateTag = async (spaceId, taskId, tagName, tagColor) => {
  // Validar existnecia y argumentos
  await Promise.all([
    spaceExistsById.error(spaceId),
    taskExistsById.error(taskId),
  ])
  // Validar argumentos
  if (!tagName) throw new BadRequestError('Missing arguments: tag_name')
  if (!tagColor) throw new BadRequestError('Missing arguments: tag_color')



  const client = await pool.connect();

  try {
    const upperCaseTagName = tagName.toUpperCase()

    const existingTag = await findTagByName(upperCaseTagName, spaceId)

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

      const updatedTask = await touchTask(taskId)

      const newTaskTagResult = await client.query(insertTaskTagQuery, [taskId, existingTag.id]);

      return { tag: existingTag, taskTag: newTaskTagResult.rows[0], updatedTask };
    }

    const tagQuery =
      `
         INSERT INTO tags (id, space_id, name, color)
         VALUES ($1, $2, $3, $4)
         RETURNING *
        `
    const newTagId = uuidv4()

    const taskTagQuery =
      `
         INSERT INTO task_tags (task_id, tag_id)
         VALUES ($1, $2)
         RETURNING *
        `

    await client.query('BEGIN');

    const newTagResult = await client.query(tagQuery, [newTagId, spaceId, upperCaseTagName, tagColor])
    const newTag = newTagResult.rows[0]

    const taskTagResult = await client.query(taskTagQuery, [taskId, newTag.id])
    const taskTag = taskTagResult.rows[0]

    await touchTask(taskId)

    await client.query('COMMIT');

    return { tag: newTag, taskTag: taskTag }
  } catch (error) {
    await client.query('ROLLBACK');
    throw error
  } finally {
    client.release();
  }
}

module.exports = findOrCreateTag