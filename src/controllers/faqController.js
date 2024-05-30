const Faq = require("../models/faq");


const addFaq = async (req, res) => {
    const { _id:companyID } = req.user;
    const { question, answer } = req.body;

    try {
        const faq = new Faq({
            companyID,
            question,
            answer,
        });
        await faq.save();
        res.status(201).json({ message: "FAQ added successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const getFaqs = async (req, res) => {
    const { id: companyID } = req.params;
    try {
        const faqs = await Faq.find({ companyID });
        res.status(200).json({ faqs });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    addFaq,
    getFaqs,
};