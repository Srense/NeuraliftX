// server.js
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
app.use(express.json());

// Serve uploads directory
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Multer setup (general)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // if req.user exists use id, otherwise fallback
    const uid = req.user?._id ? req.user._id.toString() : "anon";
    const ext = path.extname(file.originalname);
    cb(null, `${uid}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// helper: serve verification_reports
const verificationReportsDir = path.join(uploadDir, 'verification_reports');
if (!fs.existsSync(verificationReportsDir)) fs.mkdirSync(verificationReportsDir, { recursive: true });
app.use('/uploads/verification_reports', express.static(verificationReportsDir));

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

// ---------------------------
// Schemas & Models
// ---------------------------

// User
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, lowercase: true, required: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "faculty", "alumni", "admin"],
    default: "student",
  },
  roleIdValue: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profilePicUrl: { type: String, default: "" },
  coins: { type: Number, default: 0 },

  bio: { type: String, default: "" },
  percentage: { type: Number, default: null },
  className: { type: String, default: "" },
  internshipsDone: [{ type: String }],
  coursesCompleted: [{ type: String }],
  areaOfInterest: [{ type: String }],
}, { timestamps: true });

userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const User = mongoose.model("User", userSchema);

// Announcement
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

// Feedback
const feedbackSchema = new mongoose.Schema({
  announcementId: { type: mongoose.Schema.Types.ObjectId, ref: "Announcement" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  responses: mongoose.Schema.Types.Mixed,
  submittedAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model("Feedback", feedbackSchema);

// Course
const courseSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: String,
  classCount: Number,
  attendancePercent: Number,
}, { timestamps: true });
const Course = mongoose.model("Course", courseSchema);

// Mentor
const mentorSchema = new mongoose.Schema({
  name: String,
  email: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
const Mentor = mongoose.model("Mentor", mentorSchema);

// Assignment
const assignmentSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  filename: String,
  fileUrl: String,
  originalName: String,
  createdAt: { type: Date, default: Date.now },
});
const Assignment = mongoose.model("Assignment", assignmentSchema);

// Task
const TaskSchema = new mongoose.Schema({
  originalName: String,
  fileUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});
const Task = mongoose.model("Task", TaskSchema);

// Quiz
const quizQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  answer: String,
  referencePage: Number,
  topic: String,
  highlightText: String,
});
const quizSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
  questions: [quizQuestionSchema],
});
const Quiz = mongoose.model("Quiz", quizSchema);

const quizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment" },
  answers: mongoose.Schema.Types.Mixed,
  score: Number,
  coinsEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);

// Theme settings
const themeSettingsSchema = new mongoose.Schema({
  globalTheme: { type: String, default: "default" }
});
const ThemeSettings = mongoose.model("ThemeSettings", themeSettingsSchema);

// Student Answer & Verification
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
  report: String,
  documentUrl: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});
const AnswerVerification = mongoose.model("AnswerVerification", answerVerificationSchema);

// Syllabus Unit
const syllabusUnitSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  label: String,
  uploadedFileUrl: String,
});
const SyllabusUnit = mongoose.model("SyllabusUnit", syllabusUnitSchema);

// Alumni profile
const alumniSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  name: { type: String, required: true },
  company: { type: String, required: true },
  designation: { type: String, required: true },
  description: { type: String },
  linkedin: { type: String },
  github: { type: String },
}, { timestamps: true });
const Alumni = mongoose.model("Alumni", alumniSchema);

// General Connection (Alumni<->Student) - left as-is from your original backend
const connectionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    alumniId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  }, { timestamps: true }
);
const Connection = mongoose.model("Connection", connectionSchema);

// Conversation & Message (Chat)
const conversationSchema = new mongoose.Schema(
  {
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  },
  { timestamps: true }
);
const Conversation = mongoose.model("Conversation", conversationSchema);

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, trim: true, required: true },
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);

// Posts & comments
const mediaSchema = new mongoose.Schema({
  fileUrl: { type: String },
  mimeType: { type: String },
  originalName: { type: String },
  size: { type: Number },
}, { _id: false });

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    media: { type: mediaSchema, default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [commentSchema],
    shareCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Post = mongoose.model("Post", postSchema);

// ---------------------------
// NEW: Dedicated StudentConnection Model (separate from alumni Connection)
// ---------------------------
const studentConnectionSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
}, { timestamps: true });
const StudentConnection = mongoose.model("StudentConnection", studentConnectionSchema);

// ---------------------------
// Nodemailer transporter
// ---------------------------
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT) || 587,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// ---------------------------
// Utilities: Disposable email checks
// ---------------------------
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

// ---------------------------
// Send emails
// ---------------------------
const sendVerificationEmail = async (user, token) => {
  const link = `${BASE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"NeuraliftX" <${EMAIL_USER}>`,
    to: user.email,
    subject: "Email Verification - NeuraliftX",
    html: `<p>Click to verify your email (valid for ${EMAIL_VERIFICATION_TOKEN_EXPIRY} hours): <a href="${link}">${link}</a></p>`,
  });
};
const sendPasswordResetEmail = async (user, token) => {
  const link = `${BASE_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"NeuraliftX" <${EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset - NeuraliftX",
    html: `<p>Click to reset your password (valid for ${PASSWORD_RESET_TOKEN_EXPIRY} hour): <a href="${link}">${link}</a></p>`,
  });
};

// role labels
const roleIdFieldLabels = {
  student: "University ID",
  faculty: "Faculty ID",
  alumni: "Alumni ID",
  admin: "Admin Email",
};

// ---------------------------
// Validate signup input
// ---------------------------
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

// ---------------------------
// Middleware: Authenticate JWT token and attach user to req.user
// ---------------------------
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

// Middleware: Check role
const authorizeRole = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: "Access forbidden: insufficient permissions" });
  }
  next();
};

