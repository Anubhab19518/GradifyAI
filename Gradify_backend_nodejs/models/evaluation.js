const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
    createdBy: {type: String, required: true},
    paperName: {type: String, required: true},
    full_marks: {type: Number, required: true},
    obtained_total_marks: {type: Number, required: true},
    student_name: {type: String, required: true},
    roll: {type: String, required: true},
    obtained_marks: [
        {
            question_id: {type: String, required: true},
            full_marks: {type: Number, required: true},
            availed_marks: {type: Number, required: true}
        }
    ]
});

module.exports = mongoose.model("Student-Evaluation", EvaluationSchema);