const express = require('express');
const router = express.Router();

const pool = require('../database.js')

require('dotenv').config();

var jwt = require('jsonwebtoken');

// Middlewares
const verifyToken = require('../middlewares/authMiddlewares.js');
const ensureSpaceMember = require('../middlewares/spaceMiddlewares.js')

// Functions
const {
  getTasksBySpaceId
} = require('../utilities/tasksUtilities.js');

const {
  createNewTable
} = require('../utilities/tablesUtilities.js')

const {
  createMemberInstance,
  isSpaceMember
} = require('../utilities/usersUtilities.js')

const { sendError } = require('../utilities/errorsUtilities.js');
const { getSpaceTags } = require('../utilities/tagsUtilities.js');
const { getSpaceTeams } = require('../utilities/teamsUtilities.js');




router.post('/create', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { spaceName, spaceDescription } = req.body

  if (!spaceName || !spaceDescription) {
    return sendError(
      res,
      400,
      'MISSING_REQUIRED_FIELDS',
      'Missing required fields: space_name or space_description'
    )
  }

  try {

    //Crear space

    const spaceQuery = `
      INSERT INTO spaces (space_name, space_description)
      VALUES ($1, $2)
      RETURNING space_name, space_description, id
    `

    const result = await pool.query(spaceQuery, [spaceName, spaceDescription]);
    const newSpace = result.rows[0];

    if (!newSpace) {
      return sendError(
        res, 500, 'INTERNAL_SERVER_ERROR', 'Error creating space',
      )
    }

    // Crear tres tablas (TODO, DOING, DONE)

    const newTable0 = await createNewTable(newSpace.id, 'to do')
    const newTable1 = await createNewTable(newSpace.id, 'doing')
    const newTable2 = await createNewTable(newSpace.id, 'done')

    const newTables = [newTable0, newTable1, newTable2]

    if (!newTables || newTables.length == 0) {
      return sendError(
        res, 500, 'INTERNAL_SERVER_ERROR', 'Error creating space tables',
      )
    }

    // Crear memberIntance
    const newMemberInstance = await createMemberInstance(userId, newSpace.id, 'admin')

    if (!newMemberInstance) {
      return sendError(
        res, 500, 'INTERNAL_SERVER_ERROR', 'Error creating initial space member instance',
      )
    }

    return res.status(200).json({ newSpace, newMemberInstance, newTables })

  } catch (err) {
    return sendError(
      res, 500, err, 'Error querying the database',
    )
  }
});


router.get('/get/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const spaceId = parseInt(req.params.space_id, 10);  // o donde venga spaceId

  if(!spaceId) {
    return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: space_id')
  }
  try {
    const spaceQuery = `
  SELECT *
  FROM spaces
  WHERE id = $1;
`;
const spaceResult = await pool.query(spaceQuery, [spaceId])

    if(!spaceResult.rows[0] || spaceResult.rowCount == 0) {
      return sendError(res, 404, 'SPACE_NOT_FOUND', `Space ${spaceId} not found`)
    }

    const membersQuery = `
  SELECT 
    u.id,
    u.username,
    u.avatarurl,
    m.user_rol AS role
  FROM members_instances m
  JOIN users u ON m.user_id = u.id
  WHERE m.space_id = $1;
`;

    const tablesQuery = `
      SELECT * FROM space_tables st
      JOIN table_task_formats ttf ON ttf.table_id = st.id 
      WHERE space_id = $1
      ORDER BY table_position ASC;      
    `

    const tasks = await getTasksBySpaceId(spaceId)
    const tags = await getSpaceTags(spaceId)
    const teams = await getSpaceTeams(spaceId)

    const membersResult = await pool.query(membersQuery, [spaceId])
    const tablesResult = await pool.query(tablesQuery, [spaceId])

    return res.json({
      space: spaceResult.rows[0],
      members: membersResult.rows,
      tables: tablesResult.rows,
      tasks: tasks,
      tags: tags,
      teams: teams
    })

  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database',
    )
  }
})

router.post('/create/invitation_code/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const spaceId = req.params.space_id;
  const expiresIn = '1h'; // o por minutos, horas, etc.

  if(!spaceId) {
        return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: space_id')
  }

  const token = jwt.sign(
    { spaceId },
    process.env.JWT_INVITE_SECRET,
    { expiresIn }
  );

  res.json({ code: token });
});

router.get('/verify/invitation/:token', verifyToken, async (req, res) => {
  const { token } = req.params;
  const userId = req.user.id;

  if(!token) {
        return sendError(res, 400, 'MISSING_REQUIRED_FIELDS', 'Missing required fields: space_code')
  }
  try {
    // Verifica y extrae el payload
    const payload = jwt.verify(token, process.env.JWT_INVITE_SECRET);

    if (!payload.spaceId) {
      return sendError(res, 400, 'INVALID_PAYLOAD', 'Token payload missing space_id');
    }

    // Verifica si ya es miembro
    const isAlreadyMember = await isSpaceMember(userId, payload.spaceId);
    if (isAlreadyMember) {
      return sendError(res, 409, 'IS_ALREADY_A_MEMBER', `User ${userId} is already a member of space ${payload.spaceId}`);
    }

    // Crea instancia de miembro
    await createMemberInstance(userId, payload.spaceId, 'member');

    return res.status(200).json({
      valid: true,
      spaceId: payload.spaceId,
      joined: true,
    });

  } catch (err) {
    console.error('Error verifying invitation token:', err);
    return sendError(res, 400, 'INVALID_TOKEN', 'Invalid or expired invitation token');
  }
});


router.delete('/leave/:space_id', verifyToken, ensureSpaceMember, async (req, res) => {
  const userId = req.user.id;
  const spaceId = req.params.space_id;

  if (!userId || !spaceId) {
    return sendError(
      res, 400, 'MISSING_FIELDS', 'User ID or space ID is missing'
    );
  }

  try {
    const query = `
      DELETE FROM members_instances
      WHERE user_id = $1 AND space_id = $2
    `;
    const result = await pool.query(query, [userId, spaceId]);

    if (result.rowCount === 0) {
      return sendError(
        res, 404, 'NOT_A_MEMBER', 'User is not a member of this space'
      );
    }

    res.status(200).json({
      message: 'Successfully left the space'
    });
  } catch (error) {
    return sendError(
      res, 500, error, 'Error querying the database'
    );
  }
});



module.exports = router;
