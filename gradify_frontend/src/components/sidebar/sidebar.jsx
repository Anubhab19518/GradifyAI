import React, { useState } from "react";

import "./Sidebar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaHistory, FaPen, FaSignOutAlt, FaPlus, FaTachometerAlt, FaBars, FaTimes } from "react-icons/fa";
import ProfileImage from '../../assets/conct.png';
import ListImage from '../../assets/exam_lists.png';
import Create from '../../assets/create.png'
import CreateIcon from '../../assets/plus_create.png'
import LogOut from '../../assets/logout.png'

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleStartNewExam = () => {
    setIsOpen(false);
    navigate('/create-exam');
  };

  const handleLogOut = () => {
    localStorage.removeItem('usermail');
    localStorage.removeItem('name');
    localStorage.removeItem('username');
    localStorage.removeItem('dp');
    localStorage.removeItem('token');
    localStorage.removeItem('papername');
    localStorage.removeItem('evaluationResult');
    navigate('/login');
  };

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <h1 className="mobile-logo">Gradify.ai</h1>
        <button className="hamburger-btn" onClick={toggleSidebar}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <div className={`sidebar ${isOpen ? 'open' : ''}`} id="font">
        <div className="logo-section hidden-mobile">
          <h1 className="logo-heading">Gradify.ai</h1>
        </div>

        <nav className="nav-section">
          <Link to="/profile-details" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/profile-details' ? 'active' : 'non-active'}`}>
            <img className="icon-img" src={ProfileImage} alt="Profile" />
            <span>Profile Details</span>
          </Link>

          <Link to="/exam-history" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/exam-history' ? 'active' : 'non-active'}`}>
            <img className="icon-img" src={ListImage} alt="History" />
            <span>Exam History</span>
          </Link>

          <Link to="/create-exam" onClick={() => setIsOpen(false)} className={`nav-link ${location.pathname === '/create-exam' ? 'active' : 'non-active'}`}>
            <img className="icon-img" src={Create} alt="Create" />
            <span>Create Exam</span>
          </Link>

          <button className="nav-link" onClick={handleStartNewExam}>
            <div className="start-exam-btn">
              <img className="icon-img-btn" src={CreateIcon} alt="Start" />
              <span>Start New Exam</span>
            </div>
          </button>
        </nav>

        <div className="bottom-section">
          <button className="logout-btn" onClick={handleLogOut}>
            <img className="icon-img" src={LogOut} alt="Logout" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;