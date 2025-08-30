const pool = require('../../../../database');
const runTransaction = require('../../../utilities/runTransaction');

const normalizeTablePositions = async (spaceId, clientArg = pool) => {
  return runTransaction(clientArg, async (client) => {
    const query = `
    WITH reordered AS (
      SELECT st.id,
             ROW_NUMBER() OVER (ORDER BY st.table_position) - 1 AS new_position
      FROM space_tables st
      WHERE st.space_id = $1
    )
    UPDATE space_tables st
    SET table_position = r.new_position
    FROM reordered r
    WHERE st.id = r.id;
  `;
    await client.query(query, [spaceId]);

  })
};

module.exports = normalizeTablePositions
