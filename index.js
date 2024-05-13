const express = require('express');
const mongoose = require('mongoose')
const cors = require('cors')
const user = require('./src/routes/user');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const verifyToken = require('./src/middlewares/verifyToken');
const conversation = require('./src/models/conversation');
const auth = require('./src/routes/auth');

require('dotenv').config();
const app = express();

app.use(express.json());
app.use(cors());
const server = createServer(app)
const io = new Server(server, { cors: { origin: '*' } });

const conversations = [];

mongoose.connect(process.env.DATABASE_URL)

mongoose.connection.on('error', (error) => console.error(error))
mongoose.connection.once('open', () => console.log('Connected to Database'))

app.use('/users', user);
app.use('/auth', auth)

app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

app.get('/conversations', verifyToken, (req, res) => {
    console.log("pidiendo conversaciones", conversations, req.user);
    res.json(conversations.filter((conversation) => conversation.companyID == req.user._id));
});

app.get('/conversations/:id', (req, res) => {
    console.log("pidiendo conversación", req.params.id, conversations);
    const conversation = conversations.find((conversation) => conversation.id === req.params.id);
    if (!conversation) {
        return res.status(404).json({ message: 'Conversación no encontrada' });
    }
    res.json(conversation);
});

io.on('connection', (socket) => {
    socket.on('company', (user) => {
        console.log('Empresa conectada', user);
        socket.join(user._id);
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    socket.on('join conversation', (conversationId) => {
        console.log(socket.id, 'entró a', conversationId);
        socket.join(conversationId);
    })

    socket.on('chat message', (msg) => {
        console.log('Mensaje recibido', msg.content);
        const conversation = conversations.find((conversation) => conversation.id === msg.conversation);
        if (!conversation) {
            const newConversation = { id: msg.conversation, companyID: msg.companyID, user: msg.user, messages: [msg] }
            socket.join(msg.conversation);
            conversations.push(newConversation)
            io.to(msg.companyID).emit('new conversation', newConversation);
        }
        else {
            conversation.messages.push(msg);
            io.to(msg.conversation).emit('new message', msg);
        }
    });
});

server.listen(process.env.PORT, () => {
    console.log(`El servidor está escuchando en el puerto ${process.env.PORT}`);
});
