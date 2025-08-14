// index.js o donde lo necesites
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors')
const os = require('os')

const errorHandler = require('./middlewares/errorHandler')

// Routes
const authRoute = require('./modules/users/authRoutes')
const spaceRoute = require('./modules/spaces/spaceRoutes')
const tasksRoute = require('./modules/tasks/taskRoutes')
const tablesRoute = require('./modules/tables/tableRoutes')
const teamsRoute = require('./modules/teams/teamRoutes')
const tagsRoute = require('./modules/tags/tagRoutes')
const commentsRoute = require('./modules/comments/commentRoutes')




app.use(cors()); // <- Esto permite todas las conexiones externas (no recomendado en producción)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));






app.use('/api/comments', commentsRoute)
app.use('/api/space', spaceRoute)
app.use('/api/tables', tablesRoute)
app.use('/api/tags', tagsRoute)
app.use('/api/tasks', tasksRoute)
app.use('/api/teams', teamsRoute)
app.use('/api/auth', authRoute);


app.use(errorHandler)




// app.get('/api/test', (req, res) => {
//     return res.status(200).send('test')
// })

app.listen(port, () => {
    const now = new Date().toISOString();
    const host = process.env.HOST || 'localhost';
    const env = process.env.NODE_ENV || 'development';
    const pid = process.pid;
    const version = process.env.npm_package_version || 'unknown';

    const url = `http://${host}:${port}`;

    console.log('═'.repeat(30));
    console.log(`🚀 Server started`);
    console.log(`- Port: ${port}`);
    console.log(`- Host: ${host}`);
    console.log(`- URL: ${url}`);
    console.log(`- PID: ${pid}`);
    console.log(`- Environment: ${env}`);
    console.log(`- Version: ${version}`);
    console.log(`- Started at: ${now}`);
    console.log('═'.repeat(30));
});
