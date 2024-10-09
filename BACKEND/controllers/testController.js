// controllers/testController.js
const { Sequelize, Op } = require('sequelize');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Option = require('../models/Option');
const TestAttempt = require('../models/TestAttempt');
const Response = require('../models/Response');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Result = require('../models/Result');
const User = require('../models/User'); // Assuming you need user data
require('dotenv').config();


// Razorpay instance (use your keys here)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new test
exports.createTest = async (req, res) => {
  console.log("Got request to create test with request body", req.body);
  try {
    const { title, description, type, created_by, chapter, subject, duration } = req.body;
    const test = await Test.create({ title, description, type, created_by, chapter, subject, duration });
    
    
    res.status(201).json({ test_id: test.id, message: 'Test created successfully' });
    console.log(test);
  } catch (error) {
    res.status(500).json({ message: 'Error creating test', error: error.message });
  }
};


// Get all tests
exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.findAll();
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tests', error: error.message });
  }
};

// Get all test types
exports.getTestTypes = async (req, res) => {
  try {
    const testTypes = await Test.findAll({
      attributes: ['type'],
      group: ['type'], 
    });
    res.status(200).json(testTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test types', error: error.message });
  }
};

// Get a single test by ID
exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findByPk(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test', error: error.message });
  }
};

// Update a test
exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, chapter, subject, duration } = req.body;
    const test = await Test.findByPk(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    test.title = title;
    test.description = description;
    test.type = type;
    test.chapter = chapter;
    test.subject = subject;
    test.duration = duration;
    await test.save();
    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ message: 'Error updating test', error: error.message });
  }
};

// Delete a test
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findByPk(id);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    await test.destroy();
    res.status(200).json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting test', error: error.message });
  }
};



// Get all test attempts for a user
exports.getTestAttemptsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const testAttempts = await TestAttempt.findAll({ where: { user_id } });
    res.status(200).json(testAttempts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test attempts', error: error.message });
  }
};

// Get a single test attempt by ID
exports.getTestAttemptById = async (req, res) => {
  try {
    const { id } = req.params;
    const testAttempt = await TestAttempt.findByPk(id);
    if (!testAttempt) {
      return res.status(404).json({ message: 'Test attempt not found' });
    }
    res.status(200).json(testAttempt);
  } catch (error) {
    res.status (500).json({ message: 'Error fetching test attempt', error: error.message });
  }
};

// Get results for a test attempt
exports.getTestAttemptResults = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const results = await Result.findAll({ where: { attempt_id } });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching test attempt results', error: error.message });
  }
};



exports.getTests = async (req, res) => {
  try {
    const { type, title, chapter, subject } = req.query;  
    // const branch = req.branch;

    const filter = {};

    if (type) {
      const validTypes = ['GATE_PYQ', 'MOCK_TEST', 'CUSTOM_TEST', 'CHAPTER_WISE', 'SUBJECT_WISE'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid test type provided' });
      }
      filter.type = type;
    }

    if (title) {
      filter.title = { [Op.like]: `%${title}%` };
    }

    if (chapter) {
      filter.chapter = { [Op.like]: `%${chapter}%` };
    }

    if (subject) {
      filter.subject = { [Op.like]: `%${subject}%` };
    }

    const tests = await Test.findAll({
      where: filter,
      
      attributes: ['id', 'title', 'description', 'chapter', 'subject', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tests', error: error.message });
  } 
};


exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, tet} = req.body;
  console.log("verifyPayment------------------------details: ",req.body)
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generated_signature = hmac.digest('hex');

  if (generated_signature === razorpay_signature) {
    // Verification success: Update user's payment status in the database   
    await User.update({ payment_status: 'completed' }, { where: { email: user_id} });     
    // Then proceed with starting the test for the user
    console.log("Payment verified")
    res.json({ success: true, message: 'Payment verified',});
  } else {
    // Payment verification failed
    res.status(400).json({ success: false, message: 'Payment verification failed' });   
  }
};





exports.startTest = async (req, res) => {
  console.log('Request body for starting test:', req.body);
  const { user_id, test_id } = req.body;

  try { 
    // Check if the test exists
    const test = await Test.findByPk(test_id);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }

    // Check payment status for the user
    const user = await User.findByPk(user_id);

    if (user.payment_status === 'completed') {
      // User has completed payment, proceed with test attempt creation

      // Create a new test attempt
      const testAttempt = await TestAttempt.create({
        user_id,
        test_id,
        started_at: new Date(),
      });
      console.log("Current test attempt ID is", testAttempt.id);

      // Get all questions for the test
      const questions = await Question.findAll({
        where: { test_id },
        include: [{ model: Option, as: 'options' }],
      });

      return res.status(200).json({
        success: true,
        message: 'Test started successfully',
        testName: test.title,
        testDuration: test.duration,
        testAttempt,
        questions,
      });
    } else {
      // If payment is pending, inform the client that payment is required
      return res.status(402).json({
        success: false,
        message: 'Payment required. Please complete the payment to start the test.',
        redirectTo: '/api/create-order',
      });
    }
  } catch (error) {
    console.error('Error starting test:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while starting the test',
    });
  }
};

