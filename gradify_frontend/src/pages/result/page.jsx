import React, { useEffect, useState } from 'react';
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import Sidebar from "../../components/sidebar/sidebar";
import UserProfile from "../../components/UserProfile/UserProfile";
import congo from "../../assets/party-popper.png";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Resultpage() {
  const [evaluationResults, setEvaluationResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = localStorage.getItem('evaluationResult');
      if (data) {
        const parsedData = JSON.parse(data);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setEvaluationResults(parsedData);
        } else if (parsedData && !Array.isArray(parsedData)) {
          setEvaluationResults([parsedData]);
        }
      }
    } catch (error) {
      console.error('Error loading evaluation data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container" id='font'>
        <Sidebar />
        <div className="profile-content">
          <UserProfile />
          <div className="min-h-screen max-w-full bg-gray-50 p-8">
            <div>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (evaluationResults.length === 0) {
    return (
      <div className="dashboard-container" id='font'>
        <Sidebar />
        <div className="profile-content">
          <UserProfile />
          <div className="min-h-screen max-w-full bg-gray-50 p-8">
            <div>No evaluation data found. Please complete the evaluation first.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" id='font'>
      <Sidebar />
      <div className="profile-content">
        <UserProfile />
        <div className="min-h-screen max-w-full bg-gray-50 p-8">
          
          <div className="mb-10 space-y-2">
            <h1 className="text-6xl font-bold flex items-center gap-2">
              Batch Evaluation Complete <img src={congo} alt="" style={{ height: "48px", width: "48px" }} />
            </h1>
            <h2 className="text-2xl text-gray-600">
              Successfully evaluated {evaluationResults.length} student{evaluationResults.length > 1 ? 's' : ''}.
            </h2>
          </div>

          <div className="max-w-full mx-auto space-y-16">
            {evaluationResults.map((evaluationData, index) => {
              const chartData = {
                labels: evaluationData.details.map(q => `Q${q.question_id}`),
                datasets: [
                  {
                    label: "Obtained Marks",
                    data: evaluationData.details.map(q => q.availed_marks),
                    backgroundColor: "rgb(191, 219, 254)",
                    barThickness: 30,
                    borderRadius: 6,
                  },
                  {
                    label: "Total Marks",
                    data: evaluationData.details.map(q => q.full_marks),
                    backgroundColor: "rgb(59, 130, 246)",
                    barThickness: 30,
                    borderRadius: 6,
                  },
                ],
              };
              
              const options = {
                scales: {
                  y: {
                    beginAtZero: true,
                    max: Math.max(...evaluationData.details.map(q => q.full_marks)) + 2,
                    ticks: {
                      stepSize: 1,
                    },
                    grid: {
                      borderDash: [5, 5],
                      color: "rgb(226, 232, 240)",
                    },
                  },
                  x: {
                    grid: {
                      borderDash: [5, 5],
                      color: "rgb(226, 232, 240)",
                    },
                  }
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                responsive: true,
                maintainAspectRatio: false,
              };

              return (
                <div key={index} className="space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
                  <div className="space-y-2 border-b pb-6">
                    <h2 className="text-4xl font-bold text-gray-800">
                      {evaluationData.student_name}
                    </h2>
                    <div className="flex gap-8 text-gray-600">
                      <div className="text-sm font-medium">Roll Number: {evaluationData.roll}</div>
                      <div className="text-sm font-medium">Paper Name: {evaluationData.paperName}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-black text-white p-6 rounded-lg">
                      <h1 className='text-2xl mb-2'>Marks Obtained</h1>
                      <div className="text-5xl font-bold mb-2">{evaluationData.obtained_marks}</div>
                      <div className="text-sm text-gray-300">Out of full marks {evaluationData.full_marks}</div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border border-[#E9E9E9]">
                      <h1 className='text-2xl mb-2 text-gray-800'>Total Attempted</h1>
                      <div className="text-5xl font-bold mb-2 text-gray-800">{evaluationData.details.length}</div>
                      <div className="text-sm text-gray-500">Total attempted questions</div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg border border-[#E9E9E9]">
                      <h1 className='text-2xl mb-2 text-gray-800'>Total Left</h1>
                      <div className="text-5xl font-bold mb-2 text-gray-800">
                        {evaluationData.not_attempted_questions ?? (evaluationData.total_questions - evaluationData.details.length)}
                      </div>
                      <div className="text-sm text-gray-500">Total questions not attempted</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Statistics</h3>
                    <div className="h-[300px]">
                      <Bar data={chartData} options={options} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Detailed Analysis</h3>
                    {evaluationData.details.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className={`p-6 rounded-lg border ${
                          !question.student_answer || question.student_answer.trim() === ''
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-lg">Question {question.question_id}</h4>
                          <div className="text-right">
                            <span className="font-bold text-xl text-blue-600">{question.availed_marks}</span>
                            <span className="text-gray-500 font-medium">/{question.full_marks}</span>
                          </div>
                        </div>
                        <p className="text-gray-800 font-medium mb-4">{question.question}</p>
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-2">Student's Answer:</h5>
                            {question.student_answer && question.student_answer.trim() !== '' ? (
                              <p className="text-gray-700 whitespace-pre-wrap">{question.student_answer}</p>
                            ) : (
                              <p className="text-red-500 italic">Not attempted — no answer was submitted for this question.</p>
                            )}
                          </div>
                          <div className="bg-white p-4 rounded border border-gray-200">
                            <h5 className="font-semibold text-gray-800 mb-2">Model Answer:</h5>
                            <p className="text-gray-700 whitespace-pre-wrap">{question.model_answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resultpage;