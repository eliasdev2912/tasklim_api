// index.js o donde lo necesites
const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config();

const errorHandler = require('./middlewares/errorHandler')

// Import Routes
const authRoute = require('./src/modules/users/authRoutes')
const spaceRoute = require('./src/modules/spaces/spaceRoutes')
const tasksRoute = require('./src/modules/tasks/taskRoutes')
const tablesRoute = require('./src/modules/tables/tableRoutes')
const teamsRoute = require('./src/modules/teams/teamRoutes')
const tagsRoute = require('./src/modules/tags/tagRoutes')
const commentsRoute = require('./src/modules/comments/commentRoutes')

// Import Events
const onTaskCreatedSetUnreads = require('./src/modules/tasks/listeners/onTaskCreatedSetUnreads');
const onTaskUpdatedSetUnreads = require('./src/modules/tasks/listeners/onTaskUpdatedSetUnreads')


// Middlewares
app.use(cors()); // <- Esto permite todas las conexiones externas (no recomendado en producción)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));





// Run Routes
app.use('/api/comments', commentsRoute)
app.use('/api/space', spaceRoute)
app.use('/api/tables', tablesRoute)
app.use('/api/tags', tagsRoute)
app.use('/api/tasks', tasksRoute)
app.use('/api/teams', teamsRoute)
app.use('/api/auth', authRoute);

// Run Events
onTaskCreatedSetUnreads();
onTaskUpdatedSetUnreads();



// Error middleware
app.use(errorHandler)



module.exports = app