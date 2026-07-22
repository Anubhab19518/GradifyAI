const express = require("express");
const multer = require("multer");
const { EvaluateStudent, GetEvaluatedPapers, DeletePaper } = require("../controller/evaluationController");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { files: 30 } });

router.post("/evaluate-answers", upload.array("files", 30), EvaluateStudent);
router.post("/get-papers",GetEvaluatedPapers);
router.delete("/delete-paper", DeletePaper);

module.exports = router;