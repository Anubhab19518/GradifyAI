import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import UserProfile from "../../components/UserProfile/UserProfile";
import list from "../../assets/list.png";
import plus from "../../assets/plus_create.png";
import doc from "../../assets/document.png";
import trash from "../../assets/delete.png";
import cont from "../../assets/conct.png";
import total from "../../assets/total_marks.png";
import obtained from "../../assets/obtained.png";
import percnt from "../../assets/prcnt.png";
import roll from "../../assets/roll.png";
import "./styles.css";
import axios from "axios";

const ExamHistory = () => {
  const [papers, setPapers] = useState([]);
  const navigate = useNavigate();
  const teacherName = localStorage.getItem("name") || "Teacher";
  const teacherFirstName = teacherName.split(' ')[0] || "Teacher";

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/evaluation/get-papers`, {
        createdBy: localStorage.getItem("usermail")
      }, {
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.data.message === "Papers fetched successfully") {
        setPapers(response.data.papers || []);
      }
    } catch (error) {
      console.error("Error fetching papers:", error);
    }
  };

  const calculatePercentage = (obtained, total) => {
    return ((obtained / total) * 100).toFixed(1) + "%";
  };

  const handleEvaluateNew = (paperName) => {
    localStorage.setItem("papername", paperName);
    navigate("/exam-details");
  };

  const handleCreateNew = () => {
    navigate("/create-exam");
  };

  const handleDeletePaper = async (paperName) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${paperName}"? This cannot be undone.`);
    if (!confirmed) return;
    
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/evaluation/delete-paper`, {
        data: {
          paperName: paperName,
          createdBy: localStorage.getItem("usermail")
        },
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (response.status === 200) {
        // Remove the deleted paper from the state
        setPapers(papers.filter(p => p.paper_name !== paperName));
        alert(`"${paperName}" has been successfully deleted.`);
      }
    } catch (error) {
      console.error("Error deleting paper:", error);
      alert("Failed to delete paper. Please try again.");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="profile-content">
        <UserProfile />
        <div className="exam-history-container" id="font">
          <div className="exam-history-wrapper">
            <div className="class-header">
              <div className="class-icon">
                <span className="class-initial">C</span>
              </div>
              <div className="class-info">
                <h1 className="class-title">{teacherFirstName}'s Class</h1>
                <p className="class-description">
                  Hello {teacherFirstName}, store all of your exam copies here and add more
                  papers under a paper or delete them
                </p>
              </div>
            </div>

            <div className="action-bar">
              <button className="list-view-button">
                <img src={list} alt="" id="icon" />
                <span>List</span>
              </button>
              <button className="create-new-button" onClick={handleCreateNew}>
                <img src={plus} alt="" id="icon" />
                Create New
              </button>
            </div>

            {papers.map((paper, index) => (
              <div className="exam-section" key={index}>
                <div
                  className="exam-header"
                  style={{ height: 44, background: "#E8F2F8", borderRadius: 7 }}
                >
                  <div className="exam-title-section">
                    <img src={doc} alt="" id="icon" />
                    <span className="exam-title">{paper.paper_name}</span>
                  </div>
                  <div className="exam-controls">
                    <a 
                      href="#" 
                      className="evaluate-new-link"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEvaluateNew(paper.paper_name);
                      }}
                    >
                      + Evaluate New
                    </a>
                    <span
                      className="delete-icon"
                      style={{ cursor: 'pointer' }}
                      title="Delete paper"
                      onClick={() => handleDeletePaper(paper.paper_name)}
                    >
                      <img src={trash} alt="Delete" id="icon" />
                    </span>
                  </div>
                </div>

                <div className="exam-table-wrapper">
                  <table className="student-results-table">
                    <thead>
                      <tr>
                        <th className="student-name-column">
                          <div className="table-header">
                            <img src={cont} alt="" id="icon" />Student's Name
                          </div>
                        </th>
                        <th className="total-marks-column">
                          <div className="table-header">
                            <img src={total} alt="" id="icon" />Total Marks
                          </div>
                        </th>
                        <th className="marks-obtained-column">
                          <div className="table-header">
                            <img src={obtained} alt="" id="icon" />Marks Obtained
                          </div>
                        </th>
                        <th className="percentage-column">
                          <div className="table-header">
                            <img src={percnt} alt="" id="icon" />Percentage
                          </div>
                        </th>
                        <th className="roll-column">
                          <div className="table-header">
                            <img src={roll} alt="" id="icon" />Roll
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paper.checked_papers.map((student, studentIndex) => (
                        <tr key={studentIndex}>
                          <td>{student.student_name}</td>
                          <td>{student.full_marks}</td>
                          <td>{student.obtained_marks}</td>
                          <td>{calculatePercentage(student.obtained_marks, student.full_marks)}</td>
                          <td>{student.roll}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamHistory;