const express = require('express');
const router = express.Router();

require('dotenv').config();

// Middlewares
const verifyToken = require('../../../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../../../middlewares/spaceMiddlewares.js')

// Functions
const { BadRequestError, ConflictError } = require('../../utilities/errorsUtilities.js');
const createNewTable = require('./actions/createNewTable.js');
const tableExistsById = require('./validations/tableExistsById.js');
const changeTableName = require('./actions/changeTableName.js');
const changeTableColor = require('./actions/changeTableColor.js');
const changeTablePosition = require('./actions/changeTablePosition.js')
const changeTableFormat = require('./actions/changeTableFormat.js');
const deleteTable = require('./actions/deleteTable.js');
const tableExistsByName = require('./validations/tableExistsByName.js');



router.post('/create/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { newTableName } = req.body
  const spaceId = req.params.space_id

  try {
    const existingTable = await tableExistsByName.bool(newTableName, spaceId)

    if (existingTable) throw new ConflictError('A column with that name already exists in this space')

    const newTable = await createNewTable(spaceId, newTableName)
    return res.status(200).json(newTable)

  } catch (error) {
    next(error)
  }
})


router.post('/edit/name/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { tableId, newTableName } = req.body;
  const spaceId = req.params.space_id


  try {
    await tableExistsById.error(tableId)
    const alreadyExists = await tableExistsByName.bool(newTableName, spaceId)
    if(alreadyExists) throw new ConflictError('A column with that name already exists in this space')
      
    const updatedTable = await changeTableName(tableId, newTableName)

    res.status(200).json(updatedTable);
  } catch (error) {
    next(error)
  }
});


router.post('/edit/color/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { newColor, tableId } = req.body;

  try {
    await tableExistsById.error(tableId)

    const updatedTable = await changeTableColor(newColor, tableId)
    return res.status(200).json(updatedTable)

  } catch (error) {
    next(error)
  }
})


router.post('/edit/position/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { tableId, tableFromIndex, tableToIndex, neighborTableId } = req.body
  const spaceId = req.params.space_id

  try {
    // Validación individual de argumentos
    if (tableFromIndex == null) throw new BadRequestError('Missing argument: table_from_index');
    if (tableToIndex == null) throw new BadRequestError('Missing argument: table_to_index');

    // Validación de existencia
    await Promise.all([
      tableExistsById.error(tableId),
      tableExistsById.error(neighborTableId)
    ]);

    await changeTablePosition(spaceId, tableId, tableFromIndex, tableToIndex, neighborTableId)

    res.send('success')
  } catch (error) {
    next(error)
  }
})


router.post('/edit/task_format/:space_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const { newFormat, tableId } = req.body;

  try {
    await tableExistsById.error(tableId)

    const updatedTable = await changeTableFormat(tableId, newFormat)
    return res.status(200).json(updatedTable)
  } catch (error) {
    next(error)
  }
})

router.delete('/delete/:space_id/:table_id', verifyToken, ensureSpaceMember, async (req, res, next) => {
  const spaceId = req.params.space_id;
  const tableId = req.params.table_id;

  try {
    // Validaciones
    await tableExistsById.error(tableId),

    // Core
    await deleteTable(tableId, spaceId)
    res.status(200).json({message: 'success'})
  } catch (error) {
    next(error)
  }
})




module.exports = router