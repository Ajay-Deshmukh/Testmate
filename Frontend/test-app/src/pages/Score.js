import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  LineElement,
  DoughnutController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import './Score.css'; // Importing the custom CSS for styling

// Registering required components for the charts
ChartJS.register(LineElement, DoughnutController, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend, Filler);

const Score = () => {
  const [graphData, setGraphData] = useState({ labels: [], scores: [] });
  const [latestTestData, setLatestTestData] = useState({
    categories: [],
    scores: [],
    correctQuestions: [],
    totalQuestions: [],
    notAttemptedQuestions: [],
    incorrectQuestions: [] // Include incorrectQuestions in the state
  });

  // Retrieve user_id and test_id from localStorage
  const userId = localStorage.getItem('user_id');
  const testId = localStorage.getItem('test_id');

  useEffect(() => {
    // Fetch attempt data for the specific test and user for the line chart
    fetch(`http://localhost:8000/api/test-attempts/${testId}/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setGraphData({
          labels: data.labels,
          scores: data.scores,
        });
      })
      .catch((error) => console.error('Error fetching test attempt data:', error));
  }, [testId, userId]);

  useEffect(() => {
    // Fetch data for the latest test analysis for the donut chart
    fetch(`http://localhost:8000/api/latest-test/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setLatestTestData({
          categories: data.categories,
          scores: data.scores,
          correctQuestions: data.correctQuestions,
          totalQuestions: data.totalQuestions,
          notAttemptedQuestions: data.notAttemptedQuestions,
          incorrectQuestions: data.incorrectQuestions, // Add incorrectQuestions to state
        });
      })
      .catch((error) => console.error('Error fetching latest test data:', error));
  }, [userId]);

  // Data for the main subject-wise doughnut chart
  const donutChartData = {
    labels: latestTestData.categories,
    datasets: [
      {
        label: 'Latest Test Scores by Subject',
        data: latestTestData.scores,
        backgroundColor: ['#6A5ACD', '#48D1CC', '#FF6347', '#FFD700', '#32CD32', '#FF4500'],
        borderColor: ['#483D8B', '#20B2AA', '#CD5C5C', '#DAA520', '#228B22', '#8B0000'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="score-container">
      <h1 className="title">Detailed Test Performance Analysis</h1>

      <div className="chart-section latest-test-doughnut">
        <h3>Latest Test Scores by Subject (Doughnut Chart)</h3>
        <div className="doughnut-chart">
          <Doughnut data={donutChartData} options={{ maintainAspectRatio: true }} />
        </div>
      </div>


      {/* Correct vs Incorrect Questions by Subject Section */}
      <div className="correct-questions-section">
        <h3 className="correct-questions-header">Correct vs Incorrect Questions by Subject</h3>
        <div className="correct-questions-cards">
          {latestTestData.categories.map((category, index) => (
            <div key={index} className="correct-question-item">
              <p>{category}</p>
              <Doughnut
                data={{
                  labels: ['Correct', 'Incorrect', 'Not Attempted'],
                  datasets: [
                    {
                      data: [
                        latestTestData.correctQuestions[index],
                        latestTestData.totalQuestions[index] - latestTestData.correctQuestions[index],
                        latestTestData.notAttemptedQuestions[index],
                      ],
                      backgroundColor: ['#32CD32', '#FF4500', '#FFA500'],
                      borderColor: ['#228B22', '#8B0000', '#FF8C00'],
                      borderWidth: 1,
                    },
                  ],
                }}
                options={{ cutout: '70%' }}
              />
            </div>
          ))}
        </div>
      </div>


      {/* Bar Chart for Strong vs Weak Areas */}
      <div className="bar-chart-section">
        <h3>Performance Comparison by Subject</h3>
        <Bar
          data={{
            labels: latestTestData.categories,
            datasets: [
              {
                label: 'Correct Answers',
                data: latestTestData.correctQuestions,
                backgroundColor: '#32CD32',
                borderColor: '#228B22',
                borderWidth: 1,
              },
              {
                label: 'Incorrect Answers',
                data: latestTestData.incorrectQuestions, // Use incorrectQuestions data
                backgroundColor: '#FF4500',
                borderColor: '#8B0000',
                borderWidth: 1,
              },
              {
                label: 'Not Attempted Questions',
                data: latestTestData.notAttemptedQuestions,
                backgroundColor: '#FFA500',
                borderColor: '#FF8C00',
                borderWidth: 1,
              },
            ],
          }}
          options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
        />
      </div>

      {/* Line Chart for Test Score Progress Over Time */}
      <div className="line-chart-section">
        <h3>Test Score Progress Over Time</h3>
        <Line
          data={{
            labels: graphData.labels,
            datasets: [
              {
                label: 'Test Scores Over Time',
                data: graphData.scores,
                fill: true,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Test Score Progress Over Time' },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Score;
