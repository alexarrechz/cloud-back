const express = require('express');
const mongoose = require('mongoose')
const cors = require('cors')
const user = require('./routes/user');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

require('dotenv').config();
const app = express();

app.use(express.json());
app.use(cors());
const server = createServer(app)
const io = new Server(server, {cors: {origin: '*'}});

const conversations = [];

mongoose.connect(process.env.DATABASE_URL)

mongoose.connection.on('error', (error) => console.error(error))
mongoose.connection.once('open', () => console.log('Connected to Database'))

app.use('/users', user);

app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

app.get('/conversations', (req, res) => {
    console.log("pidiendo conversaciones", conversations);
    res.json(conversations);
});

app.get('/conversations/:id', (req, res) => {
    console.log("pidiendo conversación", req.params.id, conversations);
    const conversation = conversations.find((conversation) => conversation.id === req.params.id);
    if(!conversation) {
        return res.status(404).json({message: 'Conversación no encontrada'});
    }
    res.json(conversation);
});

io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    socket.on('chat message', (msg) => {
        const conversation = conversations.find((conversation) => conversation.id === msg.conversation);
        if(!conversation) {
            const newConversation = {id: msg.conversation, messages: [msg]}
            conversations.push(newConversation)
            io.emit('new conversation', newConversation);
        }
        else {
            console.log('Conversation', conversation.messages, msg);
            conversation.messages.push(msg);
            io.emit('new message', msg);
        }
        console.log('Final conversation', JSON.stringify(conversations.find((conversation) => conversation.id === msg.conversation)));
    });
});

server.listen(process.env.PORT, () => {
    console.log(`El servidor está escuchando en el puerto ${process.env.PORT}`);
});
