# 🚀 Gradify.AI
**Gradify.AI** can check and grade handwritten assignments using AI.

---

## 📌 Introduction
Gradify.AI is a tool that can grade handwritten assessments based on the study material and marks provided by the user. It uses **OCR** for text extraction, generates a **model answer** based on the provided materials and marks, and compares it with the extracted text.

### Key Benefits:
- ✅ Grades large volumes of answer sheets quickly  
- ✅ Reduces manual effort and stress for teachers  
- ✅ Easy to use and efficient  

---

## 🛠️ Installation

### Step 1: Setup a Virtual Environment
```bash
python -m venv venv
This creates a virtual environment named "venv".
```
### Step 2: Open Windows PowerShell in the project folder.
### Step 3: Change the execution policy to activate the environment:
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Confirm by typing Y and pressing Enter when prompted.

### Step 4: Activate the Virtual Environment:
```bash
.\venv\Scripts\Activate
```
### Step 5: Clone the GitHub Repository:
```bash
git clone https://github.com/subhankarcoder/AI_Exam_Checker_V2.0.git
    cd AI_Exam_Checker_V2.0
```
### Step 6: Install Required Libraries:
```bash
pip install -r requirements.txt
```
🎉 The tool is now ready to use!

## 📡 API Endpoints (For Postman)
### 📄 1. Extract Text from Image
#### Endpoint: /extract-text
<b>Method: POST<br>
Body (form-data):<br>
image → File (Upload handwritten answer sheet)</b><br>
Response Example:
```json
{
    "data": {
        "content": "Model answer",
        "question_id": "1"
    },
    "status": "success"
}
```

### 📄 2. Generate Model Answer
#### Endpoint: /generate-answer
<b>Method: POST<br>
Body (form-data):<br>
question → Text<br>
question_id → Text<br>
files → File (Upload study material PDF , can be more than one)<br>
marks → Text (Enter assigned marks)</b><br>
Response Example:
```json
{
    "answer": "Model answer based on files uploaded and marks entered",
    "marks": "5",
    "question": "Define AI",
    "question_id": "101"
}
```

### 📄 3. Evaluate Answer
#### Endpoint: /evaluate
<b>Method: POST<br>
Body (raw JSON):</b><br>
```json
{
    "question_id": "your question id",
    "model_answer": "model generated answer",
    "student_answer": "answer extracted from answer sheet",
    "max_marks": "5"
}
```
Response Example:
```json
{
    "final_score": 4,
    "max_marks": 5,
    "percentage": 80,
    "question_id": "101"
}
```
## ⚡ Tools Used:
Model Creation: Python 🐍<br>
Frontend: React.js ⚛️<br>
Backend: Node.js 🚀<br>

## 👥 Team Members:
Subhankar Chakrabarti<br>
Sohini Mukherjee<br>
Soham Saha<br>
Attharva Gupta<br>

## 🔗 Links
💻 GitHub Repo: https://github.com/subhankarcoder/AI_Exam_Checker_V2.0.git
