const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
    companyID: {
        type: String,
        required: true
    },
    present: {
        type: Boolean,
        default: false
    },
    defaultLanguage: {
        type: String,
        required: true,
        default: 'es'
    },
    user: {
        type: Object,
        properties: {
            id: { type: String, required: true },
            name: { type: String, required: true },
        },
        required: true
    },
    originalMessages: {
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
    },
    translatedMessages: {
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