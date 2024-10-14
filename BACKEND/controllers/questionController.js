const cloudinary = require('cloudinary').v2;
const Question = require('../models/Question');
const Option = require('../models/Option');
const Comment = require('../models/Comment');
const CommentLike  = require('../models/CommentLike');
const TestAttempt  = require('../models/TestAttempt');  
const User  = require('../models/User');  
const Test  = require('../models/Test');  
const Response = require('../models/Response')
const sequelize = require('../config/database'); 
require('dotenv').config();
const supportedTypes = ["image/jpeg", "image/jpg", "image/png"];


exports.getTestAnalysis = async (req, res) => {
  const { attemptId } = req.params;
  console.log("getTestAnalysis handler is triggered  ",req.body)

  try {
    
    console.log("starting controller of getTestAnalysis");
    const attempt = await TestAttempt.findByPk(attemptId, {
      include: [
        {
          model: Response,
          as: 'responses',
          include: [
            {
              model: Question,
              as: 'question',
              include: [
                {
                  model: Option,
                  as: 'options',
                },
                {
                  model: Comment,
                  as: 'comments',
                  include: [
                    {
                      model: User, 
                      as:'user', 
                      attributes: ['username'], 
                    },
                  ],
                },
              ],
            },
            {
              model: Option,  
              as: 'option',
            },
          ],
        },
        {
          model: Test,    
          as: 'test',
          attributes: ['id', 'title'],
        },
      ],
    });
    
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'No attempt found for this ID' });
    }
    // Process questions and user responses
    const formattedQuestions = attempt.responses.map((response) => {
      const question = response.question;
      const selectedOption = response.option;
      console.log("test id ---------------",attempt.test.id)
      
      return {
        testName: attempt.test.title, 
        test_id: attempt.test.id,
        questionId: question.id,
        questionLink: question.question_link,
        options: question.options.map((option) => ({  
          text: option.option_text,
          isCorrect: option.is_correct,
          isSelected: selectedOption ? selectedOption.id === option.id : false,
        })),
        solutionLink: question.solution_link,
        referenceLink: question.reference_link,
        comments: question.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          user: comment.User?.username,  
        })),
      };
    });
    
    return res.status(200).json({ success: true, questions: formattedQuestions });
  } catch (error) {
    console.error('Error fetching test analysis:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



  // Add a comment to a question
  exports.addComment = async (req, res) => {
    const { question_id, userId, content } = req.body;
    console.log("request body for add comment: ",req.body)
  
    try {
      const newComment = await Comment.create({
        question_id: question_id,
        user_id: userId,
        content:content,
      });
  
      return res.status(201).json({ success: true, comment: newComment });
    } catch (error) {
      console.error('Error adding comment:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };


 // In your questionController.js

// In your questionController.js

// Get comments for a specific question
exports.getCommentsForQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { userId } = req.body;  // Assuming the userId is passed as a query param
  console.log("requested to get commet for specofic question", req.body)
  try {
      // Fetch all comments for the question
      const comments = await Comment.findAll({
          where: { question_id: questionId },
          include: [
              {
                  model: User,
                  as: 'user', // Alias defined in associations
                  attributes: ['username'], // Fetch only the username from User model
              },  
          ],    
          attributes: {
              include: [
                  // Subquery to count likes for each comment
                  [   
                    sequelize.literal(`(
                      SELECT COUNT(*)
                      FROM CommentLikes AS likes
                      WHERE likes.comment_id = Comment.id
                    )`),
                    'likeCount'
                  ]
              ]
          },
          order: [['createdAt', 'DESC']],
      });

      // Check for each comment whether the user has liked it or not
      const commentsWithLikeStatus = await Promise.all(
        comments.map(async (comment) => {
          const likedByUser = await CommentLike.findOne({
            where: {
              comment_id: comment.id,
              user_id: userId,  // Check if the user has liked the comment
            },
          });
          
          return {
            ...comment.toJSON(),
            likedByUser: likedByUser ? true : false,  // Boolean flag based on the presence of a like
          };
        })
      );
      console.log("testing pass");
      return res.status(200).json({ success: true, comments: commentsWithLikeStatus });
  } catch (error) {
      console.error('Error fetching comments:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


  
  // Like a comment
  exports.likeComment = async (req, res) => {
    const { commentId, userId } = req.body;
    console.log("while liking comment request is ",req.body)
    try {
      const existingLike = await CommentLike.findOne({
        where: {
          comment_id: commentId,
          user_id: userId,
        },
      });
  
      if (existingLike) {
        return res.status(400).json({ success: false, message: 'You have already liked this comment' });
      }
  
      const like = await CommentLike.create({
        comment_id: commentId,
        user_id: userId,
      });
  
      return res.status(201).json({ success: true, like });
    } catch (error) {
      console.error('Error liking comment:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  async function uploadFileToCloudinary(file) {
    return await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'questions',
      resource_type: 'image'
    });
  }
  

//   exports.addQuestion = async (req, res) => {
//     console.log("request for adding question ",req.body);
//     try {
//         const { test_id, question_type, options, marks, reference_link } = req.body;
//         console.log(`test_id: ${test_id}, question_type: ${question_type}, options: ${JSON.stringify(options)}, marks: ${marks}, reference_link: ${reference_link}`);

//         if (!req.files || Object.keys(req.files).length === 0) {
//             return res.status(400).send('No files were uploaded.');
//         }

//         const file = req.files.image;
//         console.log(file);

//         // Check if the file is of a supported type
//         if (!supportedTypes.includes(file.mimetype)) {
//             return res.status(400).send('Unsupported file type. Only jpg, jpeg, and png are allowed.');
//         }

//         // Check file size
//         if (file.size > 1000 * 1024) { 
//             return res.status(400).send('File size exceeds 1000kb limit.');
//         }

//         // Upload question image to Cloudinary
//         const result = await uploadFileToCloudinary(file);
//         console.log(`Cloudinary upload result (Question Image): ${JSON.stringify(result)}`);

//         // Upload solution image if provided
//         let solutionLink = null;
//         if (req.files.solution) {
//             const solutionFile = req.files.solution;

//             // Check if the solution file is of a supported type
//             if (!supportedTypes.includes(solutionFile.mimetype)) {
//                 return res.status(400).send('Unsupported solution file type. Only jpg, jpeg, and png are allowed.');
//             }

//             // Check solution file size
//             if (solutionFile.size > 1000 * 1024) {
//                 return res.status(400).send('Solution file size exceeds 1000kb limit.');
//             }

//             // Upload solution image to Cloudinary
//             const solutionResult = await uploadFileToCloudinary(solutionFile);
//             console.log(`Cloudinary upload result (Solution Image): ${JSON.stringify(solutionResult)}`);
//             solutionLink = solutionResult.secure_url;
//         }

//         // Create the question
//         const question = await Question.create({
//             test_id,
//             question_link: result.secure_url,
//             question_type,
//             marks: marks || 1,
//             solution_link: solutionLink, // Store the solution link
//             reference_link // Store the reference link if provided
//         });
//         console.log(`Question created: ${JSON.stringify(question)}`);

//         // Handle options for MSQ and MCQ
//         if ((question_type === 'MSQ' || question_type === 'MCQ') && options) {
//             let parsedOptions;
//             try {
//                 parsedOptions = JSON.parse(options);
//             } catch (error) {
//                 return res.status(400).send('Options must be a valid JSON array.');
//             }

//             if (Array.isArray(parsedOptions)) {
//                 for (const option of parsedOptions) {
//                     console.log(`Creating option: ${JSON.stringify(option)}`);
//                     await Option.create({
//                         question_id: question.id,
//                         option_text: option.option_text,
//                         is_correct: option.is_correct
//                     });
//                 }
//                 console.log("Options created successfully");
//             } else {
//                 return res.status(400).send('Options must be an array.');
//             }
//         } else if (question_type === 'MSQ' || question_type === 'MCQ') {
//             return res.status(400).send('Options are required for MSQ and MCQ question types.');
//         }

//         // Send success response
//         res.status(201).json({
//             success: true,
//             data: question,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: 'Server error',
//             error: error.message
//         });
//     }
// };




exports.addQuestion = async (req, res) => {
  console.log("request for adding question ", req.body);
  try {
      const { test_id, question_type, marks, reference_link } = req.body;
      console.log(`test_id: ${test_id}, question_type: ${question_type}, marks: ${marks}, reference_link: ${reference_link}`);

      if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).send('No files were uploaded.');
      }

      const file = req.files.image;
      console.log(file);

      
      const supportedTypes = ['image/jpeg', 'image/png', 'image/jpg']; 
      if (!supportedTypes.includes(file.mimetype)) {
          return res.status(400).send('Unsupported file type. Only jpg, jpeg, and png are allowed.');
      }

      
      if (file.size > 1000 * 1024) {
          return res.status(400).send('File size exceeds 1000kb limit.');
      }

     
      const result = await uploadFileToCloudinary(file);
      console.log(`Cloudinary upload result (Question Image): ${JSON.stringify(result)}`);

      
      let solutionLink = null;
      if (req.files.solution) {
          const solutionFile = req.files.solution;

          
          if (!supportedTypes.includes(solutionFile.mimetype)) {
              return res.status(400).send('Unsupported solution file type. Only jpg, jpeg, and png are allowed.');
          }

          
          if (solutionFile.size > 1000 * 1024) {
              return res.status(400).send('Solution file size exceeds 1000kb limit.');
          }

          
          const solutionResult = await uploadFileToCloudinary(solutionFile);
          console.log(`Cloudinary upload result (Solution Image): ${JSON.stringify(solutionResult)}`);
          solutionLink = solutionResult.secure_url;
      }

      // Create the question
      const question = await Question.create({
          test_id,
          question_link: result.secure_url,
          question_type,
          marks: marks || 1,
          solution_link: solutionLink, 
          reference_link 
      });
      console.log(`Question created: ${JSON.stringify(question)}`);

      // Reconstruct the options from the request body
      let options = [];
      for (let i = 0; i < Object.keys(req.body).length; i++) {
          if (req.body[`options[${i}][option_text]`] && req.body[`options[${i}][is_correct]`] !== undefined) {
              options.push({
                  option_text: req.body[`options[${i}][option_text]`],
                  is_correct: req.body[`options[${i}][is_correct]`] === 'true', // Ensure the correct type
              });
          } else {
              break; // Exit loop if there are no more options
          }
      }

      // Handle options for MSQ and MCQ
      if ((question_type === 'MSQ' || question_type === 'MCQ') && options.length > 0) {
          for (const option of options) {
              console.log(`Creating option: ${JSON.stringify(option)}`);
              await Option.create({
                  question_id: question.id,
                  option_text: option.option_text,
                  is_correct: option.is_correct
              });
          }
          console.log("Options created successfully");
      } else if (question_type === 'MSQ' || question_type === 'MCQ') {
          return res.status(400).send('Options are required for MSQ and MCQ question types.');
      }

      // Send success response
      res.status(201).json({
          success: true,
          data: question,
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          success: false,
          message: 'Server error',
          error: error.message
      });
  }
};


exports.updateQuestion = async (req, res) => {
  try {
      const { question_id } = req.body;
      const { reference_link, marks } = req.body;

      // Find the question by ID
      const question = await Question.findByPk(question_id);
      if (!question) {
          return res.status(404).json({
              success: false,
              message: 'Question not found',
          });
      }

      // Check if a solution image is provided in the request
      let solutionLink = question.solution_link; 
      if (req.files && req.files.solution) {
          const solutionFile = req.files.solution;

          // Validate solution file type
          if (!supportedTypes.includes(solutionFile.mimetype)) {
              return res.status(400).send('Unsupported solution file type. Only jpg, jpeg, and png are allowed.');
          }

          // Validate solution file size
          if (solutionFile.size > 1000 * 1024) {
              return res.status(400).send('Solution file size exceeds 1000kb limit.');
          }

          // Upload the new solution image to Cloudinary
          const solutionResult = await uploadFileToCloudinary(solutionFile);
          console.log(`Cloudinary upload result (Solution Image): ${JSON.stringify(solutionResult)}`);
          solutionLink = solutionResult.secure_url; // Update solution link
      }

      // Update the question with new solution link and reference link
      question.solution_link = solutionLink;
      question.reference_link = reference_link || question.reference_link; 
      question.marks = marks || question.marks; 

      // Save the updated question
      await question.save();

      res.status(200).json({
          success: true,
          data: question,
          message: 'Question updated successfully',
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          success: false,
          message: 'Server error',
          error: error.message,
      });
  }
};
