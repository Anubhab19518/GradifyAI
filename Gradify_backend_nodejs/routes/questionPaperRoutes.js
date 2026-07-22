const express = require("express");
const multer = require("multer");
const { CreatePaper, GenerateAnswer } = require("../controller/questionPaperController");
const { StoreModelAnswer, GetPaperDetails } = require("../controller/modelAnswerController");

const router = express.Router();
const upload = multer(); // Memory storage for file uploads

// @route POST /api/papers
router.post("/create/question-paper", upload.array("files", 5), CreatePaper);
router.post("/generate/model-answer",GenerateAnswer);
router.post("/store/model-answer",StoreModelAnswer);
router.post("/get-paper-details", GetPaperDetails);

module.exports = router;
