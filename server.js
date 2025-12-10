const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");

const app = express();

// ===== Middlewares =====
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ===== MongoDB Atlas Connection =====
// इथे तुझा खरा username आणि password टाक
const MONGO_URI =
  "mongodb+srv://dhanashrideshmukh2004_db_user:EwYD4hyjMTlmkLjF@cluster0.8cb55ar.mongodb.net/professional_registration?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ===== Mongoose Schema & Model =====
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true }, // unique काढलं confusion टाळायला
    phone: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "Student" },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ===== API Routes (must be before static middleware) =====
app.post("/api/registers", async (req, res) => {
  try {
    console.log("🎯 /api/registers POST hit:", req.body);

    const { fullName, email, phone, password, role } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields." });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ MongoDB not connected. State:", mongoose.connection.readyState);
      return res
        .status(503)
        .json({ message: "Database connection error. Please try again later." });
    }

    const newUser = new User({ fullName, email, phone, password, role });
    await newUser.save();

    console.log("✅ User registered successfully:", email);
    return res.status(201).json({ message: "Registration successful!" });
  } catch (error) {
    console.error("❌ Register Error Details:", error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "Email already exists. Please use a different email." });
    }
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message).join(", ");
      return res
        .status(400)
        .json({ message: errors });
    }

    // Generic error
    return res
      .status(500)
      .json({ 
        message: "Server error. Try again later.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
  }
});

// ===== Static files (must be after API routes) =====
app.use(express.static(path.join(__dirname, "frontend")));

// ===== Default route (serve form) =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// ===== Start server =====
const PORT = 5502;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
