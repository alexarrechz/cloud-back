const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
    },
    email: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'es'
    },
    description: {
        type: String,
    },
    picture: {
        type: String
    },
    subscribed: {
        type: Boolean,
        default: false
    },
    stripeAccount: {
        type: String,
    },
    prompt: {
        type: String,
        default: ""
    },
    settings: {
        type: Object,
        default: {
            assistant: true,
            language: "Español",
            description: "",
            correctText: true,
            translator: true
        }
    },
})

module.exports = mongoose.model('User', userSchema);
// const algo = {
//     "$schema": {
//         "bsonType": "object",
//         "required": ["nombreDeEmpresa", "telefono", "correo", "horario"],
//         "properties":
//         {
//             "nombreDeEmpresa": { "bsonType": "string", "description": "Nombre de la empresa" },
//             "telefono": { "bsonType": "string", "description": "Número de teléfono" },
//             "correo": { "bsonType": "string", "description": "Correo electrónico" },
//             "horario": {
//                 "bsonType": "object",
//                 "required": ["tipo", "dias", "horaApertura", "horaCierre"],
//                 "properties": {
//                     "tipo": { "bsonType": "string", "description": "Tipo de horario" },
//                     "dias": {
//                         "bsonType": "array", "items": { "bsonType": "string" },
//                         "description": "Días de la semana en los que la empresa está abierta"
//                     }, "horaApertura": { "bsonType": "string", "description": "Hora de apertura de la empresa" },
//                     "horaCierre": { "bsonType": "string", "description": "Hora de cierre de la empresa" }
//                 }
//             }
//         }
//     }
// }