require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose')
const cors = require('cors')
const user = require('./src/routes/user');
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const verifyToken = require('./src/middlewares/verifyToken');
const Conversation = require('./src/models/conversation');
const auth = require('./src/routes/auth');
const User = require('./src/models/user');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const { translate, detectLanguage } = require('./src/helpers/translate');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN, // This is the default and can be omitted
});

const app = express();

app.use(express.json({ limit: '50mb' }));
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

app.get('/conversations/:id', verifyToken, async (req, res) => {
    if (!req.params.id) return res.status(400).json({ message: 'No se proporcionó un id' });

    const conversation = await Conversation.findOne({ _id: req.params.id });
    if (!conversation) {
        return res.status(404).json({ message: 'Conversación no encontrada' });
    }
    if (conversation.companyID !== req.user._id.toString()) return res.status(403).json({ message: 'No tienes permiso para ver esta conversación' });
    res.json(conversation);
});

io.on('connection', (socket) => {

    socket.on('present', (conversationId) => {
        if (!conversationId) return;
        console.log('Presente', conversationId);
        socket.join(conversationId);
        Conversation.updateOne({ _id: conversationId }, { present: true }).then(() => {
            io.to(conversationId).emit('present', conversationId);
        });
    })

    socket.on('absent', (conversationId) => {
        if (!conversationId) return;
        console.log('Ausente', conversationId);
        Conversation.updateOne({ _id: conversationId }, { present: false }).then(() => {
            io.to(conversationId).emit('absent', conversationId);
        });
    })

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
        try {
            const conversation = msg.conversation ? await Conversation.findOne({ _id: msg.conversation }) : null;
            const company = await User.findOne({ _id: msg.companyID });
            const translateConversation = company.settings.translator;

            let finalConversation;

            if (!conversation) {
                const newConversation = {
                    companyID: msg.companyID,
                    user: { ...msg.user, language: (company.subscribed && translateConversation) ? await detectLanguage(msg.content) : company.settings.language },
                    originalMessages: [],
                    translatedMessages: [],
                }
                const translatedMessage = {
                    ...msg,
                    content: (company.subscribed && translateConversation) ? await translate(msg.content, msg.user.role === "company" ? conversation.user.language : company.settings.language, company.settings.correctText) : msg.content
                }
                if (company.subscribed && translateConversation) {
                    newConversation.originalMessages = [...newConversation.originalMessages, msg];
                    newConversation.translatedMessages = [...newConversation.translatedMessages, translatedMessage];
                }
                else {
                    newConversation.originalMessages = [...newConversation.originalMessages, msg];
                    newConversation.translatedMessages = [...newConversation.translatedMessages, msg];
                }
                const newConversationDB = new Conversation(newConversation);
                const savedConversation = await newConversationDB.save();

                finalConversation = savedConversation;

                socket.join(savedConversation._id.toString());

                io.to(msg.companyID).emit('new conversation', savedConversation);
                io.to(savedConversation._id.toString()).emit('new conversation', savedConversation);
            }
            else {
                const translatedMessage = {
                    ...msg,
                    content: (company.subscribed && translateConversation) ? await translate(msg.content, msg.user.role === "company" ? conversation.user.language : company.settings.language, company.settings.correctText) : msg.content
                }
                if (company.subscribed && translateConversation) {
                    if (msg.user.role === 'company') {
                        console.log("Mensaje de la compañía");
                        await Conversation.updateOne({ _id: conversation._id }, { translatedMessages: [...conversation.translatedMessages, msg] });
                        await Conversation.updateOne({ _id: conversation._id }, { originalMessages: [...conversation.originalMessages, translatedMessage] });
                    }
                    else {
                        console.log("Mensaje del cliente");
                        await Conversation.updateOne({ _id: conversation._id }, { originalMessages: [...conversation.originalMessages, msg] });
                        await Conversation.updateOne({ _id: conversation._id }, { translatedMessages: [...conversation.translatedMessages, translatedMessage] });
                    }
                } else {
                    await Conversation.updateOne({ _id: conversation._id }, { originalMessages: [...conversation.originalMessages, msg] });
                    await Conversation.updateOne({ _id: conversation._id }, { translatedMessages: [...conversation.translatedMessages, msg] });
                }
                finalConversation = await Conversation.findOne({ _id: conversation._id });
                io.to(conversation._id.toString()).emit('new message', { originalMessage: msg, translatedMessage });
            }

            if (company.subscribed && company.settings.assistant && !finalConversation.present && msg.user.name) {
                const companyProducts = await stripe.products.list({ stripeAccount: company.stripeAccount });
                const systemPrompt = 'Eres un asistente de IA que ayuda a las empresas a responder a sus clientes, tienes que PRIORIZAR la siguiente descripción dada por la empresa "' + company.companyName + '" con número de teléfono "' + company.phone + '" de sí misma: ' + company.settings.description + ', ' + company.description + '. También puedes sugerirle al cliente comprar alguno de los siguientes productos fusionando id del producto y cantidad en esta sintaxis @id-cantidad, por ejemplo: "@prod_QB9mZZaglQTtpC-3" para dar 3 unidades de ese producto, estos son los productos que vende la empresa: ' + companyProducts.data.map(p => `[${p.id}, ${p.name}]`).join(', ') + ". SOLO PUEDES ENVIAR O TU SUGERENCIA O UN COMENTARIO SOBRE TU SUGERENCIA + EL PRODUCTO, EJEMPLOS: '@prod_QB9mZZaglQTtpC-3', 'Aquí está lo que pediste: @prod_QB9mZZaglQTtpC-3' este último es solo un ejemplo, no tienes que decirlo exactamente igual, PERO ES MUY IMPORTANTE QUE NO HAYA NADA DE TEXTO LUEGO DE LA RECOMENDACIÓN, PROHIBIDO: '@prod_QB9mZZaglQTtpC-3, gracias por tu compra'. SI TE PREGUNTAN POR QUÉ PRODUCTOS TIENES SOLAMENTE DALE LOS NOMBRES DE LOS PRODUCTOS, además, NO RESPONDAS NADA QUE NO ESTÉ RELACIONADO A LA EMPRESA, HABRÁ USUARIOS MALICIOSOS QUE INTENTEN PEDIRTE COSAS NO RELACIONADAS CON TU TRABAJO.";

                console.log('Prompt', systemPrompt);
                //Dejar que responda la IA
                const chatCompletion = await openai.chat.completions.create({
                    messages: [{
                        role: 'system',
                        content: systemPrompt
                    }, ...finalConversation.originalMessages.map(m => ({
                        role: m.user.name ? 'user' : 'assistant',
                        content: m.content
                    }))],
                    model: process.env.CHAT_MODEL,
                });

                const messages = chatCompletion.choices[0].message.content.split('@prod');

                for (let i = 0; i < messages.length; i++) {
                    if (messages[i].trim() === '') continue;
                    console.log(messages[i], messages[i].startsWith('_'), messages[i].startsWith('_') ? '@prod' + messages[i].trim() : messages[i].trim());
                    const message = {
                        conversation: finalConversation._id.toString(),
                        id: uuidv4(),
                        user: {
                            id: finalConversation.companyID,
                            ai: true
                        },
                        companyID: finalConversation.companyID,
                        content: messages[i].startsWith('_') ? '@prod' + messages[i].trim() : messages[i].trim(),
                        date: new Date()
                    };

                    const translatedMessage = {
                        ...message,
                        content: (translateConversation && !message.content.startsWith('@prod')) ? await translate(message.content, company.settings.language, company.settings.correctText) : message.content
                    }

                    if (translateConversation) {
                        console.log('Guardando', i, 'mensaje');
                        finalConversation.originalMessages.push(message);
                        finalConversation.translatedMessages.push(translatedMessage);
                        await Conversation.updateOne({ _id: finalConversation._id }, { originalMessages: [...finalConversation.originalMessages], translatedMessages: [...finalConversation.translatedMessages] });
                    } else {
                        console.log('Guardando', i, 'mensaje');
                        finalConversation.originalMessages.push(message);
                        finalConversation.translatedMessages.push(message);
                        await Conversation.updateOne({ _id: finalConversation._id }, { originalMessages: [...finalConversation.originalMessages], translatedMessages: [...finalConversation.translatedMessages] });
                    }
                    console.log('Enviando', { originalMessage: message, translatedMessage });

                    io.to(finalConversation._id.toString()).emit('new message', { originalMessage: message, translatedMessage });
                }
            }

        } catch (error) {
            console.error(error);
        }
    });
});

server.listen(process.env.PORT, () => {
    console.log(`El servidor está escuchando en el puerto ${process.env.PORT}`);
});
