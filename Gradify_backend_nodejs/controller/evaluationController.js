const axios = require("axios");
const FormData = require("form-data");
const { insertRows, selectRows, deleteRows } = require("../config/supabase");

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

const customRound = (number) => {
  const integerPart = Math.floor(number);
  const decimalPart = number - integerPart;

  if (decimalPart >= 0.75) {
    return integerPart + 1;
  } else if (decimalPart >= 0.25) {
    return integerPart + 0.5;
  }
  return integerPart;
};

const EvaluateStudent = async (req, res) => {
  try {
    const { paperName, createdBy, student_name, roll } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // ── Fetch model answers once (shared across all image files) ──
    const modelAnswerData = await selectRows("model_answers", {
      created_by_email: createdBy,
      paper_name: paperName,
    }, { single: true });

    if (!modelAnswerData || !modelAnswerData.model_answers || modelAnswerData.model_answers.length === 0) {
      console.warn(`No model answers found for creator: ${createdBy}, paper: ${paperName}`);
      return res.status(404).json({ message: "No model answers found for this paper." });
    }

    const modelAnswers = modelAnswerData.model_answers;

    // Build the questions context string passed to OCR to help it infer question IDs
    const questionsContext = JSON.stringify(
      modelAnswers.map(q => ({ id: q.question_id, question: q.question }))
    );

    // ── PASS 1: OCR every uploaded image → build Map<question_id, student_answer> ──
    // Multiple images for the same question_id are concatenated (multi-page answers).
    const ocrMap = new Map(); // string question_id → string student_answer

    // RPM guard: Gemini free tier = 5 RPM → wait 13 s between calls to stay safe
    const OCR_THROTTLE_MS = 13000;

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // Throttle: pause before every call except the very first
      if (i > 0) {
        console.log(`[OCR] Throttling ${OCR_THROTTLE_MS / 1000}s before processing "${file.originalname}" (RPM guard)...`);
        await new Promise(resolve => setTimeout(resolve, OCR_THROTTLE_MS));
      }

      const formData = new FormData();
      formData.append("image", file.buffer, { filename: file.originalname });
      formData.append("questions", questionsContext);

      let ocrResponse;
      try {
        console.log(`[Node] -> Sending "${file.originalname}" to Python OCR (this may take up to 2 minutes if Gemini quota is hit)...`);
        ocrResponse = await axios.post(
          `${PYTHON_SERVICE_URL}/extract-text`,
          formData,
          {
            headers: formData.getHeaders(),
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 300000,
          }
        );
        console.log(`[Node] [OK] Python OCR responded for "${file.originalname}"`);
      } catch (ocrErr) {
        console.error(`[Node] [X] OCR request failed for "${file.originalname}":`, ocrErr.message);
        continue;
      }

      if (ocrResponse.data.status !== "success") {
        console.warn(`[Node] [X] OCR non-success for "${file.originalname}" — skipping.`);
        continue;
      }

      let answersList = ocrResponse.data.data.answers;
      if (!answersList) {
        // Fallback for single-answer format
        answersList = [ocrResponse.data.data];
      }

      for (let ans of answersList) {
        let { question_id, content: student_answer } = ans;

        // Fallback 1: digits in filename  (e.g. "q1_answer.jpg" → "1")
        if (!question_id || question_id === "Unknown") {
          const m = file.originalname.match(/\d+/);
          if (m) {
            question_id = m[0];
            console.log(`Fallback filename: question_id="${question_id}" from "${file.originalname}"`);
          }
        }

        // Fallback 2: single-question paper — assign the only question
        if ((!question_id || question_id === "Unknown") && modelAnswers.length === 1) {
          question_id = String(modelAnswers[0].question_id);
          console.log(`Fallback single-question: assigning question_id="${question_id}"`);
        }

        // Fallback 3: assign by file upload order
        if ((!question_id || question_id === "Unknown") && i < modelAnswers.length) {
          question_id = String(modelAnswers[i].question_id);
          console.log(`Fallback index: file[${i}] → question_id="${question_id}"`);
        }

        if (!question_id || question_id === "Unknown") {
          console.warn(`Could not determine question_id for a block in "${file.originalname}" — skipping.`);
          continue;
        }

        const qKey = String(question_id);
        // Concatenate if multiple pages belong to the same question
        ocrMap.set(qKey, ocrMap.has(qKey) ? ocrMap.get(qKey) + "\n" + student_answer : student_answer);
      }
    }

    // ── PASS 2: Evaluate EVERY model answer using the OCR map ──
    const evaluationDetails = [];
    let totalFullMarks = 0;
    let totalAvailedMarks = 0;

    for (const modelAnswer of modelAnswers) {
      const qKey = String(modelAnswer.question_id);
      const student_answer = ocrMap.get(qKey) || "";

      totalFullMarks += modelAnswer.marks;

      // No answer found for this question → score 0 immediately (no API call needed)
      if (!student_answer.trim()) {
        console.log(`Question ${qKey}: no student answer — scoring 0.`);
        evaluationDetails.push({
          question_id: qKey,
          question: modelAnswer.question,
          model_answer: modelAnswer.answer,
          student_answer: "",
          full_marks: modelAnswer.marks,
          availed_marks: 0,
        });
        continue;
      }

      let evaluationResponse;
      try {
        evaluationResponse = await axios.post(
          `${PYTHON_SERVICE_URL}/evaluate`,
          {
            question_id: qKey,
            student_answer,
            model_answer: modelAnswer.answer,
            max_marks: modelAnswer.marks,
          },
          { timeout: 30000 }
        );
      } catch (evalErr) {
        console.error(`Evaluate API failed for question ${qKey}:`, evalErr.message);
        evaluationDetails.push({
          question_id: qKey,
          question: modelAnswer.question,
          model_answer: modelAnswer.answer,
          student_answer,
          full_marks: modelAnswer.marks,
          availed_marks: 0,
        });
        continue;
      }

      if (evaluationResponse.data.status !== "success") {
        console.error(`Evaluation non-success for question ${qKey}:`, evaluationResponse.data);
        evaluationDetails.push({
          question_id: qKey,
          question: modelAnswer.question,
          model_answer: modelAnswer.answer,
          student_answer,
          full_marks: modelAnswer.marks,
          availed_marks: 0,
        });
        continue;
      }

      const roundedAvailedMarks = customRound(evaluationResponse.data.final_score);
      totalAvailedMarks += roundedAvailedMarks;

      evaluationDetails.push({
        question_id: qKey,
        question: modelAnswer.question,
        model_answer: modelAnswer.answer,
        student_answer,
        full_marks: modelAnswer.marks,
        availed_marks: roundedAvailedMarks,
      });
    }

    // Persist to DB
    await insertRows("evaluations", [{
      created_by_email: createdBy,
      paper_name: paperName,
      full_marks: totalFullMarks,
      obtained_total_marks: totalAvailedMarks,
      student_name,
      roll,
      obtained_marks: evaluationDetails.map(({ question_id, full_marks, availed_marks }) => ({
        question_id,
        full_marks,
        availed_marks,
      })),
    }]);

    const attemptedCount = evaluationDetails.filter(d => d.student_answer.trim() !== "").length;

    return res.status(201).json({
      message: "Evaluation saved successfully",
      student_name,
      roll,
      paperName,
      full_marks: totalFullMarks,
      obtained_marks: totalAvailedMarks,
      total_questions: modelAnswers.length,
      attempted_questions: attemptedCount,
      not_attempted_questions: modelAnswers.length - attemptedCount,
      details: evaluationDetails,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};


const GetEvaluatedPapers = async (req, res) => {
  try {
    const { createdBy } = req.body;

    if (!createdBy) {
      return res.status(400).json({
        message: "createdBy field is required"
      });
    }

    // Get all evaluations for the creator
    const evaluations = await selectRows("evaluations", { created_by_email: createdBy });

    // Group evaluations by paper name
    const paperMap = evaluations.reduce((acc, evaluation) => {
      if (!acc[evaluation.paper_name]) {
        acc[evaluation.paper_name] = {
          paper_name: evaluation.paper_name,
          checked_papers: []
        };
      }

      acc[evaluation.paper_name].checked_papers.push({
        student_name: evaluation.student_name,
        roll: evaluation.roll,
        full_marks: evaluation.full_marks,
        obtained_marks: evaluation.obtained_total_marks
      });

      return acc;
    }, {});

    // Convert the map to array format
    const papers = Object.values(paperMap);

    return res.status(200).json({
      message: "Papers fetched successfully",
      papers
    });
  } catch (error) {
    console.error('Get Evaluated Papers Error:', error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

const DeletePaper = async (req, res) => {
  try {
    const { paperName, createdBy } = req.body;

    if (!paperName || !createdBy) {
      return res.status(400).json({
        message: "paperName and createdBy fields are required"
      });
    }

    // Delete from evaluations
    await deleteRows("evaluations", { 
      paper_name: paperName, 
      created_by_email: createdBy 
    });

    // Delete from model_answers
    await deleteRows("model_answers", { 
      paper_name: paperName, 
      created_by_email: createdBy 
    });

    return res.status(200).json({
      message: "Paper deleted successfully"
    });
  } catch (error) {
    console.error('Delete Paper Error:', error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

module.exports = {
  EvaluateStudent,
  GetEvaluatedPapers,
  DeletePaper
};