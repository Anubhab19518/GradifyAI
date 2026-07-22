const { insertRows, selectRows, updateRows } = require('../config/supabase');

const StoreModelAnswer = async (req, res) => {
    try {
        const { createdBy, paperName, model_answers } = req.body;

        const parsedModelAnswers = Array.isArray(model_answers)
            ? model_answers
            : typeof model_answers === "string"
                ? JSON.parse(model_answers)
                : [];

        const existingPaper = await selectRows("model_answers", { created_by_email: createdBy, paper_name: paperName }, { single: true });

        if (existingPaper) {
            const updated = await updateRows("model_answers", {
                model_answers: parsedModelAnswers,
            }, {
                id: existingPaper.id,
            });

            return res.status(200).json({
                message: "Model Answer updated successfully",
                data: Array.isArray(updated) ? updated[0] : updated,
            });
        }

        const newModelAnswer = await insertRows("model_answers", [{
            created_by_email: createdBy,
            paper_name: paperName,
            model_answers: parsedModelAnswers,
        }]);

        return res.status(201).json({ message: "Model Answer created successfully", data: newModelAnswer[0] });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const GetPaperDetails = async (req, res) => {
    try {
        const { createdBy, paperName } = req.body;
        if (!createdBy || !paperName) {
            return res.status(400).json({
                success: false,
                message: "createdBy and paperName are required fields"
            });
        }

        const paperDetails = await selectRows("papers", { 
            created_by_email: createdBy, 
            paper_name: paperName 
        }, { single: true });

        if (!paperDetails) {
            return res.status(404).json({
                success: false,
                message: "Paper not found"
            });
        }

        const modelAnswers = await selectRows("model_answers", {
            created_by_email: createdBy,
            paper_name: paperName
        }, { single: true });

        if (!modelAnswers) {
            return res.status(404).json({
                success: false,
                message: "Model answers not found"
            });
        }
        const files = (paperDetails.materials || []).map((item, index) => ({
            file_id: index + 1,
            file_name: item.file_name
        }));
        const questionsAndAnswers = (modelAnswers.model_answers || []).map(item => ({
            question_id: item.question_id,
            question: item.question,
            answer: item.answer
        }));
        const response = {
            success: true,
            data: {
                paperName: paperDetails.paper_name,
                details: paperDetails.details || "",
                fullMarks: paperDetails.full_marks,
                files: files,
                questionsAndAnswers: questionsAndAnswers
            }
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('Get Paper Details Error:', error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

module.exports = { StoreModelAnswer, GetPaperDetails }