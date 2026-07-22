const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db-config");
const teacherRoutes = require("./routes/teacherRoutes");
const questionPaperRoutes = require('./routes/questionPaperRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Database connection
connectDB();

// Routes
app.use("/api/teacher", teacherRoutes);
app.use("/api/papers", questionPaperRoutes);
app.use("/api/evaluation",evaluationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
