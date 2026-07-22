const mongoose = require('mongoose');

const ModelAnswerSchema = new mongoose.Schema({
    createdBy: {type: String, required: true},
    paperName: {type: String, require: true},
    model_answers: [
        {
            question_id: {type: String, required: true, index: false},
            question: {type: String, required: true},
            marks: {type: Number, required: true},
            answer: {type: String, required: true}
        }
    ]
});

ModelAnswerSchema.index({ createdBy: 1, paperName: 1 }, { unique: true });
module.exports = mongoose.model("Model-Answers", ModelAnswerSchema);