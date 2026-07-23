import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "../../components/sidebar/sidebar";
import UserProfile from "../../components/UserProfile/UserProfile";
import "./styles.css";
import Woman from "../../assets/niggi.webp";
import Warn from "../../assets/warning.png";
import Edit from "../../assets/edit-icon.png";

const ProfileDetails = () => {
  const [teacherName, setTeacherName] = useState(localStorage.getItem("name") || "Teacher");
  const [teacherUsername, setTeacherUsername] = useState(localStorage.getItem("username") || "instructor");
  const teacherInitial = teacherName.split(' ')[0] || "Teacher";
  const role = localStorage.getItem("role") || "Instructor";
  const userEmail = localStorage.getItem("usermail");

  const [profilePicture, setProfilePicture] = useState(localStorage.getItem("dp") || Woman);
  const [papersList, setPapersList] = useState([]);
  const [activeTab, setActiveTab] = useState("recent");
  
  // Settings Form State
  const [editName, setEditName] = useState(teacherName);
  const [editUsername, setEditUsername] = useState(teacherUsername);

  // Statistics State
  const [selectedStatsPaper, setSelectedStatsPaper] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    if (!userEmail) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/evaluation/get-papers`, {
        createdBy: userEmail
      }, {
        headers: { "Content-Type": "application/json" }
      });
      if (response.data.message === "Papers fetched successfully") {
        const papers = response.data.papers || [];
        setPapersList(papers);
        if (papers.length > 0) {
          setSelectedStatsPaper(papers[0].paper_name);
        }
      }
    } catch (error) {
      console.error("Error fetching papers count:", error);
    }
  };

  const handleEditClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!userEmail) {
      alert("Error: User email not found in session.");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);
    formData.append("email", userEmail);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/teacher/update-profile-picture`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.status === 200 && response.data.profilePicture) {
        setProfilePicture(response.data.profilePicture);
        localStorage.setItem("dp", response.data.profilePicture);
        alert("Profile picture updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
      alert("Failed to update profile picture.");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!userEmail) return;

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/teacher/update-profile`, {
        email: userEmail,
        name: editName,
        username: editUsername
      });

      if (response.status === 200) {
        setTeacherName(editName);
        setTeacherUsername(editUsername);
        localStorage.setItem("name", editName);
        localStorage.setItem("username", editUsername);
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  // Calculate Statistics for Selected Paper
  let totalStudents = 0;
  let highestScore = 0;
  let highestScorerName = "N/A";
  let avgClassScore = "0%";

  if (selectedStatsPaper) {
    const paper = papersList.find(p => p.paper_name === selectedStatsPaper);
    if (paper && paper.checked_papers) {
      totalStudents = paper.checked_papers.length;
      let totalScoreSum = 0;
      let totalMaxMarksSum = 0;

      paper.checked_papers.forEach(student => {
        const score = parseFloat(student.obtained_marks) || 0;
        const maxMarks = parseFloat(student.full_marks) || 0;
        
        totalScoreSum += score;
        totalMaxMarksSum += maxMarks;

        if (score > highestScore) {
          highestScore = score;
          highestScorerName = student.student_name || "Unknown";
        }
      });

      if (totalMaxMarksSum > 0) {
        avgClassScore = ((totalScoreSum / totalMaxMarksSum) * 100).toFixed(1) + "%";
      }
    }
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="profile-content">
        <UserProfile />
        <div className="profile-main-content" id="font">
          <div className="profile-header">
            <div className="header-text">
              <h1 className="header-title">
                Hey, {teacherInitial}! <br />
                Here’s your treasure.
              </h1>
              <p className="header-description">
                Look out for your necessary basic details as page admin here,
                edit them as per your wish and use them to ease the evolution
                process.
              </p>
              <div className="header-buttons">
                <button className="role-button">{role}</button>
                <button className="total-papers-button">
                  Total papers
                  <span className="paper-count">{papersList.length}</span>
                </button>
              </div>
              <div className="upgrade-notice">
                <img className="upgrade-icon" src={Warn} alt="error" />
                <p>You're currently on free tier. <span className="text-black">Upgrade your account</span> to avail more features</p>
              </div>
            </div>
            <div className="profile-info">
              <div className="profile-image-container">
                <img
                  alt="Profile Picture"
                  className="profile-image"
                  src={profilePicture}
                />

                <div className="edit-icon" onClick={handleEditClick} style={{ cursor: "pointer" }}>
                  <img src={Edit} alt="Edit" />
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  onChange={handleFileChange}
                />
              </div>

              <div className="profile-text">
                <h2 className="profile-name">{teacherName}</h2>
                <p className="profile-username">@{teacherUsername}</p>
              </div>
            </div>
          </div>
          <div className="profile-navigation">
            <div className="navigation-buttons">
              <button 
                className={`active-tab ${activeTab === 'recent' ? 'selected' : ''}`}
                onClick={() => setActiveTab('recent')}
                style={{ opacity: activeTab === 'recent' ? 1 : 0.6 }}
              >
                Recent Evaluations
              </button>
              <button 
                className={`active-tab ${activeTab === 'stats' ? 'selected' : ''}`}
                onClick={() => setActiveTab('stats')}
                style={{ opacity: activeTab === 'stats' ? 1 : 0.6 }}
              >
                Statistics
              </button>
              <button 
                className={`active-tab ${activeTab === 'settings' ? 'selected' : ''}`}
                onClick={() => setActiveTab('settings')}
                style={{ opacity: activeTab === 'settings' ? 1 : 0.6 }}
              >
                Settings
              </button>
            </div>

            <div className="content-area" style={{ marginTop: '20px', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {activeTab === 'recent' && (
                <div>
                  <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>Recent Papers</h3>
                  {papersList.length === 0 ? (
                    <p>No papers evaluated yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {papersList.slice(0, 5).map((paper, idx) => (
                        <div key={idx} style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '500' }}>{paper.paper_name}</span>
                          <span style={{ fontSize: '14px', color: '#64748B' }}>{paper.checked_papers?.length || 0} students evaluated</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Paper Statistics</h3>
                    {papersList.length > 0 && (
                      <select 
                        value={selectedStatsPaper}
                        onChange={(e) => setSelectedStatsPaper(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', outline: 'none' }}
                      >
                        {papersList.map((p, idx) => (
                          <option key={idx} value={p.paper_name}>{p.paper_name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {papersList.length === 0 ? (
                    <p>No papers available for statistics.</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div style={{ padding: '20px', background: '#F0F7FF', borderRadius: '12px', border: '1px solid #E0E7FF' }}>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>Total Students Evaluated</p>
                        <h2 style={{ fontSize: '28px', color: '#1E293B', margin: 0 }}>{totalStudents}</h2>
                      </div>
                      <div style={{ padding: '20px', background: '#FDF4FF', borderRadius: '12px', border: '1px solid #FAE8FF' }}>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>Highest Score</p>
                        <h2 style={{ fontSize: '28px', color: '#1E293B', margin: 0 }}>{highestScore}</h2>
                        <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>by {highestScorerName}</p>
                      </div>
                      <div style={{ padding: '20px', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #DCFCE7' }}>
                        <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '8px' }}>Average Class Score</p>
                        <h2 style={{ fontSize: '28px', color: '#1E293B', margin: 0 }}>{avgClassScore}</h2>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Update Profile Details</h3>
                  <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', color: '#334155' }}>Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', color: '#334155' }}>Username</label>
                      <input 
                        type="text" 
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '14px' }}
                        required
                      />
                    </div>
                    <button type="submit" style={{ marginTop: '8px', padding: '12px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>
                      Save Changes
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;
