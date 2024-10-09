const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const testRoutes = require('./routes/testRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const { Question, Option } = require('./models');


require('dotenv').config({ path: './.env' })  

const app = express();  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const fileUpload = require("express-fileupload");
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

//cloud se connect karna
const cloudinary = require("./config/cloudinary");
cloudinary.cloudinaryConnect();

const corsOptions = {
  origin: 'http://localhost:3000',  // Replace with your frontend origin
  credentials: true  // Allow credentials (cookies) to be sent
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', userRoutes);
app.use('/api', testRoutes);
app.use('/api', attemptRoutes);
app.use('/api/teacherRoutes', teacherRoutes);


const PORT = process.env.PORT || 8000;

// sequelize.sync()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   })
//   .catch(err => {
//     console.error('Unable to connect to the database:', err);
//   });

// Sync database
(async () => {
  try {
    await sequelize.sync({ alter: true }); // Sync database with alter:true to update schema without dropping tables
    console.log('Database synced!');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
})();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

