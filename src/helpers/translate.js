require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_TOKEN, // This is the default and can be omitted
});

const translate = async (text, language) => {
    const chatCompletion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: `Translate this text to ${language}, I just need the translation, nothing else`,
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
                content: 'Detect the language of this text, I just need the language, nothing else',
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