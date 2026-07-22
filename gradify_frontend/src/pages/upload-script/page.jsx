import React, { useState, useRef } from "react";
import "./styles.css";
import Sidebar from "../../components/sidebar/sidebar";
import UserProfile from "../../components/UserProfile/UserProfile";
import greyplus from "../../assets/plusgrey.png";
import close from "../../assets/close.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OCR_THROTTLE_S = 13; // must match evaluationController.js

const EvaluateAnswer = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([
    { id: Date.now(), studentName: "", roll: "", uploadedImages: [] }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Progress state ──
  const [progress, setProgress] = useState(0);           // 0-100
  const [currentStudentIdx, setCurrentStudentIdx] = useState(-1);
  const [studentStatuses, setStudentStatuses] = useState([]); // 'queued'|'ocr'|'evaluating'|'done'
  const [progressMsg, setProgressMsg] = useState("");
  const timerRef = useRef(null);

  // ── Student management ──
  const handleAddStudent = () =>
    setStudents(prev => [...prev, { id: Date.now(), studentName: "", roll: "", uploadedImages: [] }]);

  const handleRemoveStudent = id =>
    setStudents(prev => prev.filter(s => s.id !== id));

  const handleStudentChange = (id, field, value) =>
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

  const handleImageUpload = (e, studentId) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (!file.type.startsWith("image/")) { alert("Please upload only image files"); return; }
      const reader = new FileReader();
      reader.onload = event => {
        setStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          if (s.uploadedImages.length >= 5) { alert("Maximum 5 images allowed per student"); return s; }
          return { ...s, uploadedImages: [...s.uploadedImages, { imageId: Date.now() + Math.random(), url: event.target.result, file }] };
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (studentId, imageId) =>
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, uploadedImages: s.uploadedImages.filter(img => img.imageId !== imageId) } : s
    ));

  // ── Smooth progress ticker ──
  const startProgressTicker = (fromPct, toPct, durationMs) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const steps = 60;
    const interval = durationMs / steps;
    const increment = (toPct - fromPct) / steps;
    let current = fromPct;
    let step = 0;
    timerRef.current = setInterval(() => {
      step++;
      current += increment;
      setProgress(Math.min(Math.round(current), toPct));
      if (step >= steps) clearInterval(timerRef.current);
    }, interval);
  };

  const handleSubmit = async () => {
    for (const student of students) {
      if (!student.studentName || !student.roll) { alert("Please fill in all student details"); return; }
      if (student.uploadedImages.length === 0) { alert(`Please upload at least one image for ${student.studentName}`); return; }
    }

    setIsSubmitting(true);
    setProgress(0);
    setCurrentStudentIdx(0);
    setStudentStatuses(students.map(() => "queued"));

    const resultsArray = [];
    const paperName = localStorage.getItem("papername");
    const createdBy = localStorage.getItem("usermail");

    // Estimate total seconds: for each student → (numImages × 13s OCR) + 5s evaluation
    const totalEstimatedS = students.reduce((acc, s) => acc + (s.uploadedImages.length * OCR_THROTTLE_S) + 5, 0);
    const pctPerSecond = 95 / totalEstimatedS; // reserve last 5% for save+navigate
    let accumulatedPct = 0;

    try {
      for (let si = 0; si < students.length; si++) {
        const student = students[si];
        setCurrentStudentIdx(si);
        setStudentStatuses(prev => prev.map((s, i) => i === si ? "ocr" : s));
        setProgressMsg(`OCR scanning ${student.studentName || `Student #${si + 1}`}'s answer sheet…`);

        const ocrDurationMs = student.uploadedImages.length * OCR_THROTTLE_S * 1000;
        const ocrEndPct = Math.min(accumulatedPct + ocrDurationMs / 1000 * pctPerSecond, 95);
        startProgressTicker(accumulatedPct, ocrEndPct, ocrDurationMs);
        accumulatedPct = ocrEndPct;

        const formDataToSend = new FormData();
        formDataToSend.append("paperName", paperName);
        formDataToSend.append("createdBy", createdBy);
        formDataToSend.append("student_name", student.studentName);
        formDataToSend.append("roll", student.roll);
        student.uploadedImages.forEach(img => formDataToSend.append("files", img.file));

        setStudentStatuses(prev => prev.map((s, i) => i === si ? "evaluating" : s));
        setProgressMsg(`Evaluating ${student.studentName || `Student #${si + 1}`}'s answers…`);

        const response = await axios.post(
          "http://localhost:5000/api/evaluation/evaluate-answers",
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        resultsArray.push(response.data);

        setStudentStatuses(prev => prev.map((s, i) => i === si ? "done" : s));
        accumulatedPct = Math.min(accumulatedPct + 5 * pctPerSecond, 95);
        setProgress(Math.round(accumulatedPct));
      }

      setProgressMsg("Saving results…");
      startProgressTicker(accumulatedPct, 100, 600);
      await new Promise(r => setTimeout(r, 700));

      localStorage.setItem("evaluationResult", JSON.stringify(resultsArray));
      navigate("/results");
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      alert("An error occurred while evaluating the answer scripts. Please try again.");
      setIsSubmitting(false);
      setProgress(0);
      setProgressMsg("");
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const statusBadge = (status, name) => {
    const cfg = {
      queued:     { bg: "bg-gray-100",   text: "text-gray-500",  dot: "bg-gray-400",  label: "Queued" },
      ocr:        { bg: "bg-blue-50",    text: "text-blue-600",  dot: "bg-blue-500",  label: "Scanning…" },
      evaluating: { bg: "bg-yellow-50",  text: "text-yellow-700",dot: "bg-yellow-500",label: "Evaluating…" },
      done:       { bg: "bg-green-50",   text: "text-green-700", dot: "bg-green-500", label: "Done ✓" },
    }[status] || {};
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${cfg.bg} ${cfg.text}`}>
        <span className={`w-2 h-2 rounded-full inline-block ${cfg.dot} ${status === 'ocr' || status === 'evaluating' ? 'animate-pulse' : ''}`}></span>
        {name}: {cfg.label}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="profile-content">
        <UserProfile />
        <div className="evaluate-answer-container p-6" id="font">
          <h1
            className="text-10xl font-bold mb-2"
            style={{ fontSize: "45px", marginBottom: "20px", marginTop: "20px" }}
          >
            Evaluate Answers
          </h1>
          <p className="text-gray-600 mb-6">
            Evaluate multiple students' answer scripts in one pass. Add rows for each student and upload their respective answer sheets.
          </p>

          {/* ── Progress Bar ── */}
          {isSubmitting && (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800">Evaluation in progress</span>
                <span className="text-sm font-bold text-blue-600">{progress}%</span>
              </div>

              {/* Track */}
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-4">
                <div
                  className="h-4 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                  }}
                />
              </div>

              {/* Status message */}
              <p className="text-sm text-gray-500 mb-4 italic">{progressMsg}</p>

              {/* Per-student status pills */}
              <div className="flex flex-wrap gap-2">
                {studentStatuses.map((status, i) =>
                  statusBadge(status, students[i]?.studentName || `Student #${i + 1}`)
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                ⏱ Gemini OCR processes ~1 image every 13 s (free-tier rate limit). Please wait.
              </p>
            </div>
          )}

          {/* ── Student rows ── */}
          {!isSubmitting && students.map((student, index) => (
            <div key={student.id} className="bg-[#FDFDFD] p-6 rounded-lg shadow-md mb-6 border border-gray-200 relative">
              <div className="absolute top-4 right-4 flex space-x-2">
                {students.length > 1 && (
                  <button
                    onClick={() => handleRemoveStudent(student.id)}
                    className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xl"
                    title="Remove Student"
                  >-</button>
                )}
                {index === students.length - 1 && (
                  <button
                    onClick={handleAddStudent}
                    className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-xl"
                    title="Add Student"
                  >+</button>
                )}
              </div>

              <h2 className="text-xl font-semibold mb-4">Student #{index + 1} Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pr-20">
                <div>
                  <label className="block text-gray-700" htmlFor={`studentName-${student.id}`}>Name of Student</label>
                  <input
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    id={`studentName-${student.id}`}
                    placeholder="eg. Celine Gomez"
                    type="text"
                    value={student.studentName}
                    onChange={e => handleStudentChange(student.id, "studentName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700" htmlFor={`roll-${student.id}`}>Roll</label>
                  <input
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    id={`roll-${student.id}`}
                    placeholder="eg. CR013"
                    type="text"
                    value={student.roll}
                    onChange={e => handleStudentChange(student.id, "roll", e.target.value)}
                  />
                </div>
              </div>

              <h2 className="text-xl font-semibold mb-4">Upload Answer Script</h2>
              <div className="flex space-x-4 mb-6 flex-wrap">
                {student.uploadedImages.map(image => (
                  <div key={image.imageId} className="relative mb-4">
                    <img
                      alt="Uploaded answer script page"
                      className="w-32 h-32 object-cover rounded-md shadow-md"
                      src={image.url}
                    />
                    <button
                      className="absolute top-2 right-2 bg-white shadow-md text-white rounded-full p-1"
                      onClick={() => removeImage(student.id, image.imageId)}
                    >
                      <img src={close} alt="" className="w-2 h-2 cursor-pointer" />
                    </button>
                  </div>
                ))}
                {student.uploadedImages.length < 5 && (
                  <div className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md mb-4">
                    <label
                      className="cursor-pointer text-center items-center justify-center flex flex-col text-gray-500 mt-6 w-full h-full"
                      htmlFor={`upload-${student.id}`}
                    >
                      <img src={greyplus} alt="" className="w-10 h-10" />
                      <p className="text-xs -mt-2 text-center">click to upload<br />(image files only)</p>
                    </label>
                    <input
                      className="hidden"
                      id={`upload-${student.id}`}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => handleImageUpload(e, student.id)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            className="bg-black text-white py-3 px-6 rounded-md disabled:bg-gray-400 w-full text-lg font-semibold"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Evaluating… please wait" : "Evaluate All Scripts"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluateAnswer;

