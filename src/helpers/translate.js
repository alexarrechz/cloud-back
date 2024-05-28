require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN, // This is the default and can be omitted
});

const translate = async (text, language, corrector = false) => {
    const chatCompletion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `Translate this text to ${language}, I just need the translation, nothing else, if you detect that the text is already in ${language}, ${corrector ? 'try to correct its ortography' : "just return the same text without changes"}`,
            },
            {
                role: 'user',
                content: text,
            },
        ],
        model: 'gpt-3.5-turbo',
    });

    console.log(chatCompletion.choices[0].message.content);

    return chatCompletion.choices[0].message.content;
}

const detectLanguage = async (text) => {
    const chatCompletion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: 'Detecta el lenguaje utilizado en este texto, solo necesito el lenguaje, nada más.',
            },
            {
                role: 'user',
                content: text,
            },
        ],
        model: 'gpt-3.5-turbo',
    });

    console.log(chatCompletion.choices[0].message.content);

    return chatCompletion.choices[0].message.content;
}

module.exports = {
    translate,
    detectLanguage,
};