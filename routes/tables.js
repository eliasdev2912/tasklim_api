const express = require('express');
const router = express.Router();

const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

var jwt = require('jsonwebtoken');

// Middlewares
const verifyToken = require('../middlewares/authMiddleware.js');


// Functions
const { findTableByName, createNewTable, changeTablePosition, findTableById, changeTableFormat } = require('../utilities/tablesUtilities.js')
const { sendError } = require('../utilities/errorsUtilities.js')




router.post('/create', verifyToken, async (req, res) => {
  const { newTableName, spaceId } = req.body

  if (!newTableName || !spaceId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: new_table_name or space_id')
  }

  try {
    const existingTable = await findTableByName(newTableName, spaceId)

    if (existingTable != null) {
      return sendError(
        res, 409,
        'TABLE_NAME_ALREADY_EXISTS',
        'A column with that name already exists in this space'
      )
    }

    const newTable = await createNewTable(spaceId, newTableName)
    return res.status(200).json(newTable)

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})


router.post('/edit/name', verifyToken, async (req, res) => {
  const { tableId, newTableName, spaceId } = req.body;

    if (!newTableName || !spaceId || !tableId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: new_table_name, table_id or space_id')
  }

  try {
    const existingTable = await findTableByName(newTableName, spaceId)

    if (existingTable != null && existingTable.id != tableId) {
      return sendError(
        res, 409,
        'TABLE_NAME_ALREADY_EXISTS',
        'A column with that name already exists in this space'
      )
    }

    const query = `
      UPDATE space_tables
      SET name = $1
      WHERE id = $2
      RETURNING *;
    `;

    await pool.query(query, [newTableName, tableId]);
    const updatedTable = await findTableById(tableId)

    res.status(200).json(updatedTable);
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
});

router.post('/edit/color', verifyToken, async (req, res) => {
  const {newColor, tableId} = req.body;

  if(!tableId) {
    return sendError(res, 
      400, 
      'MISSING_REQUIRED_FIELDS', 
      'Missing required fields: table_id'
    )
  }

  try {
    const query = `
    UPDATE space_tables
    SET color = $1
    WHERE id = $2
    `

    await pool.query(query, [newColor, tableId])

    const updatedTable = await findTableById(tableId)

    return res.status(200).json(updatedTable)

  } catch (error) {
     return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})

router.post('/edit/position', verifyToken, async (req, res) => {
  const {spaceId, tableId, tableFromIndex, tableToIndex, neighborTableId} = req.body

  try {
    await changeTablePosition(spaceId, tableId, tableFromIndex, tableToIndex, neighborTableId)

    res.send('success')
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})


router.post('/edit/task_format', verifyToken, async (req, res) => {
  const {newFormat, tableId} = req.body;

  if(!tableId || !newFormat) {
    return sendError(res, 
      400, 
      'MISSING_REQUIRED_FIELDS', 
      'Missing required fields: table_id or new_format'
    )
  }


  try {
    const updatedTable = await changeTableFormat(tableId, newFormat)
    return res.status(200).json(updatedTable)
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})




module.exports = router