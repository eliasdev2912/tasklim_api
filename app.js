// index.js o donde lo necesites
const express = require('express');
const app = express();
const cors = require('cors')
require('dotenv').config();

const errorHandler = require('./middlewares/errorHandler')

// Import Routes
const authRoute = require('./modules/users/authRoutes')
const spaceRoute = require('./modules/spaces/spaceRoutes')
const tasksRoute = require('./modules/tasks/taskRoutes')
const tablesRoute = require('./modules/tables/tableRoutes')
const teamsRoute = require('./modules/teams/teamRoutes')
const tagsRoute = require('./modules/tags/tagRoutes')
const commentsRoute = require('./modules/comments/commentRoutes')

// Import Events
const onTaskCreatedSetUnreads = require('./modules/tasks/listeners/onTaskCreatedSetUnreads');
const onTaskUpdatedSetUnreads = require('./modules/tasks/listeners/onTaskUpdatedSetUnreads')


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