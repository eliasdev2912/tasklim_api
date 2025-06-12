const express = require('express');
const router = express.Router();

const pool = require('../database.js')
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();


// Middlewares
const verifyToken = require('../middlewares/authMiddleware.js');


// Functions

const sendError = (res, statusCode, error, message) => {
  return res.status(statusCode).json({ error, message });
}

const getTaskById = async (taskId) => {
  const taskQuery = `
SELECT 
  t.id,
  t.space_id,
  t.title,
  t.description,
  t.body,
  t.created_at,
  t.table_id,

  json_build_object(
    'id', u.id,
    'username', u.username,
    'role', mi.user_rol,
    'avatarurl', u.avatarurl
  ) AS created_by,

  COALESCE(
    json_agg(
      json_build_object(
        'id', tc.id,
        'task_id', tc.task_id,
        'user_id', cu.id,
        'user_name', cu.username,
        'user_avatarurl', cu.avatarurl,
        'body', tc.body
      )
    ) FILTER (WHERE tc.id IS NOT NULL),
    '[]'
  ) AS comments

FROM tasks t
JOIN users u ON t.created_by = u.id
LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = t.space_id
LEFT JOIN task_comments tc ON tc.task_id = t.id
LEFT JOIN users cu ON tc.user_id = cu.id

WHERE t.id = $1
GROUP BY t.id, t.space_id, t.body, t.created_at, u.id, u.username, u.avatarurl, mi.user_rol

        `

  try {
    const { rows } = await pool.query(taskQuery, [taskId]);
    return rows[0]; // Una sola tarea
  } catch (error) {
    throw error
  }
}
const getTasksBySpaceId = async (spaceId) => {
  const tasksQuery = `
SELECT 
  t.id,
  t.space_id,
  t.title,
  t.description,
  t.body,
  t.created_at,
  t.table_id,

  json_build_object(
    'id', u.id,
    'username', u.username,
    'role', mi.user_rol,
    'avatarurl', u.avatarurl
  ) AS created_by,

  COALESCE(
    json_agg(
      json_build_object(
        'id', tc.id,
        'task_id', tc.task_id,
        'user_id', cu.id,
        'user_name', cu.username,
        'user_avatarurl', cu.avatarurl,
        'body', tc.body
      )
    ) FILTER (WHERE tc.id IS NOT NULL),
    '[]'
  ) AS comments

FROM tasks t
JOIN users u ON t.created_by = u.id
LEFT JOIN members_instances mi ON mi.user_id = u.id AND mi.space_id = t.space_id
LEFT JOIN task_comments tc ON tc.task_id = t.id
LEFT JOIN users cu ON tc.user_id = cu.id

WHERE t.space_id = $1::integer
GROUP BY t.id, t.space_id, t.body, t.created_at, u.id, u.username, u.avatarurl, mi.user_rol
        `

  try {
    const { rows } = await pool.query(tasksQuery, [spaceId]);
    return rows; // Lista de tareas
  } catch (error) {
    throw error
  }
}
const setNewComment = async (taskId, userId, body) => {

  const commentQuery = `
    INSERT INTO task_comments (
      task_id, user_id, body
    ) VALUES ( $1, $2, $3 )
  `
  try {
    await pool.query(commentQuery, [taskId, userId, body])
    const task = await getTaskById(taskId)
    return task

  } catch (error) {
    throw error
  }
}
const deleteTaskById = async (taskId) => {
  const query = `
    DELETE FROM tasks WHERE id = $1
  `

  try {
    await pool.query(query, [taskId])
  } catch (error) {
    throw error
  }
}

const findTableByName = async (tableName, spaceId) => {
  if(!tableName || !spaceId) throw new Error('MISSING_ARGUMENTS')

  try {
    const query = `
      SELECT * FROM space_tables
      WHERE name = $1 AND space_id = $2
    `
    const result = await pool.query(query, [tableName, spaceId])

    return result.rows[0]

  } catch (error) {
    throw error
  }
}
const createNewTable = async (spaceId, tableName) => {
  const idDone = 'col-' + uuidv4();

  if(!spaceId || !tableName) throw new Error('MISSING_ARGUMENTS')
  
  const existingTable = await findTableByName(tableName, spaceId)
  if(existingTable != null) throw new Error('TABLE_NAME_ALREADY_EXISTS')
  try {
    const spaceTablesQuery = `
  INSERT INTO space_tables (space_id, id, name)
  VALUES ($1, $2, $3)
  RETURNING *;`

    const result = await pool.query(spaceTablesQuery, [spaceId, idDone, tableName])
    return result.rows[0]

  } catch (error) {
    throw error
  }
}

router.post('/create/space', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { spaceName, spaceDescription } = req.body


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
      return res.status(500).send("Internal server error")
    }

    // Crear tres tablas (TODO, DOING, DONE)

    const newTable0 = await createNewTable(newSpace.id, 'to do')
    const newTable1 =  await createNewTable(newSpace.id, 'doing')
    const newTable2 = await createNewTable(newSpace.id, 'done')

    const newTables = [newTable0, newTable1, newTable2]

    if (!newTables || newTables.length == 0) {
      return res.status(500).send("Internal server error")
    }

    // Crear memberIntance
    const memberInstanceQuery = `
        INSERT INTO members_instances (user_id, space_id, user_rol)
        VALUES ($1, $2, $3)
        RETURNING user_id, space_id, user_rol
        `

    const memberInstanceResult = await pool.query(memberInstanceQuery, [userId, newSpace.id, 'admin'])
    const newMemberInstance = memberInstanceResult.rows[0];

    if (!newMemberInstance) {
      return res.status(500).send("Internal server error")
    }

    return res.status(200).json({ newSpace, newMemberInstance, newTables })

  } catch (err) {
    console.error('Error al consultar la base de datos', err);
    res.status(500).send('Internal server error')
  }
});

