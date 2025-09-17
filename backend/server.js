require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const axios = require("axios");
const deepEmailValidator = require("deep-email-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const PDFDocument = require('pdfkit');




// Load environment variables
const {
  PORT = 4000,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN = "1d",
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  BASE_URL,
  EMAIL_VERIFICATION_TOKEN_EXPIRY = 24,
  PASSWORD_RESET_TOKEN_EXPIRY = 1,
  ABSTRACT_API_KEY,
  OPENWEATHER_API_KEY,
  API_KEY,
} = process.env;



const app = express();


app.use(cors({
  origin: "https://neuralift-x-lfrc.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// This helps with preflight requests too.



app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

// Serve uploads directory
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// Blocked emails and utility functions
const blockedEmailsOrPatterns = [
  "abc@gmail.com",
  /^test[0-9]*@gmail\.com$/,
  /^demo@/,
  /^fake@/,
];
function matchesBlockedEmail(email) {
  if (!email) return false;
  email = email.toLowerCase();
  return blockedEmailsOrPatterns.some(p =>
    typeof p === "string" ? email === p : p.test(email)
  );
}

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(e => {
    console.error("DB connect error:", e);
    process.exit(1);
  });

// User schema and model
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true, lowercase: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty", "alumni", "admin"], default: "student" },
  roleIdValue: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profilePicUrl: { type: String, default: "" },
    // Added field for profile pic
    // In userSchema
  coins: { type: Number, default: 0 },

}, { timestamps: true });

userSchema.methods.generateJWT = function () {
  return jwt.sign({ id: this._id, email: this.email, role: this.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const User = mongoose.model("User", userSchema);

// 1. Extend announcement schema to support text/survey and visibility
const announcementSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  date: String,
  time: String,
  refNumber: String,
  contentType: { type: String, enum: ['text', 'survey'], default: 'text' },
  message: String,
  surveyQuestions: [{
    question: String,
    inputType: { type: String, enum: ['text', 'radio', 'checkbox', 'select'], default: 'text' },
    options: [String],
  }],
  visibleTo: {
    students: { type: Boolean, default: false },
    faculty: { type: Boolean, default: false },
    alumni: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});
const Announcement = mongoose.model("Announcement", announcementSchema);


// 2. Feedback schema
const feedbackSchema = new mongoose.Schema({
  announcementId: { type: mongoose.Schema.Types.ObjectId, ref: "Announcement" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  responses: mongoose.Schema.Types.Mixed,
  submittedAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model("Feedback", feedbackSchema);

// Course schema
const courseSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: String,
  classCount: Number,
  attendancePercent: Number,
}, { timestamps: true });

const Course = mongoose.model("Course", courseSchema);

// Mentor schema
const mentorSchema = new mongoose.Schema({
  name: String,
  email: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Mentor = mongoose.model("Mentor", mentorSchema);

const assignmentSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: String,
  fileUrl: String,
  originalName: String,
  createdAt: { type: Date, default: Date.now },
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

const quizQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  referencePage: Number,  // for suggestions, optional
  topic: String,          // for suggestions, optional
  highlightText: String,  //
});

const quizSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
  questions: [quizQuestionSchema],
});

const Quiz = mongoose.model("Quiz", quizSchema);

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
  answers: mongoose.Schema.Types.Mixed, // Map of question index to answer
  score: Number,
  coinsEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});


const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

// THEME SETTINGS SCHEMA & MODEL (add directly in your server file)
const themeSettingsSchema = new mongoose.Schema({
  globalTheme: { type: String, default: "default" } // "default", "dark", "blue"
});
const ThemeSettings = mongoose.model("ThemeSettings", themeSettingsSchema);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT) || 587,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// Task Model
const TaskSchema = new mongoose.Schema({
  originalName: String,
  fileUrl: String, // path to file if saved in 'uploads' folder,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

const Task = mongoose.model("Task", TaskSchema);

const studentAnswerSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: String,
  fileUrl: String,
  uploadedAt: { type: Date, default: Date.now }
});

const StudentAnswer = mongoose.model('StudentAnswer', studentAnswerSchema);

const answerVerificationSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score: Number,
  report: String, // JSON or text explanation from Perplexity
  documentUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const AnswerVerification = mongoose.model("AnswerVerification", answerVerificationSchema);





// Syllabus Content schema and model
const syllabusContentSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  unit: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const SyllabusContent = mongoose.model("SyllabusContent", syllabusContentSchema);

// Disposable email checks (using AbstractAPI and deep-email-validator)
const isDisposableEmail = async (email) => {
  try {
    const res = await axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`);
    return res.data.is_disposable_email?.value === true;
  } catch (err) {
    console.error("Disposable Email API error:", err.message);
    return true; // fail closed
  }
};

const validateEmailExistence = async (email) => {
  try {
    return await deepEmailValidator.validate({ email });
  } catch {
    return { valid: false, reason: "smtp_check_failed" };
  }
};

// Send verification email
const sendVerificationEmail = async (user, token) => {
  const link = `${BASE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"NeuraliftX" <${EMAIL_USER}>`,
    to: user.email,
    subject: "Email Verification - NeuraliftX",
    html: `<p>Click to verify your email (valid for ${EMAIL_VERIFICATION_TOKEN_EXPIRY} hours): <a href="${link}">${link}</a></p>`,
  });
};

// Send password reset email
const sendPasswordResetEmail = async (user, token) => {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"NeuraliftX" <${EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset - NeuraliftX",
    html: `<p>Click to reset your password (valid for ${PASSWORD_RESET_TOKEN_EXPIRY} hour): <a href="${link}">${link}</a></p>`,
  });
};

// Role labels
const roleIdFieldLabels = {
  student: "University ID",
  faculty: "Faculty ID",
  alumni: "Alumni ID",
  admin: "Admin Email",
};

// Validate signup input
const validateSignupInput = async (data) => {
  const errors = {};
  if (!data.firstName?.trim()) errors.firstName = "First name is required";
  if (!data.lastName?.trim()) errors.lastName = "Last name is required";

  if (matchesBlockedEmail(data.email)) {
    errors.email = "This email address is blocked. Please use a different email.";
    return errors;
  }

  if (!data.email?.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Invalid email format";
  else if (await isDisposableEmail(data.email)) errors.email = "Disposable or temporary emails are not allowed";

 // Place this right after you check for format/disposable emails, before password checks

const bigFreeProviders = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "live.com"
];
const emailDomain = data.email.split("@")[1].toLowerCase();
let existenceCheck = { valid: true };

// Only check SMTP for small/enterprise domains, NOT for common big free email providers
if (!bigFreeProviders.includes(emailDomain)) {
  existenceCheck = await validateEmailExistence(data.email);
}
if (!existenceCheck.valid) {
  errors.email = "This email does not exist or cannot receive mail.";
}

  if (!data.password) errors.password = "Password is required and must meet complexity requirements";
  else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(data.password))
    errors.password = "Password must have uppercase, lowercase, number and special char, min 8 chars";

  if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords do not match";

  if (!data.role) errors.role = "Role is required";

  const roleLabel = roleIdFieldLabels[data.role];
  if (!data.roleIdValue?.trim()) errors.roleIdValue = `${roleLabel || "Role ID"} is required`;

  if (data.role === "admin" && data.roleIdValue?.toLowerCase() !== data.email?.toLowerCase())
    errors.roleIdValue = "Admin Email must match Email";

  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) errors.email = "Email already registered";

  return errors;
};



// Middleware: Authenticate JWT token and attach user to req.user
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: "Authorization header missing" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "Token missing" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ success: false, error: "Invalid token user" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

// Middleware: Check if user role is authorized
const authorizeRole = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: "Access forbidden: insufficient permissions" });
  }
  next();
};


const answerDir = path.join(uploadDir, "student_answers");
if (!fs.existsSync(answerDir)) fs.mkdirSync(answerDir, { recursive: true });

const answerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, answerDir),
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}-${req.params.taskId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadAnswer = multer({ storage: answerStorage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// API Routes



app.post(
  "/api/syllabus-content",
  authenticateJWT,
  upload.single("pdf"), // Your existing multer middleware
  async (req, res) => {
    try {
      const { subject, unit } = req.body;
      if (!subject || !unit) {
        return res.status(400).json({ message: "Subject and unit are required" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No PDF uploaded" });
      }
      // Save metadata with file path
      const filePath = `/uploads/${req.file.filename}`;
      const newContent = new SyllabusContent({
        subject,
        unit,
        filePath,
        uploadedBy: req.user.id,
      });
      await newContent.save();
      res.json({ message: "Syllabus content uploaded successfully", content: newContent });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);


app.post('/api/student-answers/:taskId', authenticateJWT, uploadAnswer.single('answerFile'), async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ error: "Students only" });

  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Remove any existing answer for this student and task
    await StudentAnswer.deleteMany({ studentId: req.user._id, taskId: req.params.taskId });

    const answer = await StudentAnswer.create({
      taskId: req.params.taskId,
      studentId: req.user._id,
      fileName: file.originalname,
      fileUrl: `/uploads/student_answers/${file.filename}`,
      uploadedAt: new Date()
    });

    res.json(answer);

  } catch (err) {
    console.error("Student answer upload error:", err);
    res.status(500).json({ error: "Answer upload failed" });
  }
});


app.get('/api/student-answers/:taskId', authenticateJWT, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ error: "Students only" });

  try {
    const answer = await StudentAnswer.findOne({ studentId: req.user._id, taskId: req.params.taskId });
    if (!answer) return res.status(404).json({ error: "No answer submitted yet" });
    res.json(answer);

  } catch (err) {
    console.error("Fetching student answer error:", err);
    res.status(500).json({ error: "Failed to fetch answer" });
  }
});


app.get('/api/faculty-answers/:taskId', authenticateJWT, async (req, res) => {
  if (req.user.role !== "faculty") return res.status(403).json({ error: "Faculty only" });

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Not authorized to view this task's answers" });

    const answers = await StudentAnswer.find({ taskId: req.params.taskId })
      .populate('studentId', 'firstName lastName roleIdValue email');

    // Get verification results
    const verificationReports = await AnswerVerification.find({ taskId: req.params.taskId });

    // Map by studentId for quick lookup
    const verificationMap = {};
    verificationReports.forEach(v => {
      verificationMap[v.studentId.toString()] = v;
    });

    const formatted = answers.map(ans => {
      const verification = verificationMap[ans.studentId?._id?.toString()];
      return {
        id: ans._id,
        fileName: ans.fileName,
        fileUrl: ans.fileUrl,
        uploadedAt: ans.uploadedAt,
        studentName: ans.studentId ? `${ans.studentId.firstName} ${ans.studentId.lastName}` : "",
        studentUID: ans.studentId ? ans.studentId.roleIdValue : "",
        studentEmail: ans.studentId ? ans.studentId.email : "",
        verificationScore: verification?.score || null,
        verificationReport: verification?.report || null,
        verificationDate: verification?.createdAt || null,
        verificationReportUrl: verification?.documentUrl || null,

      };
    });

    res.json(formatted);

  } catch (err) {
    console.error("Fetching faculty answers error:", err);
    res.status(500).json({ error: "Failed to fetch student answers" });
  }
});



// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role, roleIdValue } = req.body;

    const errors = await validateSignupInput({ firstName, lastName, email, password, confirmPassword, role, roleIdValue });
    if (Object.keys(errors).length > 0) return res.status(400).json({ success: false, error: Object.values(errors).join(", ") });

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + Number(EMAIL_VERIFICATION_TOKEN_EXPIRY));

    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase(),
      passwordHash,
      role,
      roleIdValue,
      emailVerified: false,
      verificationToken,
      verificationTokenExpires,
    });
    await user.save();

    await sendVerificationEmail(user, verificationToken);

    res.json({ success: true, message: "Signup successful. Please verify your email with the link sent to your inbox." });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Email verification
app.get("/api/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ success: false, error: "Verification token missing" });

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ success: false, error: "Invalid or expired token" });

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    // Respond with JSON, as requested
    res.json({ success: true, message: "Email verified. You can now log in." });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});


// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ success: false, error: "Invalid credentials" });

    if (!user.emailVerified) return res.status(403).json({ success: false, error: "Please verify your email before login" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ success: false, error: "Invalid credentials" });

    const token = user.generateJWT();
    res.json({ success: true, message: "Login successful", token, user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName } });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Forgot password
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ success: false, error: "Email not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setHours(resetPasswordExpires.getHours() + Number(PASSWORD_RESET_TOKEN_EXPIRY));

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    await sendPasswordResetEmail(user, resetToken);
    res.json({ success: true, message: "Password reset link sent to your email" });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Reset password
app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token) return res.status(400).json({ success: false, error: "Token required" });
    if (!newPassword || !confirmPassword) return res.status(400).json({ success: false, error: "New password required" });
    if (newPassword !== confirmPassword) return res.status(400).json({ success: false, error: "Passwords do not match" });
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(newPassword)) return res.status(400).json({ success: false, error: "Password must have min 8 chars with uppercase, lowercase, number, special char" });

    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, error: "Invalid or expired token" });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Get user profile info
app.get("/api/profile", authenticateJWT, (req, res) => {
  if (!req.user) return res.status(404).json({ success: false, error: "User not found" });
  res.json({
    success: true,
    user: {
      id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
      roleIdValue: req.user.roleIdValue,
      coins: req.user.coins || 0,
      profilePicUrl: req.user.profilePicUrl || "",
    },
  });
});

// Profile picture upload
app.post("/api/profile/picture", authenticateJWT, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

    req.user.profilePicUrl = `/uploads/${req.file.filename}`;
    await req.user.save();

    res.json({ success: true, profilePicUrl: req.user.profilePicUrl });
  } catch (err) {
    console.error("Profile picture upload error:", err);
    res.status(500).json({ success: false, error: "Failed to upload profile picture" });
  }
});

// Weather API
app.get("/api/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ success: false, error: "Latitude and longitude required" });

    const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`);
    const weatherData = weatherRes.data;

    res.json({
      temperature: weatherData.main.temp,
      description: weatherData.weather[0].description,
    });
  } catch (err) {
    console.error("Weather API error:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch weather" });
  }
});
app.post("/api/generate-quiz", authenticateJWT, async (req, res) => {
  try {
    const { assignmentId } = req.body;
    if (!assignmentId) return res.status(400).json({ error: "assignmentId is required" });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const pdfPath = path.join(__dirname, "uploads", assignment.filename);
    console.log("PDF Path:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Assignment PDF file missing" });
    }

    // Read file buffer
    const dataBuffer = fs.readFileSync(pdfPath);

    // Extract text from PDF
    const pdfData = await pdfParse(dataBuffer);
    console.log("Extracted PDF Text Preview:", pdfData.text.substring(0, 500));
    const textContent = pdfData.text;

    if (!textContent || textContent.trim().length === 0) {
      return res.status(500).json({ error: "Failed to extract text from PDF" });
    }

    // Updated prompt to include highlightText field in output
    const prompt = `
Generate a quiz of 10 multiple choice questions with options and answers based on the following text from an academic assignment:
${textContent}

For each question, also provide:
- referencePage (optional)
- topic (optional)
- highlightText: a phrase or keyword from the PDF to help with highlighting the related section.

Output the result as a JSON array. Each object must have fields: question, options (array), answer, referencePage, topic, highlightText.
`;

    // Call Perplexity API
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar",
        messages: [
          { role: "system", content: "You are an AI assistant that generates quizzes based on academic assignments." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let content = response.data?.choices?.[0]?.message?.content;
    if (!content) return res.status(500).json({ error: "No content received from Perplexity API" });

    // Remove markdown code fences if present
    content = content.replace(/``````/g, '').trim();

    // Parse JSON
    let questions;
    try {
      questions = JSON.parse(content);
    } catch (parseErr) {
      console.error("Failed to parse quiz JSON after cleaning:", content);
      return res.status(500).json({ error: "Failed to parse quiz JSON" });
    }

    // Save or update quiz in DB
    const quiz = await Quiz.findOneAndUpdate(
      { assignmentId },
      { questions },
      { upsert: true, new: true }
    );

    // Remove answers before sending to frontend
    const quizWithoutAnswers = quiz.questions.map(({ question, options, referencePage, topic, highlightText }) => ({
      question,
      options,
      referencePage,
      topic,
      highlightText,
    }));

    res.json({ quiz: quizWithoutAnswers });
  } catch (err) {
    console.error("Generate quiz error:", err?.response?.data || err.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/api/submit-quiz", authenticateJWT, async (req, res) => {
  try {
    const { assignmentId, answers } = req.body;
    if (!assignmentId || !answers) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const userId = req.user._id;

    // Check attempts today for this assignment by this user
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const attemptsTodayCount = await QuizAttempt.countDocuments({
      userId,
      assignmentId,
      createdAt: { $gte: todayStart }
    });

    if (attemptsTodayCount >= 5) {
      return res.status(403).json({ error: "Maximum 5 attempts per day allowed for this assignment." });
    }

    const quiz = await Quiz.findOne({ assignmentId });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const assignment = await Assignment.findById(assignmentId);
    const pdfUrl = assignment ? assignment.fileUrl : "";

    let score = 0;
    const correctAnswers = [];
    const wrongQuestions = [];
    const suggestions = [];
    let allCorrect = true;

    quiz.questions.forEach((q, i) => {
      correctAnswers[i] = q.answer;
      if (answers[i] && answers[i] === q.answer) {
        score++;
      } else {
        allCorrect = false;
        wrongQuestions.push(i);
        suggestions[i] = {
          pdfUrl,
          page: q.referencePage || 1,
          topic: q.topic || "Refer to assignment materials",
          highlightText: q.highlightText || "",
        };
      }
    });

    // Award coins = 5 only if all correct
    let coinsAwarded = 0;
    if (allCorrect) {
      coinsAwarded = 5;
      // Update user coins
      await User.findByIdAndUpdate(userId, { $inc: { coins: coinsAwarded } });
    }

    // Save quiz attempt
    await QuizAttempt.create({
      userId,
      assignmentId,
      answers,
      score,
      coinsEarned: coinsAwarded,  // store coins earned in attempt
    });

    res.json({
      score,
      correctAnswers,
      wrongQuestions,
      suggestions,
      coinsAwarded,
      totalCoins: (req.user.coins || 0) + coinsAwarded,
    });

  } catch (err) {
    console.error("Submit quiz error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use('/pdf-viewer', express.static(path.join(__dirname, 'pdf-viewer')));
app.use('/uploads/verification_reports', express.static(path.join(__dirname, 'uploads', 'verification_reports')));


// Example endpoint to fetch Coursera categories or courses
app.get("/api/coursera-courses", async (req, res) => {
  try {
    const response = await axios.get("https://api.coursera.org/api/courses.v1", {
      params: {
        includes: "partnerIds,categories",
        limit: 20,
      },
    });

    const courses = response.data.elements.map(course => ({
      id: course.id,
      name: course.name,
      description: course.description || "",
      photoUrl: course.photoUrl || "https://via.placeholder.com/120x80?text=No+Image",
      slug: course.slug,
      courseUrl: `https://www.coursera.org/learn/${course.slug}`,
    }));

    res.json({ courses });
  } catch (error) {
    console.error("Coursera fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch Coursera courses" });
  }
});

// Get announcements
app.get("/api/announcements", authenticateJWT, async (req, res) => {
  try {
    const allAnnouncements = await Announcement.find().sort({ createdAt: -1 });
    res.json(allAnnouncements);
  } catch (err) {
    console.error("Get announcements error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch announcements" });
  }
});

// Create announcement (faculty, alumni, admin only)
app.post("/api/announcements", authenticateJWT, authorizeRole(["faculty", "alumni", "admin"]), async (req, res) => {
  try {
    const { title, date, time, refNumber, details } = req.body;
    const announcement = new Announcement({
      createdBy: req.user._id,
      title,
      date,
      time,
      refNumber,
      details,
    });
    await announcement.save();
    res.json({ success: true, message: "Announcement created", announcement });
  } catch (err) {
    console.error("Create announcement error:", err);
    res.status(500).json({ success: false, error: "Failed to create announcement" });
  }
});

// 3. Admin routes
app.post("/api/admin/announcements", authenticateJWT, authorizeRole(["admin"]), async (req, res) => {
  try {
    const { title, date, time, refNumber, contentType, message, surveyQuestions, visibleTo } = req.body;
    const announcement = new Announcement({
      createdBy: req.user._id,
      title, date, time, refNumber, contentType, message, surveyQuestions, visibleTo
    });
    await announcement.save();
    res.json({ success: true, announcement });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "Failed to create announcement" });
  }
});

// Ensure this is after your multer and authenticateJWT middleware setup

app.post(
  "/api/tasks",
  authenticateJWT,            // verify the user's token, set req.user
  upload.single("pdf"),       // multer middleware to handle single file upload 'pdf'
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No PDF uploaded" });
      }

      // Create Task document in MongoDB
      const task = await Task.create({
        originalName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        uploadedBy: req.user._id,   // req.user is set by authenticateJWT
        uploadedAt: new Date(),
      });

      res.json({ success: true, message: "Task uploaded successfully", task });
    } catch (err) {
      console.error("Task upload failed:", err);
      res.status(500).json({ error: "Task upload failed" });
    }
  }
);
app.get("/api/tasks", authenticateJWT, async (req, res) => {
  try {
    // Return ALL tasks (visible to students)
    const tasks = await Task.find().sort({ uploadedAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Failed to get tasks" });
  }
});
app.get('/api/faculty-answers/:taskId', authenticateJWT, async (req, res) => {
  if (req.user.role !== "faculty") return res.status(403).json({ error: "Faculty only" });

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.uploadedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ error: "Not authorized" });

    const answers = await StudentAnswer.find({ taskId: req.params.taskId })
      .populate('studentId', 'firstName lastName roleIdValue email');

    const verificationReports = await AnswerVerification.find({ taskId: req.params.taskId });
    const verificationMap = {};
    verificationReports.forEach(v => {
      verificationMap[v.studentId.toString()] = v;
    });

    const formatted = answers.map(ans => {
      const v = verificationMap[ans.studentId?._id?.toString()] || {};
      return {
        id: ans._id,
        fileName: ans.fileName,
        fileUrl: ans.fileUrl,
        uploadedAt: ans.uploadedAt,
        studentName: ans.studentId ? `${ans.studentId.firstName} ${ans.studentId.lastName}` : "",
        studentUID: ans.studentId ? ans.studentId.roleIdValue : "",
        studentEmail: ans.studentId ? ans.studentId.email : "",
        verificationScore: v.score || null,
        verificationReport: v.report || null,
        verificationDate: v.createdAt || null,
        verificationReportUrl: v.documentUrl || null, // Send URL of PDF report
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Fetching faculty answers error:', err);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});




app.delete("/api/tasks/:id", authenticateJWT, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this task" });
    }

    // Delete the file from server
    const filePath = path.join(__dirname, "uploads", path.basename(task.fileUrl));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Task.deleteOne({ _id: task._id });
    res.json({ success: true });
  } catch (e) {
    console.error("Delete task error:", e);
    res.status(500).json({ error: "Failed to delete task" });
  }
});



// Get current global theme (accessible to all users, no auth required)
app.get("/api/theme", async (req, res) => {
  try {
    let settings = await ThemeSettings.findOne({});
    res.json({ theme: settings?.globalTheme || "default" });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch theme" });
  }
});

// Set global theme (admin only)
app.post("/api/admin/theme", authenticateJWT, authorizeRole(["admin"]), async (req, res) => {
  try {
    const { theme } = req.body;
    if (!["default", "dark", "blue"].includes(theme))
      return res.status(400).json({ error: "Invalid theme" });
    let settings = await ThemeSettings.findOne({});
    if (!settings) settings = new ThemeSettings();
    settings.globalTheme = theme;
    await settings.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to update theme" });
  }
});


app.get("/api/admin/announcements", authenticateJWT, authorizeRole(["admin"]), async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch announcements" });
  }
});

