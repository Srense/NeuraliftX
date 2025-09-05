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
  profilePicUrl: { type: String, default: "" },  // Added field for profile pic
}, { timestamps: true });

userSchema.methods.generateJWT = function () {
  return jwt.sign({ id: this._id, email: this.email, role: this.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const User = mongoose.model("User", userSchema);

// Announcement schema
const announcementSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  date: String,
  time: String,
  refNumber: String,
  details: String,
}, { timestamps: true });

const Announcement = mongoose.model("Announcement", announcementSchema);

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
  createdAt: { type: Date, default: Date.now },
});

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);


// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: Number(EMAIL_PORT) || 587,
  secure: false,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});


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

// API Routes

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

    const user = await User.findOne({ verificationToken: token, verificationTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, error: "Invalid or expired token" });

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully" });

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

    const quiz = await Quiz.findOne({ assignmentId });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const assignment = await Assignment.findById(assignmentId);
    const pdfUrl = assignment ? assignment.fileUrl : "";

    let score = 0;
    const correctAnswers = [];
    const wrongQuestions = [];
    const suggestions = [];

    quiz.questions.forEach((q, i) => {
      correctAnswers[i] = q.answer;
      if (answers[i] && answers[i] === q.answer) {
        score++;
      } else {
        wrongQuestions.push(i);
        suggestions[i] = {
          pdfUrl,
          page: q.referencePage || 1,
          topic: q.topic || "Refer to assignment materials",
          highlightText: q.highlightText || "", // Include highlight text here
        };
      }
    });

    // Save quiz attempt
    await QuizAttempt.create({
      userId: req.user._id,
      assignmentId,
      answers,
      score,
    });

    res.json({
      score,
      correctAnswers,
      wrongQuestions,
      suggestions,
    });
  } catch (err) {
    console.error("Submit quiz error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.use('/pdf-viewer', express.static(path.join(__dirname, 'pdf-viewer')));

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
