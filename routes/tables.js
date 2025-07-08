const express = require('express');
const router = express.Router();

const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

var jwt = require('jsonwebtoken');

// Middlewares
const verifyToken = require('../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../middlewares/spaceMiddlewares.js')

// Functions
const { findTableByName, createNewTable, changeTablePosition, findTableById, changeTableFormat } = require('../utilities/tablesUtilities.js')
const { sendError } = require('../utilities/errorsUtilities.js')




router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const { newTableName } = req.body
  const spaceId = req.params.space_id

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


router.post('/edit/name/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const { tableId, newTableName } = req.body;
  const spaceId = req.params.space_id


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


router.post('/edit/color/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
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


router.post('/edit/position/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const {tableId, tableFromIndex, tableToIndex, neighborTableId} = req.body
  const spaceId = req.params.space_id

  try {
    await changeTablePosition(spaceId, tableId, tableFromIndex, tableToIndex, neighborTableId)

    res.send('success')
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})


router.post('/edit/task_format/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
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