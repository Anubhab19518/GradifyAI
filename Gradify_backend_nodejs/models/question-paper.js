const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    createdBy: {type: String, required: true},
    paperName: {type: String, required: true},
    subjectName: {type: String, required: true},
    fullMarks: {type: Number, required: true},
    details: {type: String, required: false},
    material: [{
        file: {type: Buffer, required: true},
        file_name: {type: String, required: true}
    }],
});

module.exports = mongoose.model("Papers", QuestionSchema);