router.post('/create/task', verifyToken, async (req, res) => {
  const userId = req.user.id;

  const { taskTitle, spaceId, tableId } = req.body;

  const taskId = 'task-' + uuidv4()
  try {
    const taskQuery = `
      INSERT INTO tasks (
      id,
      created_by,
      space_id,
      table_id,
      title
      ) VALUES (
       $1, $2, $3, $4, $5)
      RETURNING *
       `

    await pool.query(taskQuery, [taskId, userId, spaceId, tableId, taskTitle])

    const newTask = await getTaskById(taskId)


    return res.status(200).json(newTask)
  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})


router.delete('/delete/task/:id', verifyToken, async (req, res) => {
  const taskId = req.params.id;

  try {
    deleteTaskById(taskId)
    return res.status(200).send('OK')

  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})

router.post('/create/task/comment', verifyToken, async (req, res) => {
  const { taskId, userId, body } = req.body;

  try {
    const updatedTask = await setNewComment(taskId, userId, body)
    return res.status(200).json(updatedTask)
  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})

router.get('/get/task/:task_id', verifyToken, async (req, res) => {
  const taskId = req.params.task_id
  try {

    const task = await getTaskById(taskId)

    return res.status(200).json(task)

  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})
router.post('/edit/task/title', verifyToken, async (req, res) => {
  const { taskId, newTitle } = req.body

  try {
    const query = `
  UPDATE tasks
SET title = $2
WHERE id = $1;
  `

    await pool.query(query, [taskId, newTitle])

    const updatedTask = await getTaskById(taskId)
    return res.status(200).json(updatedTask)

  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})
router.post('/edit/task/description', verifyToken, async (req, res) => {
  const { taskId, newDescription } = req.body

  try {
    const query = `
  UPDATE tasks
SET description = $2
WHERE id = $1;
  `

    await pool.query(query, [taskId, newDescription])

    const updatedTask = await getTaskById(taskId)
    return res.status(200).json(updatedTask)

  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})
router.post('/edit/task/body', verifyToken, async (req, res) => {
  const { taskId, newBody } = req.body

  try {
    const query = `
  UPDATE tasks
SET body = $2
WHERE id = $1;
  `
    await pool.query(query, [taskId, newBody])

    const updatedTask = await getTaskById(taskId)
    return res.status(200).json(updatedTask)

  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})

router.post('/edit/task/table', verifyToken, async (req, res) => {
  const { taskId, newTableId } = req.body

  try {
    const query = `
  UPDATE tasks
SET table_id = $2
WHERE id = $1;
  `

    const queryResult = await pool.query(query, [taskId, newTableId])
    return res.status(200).json(queryResult.rows[0])

  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})

router.post('/edit/table/name', verifyToken, async (req, res) => {
  const { tableId, newTableName, spaceId } = req.body;

  try {
    const existingTable = await findTableByName(newTableName, spaceId)

    if (existingTable != null && existingTable.id != tableId) {
      return sendError(
        res, 409,
        'TABLE_NAME_ALREADY_EXISTS',
        'A column with that name already exists in this space.'
      )
    }

    const query = `
      UPDATE space_tables
      SET name = $1
      WHERE id = $2
      RETURNING *;
    `;

    const result = await pool.query(query, [newTableName, tableId]);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal server error');
  }
});
router.post('/create/table', verifyToken, async (req, res) => {
  const {newTableName, spaceId} = req.body

  try {
    const existingTable = await findTableByName(newTableName, spaceId)

    if(existingTable != null) {
       return sendError(
        res, 409,
        'TABLE_NAME_ALREADY_EXISTS',
        'A column with that name already exists in this space.'
      )
    }

    const newTable = await createNewTable(spaceId, newTableName)
    return res.status(200).json(newTable)
    
  } catch (error) {
     res.status(500).send('Internal server error'); 
  }
})





router.get('/get/:id', verifyToken, async (req, res) => {
  const spaceId = parseInt(req.params.id, 10);  // o donde venga spaceId
  console.log('SPACE_ID: ' + spaceId)

  try {
    const spaceQuery = `
  SELECT *
  FROM spaces
  WHERE id = $1;
`;
    const membersQuery = `
  SELECT 
    u.username,
    u.avatarurl,
    m.user_rol AS role
  FROM members_instances m
  JOIN users u ON m.user_id = u.id
  WHERE m.space_id = $1;
`;

    const tablesQuery = `
      SELECT * FROM space_tables
      WHERE space_id = $1;      
    `

    const tasks = await getTasksBySpaceId(spaceId)


    const spaceResult = await pool.query(spaceQuery, [spaceId])
    const membersResult = await pool.query(membersQuery, [spaceId])
    const tablesResult = await pool.query(tablesQuery, [spaceId])

    return res.json({
      space: spaceResult.rows[0],
      members: membersResult.rows,
      tables: tablesResult.rows,
      tasks: tasks
    })

  } catch (error) {
    console.error('Error al consultar la base de datos', error);
    res.status(500).send('Internal server error')
  }
})


module.exports = router;