app.delete("/api/admin/announcements/:id", authenticateJWT, authorizeRole(["admin"]), async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ error: "Not found" });
    await Announcement.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

// 4. Feedback submission
app.post("/api/feedback", authenticateJWT, async (req, res) => {
  try {
    const { announcementId, responses } = req.body;
    if (!announcementId || !responses) return res.status(400).json({ error: "Missing data" });

    const existing = await Feedback.findOne({ announcementId, userId: req.user._id });
    if (existing) {
      existing.responses = responses;
      existing.submittedAt = new Date();
      await existing.save();
      return res.json({ success: true, message: "Feedback updated" });
    }

    const feedback = new Feedback({ announcementId, userId: req.user._id, responses });
    await feedback.save();
    res.json({ success: true, message: "Feedback submitted" });
  } catch (e) {
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});
app.get("/api/announcements/active", authenticateJWT, async (req, res) => {
  try {
    const role = req.user.role;

    // Build filter for any matching role visibility
    const roleFilters = [];

    if (role === "student") roleFilters.push({ "visibleTo.students": true });
    if (role === "faculty") roleFilters.push({ "visibleTo.faculty": true });
    if (role === "alumni") roleFilters.push({ "visibleTo.alumni": true });

    if (!roleFilters.length) return res.json([]);

    const announcements = await Announcement.find({
      $or: roleFilters
    }).sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// Get courses
app.get("/api/courses", authenticateJWT, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    const studentName = req.user.firstName + " " + req.user.lastName;
    res.json({ studentName, list: courses });
  } catch (err) {
    console.error("Get courses error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch courses" });
  }
});
// Get last 3 quiz attempts for the logged-in student
app.get("/api/student/quiz-performance", authenticateJWT, async (req, res) => {
  try {
    const quizAttempts = await QuizAttempt.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("assignmentId");

    const formatted = quizAttempts.map(q => ({
      date: q.createdAt,
      score: q.score,
      total: q.answers ? Object.keys(q.answers).length : 10, // fallback total, adjust based on your data
      topics: q.assignmentId?.topics || [], // if you store topics per assignment
      assignmentTitle: q.assignmentId?.originalName || 'Quiz',
    }));

    res.json(formatted.reverse()); // so oldest is first
  } catch (err) {
    console.error("Quiz performance fetch error:", err);
    res.status(500).json({ error: "Failed to fetch quiz performance" });
  }
});


// Create course (faculty and admin only)
app.post("/api/courses", authenticateJWT, authorizeRole(["faculty", "admin"]), async (req, res) => {
  try {
    const { subject, classCount, attendancePercent } = req.body;
    const course = new Course({
      createdBy: req.user._id,
      subject,
      classCount,
      attendancePercent,
    });
    await course.save();
    res.json({ success: true, message: "Course created", course });
  } catch (err) {
    console.error("Create course error:", err);
    res.status(500).json({ success: false, error: "Failed to create course" });
  }
});

// Get mentor
app.get("/api/mentor", authenticateJWT, async (req, res) => {
  try {
    const mentor = await Mentor.findOne().sort({ createdAt: -1 });
    if (!mentor) return res.status(404).json({ success: false, error: "No mentor found" });
    res.json(mentor);
  } catch (err) {
    console.error("Get mentor error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch mentor" });
  }
});

