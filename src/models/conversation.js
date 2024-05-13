const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
    companyID: {
        type: String,
        required: true
    },
    user: {
        type: Object,
        properties: {
            id: { type: String, required: true },
            name: { type: String, required: true },
        },
        required: true
    },
    messages: {
        type: [Object],
        properties: {
            content: { type: String, required: true },
            date: { type: Date, required: true },
            user: {
                type: Object, properties: {
                    name: { type: String, required: true },
                }, required: true
            }
        }
    }
})

module.exports = mongoose.model('Conversation', conversationSchema);