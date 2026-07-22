import React, { useState, useEffect } from "react";
import axios from "axios";
import './styles.css'
import Sidebar from "../../components/sidebar/sidebar";
import UserProfile from "../../components/UserProfile/UserProfile";
import flim from "../../assets/flim.png";
import Checked from '../../assets/checked.png';
import DownArrow from '../../assets/down-arrow.png';
import { useNavigate } from "react-router-dom";

const SkullLoader = () => (
  <div className="skull-loader-container">
    <div className="skull-loader">
      <div className="skull-head">
        <div className="skull-eye left"></div>
        <div className="skull-eye right"></div>
        <div className="skull-nose"></div>
        <div className="skull-teeth"></div>
      </div>
    </div>
    <div className="loading-text">Loading Paper Details...</div>
  </div>
);

const ExamDetails = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paperDetails, setPaperDetails] = useState({
        paperName: "",
        details: "",
        fullMarks: 0,
        files: [],
        questionsAndAnswers: []
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchPaperDetails();
    }, []);

    const fetchPaperDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/papers/get-paper-details`, {
                createdBy: localStorage.getItem("usermail"),
                paperName: localStorage.getItem("papername")
            });

            if (response.data.success) {
                setPaperDetails(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching paper details:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container" id="font">
            <Sidebar />
            <div className="profile-content">
                <UserProfile />
                <div className="min-h-screen max-w-full p-8">
                    <div className="max-w-full mx-auto space-y-8">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-bold flex items-center gap-2">
                                {paperDetails.paperName}
                            </h1>
                            <p className="text-base mt-4">{paperDetails.details}. The full marks of the exam is {paperDetails.fullMarks}</p>
                            {loading ? (
                                <SkullLoader />
                            ) : (
                                <div className="w-full min-h-[85vh] bg-[#FDFDFD] mt-6 p-10">
                                    <h1 className="text-xl font-medium">Materials Uploaded</h1>
                                    <div className="mt-4">
                                        {paperDetails.files.map((file, index) => (
                                            <div key={index} className="mt-2 mb-2 w-full h-16 rounded-xl border border-[#D9D9D9] p-4 flex items-center justify-between">
                                                <div className="flex gap-2 items-center">
                                                    <div className="h-10 w-10 flex items-center justify-center rounded-sm border border-[#D9D9D9] bg-gray-100">
                                                        <img className="h-6 w-6" src={flim} alt="file" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">{file.file_name}</p>
                                                        <p className="text-xs text-gray-500">id: {file.file_id}</p>
                                                    </div>
                                                </div>
                                                <div className="text-green-500 text-xl">
                                                    <img className="h-4 w-4" src={Checked} alt="checked" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <h1 className="text-xl font-medium mt-4">Question Paper</h1>
                                    {paperDetails.questionsAndAnswers.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <div className="flex gap-3 w-full mt-4 items-start">
                                                <div className="w-8 h-8 rounded-sm border border-[#D9D9D9] flex justify-center items-center text-sm font-medium bg-gray-100">
                                                    {item.question_id}
                                                </div>
                                                <div className="flex-1">
                                                    <div
                                                        className="flex justify-between items-center cursor-pointer"
                                                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                                    >
                                                        <p className="text-[15px] font-medium">{item.question}</p>
                                                        <span className="text-gray-500 text-lg">
                                                            <img
                                                                className={`h-4 w-4 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
                                                                src={DownArrow}
                                                                alt="arrow"
                                                            />
                                                        </span>
                                                    </div>
                                                    {openIndex === index && (
                                                        <p className="text-sm text-gray-600 mt-4 text-[14px]">{item.answer}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {index < paperDetails.questionsAndAnswers.length - 1 && (
                                                <div className="border-b border-gray-200 mt-4"></div>
                                            )}
                                        </React.Fragment>
                                    ))}
                                    <button onClick={() => navigate('/upload-script')} className="px-6 py-2 mt-4 rounded-2xl bg-[#000] text-white cursor-pointer">Proceed</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamDetails;