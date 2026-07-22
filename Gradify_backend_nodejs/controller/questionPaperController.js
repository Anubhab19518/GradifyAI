const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { insertRows, selectRows, updateRows } = require("../config/supabase");

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

const CreatePaper = async (req,res) => {
    try {
        const { createdBy, paperName, subjectName, fullMarks, details } = req.body;

        if (!createdBy || !paperName || !subjectName || !fullMarks) {
            return res.status(400).json({ error: "createdBy, paperName, subjectName, and fullMarks are required" });
        }

        let materials = [];
        if (req.files && req.files.length > 0) {
            materials = req.files.map(file => ({
                file_name: file.originalname,
                mime_type: file.mimetype,
                file_base64: file.buffer.toString("base64")
            }));
        }

        const paperPayload = {
            created_by_email: createdBy,
            paper_name: paperName,
            subject_name: subjectName,
            full_marks: Number(fullMarks),
            details: details || "",
            materials,
        };

        const existingPaper = await selectRows("papers", { created_by_email: createdBy, paper_name: paperName }, { single: true });

        let savedPaper;
        if (existingPaper) {
            const updated = await updateRows("papers", paperPayload, { id: existingPaper.id });
            savedPaper = Array.isArray(updated) ? updated[0] : updated;
        } else {
            const inserted = await insertRows("papers", [paperPayload]);
            savedPaper = inserted[0];
        }

        res.status(201).json({
            message: "Paper created successfully",
            paper: {
                ...savedPaper,
                paperName: savedPaper.paper_name,
                createdBy: savedPaper.created_by_email,
                subjectName: savedPaper.subject_name,
                fullMarks: savedPaper.full_marks,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const GenerateAnswer = async (req,res) => {
    try {
        const { createdBy, paperName, question, marks, question_id } = req.body;

        if (!createdBy || !paperName) {
            return res.status(400).json({ error: "createdBy and paperName are required. Complete exam setup before adding questions." });
        }

        const paper = await selectRows("papers", { created_by_email: createdBy, paper_name: paperName }, { single: true });
        if (!paper) {
            return res.status(404).json({ error: `Paper "${paperName}" not found. Click Proceed after uploading your PDF first.` });
        }

        let materials = paper.materials;
        if (typeof materials === "string") {
            materials = JSON.parse(materials);
        }

        if (!materials || !materials.length) {
            return res.status(400).json({ error: "No study material found for this paper. Upload a PDF and click Proceed before generating answers." });
        }

        const tempFilePaths = [];
        const formData = new FormData();
        formData.append("question", question);
        formData.append("question_id", question_id);
        formData.append("marks", marks);
        materials.forEach((material, index) => {
            if (!material || !material.file_base64) {
                return;
            }

            const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${index + 1}-${material.file_name || "paper.pdf"}`);
            fs.writeFileSync(tempFilePath, Buffer.from(material.file_base64, "base64"));
            tempFilePaths.push(tempFilePath);

            formData.append("files", fs.createReadStream(tempFilePath), {
                filename: material.file_name || `file${index + 1}.pdf`,
                contentType: material.mime_type || "application/pdf"
            });
        });

        let response;
        try {
            response = await axios.post(`${PYTHON_SERVICE_URL}/generate-answer`, formData, {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
            });
        } finally {
            tempFilePaths.forEach((tempFilePath) => {
                try {
                    fs.unlinkSync(tempFilePath);
                } catch (cleanupError) {
                    console.error(`Failed to clean up temp file ${tempFilePath}:`, cleanupError);
                }
            });
        }

        res.status(200).json({ answer: response.data.answer, question_id, question, marks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { CreatePaper, GenerateAnswer }