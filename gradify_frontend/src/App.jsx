import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CreateexamPage from "./pages/create-exam/page";
import ExamHistoryPage from "./pages/exam-history/page";
import ProfileDetails from "./pages/profile-details/page";
import EvaluateAnswer from "./pages/upload-script/page";
import Resultpage from "./pages/result/page";
import "./App.css";
import ExamDetails from "./pages/exam-details/page";
import AuthForm from "./pages/login/page";
import LandingPage from "./pages/landing/page";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profile-details" element={<ProfileDetails />} />
        <Route path="/exam-history" element={<ExamHistoryPage />} />
        <Route path="/create-exam" element={<CreateexamPage />} />
        <Route path="/upload-script" element={<EvaluateAnswer />} />
        <Route path="/results" element={<Resultpage />} />
        <Route path="/exam-details" element={<ExamDetails />} />
        <Route path='/login' element={<AuthForm />} />
      </Routes>
    </Router>
  );
}

export default App;

