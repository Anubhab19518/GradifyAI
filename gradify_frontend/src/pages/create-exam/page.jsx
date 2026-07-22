import React, { useState, useRef } from "react";
import Sidebar from "../../components/sidebar/sidebar";
import UserProfile from "../../components/UserProfile/UserProfile";
import upload from "../../assets/upload.png";
import flim from "../../assets/flim.png";
import refresh from "../../assets/refresh.png";
import lines from "../../assets/menu.png";
import cross from "../../assets/close.png";
import { Line } from "rc-progress";
import "./styles.css";
import { CreateQuestionPaper } from '../../api/api';
import QuestionForm from "../../components/QuestionForm/QuestionForm";

const Createexam = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    createdBy: localStorage.getItem("usermail"),
    paperName: "",
    subjectName: "",
    fullMarks: "",
    details: "",
    files: []
  });

  const resetForm = () => {
    setFormData({
      createdBy: localStorage.getItem("usermail"),
      paperName: "",
      subjectName: "",
      fullMarks: "",
      details: "",
      files: []
    });
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setIsUploading(true);
      const newFiles = files.map(file => ({
        id: Date.now() + Math.random(),
        file: file,
        name: file.name,
        size: (file.size / 1024).toFixed(2) + "KB",
        progress: 0
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);

      setFormData(prev => ({
        ...prev,
        files: [...prev.files, ...files]
      }));

      newFiles.forEach(newFile => {
        const interval = setInterval(() => {
          setUploadedFiles(prev =>
            prev.map(f =>
              f.id === newFile.id
                ? { ...f, progress: Math.min(f.progress + 10, 100) }
                : f
            )
          );
        }, 300);

        setTimeout(() => {
          clearInterval(interval);
          setIsUploading(false);
        }, 3000);
      });
    }
  };

  const handleFileDelete = (id) => {
    const fileToDelete = uploadedFiles.find(file => file.id === id);
    setUploadedFiles(prev => prev.filter(file => file.id !== id));

    if (fileToDelete) {
      setFormData(prev => ({
        ...prev,
        files: prev.files.filter(file => file.name !== fileToDelete.name)
      }));
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const fieldMap = {
      'name-of-paper': 'paperName',
      'subject-name': 'subjectName',
      'full-marks': 'fullMarks',
      'details': 'details'
    };

    setFormData(prev => ({
      ...prev,
      [fieldMap[id] || id]: value
    }));
  };

  const showSuccessNotification = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const finalFormData = new FormData();

    finalFormData.append("createdBy", formData.createdBy);
    finalFormData.append("paperName", formData.paperName);
    finalFormData.append("subjectName", formData.subjectName);
    finalFormData.append("fullMarks", formData.fullMarks);
    finalFormData.append("details", formData.details);

    formData.files.forEach((file) => {
      finalFormData.append("files", file);
    });

    try {
      const response = await CreateQuestionPaper(finalFormData);
      const savedPaperName = response.paper?.paper_name || response.paper?.paperName || formData.paperName;
      localStorage.setItem("papername", savedPaperName);
      console.log("API Response:", response);
      setIsOpen(true);
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showSuccessNotification();
    } catch (error) {
      console.error("Failed to create question paper:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    resetForm();
  };

  const sidebarStyles = {
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    opacity: isOpen ? '1' : '0'
  };

  const loadingOverlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: isLoading ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  return (
    <div className="dashboard-container">
      {showSuccess && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '4px',
            zIndex: 1000,
            animation: 'slideIn 0.5s ease-out'
          }}
        >
          Exam paper created successfully!
        </div>
      )}

      {/* Loading Overlay */}
      <div style={loadingOverlayStyles}>
        <div className="loader-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <div className="spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '10px', color: '#333' }}>Creating exam...</p>
        </div>
      </div>

      <div className="sidebar">
        <Sidebar />
      </div>
      <div className="profile-content">
        <UserProfile />
        <div className="create-exam-container" id="font">
          <div className="create-exam-wrapper">
            <div className="create-exam-header">
              <h1 className="create-exam-title">Let's Create An Exam</h1>
              <button className="start-over-button" onClick={handleStartOver}>
                <div className="refresh-icon">
                  <img src={refresh} alt="Refresh" className="icon" />
                  <span className="start-over-text">Start Over</span>
                </div>
              </button>
            </div>
            <p className="create-exam-description">
              Create new exam from this section. Upload your study material
              (.pdf) and add basic details about the exam. After you're done
              click Add Questions to add questions and their marks.
            </p>
            <div className="upload-section relative">
              <div
                className={`absolute top-0 right-0 p-4 w-[45%] h-full bg-white shadow-md overflow-y-auto ${isOpen ? '' : 'hidden'}`}
                style={sidebarStyles}
              >
                <div className="w-full flex justify-end mt-2">
                  <img
                    src={cross}
                    className="w-[12px] h-[12px] cursor-pointer"
                    onClick={() => setIsOpen(false)}
                    alt="Close"
                  />
                </div>
                <QuestionForm />
              </div>
              <div className="upload-header">
                <div>
                  <h2 className="upload-title">Upload Study Material</h2>
                  <p className="upload-description">
                    Upload your study material for answer generation. Only pdf
                    files are supported.
                  </p>
                </div>
                <img
                  src={lines}
                  alt="Menu"
                  className="icon cursor-pointer"
                  style={{ height: "27px", width: "27px" }}
                  onClick={() => setIsOpen(true)}
                />
              </div>
              <div className="upload-box">
                <label htmlFor="file-upload" className="upload-label">
                  <img
                    alt="Upload icon"
                    className="icon"
                    src={upload}
                    style={{
                      width: 50,
                      height: 50,
                      margin: "auto",
                      padding: "5px",
                    }}
                  />
                  <p className="upload-instruction">
                    Click to upload or drag and drop
                  </p>
                  <p className="upload-instruction">
                    Multiple uploads (.pdf) supported
                  </p>
                </label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </div>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="uploaded-file">
                  <div className="file-info">
                    <img src={flim} alt="File icon" className="icon" id="flim-icon" />
                    <div>
                      <p className="file-name">{file.name}</p>
                      <p className="file-size">{file.size}</p>
                    </div>
                  </div>
                  <div className="file-progress">
                    <div className="progress-bar">
                      <Line
                        percent={file.progress}
                        strokeWidth={4}
                        strokeColor={file.progress === 100 ? "#10B981" : "#D1D5DB"}
                      />
                    </div>
                    <button
                      className="delete-file-button"
                      onClick={() => handleFileDelete(file.id)}
                    >
                      <img
                        src={cross}
                        alt="Delete"
                        className="icon"
                        style={{ height: "9px", width: "9px" }}
                      />
                    </button>
                  </div>
                </div>
              ))}

              <h2 className="details-title">Describe About Your Exam</h2>
              <p className="details-description">
                Upload your study material for answer generation. Only pdf files
                are supported.
              </p>
              <div className="details-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="name-of-paper">
                      Name of Paper
                    </label>
                    <input
                      className="form-input"
                      id="name-of-paper"
                      placeholder="eg. PYTHON 101"
                      type="text"
                      value={formData.paperName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="full-marks">
                      Full Marks
                    </label>
                    <input
                      className="form-input"
                      id="full-marks"
                      placeholder="eg. 100"
                      type="text"
                      value={formData.fullMarks}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="subject-name">
                      Subject Name
                    </label>
                    <input
                      className="form-input"
                      id="subject-name"
                      placeholder="eg. Programming in python"
                      type="text"
                      value={formData.subjectName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="details">
                    Details (Optional)
                  </label>
                  <textarea
                    className="form-textarea"
                    id="details"
                    rows="4"
                    value={formData.details}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
              <button
                className="px-10 mt-4 cursor-pointer py-2 bg-[#000] text-white rounded-3xl"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Proceed'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Createexam;