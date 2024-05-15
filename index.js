const express = require('express');
const mongoose = require('mongoose')
const cors = require('cors')
const user = require('./src/routes/user');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const verifyToken = require('./src/middlewares/verifyToken');
const Conversation = require('./src/models/conversation');
const auth = require('./src/routes/auth');

require('dotenv').config();
const app = express();

app.use(express.json());
app.use(cors());
const server = createServer(app)
const io = new Server(server, { cors: { origin: '*' } });

mongoose.connect(process.env.DATABASE_URL)

mongoose.connection.on('error', (error) => console.error(error))
mongoose.connection.once('open', () => console.log('Connected to Database'))

app.use('/users', user);
app.use('/auth', auth)

app.get('/', (req, res) => {
    res.send('¡Hola Mundo!');
});

app.get('/conversations', verifyToken, async (req, res) => {
    const conversations = await Conversation.find({ companyID: req.user._id });
    res.json(conversations);
});

app.get('/conversations/:id', async (req, res) => {
    const conversation = await Conversation.findOne({ _id: req.params.id });
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

    socket.on('chat message', async (msg) => {
        console.log('Mensaje recibido', msg.content);
        const conversation = await Conversation.findOne({ id: msg.conversation });
        if (!conversation) {
            const newConversation = { id: msg.conversation, companyID: msg.companyID, user: msg.user, messages: [msg] }
            socket.join(msg.conversation);
            const newConversationDB = new Conversation(newConversation);
            await newConversationDB.save();
            io.to(msg.companyID).emit('new conversation', newConversation);
        }
        else {
            conversation.messages.push(msg);

            await Conversation.updateOne({ id: msg.conversation }, { messages: conversation.messages });
            io.to(msg.conversation).emit('new message', msg);
        }
    });
});

server.listen(process.env.PORT, () => {
    console.log(`El servidor está escuchando en el puerto ${process.env.PORT}`);
});