exports.submitResponse = async (req, res) => {
  console.log('Request body for submitting test:', req.body);
  const { attempt_id, test_id, user_id, responses } = req.body;

  try {
   
    const testAttempt = await TestAttempt.findByPk(attempt_id);
    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found',
      });
    }
    console.log("Test attempt found");

    // Array to hold response creation promises
    const responsePromises = [];

    // Iterate over the responses object
    for (const [question_id, responseValue] of Object.entries(responses)) {
      // Determine if the response is an option (MCQ), numerical, or multiple select (MSQ)
      if (Array.isArray(responseValue)) {
        // Handle MSQ: responseValue is an array of option_ids
        for (const option_id of responseValue) {
          const responsePromise = Response.create({
            attempt_id,
            question_id: parseInt(question_id, 10), // Ensure question_id is an integer
            option_id: option_id, // Set the option_id for MSQs
            numerical_response: null, // No numerical response for MSQs
          });
          responsePromises.push(responsePromise);
        }
      } else {
        // Handle MCQ or numerical: responseValue is a single value
        const responsePromise = Response.create({
          attempt_id,
          question_id: parseInt(question_id, 10), // Ensure question_id is an integer
          option_id: isNaN(responseValue) ? null : parseInt(responseValue, 10), // Set option_id for MCQs or null for numerical
          numerical_response: isNaN(responseValue) ? parseFloat(responseValue) : null, // Set numerical response or null for MCQs
        });
        responsePromises.push(responsePromise);
      }
    }

    // Wait for all responses to be created
    const createdResponses = await Promise.all(responsePromises);

    res.status(200).json({
      success: true,
      message: 'Responses submitted successfully',
      responses: createdResponses,
    });
  } catch (error) {
    console.error('Error submitting responses:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting the responses',
    });
  }
};


exports.completeTest = async (req, res) => {
  console.log('Request body for completing test:', req.body);
  const { attempt_id } = req.body;

  try {
    // Check if the attempt exists
    const testAttempt = await TestAttempt.findByPk(attempt_id);
    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: 'Test attempt not found',
      });
    }
    console.log("Test attempt found");

    // Update the test attempt with the completion time
    testAttempt.completed_at = new Date();
    testAttempt.duration = Math.ceil((testAttempt.completed_at - testAttempt.started_at) / (1000 * 60)); 
    await testAttempt.save();

    
    const responses = await Response.findAll({
      where: { attempt_id: attempt_id },
      include: [
        {
          model: Option,
          as: 'option', 
        },
        {
          model: Question,
          as: 'question', 
        },
      ],
    });
    
    let score = 0;
    const questionResponseMap = {};

    // Group responses by question_id
    for (const response of responses) {
      if (!questionResponseMap[response.question_id]) {
        questionResponseMap[response.question_id] = [];
      }
      questionResponseMap[response.question_id].push(response);
    }

    // Calculate the score
    for (const question_id in questionResponseMap) {
      const responsesForQuestion = questionResponseMap[question_id];
      const question = await Question.findByPk(question_id);

      if (question.question_type === 'MSQ') {
        // MSQ scoring logic
        const correctOptions = await Option.findAll({
          where: { question_id, is_correct: true },
        });

        const correctOptionIds = correctOptions.map(opt => opt.id);
        const selectedOptionIds = responsesForQuestion.map(resp => resp.option_id);

        if (correctOptionIds.length === selectedOptionIds.length && correctOptionIds.every(optId => selectedOptionIds.includes(optId))) {
          score += question.marks;
        }
      } else {
        // Single correct option or numerical response scoring logic
        for (const response of responsesForQuestion) {
          if (response.option_id) {
            const option = await Option.findByPk(response.option_id);
            if (option && option.is_correct) {
              score += question.marks; 
            }
          } else if (response.numerical_response !== null) {
            
          }
        }
      }
    }
    console.log("scrore calculated ==",score)
    const result = await Result.create({
      attempt_id,
      score,
    }).catch(error => {
      console.error('Error creating result:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while creating the result',
        error,
      });
    });

    res.status(200).json({
      success: true,
      message: 'Test completed successfully',
      result,
    });
  } catch (error) {
    console.error('Error completing test:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while completing the test',
    });
  }
};



exports.getUserAttempts = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Fetching test attempts for user:", userId);

    // Step 1: Fetch all test attempts for the specified user
    const attempts = await TestAttempt.findAll({
      where: { user_id: userId },
    });

    // Step 2: For each attempt, fetch the test details and result
    const formattedAttempts = await Promise.all(attempts.map(async (attempt) => {
      // Fetch the test details using test_id
      const test = await Test.findOne({
        where: { id: attempt.test_id },
        attributes: ['title'],
      });

      // Fetch the result details using attempt_id
      const result = await Result.findOne({
        where: { attempt_id: attempt.id },
        attributes: ['score'],
      });

      return {
        id: attempt.id,
        testTitle: test ? test.title : 'Unknown Test',
        score: result ? result.score : 'N/A',
      };
    }));

    // Step 3: Send the formatted response back to the client
    res.status(200).json({ attempts: formattedAttempts });
  } catch (error) {
    console.error('Error fetching user attempts:', error);
    res.status(500).json({ message: 'Error fetching user attempts' });
  }
};



// Handler to delete a user account and related data
exports.deleteUserAccount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete the user from the database
    const userDeletion = await User.findByIdAndDelete(userId);

    if (!userDeletion) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Optionally delete all test attempts associated with the user
    await TestAttempt.deleteMany({ userId });

    res.status(200).json({ message: 'User account and related data successfully deleted' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Error deleting user account' });
  }
};








exports.createOrder = async (req, res) => {
  console.log('Request body for creating order:', req.body);
  const { user_id, test_id } = req.body;

  try {
    const shortReceipt = `${test_id}_${user_id.substring(0, 10)}`;

    // Create a Razorpay order
    const order = await razorpay.orders.create({
      amount: 100000, // Amount in paise (e.g., 50000 paise = ₹500)
      currency: 'INR',
      receipt: shortReceipt,
    });

    return res.status(200).json({
      success: true,
      message: 'Order created successfully',
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      user_id,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the order',
    });
  }
};