// ---------------------------
// Answer upload storage (student answers)
// ---------------------------
const answerDir = path.join(uploadDir, "student_answers");
if (!fs.existsSync(answerDir)) fs.mkdirSync(answerDir, { recursive: true });

const answerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, answerDir),
  filename: (req, file, cb) => {
    const uid = req.user?._id ? req.user._id.toString() : "anon";
    cb(null, `${uid}-${req.params.taskId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const uploadAnswer = multer({ storage: answerStorage });

// ---------------------------
// Student answers endpoints
// ---------------------------
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

// Faculty fetches student answers (already present in your original code - slightly improved)
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

    // Map by studentId
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

// ---------------------------
// Signup / Verify / Login / Password Reset
// ---------------------------
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

    res.json({ success: true, message: "Email verified. You can now log in." });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

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

// ---------------------------
// Profile endpoints
// ---------------------------
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
      bio: req.user.bio || "",
      percentage: req.user.percentage || null,
      className: req.user.className || "",
      internshipsDone: req.user.internshipsDone || [],
      coursesCompleted: req.user.coursesCompleted || [],
      areaOfInterest: req.user.areaOfInterest || [],
    },
  });
});

app.put("/api/profile", authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const {
      bio, percentage, className,
      internshipsDone, coursesCompleted, areaOfInterest
    } = req.body;

    if (bio !== undefined) user.bio = bio;
    if (percentage !== undefined) user.percentage = percentage;
    if (className !== undefined) user.className = className;
    if (internshipsDone !== undefined) user.internshipsDone = internshipsDone;
    if (coursesCompleted !== undefined) user.coursesCompleted = coursesCompleted;
    if (areaOfInterest !== undefined) user.areaOfInterest = areaOfInterest;

    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("Profile update error", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
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

// ---------------------------
// Weather API
// ---------------------------
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

// ---------------------------
// Generate quiz endpoint (Perplexity)
// ---------------------------
app.post("/api/generate-quiz", authenticateJWT, async (req, res) => {
  try {
    const { assignmentId } = req.body;
    if (!assignmentId) return res.status(400).json({ error: "assignmentId is required" });

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const pdfPath = path.join(__dirname, "uploads", assignment.filename);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Assignment PDF file missing" });
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    const textContent = pdfData.text;

    if (!textContent || textContent.trim().length === 0) {
      return res.status(500).json({ error: "Failed to extract text from PDF" });
    }

    const prompt = `
Generate a quiz of 10 multiple choice questions with options and answers based on the following text from an academic assignment:
${textContent}

For each question, also provide:
- referencePage (optional)
- topic (optional)
- highlightText: a phrase or keyword from the PDF to help with highlighting the related section.

Output the result as a JSON array. Each object must have fields: question, options (array), answer, referencePage, topic, highlightText.
`;

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
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let content = response.data?.choices?.[0]?.message?.content;
    if (!content) return res.status(500).json({ error: "No content received from Perplexity API" });

    content = content.replace(/``````/g, '').trim();

    let questions;
    try {
      questions = JSON.parse(content);
    } catch (parseErr) {
      console.error("Failed to parse quiz JSON after cleaning:", content);
      return res.status(500).json({ error: "Failed to parse quiz JSON" });
    }

    const quiz = await Quiz.findOneAndUpdate(
      { assignmentId },
      { questions },
      { upsert: true, new: true }
    );

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

// Submit quiz
app.post("/api/submit-quiz", authenticateJWT, async (req, res) => {
  try {
    const { assignmentId, answers } = req.body;
    if (!assignmentId || !answers) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const userId = req.user._id;

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

    let coinsAwarded = 0;
    if (allCorrect) {
      coinsAwarded = 5;
      await User.findByIdAndUpdate(userId, { $inc: { coins: coinsAwarded } });
    }

    await QuizAttempt.create({
      userId,
      assignmentId,
      answers,
      score,
      coinsEarned: coinsAwarded,
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

// ---------------------------
// Syllabus endpoints
// ---------------------------
app.post(
  "/api/syllabus/unit-upload",
  authenticateJWT,
  (req, res, next) => {
    // authorise faculty role
    if (req.user.role !== "faculty") return res.status(403).json({ error: "Faculty only" });
    next();
  },
  upload.single("pdf"),
  async (req, res) => {
    try {
      const unitKey = req.query.unitKey;
      if (!unitKey || !req.file)
        return res.status(400).json({ error: "Missing unitKey or PDF file" });

      const fileUrl = `/uploads/${req.file.filename}`;

      let unit = await SyllabusUnit.findOne({ key: unitKey });
      if (unit) {
        unit.uploadedFileUrl = fileUrl;
      } else {
        unit = new SyllabusUnit({
          key: unitKey,
          label: unitKey.toUpperCase(),
          uploadedFileUrl: fileUrl,
        });
      }
      await unit.save();

      res.json({ message: "File uploaded successfully", fileUrl });
    } catch (err) {
      console.error("Syllabus unit upload error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

app.get("/api/syllabus", authenticateJWT, async (req, res) => {
  try {
    const units = await SyllabusUnit.find();
    res.json(units);
  } catch (err) {
    console.error("Get syllabus error:", err);
    res.status(500).json({ error: "Failed to fetch syllabus" });
  }
});

app.delete(
  "/api/syllabus/unit-upload",
  authenticateJWT,
  (req, res, next) => {
    if (req.user.role !== "faculty") return res.status(403).json({ error: "Faculty only" });
    next();
  },
  async (req, res) => {
    try {
      const unitKey = req.query.unitKey;
      if (!unitKey) return res.status(400).json({ error: "unitKey is required" });

      const unit = await SyllabusUnit.findOne({ key: unitKey });
      if (!unit || !unit.uploadedFileUrl) return res.status(404).json({ error: "No file found for this unit" });

      const filePath = path.join(__dirname, "uploads", path.basename(unit.uploadedFileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      unit.uploadedFileUrl = "";
      await unit.save();

      res.json({ message: "Syllabus unit file deleted" });
    } catch (err) {
      console.error("Delete syllabus unit file error:", err);
      res.status(500).json({ error: "Failed to delete syllabus file" });
    }
  }
);

// ---------------------------
// Announcements endpoints
// ---------------------------
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
app.post("/api/announcements", authenticateJWT, (req, res, next) => {
  if (!["faculty", "alumni", "admin"].includes(req.user.role)) return res.status(403).json({ success: false, error: "Not authorized" });
  next();
}, async (req, res) => {
  try {
    const { title, date, time, refNumber, details } = req.body;
    const announcement = new Announcement({
      createdBy: req.user._id,
      title,
      date,
      time,
      refNumber,
      message: details, // using message field
    });
    await announcement.save();
    res.json({ success: true, message: "Announcement created", announcement });
  } catch (err) {
    console.error("Create announcement error:", err);
    res.status(500).json({ success: false, error: "Failed to create announcement" });
  }
});

// Admin announcement creation (with survey etc)
app.post("/api/admin/announcements", authenticateJWT, (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ success: false, error: "Admin only" });
  next();
}, async (req, res) => {
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

// Active announcements for the user's role
app.get("/api/announcements/active", authenticateJWT, async (req, res) => {
  try {
    const role = req.user.role;
    const roleFilters = [];
    if (role === "student") roleFilters.push({ "visibleTo.students": true });
    if (role === "faculty") roleFilters.push({ "visibleTo.faculty": true });
    if (role === "alumni") roleFilters.push({ "visibleTo.alumni": true });
    if (!roleFilters.length) return res.json([]);
    const announcements = await Announcement.find({ $or: roleFilters }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// Feedback submission
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

// Admin announcements list & delete
app.get("/api/admin/announcements", authenticateJWT, (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ success: false, error: "Admin only" });
  next();
}, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch announcements" });
  }
});
app.delete("/api/admin/announcements/:id", authenticateJWT, (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ success: false, error: "Admin only" });
  next();
}, async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ error: "Not found" });
    await Announcement.deleteOne({ _id: req.params.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

// ---------------------------
// Tasks (upload/download/delete)
// ---------------------------
app.post(
  "/api/tasks",
  authenticateJWT,
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF uploaded" });
      }

      const task = await Task.create({
        originalName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        uploadedBy: req.user._id,
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
    const tasks = await Task.find().sort({ uploadedAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Failed to get tasks" });
  }
});

app.delete("/api/tasks/:id", authenticateJWT, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (task.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this task" });
    }

    const filePath = path.join(__dirname, "uploads", path.basename(task.fileUrl));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await Task.deleteOne({ _id: task._id });
    res.json({ success: true });
  } catch (e) {
    console.error("Delete task error:", e);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// ---------------------------
// Assignments upload/list/delete (faculty/admin)
// ---------------------------
app.post("/api/assignments", authenticateJWT, upload.single("pdf"), async (req, res) => {
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

app.delete("/api/assignments/:id", authenticateJWT, async (req, res) => {
  if (!["faculty", "admin"].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    const filepath = path.join(__dirname, "uploads", assignment.filename);
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (fileErr) {
      console.error("Failed to delete file:", fileErr);
      return res.status(500).json({ error: "Failed to delete PDF file: " + fileErr.message });
    }

    await Assignment.deleteOne({ _id: assignment._id });

    res.json({ success: true });
  } catch (err) {
    console.error("Assignment deletion failed:", err);
    res.status(500).json({ error: "Delete failed: " + err.message });
  }
});

// ---------------------------
// Leaderboard & other student endpoints
// ---------------------------
app.get("/api/leaderboard/individual", async (req, res) => {
  try {
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
    res.status(200).json([]);
  }
});

// ---------------------------
// Check-answer (Perplexity grading) - student triggers check on own uploaded answer
// ---------------------------
app.post("/api/check-answer", authenticateJWT, async (req, res) => {
  if (req.user.role !== "student") return res.status(403).json({ error: "Only students can verify" });

  const { taskId } = req.body;
  const studentId = req.user._id;

  try {
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

    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "sonar",
        messages: [
          { role: "system", content: "You are an academic grading assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      },
      { headers: { Authorization: `Bearer ${API_KEY}` } }
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
    const filename = `verification_${studentId}_${taskId}_${Date.now()}.pdf`;
    const filePath = path.join(verificationReportsDir, filename);
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

    if (result.score !== null && result.score >= 80) {
      await User.findByIdAndUpdate(studentId, { $inc: { coins: 5 } });
    }

    res.json({ message: 'Verification completed', score: result.score, feedback: result.feedback, reportUrl: docUrl });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ---------------------------
// Delete assignment (already above) - removed duplicate conflicts
// ---------------------------

// ---------------------------
// CONNECTION ROUTES (Alumni connections) - existing routes preserved from original
// ---------------------------
// Connection model already defined above: Connection

// POST /api/connect/:alumniId (student sends connection request to alumni)
app.post(
  "/api/connect/:alumniId",
  authenticateJWT,
  (req, res, next) => {
    if (req.user.role !== "student") return res.status(403).json({ success: false, error: "Students only" });
    next();
  },
  async (req, res) => {
    try {
      let { alumniId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(alumniId)) {
        return res.status(400).json({ success: false, error: "Invalid alumniId" });
      }

      let targetAlumniUserId;
      const alumniProfile = await Alumni.findById(alumniId);

      if (alumniProfile) {
        targetAlumniUserId = alumniProfile.userId;
      } else {
        const userExists = await User.findById(alumniId);
        if (!userExists || userExists.role !== "alumni") {
          return res.status(404).json({ success: false, error: "Alumni not found" });
        }
        targetAlumniUserId = alumniId;
      }

      const existing = await Connection.findOne({
        studentId: req.user._id,
        alumniId: targetAlumniUserId,
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Request already sent",
          status: existing.status,
        });
      }

      const newConn = await Connection.create({
        studentId: req.user._id,
        alumniId: targetAlumniUserId,
        status: "pending",
      });

      return res.json({
        success: true,
        message: "Connection request sent",
        connection: newConn,
      });
    } catch (err) {
      console.error("❌ Error sending connection:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// GET /api/connect/status/:alumniId - student checks request status
app.get(
  "/api/connect/status/:alumniId",
  authenticateJWT,
  (req, res, next) => {
    if (req.user.role !== "student") return res.status(403).json({ success: false, error: "Students only" });
    next();
  },
  async (req, res) => {
    try {
      let { alumniId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(alumniId)) {
        return res.status(400).json({ success: false, error: "Invalid alumniId" });
      }

      let targetAlumniUserId;
      const alumniProfile = await Alumni.findById(alumniId);

      if (alumniProfile) {
        targetAlumniUserId = alumniProfile.userId;
      } else {
        const userExists = await User.findById(alumniId);
        if (!userExists || userExists.role !== "alumni") {
          return res.status(404).json({ success: false, error: "Alumni not found" });
        }
        targetAlumniUserId = alumniId;
      }

      const conn = await Connection.findOne({
        studentId: req.user._id,
        alumniId: targetAlumniUserId,
      });

      return res.json({
        success: true,
        status: conn ? conn.status : "not_sent",
      });
    } catch (err) {
      console.error("❌ Connection status error:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Alumni fetch pending requests
app.get(
  "/api/alumni/requests",
  authenticateJWT,
  (req, res, next) => {
    if (req.user.role !== "alumni") return res.status(403).json({ success: false, error: "Alumni only" });
    next();
  },
  async (req, res) => {
    try {
      const requests = await Connection.find({
        alumniId: req.user._id,
        status: "pending",
      })
        .populate("studentId", "firstName lastName email roleIdValue coins");

      return res.json({ success: true, requests });
    } catch (err) {
      console.error("❌ Error fetching pending requests:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Alumni accepts/rejects
app.put(
  "/api/alumni/requests/:id",
  authenticateJWT,
  (req, res, next) => {
    if (req.user.role !== "alumni") return res.status(403).json({ success: false, error: "Alumni only" });
    next();
  },
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status" });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, error: "Invalid request id" });
      }

      const request = await Connection.findOneAndUpdate(
        { _id: id, alumniId: req.user._id },
        { status },
        { new: true }
      );

      if (!request) {
        return res.status(404).json({ success: false, error: "Request not found" });
      }

      res.json({ success: true, message: `Request ${status}`, request });
    } catch (err) {
      console.error("❌ Error updating connection request:", err);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

// Chat endpoints for conversations & messages (preserve existing)
app.post("/api/chat/start/:alumniId", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const { alumniId } = req.params;

    const connection = await Connection.findOne({
      $or: [
        { studentId: userId, alumniId, status: "accepted" },
        { studentId: alumniId, alumniId: userId, status: "accepted" },
      ],
    });

    if (!connection) {
      return res
        .status(403)
        .json({ success: false, message: "No valid connection found." });
    }

    let convo = await Conversation.findOne({
      members: { $all: [userId, alumniId] },
    });

    if (!convo) {
      convo = await Conversation.create({ members: [userId, alumniId] });
    }

    res.json({ success: true, conversation: convo });
  } catch (err) {
    console.error("❌ Error starting chat:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.get("/api/chat/:conversationId", authenticateJWT, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const convo = await Conversation.findById(conversationId);
    if (!convo || !convo.members.includes(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this chat." });
    }

    const messages = await Message.find({ conversationId }).sort("createdAt");
    res.json({ success: true, messages });
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

app.post("/api/chat/message", authenticateJWT, async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const userId = req.user._id;

    const convo = await Conversation.findById(conversationId);
    if (!convo || !convo.members.includes(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this chat." });
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: userId,
      text,
    });

    res.json({ success: true, message: newMessage });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// ---------------------------
// Posts endpoints (create, list, like, comment, share, edit, delete)
// ---------------------------
app.post("/api/posts", authenticateJWT, upload.single("media"), async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    if (user.role !== "student") return res.status(403).json({ error: "Only students can post." });

    const text = (req.body.text || "").toString().trim() || null;
    let media = null;

    if (req.file) {
      media = {
        fileUrl: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
        size: req.file.size,
      };
    }

    const newPost = new Post({
      user: user._id,
      text,
      media,
      likes: [],
      comments: [],
      shareCount: 0,
    });

    await newPost.save();

    const populated = await Post.findById(newPost._id)
      .populate("user", "firstName lastName profilePicUrl roleIdValue")
      .populate("comments.user", "firstName lastName profilePicUrl")
      .lean();

    populated.likeCount = (populated.likes || []).length;
    populated.commentCount = (populated.comments || []).length;
    populated.likedByMe = !!(populated.likes || []).find((id) => id.toString() === user._id.toString());

    res.status(201).json({ post: populated });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/posts", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user ? req.user._id.toString() : null;

    const posts = await Post.find()
      .populate("user", "firstName lastName profilePicUrl roleIdValue")
      .populate("comments.user", "firstName lastName profilePicUrl")
      .sort({ createdAt: -1 })
      .lean();

    const shaped = posts.map((p) => {
      return {
        ...p,
        likeCount: (p.likes || []).length,
        commentCount: (p.comments || []).length,
        likedByMe: userId ? !!(p.likes || []).find((id) => id.toString() === userId.toString()) : false,
      };
    });

    res.json({ posts: shaped });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/posts/:id/like", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const found = post.likes.findIndex((l) => l.toString() === userId.toString());
    let action;
    if (found !== -1) {
      post.likes.splice(found, 1);
      action = "unliked";
    } else {
      post.likes.push(userId);
      action = "liked";
    }

    await post.save();
    res.json({ action, likeCount: post.likes.length });
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/posts/:id/comment", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const text = (req.body.text || "").toString().trim();
    if (!text) return res.status(400).json({ error: "Comment text required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.comments.push({ user: userId, text });
    await post.save();

    const populated = await Post.findById(post._id).populate("comments.user", "firstName lastName profilePicUrl").lean();
    const comment = populated.comments[populated.comments.length - 1];

    res.json({ comment, commentCount: populated.comments.length });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/posts/:id/share", authenticateJWT, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.shareCount = (post.shareCount || 0) + 1;
    await post.save();
    res.json({ shareCount: post.shareCount });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/posts/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const text = (req.body.text || "").toString().trim();

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to edit this post" });
    }

    post.text = text;
    await post.save();

    const populated = await Post.findById(post._id)
      .populate("user", "firstName lastName profilePicUrl roleIdValue")
      .populate("comments.user", "firstName lastName profilePicUrl")
      .lean();

    populated.likeCount = (populated.likes || []).length;
    populated.commentCount = (populated.comments || []).length;

    res.json({ post: populated });
  } catch (err) {
    console.error("Edit post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/posts/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------------------
// Student Search
// ---------------------------
app.get("/api/students/search", authenticateJWT, async (req, res) => {
  try {
    const query = (req.query.query || "").trim();
    if (!query) return res.json([]);

    const regex = new RegExp(query, "i");

    const results = await User.find({
      role: "student",
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { roleIdValue: regex },
        { className: regex },
      ],
    })
      .select("firstName lastName email roleIdValue className percentage bio profilePicUrl areaOfInterest")
      .limit(20);

    res.json(results);
  } catch (err) {
    console.error("❌ Student search error:", err);
    res.status(500).json({ error: "Failed to search students" });
  }
});

// ---------------------------
// Student-to-Student Connection (legacy approach using Connection model) - kept but don't use if using dedicated system
// ---------------------------
app.post("/api/connect/student/:targetId", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ error: "Students only" });

    const { targetId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }
    if (req.user._id.toString() === targetId) {
      return res.status(400).json({ error: "Cannot connect with yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser || targetUser.role !== "student") {
      return res.status(404).json({ error: "Target student not found" });
    }

    const existing = await Connection.findOne({
      $or: [
        { studentId: req.user._id, alumniId: targetId },
        { studentId: targetId, alumniId: req.user._id },
      ],
    });

    if (existing) {
      return res.status(400).json({
        message:
          existing.status === "pending"
            ? "Request already pending"
            : "Already connected",
        status: existing.status,
      });
    }

    const connection = await Connection.create({
      studentId: req.user._id,
      alumniId: targetId,
      status: "pending",
    });

    res.json({ success: true, message: "Connection request sent", connection });
  } catch (err) {
    console.error("❌ Error sending student connection:", err);
    res.status(500).json({ error: "Failed to send connection" });
  }
});

// Student-to-student status (legacy)
app.get("/api/connect/student/status/:targetId", authenticateJWT, async (req, res) => {
  try {
    const { targetId } = req.params;
    const currentUserId = req.user._id;

    const connection = await Connection.findOne({
      $or: [
        { studentId: currentUserId, alumniId: targetId },
        { studentId: targetId, alumniId: currentUserId },
      ],
    });

    res.json({
      success: true,
      status: connection ? connection.status : "not_connected",
    });
  } catch (err) {
    console.error("❌ Check connection status error:", err);
    res.status(500).json({ error: "Failed to check connection status" });
  }
});

// Get all student connections for logged-in user (legacy)
app.get("/api/students/connections", authenticateJWT, async (req, res) => {
  try {
    const myId = req.user._id;

    const connections = await Connection.find({
      $or: [{ studentId: myId }, { alumniId: myId }],
      status: "accepted",
    })
      .populate("studentId", "firstName lastName email profilePicUrl")
      .populate("alumniId", "firstName lastName email profilePicUrl");

    res.json(connections);
  } catch (err) {
    console.error("❌ Fetch student connections error:", err);
    res.status(500).json({ error: "Failed to fetch connections" });
  }
});

// Student incoming connection requests (legacy)
app.get("/api/connect/student/requests",
  authenticateJWT,
  async (req, res) => {
    try {
      const userId = req.user._id;

      const requests = await Connection.find({
        alumniId: new mongoose.Types.ObjectId(userId),
        status: "pending",
      })
        .populate("studentId", "firstName lastName email roleIdValue className profilePicUrl")
        .lean();

      res.json({
        success: true,
        count: requests.length,
        requests,
      });
    } catch (err) {
      console.error("📥 Student fetch connection requests error:", err);
      res.status(500).json({ error: "Failed to fetch connection requests" });
    }
  }
);

// Student accept/reject request (legacy)
app.put("/api/connect/student/requests/:id",
  authenticateJWT,
  async (req, res) => {
    try {
      const { action } = req.body; // 'accept' or 'reject'
      const connectionId = req.params.id;
      const userId = req.user._id;

      const connection = await Connection.findById(connectionId);
      if (!connection) {
        return res.status(404).json({ error: "Connection request not found" });
      }

      if (connection.alumniId.toString() !== userId.toString()) {
        return res.status(403).json({ error: "Not authorized" });
      }

      if (action === "accept") connection.status = "accepted";
      else if (action === "reject") connection.status = "rejected";
      else return res.status(400).json({ error: "Invalid action" });

      await connection.save();
      res.json({ success: true, message: `Request ${action}ed successfully.` });
    } catch (err) {
      console.error("✅ Student accept/reject connection error:", err);
      res.status(500).json({ error: "Failed to update connection request" });
    }
  }
);

// ---------------------------
// ---------------------------
// NEW: Dedicated Student Connection Routes (recommended for student-to-student)
// Base path: /api/student-connection
// ---------------------------

// Send connection request (student -> student)
app.post("/api/student-connection/connect/:id", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ message: "Students only" });

    const senderId = req.user._id.toString();
    const receiverId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID" });
    }
    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot connect with yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver || receiver.role !== "student") {
      return res.status(404).json({ message: "Receiver student not found" });
    }

    const existing = await StudentConnection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "Request already exists", status: existing.status });
    }

    const connection = await StudentConnection.create({ senderId, receiverId, status: "pending" });

    res.status(201).json({ message: "Connection request sent", connection });
  } catch (err) {
    console.error("Error sending student connection:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch received requests (for current student)
app.get("/api/student-connection/requests", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ message: "Students only" });

    const receiverId = req.user._id;
    const requests = await StudentConnection.find({ receiverId, status: "pending" })
      .populate("senderId", "firstName lastName email roleIdValue profilePicUrl className");

    res.json(requests);
  } catch (err) {
    console.error("Error fetching received requests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch sent requests (for current student)
app.get("/api/student-connection/requests/sent", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ message: "Students only" });

    const senderId = req.user._id;
    const requests = await StudentConnection.find({ senderId, status: "pending" })
      .populate("receiverId", "firstName lastName email roleIdValue profilePicUrl className");

    res.json(requests);
  } catch (err) {
    console.error("Error fetching sent requests:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Accept or reject a received request (receiver only)
app.put("/api/student-connection/requests/:id", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ message: "Students only" });

    const receiverId = req.user._id.toString();
    const { id } = req.params;
    const { status } = req.body; // "accepted" or "rejected"

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await StudentConnection.findOne({ _id: id });
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.receiverId.toString() !== receiverId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    request.status = status;
    await request.save();

    res.json({ message: `Request ${status}`, request });
  } catch (err) {
    console.error("Error updating student request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all accepted student connections for user
app.get("/api/student-connection/connections", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ message: "Students only" });

    const userId = req.user._id;
    const connections = await StudentConnection.find({
      $or: [
        { senderId: userId, status: "accepted" },
        { receiverId: userId, status: "accepted" }
      ]
    })
      .populate("senderId", "firstName lastName email roleIdValue profilePicUrl className")
      .populate("receiverId", "firstName lastName email roleIdValue profilePicUrl className");

    res.json(connections);
  } catch (err) {
    console.error("Error fetching student connections:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove a connection (either side)
app.delete("/api/student-connection/connections/:id", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ message: "Students only" });

    const userId = req.user._id.toString();
    const connection = await StudentConnection.findOne({ _id: req.params.id });
    if (!connection) return res.status(404).json({ message: "Connection not found" });

    if (connection.senderId.toString() !== userId && connection.receiverId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await connection.deleteOne();
    res.json({ message: "Connection removed" });
  } catch (err) {
    console.error("Error removing connection:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------
// Individual student endpoints & other admin/alumni helpers
// ---------------------------

// Create or update alumni profile
app.post("/api/alumni", authenticateJWT, async (req, res) => {
  try {
    const { name, company, designation, description, linkedin, github } = req.body;

    if (!name || !company || !designation) {
      return res.status(400).json({ error: "Name, company, and designation are required" });
    }

    let alumni = await Alumni.findOne({ userId: req.user._id });

    if (alumni) {
      alumni.name = name;
      alumni.company = company;
      alumni.designation = designation;
      alumni.description = description;
      alumni.linkedin = linkedin;
      alumni.github = github;
      await alumni.save();
    } else {
      alumni = await Alumni.create({
        userId: req.user._id,
        name,
        company,
        designation,
        description,
        linkedin,
        github,
      });
    }

    res.json({ success: true, alumni });
  } catch (err) {
    console.error("Error saving alumni:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/alumni/me", authenticateJWT, async (req, res) => {
  try {
    const alumni = await Alumni.findOne({ userId: req.user._id });
    if (!alumni) return res.status(404).json({ error: "Profile not found" });
    res.json({ success: true, alumni });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/alumni", async (req, res) => {
  try {
    const alumniList = await Alumni.find().populate("userId", "firstName lastName email");
    res.json({ success: true, alumni: alumniList });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/alumni", authenticateJWT, async (req, res) => {
  try {
    const alumni = await Alumni.findOneAndDelete({ userId: req.user._id });

    if (!alumni) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({ success: true, message: "Alumni profile deleted successfully" });
  } catch (err) {
    console.error("Error deleting alumni:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Alumni fetching students (alumni-only)
app.get("/api/alumni/students", authenticateJWT, (req, res, next) => {
  if (req.user.role !== "alumni") return res.status(403).json({ error: "Alumni only" });
  next();
}, async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("firstName lastName email roleIdValue coins profilePicUrl");
    res.json({ success: true, students });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Get details of a single student (Alumni-only)
app.get("/api/alumni/student/:id", authenticateJWT, (req, res, next) => {
  if (req.user.role !== "alumni") return res.status(403).json({ error: "Alumni only" });
  next();
}, async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await User.findById(studentId).select(
      "firstName lastName email roleIdValue coins profilePicUrl bio percentage className internshipsDone coursesCompleted areaOfInterest"
    );
    if (!student) return res.status(404).json({ error: "Student not found" });

    const quizAttempts = await QuizAttempt.find({ userId: studentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("assignmentId", "originalName");

    const tasks = await StudentAnswer.find({ studentId })
      .populate("taskId", "originalName fileUrl uploadedAt");

    res.json({
      success: true,
      student,
      quizAttempts,
      tasks
    });
  } catch (err) {
    console.error("Error fetching student details:", err);
    res.status(500).json({ error: "Failed to fetch student details" });
  }
});

// ---------------------------
// Theme
// ---------------------------
app.get("/api/theme", async (req, res) => {
  try {
    let settings = await ThemeSettings.findOne({});
    res.json({ theme: settings?.globalTheme || "default" });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch theme" });
  }
});

app.post("/api/admin/theme", authenticateJWT, (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}, async (req, res) => {
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

// ---------------------------
// Misc endpoints (Coursera)
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

// ---------------------------
// Student quiz performance
app.get("/api/student/quiz-performance", authenticateJWT, async (req, res) => {
  try {
    const quizAttempts = await QuizAttempt.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("assignmentId");

    const formatted = quizAttempts.map(q => ({
      date: q.createdAt,
      score: q.score,
      total: q.answers ? Object.keys(q.answers).length : 10,
      topics: q.assignmentId?.topics || [],
      assignmentTitle: q.assignmentId?.originalName || 'Quiz',
    }));

    res.json(formatted.reverse());
  } catch (err) {
    console.error("Quiz performance fetch error:", err);
    res.status(500).json({ error: "Failed to fetch quiz performance" });
  }
});

// ---------------------------
// Student Connections UI endpoints (for StudentConnections.jsx) - example endpoints that call the student-connection system
// - GET /api/student-connections/sent (alias)
// - GET /api/student-connections/received (alias)
app.get("/api/student-connections/sent", authenticateJWT, async (req, res) => {
  // alias to student-connection/requests/sent
  try {
    const data = await StudentConnection.find({ senderId: req.user._id, status: "pending" })
      .populate("receiverId", "firstName lastName email roleIdValue profilePicUrl className");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});
app.get("/api/student-connections/received", authenticateJWT, async (req, res) => {
  try {
    const data = await StudentConnection.find({ receiverId: req.user._id, status: "pending" })
      .populate("senderId", "firstName lastName email roleIdValue profilePicUrl className");
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// ---------------------------
// Fallback route
app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

// ---------------------------
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
