const pool = require('../database.js')

const { v4: uuidv4 } = require('uuid');

const { getTaskById, taskExists, touchTask } = require('./tasksUtilities.js')


const findTagByName = async (tagName, spaceId) => {
    if (!tagName || !spaceId) throw new Error('MISSING_ARGUMENTS')

    try {
        const query = `SELECT * FROM tags WHERE name = $1 AND space_id = $2`
        const result = await pool.query(query, [tagName, spaceId])
        return result.rows[0]
    } catch (error) {
        throw error
    }
}

const tagExists = async (tagId) => {
    if (!tagId) throw new Error('TAG_ID_IS_REQUIRED');

    const query = `
    SELECT EXISTS (
      SELECT 1 FROM tags WHERE id = $1
    )
  `;

    const result = await pool.query(query, [tagId]);
    return result.rows[0].exists; // ✅ esto es true o false
};

const getTagTaskCount = async (tagId) => {
    if (!tagId) throw new Error('MISSING_ARGUMENTS');

    const query = `
    SELECT COUNT(*) AS count
    FROM task_tags
    WHERE tag_id = $1;
  `;

    const result = await pool.query(query, [tagId]);
    return parseInt(result.rows[0].count, 10);
};



const findOrCreateTag = async (spaceId, taskId, tagName, tagColor) => {
    if (!taskId || !tagName || !tagColor || !spaceId) throw new Error('MISSING_ARGUMENTS')

    const client = await pool.connect();

    try {

        const task = await getTaskById(taskId)
        if (!task) throw new Error('TASK_DONT_EXIST')

        const upperCaseTagName = tagName.toUpperCase()

        const existingTag = await findTagByName(upperCaseTagName, spaceId)

        if (existingTag != null) {
            const tagInTaskQuery = `
            SELECT * FROM task_tags WHERE task_id = $1 AND tag_id = $2`

            const tagInTaskResult = await client.query(tagInTaskQuery, [taskId, existingTag.id])

            if (tagInTaskResult.rows.length > 0) {
                throw new Error('TAG_ALREADY_EXIST_IN_THIS_TASK')
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

        const updatedTask = await touchTask(taskId)


        await client.query('COMMIT');

        return { tag: newTag, taskTag: taskTag, updatedTask }
    } catch (error) {
        await client.query('ROLLBACK');
        throw error
    } finally {
        client.release();
    }
}

const deleteTaskTag = async (taskId, tagId) => {
    if (!taskId || !tagId) {
        throw new Error('MISSING_ARGUMENTS');
    }

    const tagExists_ = await tagExists(tagId);
    const taskExists_ = await taskExists(taskId);

    if (!tagExists_) {
        throw new Error('TAG_NOT_FOUND');
    } else if (!taskExists_) {
        throw new Error('TASK_NOT_FOUND');
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1️⃣ Borra SOLO la relación task-tag específica
        const deleteTaskTagQuery = `
      DELETE FROM task_tags 
      WHERE tag_id = $1 AND task_id = $2
    `;
        await client.query(deleteTaskTagQuery, [tagId, taskId]);


        await client.query('COMMIT');

        // 2️⃣ Verifica cuántas quedan después de borrarla
        const tagTaskCount = await getTagTaskCount(tagId);
        if (tagTaskCount == 0) {
            // Si quedó huérfano: eliminar tag
            const deleteTagQuery = `DELETE FROM tags WHERE id = $1`;
            await client.query(deleteTagQuery, [tagId]);
        }

        const updatedTask = await touchTask(taskId)
        return { updatedTask }

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};



module.exports = {
    findOrCreateTag,
    tagExists,
    findTagByName,
    deleteTaskTag
}