// Create mentor (admin only)
app.post("/api/mentor", authenticateJWT, authorizeRole(["admin"]), async (req, res) => {
  try {
    const { name, email, assignedTo } = req.body;
    const mentor = new Mentor({ name, email, assignedTo });
    await mentor.save();
    res.json({ success: true, message: "Mentor created", mentor });
  } catch (err) {
    console.error("Create mentor error:", err);
    res.status(500).json({ success: false, error: "Failed to create mentor" });
  }
});

app.post("/api/assignments", authenticateJWT, upload.single("pdf"), async (req, res) => {
  // Only allow faculty or admin to upload
  if (!["faculty", "admin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  if (!req.file) return res.status(400).json({ error: "No PDF uploaded" });
  try {
    const assignment = new Assignment({
      uploadedBy: req.user._id,
      filename: req.file.filename,
      fileUrl: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
    });
    await assignment.save();
    res.json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
});
app.get("/api/assignments", authenticateJWT, async (req, res) => {
  const assignments = await Assignment.find().sort({ createdAt: -1 });
  res.json(assignments);
});

// Individual Leaderboard API - Top Rankers by Average Quiz Score

// In your Express app
app.get("/api/leaderboard/individual", async (req, res) => {
  try {
    // Fetch students and sort by coins descending
    const users = await User.find({ role: "student" })
      .sort({ coins: -1 })
      .select("firstName lastName coins")
      .lean();

    const leaderboard = Array.isArray(users)
      ? users.map((u, idx) => ({
          studentId: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
          totalCoins: u.coins || 0,
          rank: idx + 1,
        }))
      : [];

    res.json(leaderboard);
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    // Always return array, never a crash or object!
    res.status(200).json([]);
  }
});

app.post("/api/check-answer", authenticateJWT, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ error: "Only students can verify" });

  const { taskId } = req.body;
  const studentId = req.user._id;

  try {
    // Fetch task and answer
    const task = await Task.findById(taskId);
    const answer = await StudentAnswer.findOne({ taskId, studentId });
    if (!task || !answer) return res.status(404).json({ error: "Task or answer not found" });

    function resolvePath(url) {
      return path.join(__dirname, url.startsWith("/") ? url.slice(1) : url);
    }
    const taskPdfPath = resolvePath(task.fileUrl);
    const answerPdfPath = resolvePath(answer.fileUrl);

    if (!fs.existsSync(taskPdfPath) || !fs.existsSync(answerPdfPath)) {
      return res.status(404).json({ error: "PDF files not found" });
    }

    // Extract text for prompt
    const taskText = (await pdfParse(fs.readFileSync(taskPdfPath))).text;
    const answerText = (await pdfParse(fs.readFileSync(answerPdfPath))).text;

    const prompt = `
      You are an expert academic grader.

      Task Description:
      ${taskText}

      Student Answer:
      ${answerText}

      Provide score (0-100) and feedback in JSON: { "score":number, "feedback":string }
    `;

    // Call Perplexity API
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",   // Corrected endpoint
      {
        model: "sonar",
        messages: [
          { role: "system", content: "You are an academic grading assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      },
      { headers: { Authorization: `Bearer ${process.env.API_KEY}` } }
    );

    let content = response.data?.choices?.[0].message.content || "";
    content = content.replace(/``````/g, '').trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { score: null, feedback: content };
    }

    // Generate PDF report
    const doc = new PDFDocument();
    const reportsDir = path.join(__dirname, 'uploads', 'verification_reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const filename = `verification_${studentId}_${taskId}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, filename);
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(18).text('Answer Verification Report', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Student ID: ${studentId}`);
    doc.text(`Task ID: ${taskId}`);
    doc.moveDown();
    doc.fontSize(14).text(`Score: ${result.score !== null ? result.score : "N/A"}`);
    doc.moveDown();
    doc.fontSize(12).text('Feedback:', { underline: true });
    doc.moveDown();
    doc.fontSize(10).text(result.feedback || 'No feedback provided.');
    doc.end();

    await new Promise((resolve) => writeStream.on('finish', resolve));

    // Save verification result and documentUrl in DB
    const docUrl = `/uploads/verification_reports/${filename}`;
    await AnswerVerification.findOneAndUpdate(
      { taskId, studentId },
      {
        score: result.score,
        report: result.feedback,
        documentUrl: docUrl,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Award coins for high scores
    if (result.score !== null && result.score >= 80) {
      await User.findByIdAndUpdate(studentId, { $inc: { coins: 5 } });
    }

    res.json({ message: 'Verification completed', score: result.score, feedback: result.feedback, reportUrl: docUrl });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.delete("/api/assignments/:id", authenticateJWT, async (req, res) => {
  if (!["faculty", "admin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const filepath = path.join(__dirname, "uploads", assignment.filename);
    // Log file path for debugging
    console.log("Deleting file:", filepath);

    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log("File deleted:", filepath);
      } else {
        console.log("File not found, skipping:", filepath);
      }
    } catch (fileErr) {
      console.error("Failed to delete file:", fileErr);
      return res.status(500).json({ error: "Failed to delete PDF file: " + fileErr.message });
    }

    // Use recommended Mongoose deletion method
    await Assignment.deleteOne({ _id: assignment._id });

    res.json({ success: true });
  } catch (err) {
    console.error("Assignment deletion failed:", err);
    res.status(500).json({ error: "Delete failed: " + err.message });
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
