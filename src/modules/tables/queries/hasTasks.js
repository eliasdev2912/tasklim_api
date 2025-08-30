const pool = require('../../../../database')
const runTransaction = require('../../../utilities/runTransaction')


const hasTasks = async (tableId, clientArg = pool) => {
    return runTransaction(clientArg, async (client) => {
        const query = `
     SELECT id FROM tasks WHERE table_id = $1 LIMIT 1;
     `
        const hasTasks = (await client.query(query, [tableId])).rowCount > 0
        return hasTasks
    })
}

module.exports = hasTasks