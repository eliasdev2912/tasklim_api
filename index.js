// index.js o donde lo necesites
const express = require('express');
const app = express();
const port = 3000;
const cors = require('cors')

const authRoute = require('./routes/auth')
const spaceRoute = require('./routes/space')

app.use(cors()); // <- Esto permite todas las conexiones externas (no recomendado en producción)
app.use(express.json());


app.use('/auth', authRoute);
app.use('/space', spaceRoute)


app.listen(port, () => {
    console.log(`API escuchando en http://localhost:${port}`);
});
