import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TestAnalysisPage.css';

const TestAnalysis = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userId, setUserId] = useState(localStorage.getItem('user_id'));

  useEffect(() => {
    const fetchTestAnalysis = async () => {
      const response = await fetch(`http://localhost:8000/api/test-analysis/${attemptId}`);
      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions);
        if (data.questions.length > 0) {
          localStorage.setItem('test_id', data.questions[0].test_id);
          console.log("locally stored test_id is :",localStorage.getItem('user_id'));
          fetchComments(data.questions[0].questionId);
        }
      }
    };
    fetchTestAnalysis();
  }, [attemptId]);

  const fetchComments = async (questionId) => {
    const response = await fetch(`http://localhost:8000/api/questions/${questionId}/getcomments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();
    if (data.success) {
      setComments(data.comments);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    const response = await fetch(`http://localhost:8000/api/questions/${questions[currentQuestionIndex].questionId}/addcomments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newComment,
        question_id: questions[currentQuestionIndex].questionId,
        userId,
      }),
    });

    const data = await response.json();
    if (data.success) {
      setComments([data.comment, ...comments]);
      setNewComment(''); // Clear input field
    } else {
      console.error('Error adding comment:', data.message);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, likeCount: comment.likeCount + 1, likedByUser: true }
            : comment
        )
      );

      const response = await fetch('http://localhost:8000/api/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, userId }),
      });

      const data = await response.json();
      if (!data.success) {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === commentId
              ? { ...comment, likeCount: comment.likeCount - 1, likedByUser: false }
              : comment
          )
        );
        console.error('Error liking comment:', data.message);
      }
    } catch (error) {
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? { ...comment, likeCount: comment.likeCount - 1, likedByUser: false }
            : comment
        )
      );
      console.error('Error liking comment:', error);
    }
  };

  const handleNextQuestion = () => {
    const nextIndex = Math.min(currentQuestionIndex + 1, questions.length - 1);
    setCurrentQuestionIndex(nextIndex);
    fetchComments(questions[nextIndex].questionId);
  };

  const handlePreviousQuestion = () => {
    const prevIndex = Math.max(currentQuestionIndex - 1, 0);
    setCurrentQuestionIndex(prevIndex);
    fetchComments(questions[prevIndex].questionId);
  };

  const handleEndAnalysis = () => {
    
      navigate('/score');

  };

  return (
    <div className="test-analysis">
      <div className="question-container">
        {questions.length > 0 && (
          <div className="question-card">
            {/* Navigation buttons directly above the test name */}
            <div className="navigation-buttons">
              <button onClick={handlePreviousQuestion} className="testnavigation-button">Previous</button>
              <button onClick={handleNextQuestion} className="testnavigation-button">Next</button>
            </div>

            <h2>{questions[currentQuestionIndex].testName}</h2>

            <img
              src={questions[currentQuestionIndex].questionLink}
              alt={`Question ${currentQuestionIndex + 1}`}
              className="question-image"
            />
            <div className="options-container">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <div
                  key={index}
                  className={`option ${option.isCorrect ? 'correct' : option.isSelected ? 'selected' : ''}`}
                >
                  {option.text}
                </div>
              ))}
            </div>
            <img
              src={questions[currentQuestionIndex].solutionLink}
              alt="Solution"
              className="solution-image"
            />
            <a href={questions[currentQuestionIndex].referenceLink} target="_blank" rel="noopener noreferrer">
              Reference Link
            </a>

            {/* Comments Section */}
            <div className="comments-section">
              <h3>Comments</h3>
              {/* Add comment input at the beginning */}
              <div className="add-comment">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                ></textarea>
                <button onClick={handleAddComment}>Post Comment</button>
              </div>
              <div className="comments-list">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div key={index} className="comment">
                      <p>
                        <strong>{comment.user_id}:</strong> {comment.content}
                      </p>
                      <div className="comment-actions">
                        <span>{comment.likeCount}</span>
                        <button
                          className={`like-button ${comment.likedByUser ? 'liked' : ''}`}
                          disabled={comment.likedByUser === true}
                          onClick={() => handleLikeComment(comment.id)}
                        >
                          {comment.likedByUser ? 'Liked' : 'Like'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="test-sidebar">
        {questions.map((question, index) => (
          <div
            key={index}
            className={`sidebar-item ${currentQuestionIndex === index ? 'active' : ''}`}
            onClick={() => {
              setCurrentQuestionIndex(index);
              fetchComments(question.id);
            }}
          >
            {index + 1}
          </div>
        ))}
        <button onClick={handleEndAnalysis} className="done-button">Done</button>
      </div>
    </div>
  );
};

export default TestAnalysis;
