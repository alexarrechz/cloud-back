require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose')
const cors = require('cors')
const user = require('./routes/user');

mongoose.connect(process.env.DATABASE_URL)

mongoose.connection.on('error', (error) => console.error(error))
mongoose.connection.once('open', () => console.log('Connected to Database'))

app.use(express.json());
app.use(cors());

app.use('/users', user);

app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

app.listen(process.env.PORT, () => {
    console.log(`El servidor está escuchando en el puerto ${process.env.PORT}`);
});

