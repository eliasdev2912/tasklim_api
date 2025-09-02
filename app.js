// index.js o donde lo necesites
const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config();

const errorHandler = require('./middlewares/errorHandler')

// Import Routes
const authRoutes = require('./src/modules/auth/authRoutes')
const userRoutes = require('./src/modules/users/userRoutes')
const spaceRoutes = require('./src/modules/spaces/spaceRoutes')
const taskRoutes = require('./src/modules/tasks/taskRoutes')
const tableRoutes = require('./src/modules/tables/tableRoutes')
const teamRoutes = require('./src/modules/teams/teamRoutes')
const tagRoutes = require('./src/modules/tags/tagRoutes')
const commentRoutes = require('./src/modules/comments/commentRoutes')

// Import Events
const onTaskCreatedSetUnreads = require('./src/modules/tasks/listeners/onTaskCreatedSetUnreads');
const onTaskUpdatedSetUnreads = require('./src/modules/tasks/listeners/onTaskUpdatedSetUnreads')


// Middlewares
app.use(cors()); // <- Esto permite todas las conexiones externas (no recomendado en producción)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));





// Run Routes
app.use('/api/comments', commentRoutes)
app.use('/api/space', spaceRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

// Run Events
onTaskCreatedSetUnreads();
onTaskUpdatedSetUnreads();



// Error middleware
app.use(errorHandler)



module.exports = app