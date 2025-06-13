// index.js o donde lo necesites
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors')

// Routes
const authRoute = require('./routes/auth')
const spaceRoute = require('./routes/space')
const tasksRoute = require('./routes/tasks')
const tablesRoute = require('./routes/tables')

app.use(cors()); // <- Esto permite todas las conexiones externas (no recomendado en producción)
app.use(express.json());


app.use('/auth', authRoute);
app.use('/space', spaceRoute)
app.use('/tasks', tasksRoute)
app.use('/tables', tablesRoute)

app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
});
