const pool = require('../../../../database')


const hasTasks = async (tableId) => {
    const query = `
        SELECT id FROM tasks WHERE table_id = $1 LIMIT 1;
    `
    try {
        const hasTasks = (await pool.query(query, [tableId])).rowCount > 0
        return hasTasks
    } catch (error) {
        throw error
    }
}

module.exports = hasTasks