require('dotenv').config();
const express = require('express');
const app = express();


app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

app.listen(process.env.PORT, () => {
    console.log(`El servidor está escuchando en el puerto ${process.env.PORT}`);
});