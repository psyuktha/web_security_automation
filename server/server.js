import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, getDB } from "./db.js";
import { hashPassword, comparePassword, generateToken, authenticateToken } from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB().catch(console.error);

// Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Auth Routes

// Sign up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = {
      email: email.toLowerCase(),
      password: hashedPassword,
      full_name: fullName || null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await usersCollection.insertOne(user);
    const userId = result.insertedId.toString();

    // Generate token
    const token = generateToken(userId, user.email);

    console.log(`✅ User created: ${user.email}`);

    res.status(201).json({
      token,
      user: {
        id: userId,
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error("❌ Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  }
});

// Sign in
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    // Find user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.email);

    console.log(`✅ User signed in: ${user.email}`);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error("❌ Signin error:", error);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

// Get current user (protected route)
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const usersCollection = db.collection("users");
    const { ObjectId } = await import("mongodb");
    
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        full_name: user.full_name,
      },
    });
  } catch (error) {
    console.error("❌ Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Get all scan history
app.get("/api/scan-history", async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("scan_history");
    
    const history = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    console.log(`📊 Fetched ${history.length} scan history entries`);
    
    res.json(history);
  } catch (error) {
    console.error("❌ Error fetching scan history:", error);
    res.status(500).json({ error: "Failed to fetch scan history" });
  }
});

// Get scan history by user ID (protected route)
app.get("/api/scan-history/user/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user can only access their own data
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const db = getDB();
    const collection = db.collection("scan_history");
    
    const history = await collection
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching user scan history:", error);
    res.status(500).json({ error: "Failed to fetch user scan history" });
  }
});

// Create new scan history entry (protected route)
app.post("/api/scan-history", authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const collection = db.collection("scan_history");
    
    const scanData = {
      ...req.body,
      user_id: req.user.userId, // Use authenticated user ID
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    console.log("💾 Saving scan history to MongoDB:", {
      target_url: scanData.target_url,
      vulnerabilities_found: scanData.vulnerabilities_found,
      user_id: scanData.user_id,
    });
    
    const result = await collection.insertOne(scanData);
    
    const insertedDoc = await collection.findOne({ _id: result.insertedId });
    
    console.log("✅ Scan history saved successfully. ID:", result.insertedId);
    
    res.status(201).json({
      ...insertedDoc,
      id: insertedDoc._id.toString(),
    });
  } catch (error) {
    console.error("❌ Error creating scan history:", error);
    res.status(500).json({ error: "Failed to create scan history" });
  }
});

// Delete scan history entry
app.delete("/api/scan-history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const collection = db.collection("scan_history");
    
    // Convert string ID to ObjectId
    const { ObjectId } = await import("mongodb");
    const objectId = new ObjectId(id);
    
    const result = await collection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Scan history not found" });
    }
    
    res.json({ message: "Scan history deleted successfully" });
  } catch (error) {
    console.error("Error deleting scan history:", error);
    res.status(500).json({ error: "Failed to delete scan history" });
  }
});

// Update scan history entry
app.put("/api/scan-history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const collection = db.collection("scan_history");
    
    // Convert string ID to ObjectId
    const { ObjectId } = await import("mongodb");
    const objectId = new ObjectId(id);
    
    const updateData = {
      ...req.body,
      updated_at: new Date(),
    };
    
    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: "after" }
    );
    
    if (!result.value) {
      return res.status(404).json({ error: "Scan history not found" });
    }
    
    res.json({
      ...result.value,
      id: result.value._id.toString(),
    });
  } catch (error) {
    console.error("Error updating scan history:", error);
    res.status(500).json({ error: "Failed to update scan history" });
  }
});

// Scan Routes

// Start security scan
app.post("/api/scan/start", authenticateToken, async (req, res) => {
  try {
    const { targetUrl, attackTypes } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: "Target URL is required" });
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    console.log(`🚀 Starting scan for: ${targetUrl} by user: ${req.user.userId}`);

    // Import scan orchestrator
    const { runSecurityScan } = await import("./modules/scanOrchestrator.js");

    // Run scan asynchronously
    const scanPromise = runSecurityScan(targetUrl, attackTypes || { sqlInjection: true });

    // Return immediately with scan ID
    const scanId = `scan_${Date.now()}_${req.user.userId}`;

    // Run scan in background and save results
    scanPromise
      .then(async (result) => {
        if (result.success) {
          // Save scan history to MongoDB
          const db = getDB();
          const collection = db.collection("scan_history");

          const criticalCount = result.vulnerabilities.filter((v) => v.severity === "critical").length;
          const highCount = result.vulnerabilities.filter((v) => v.severity === "high").length;
          const mediumCount = result.vulnerabilities.filter((v) => v.severity === "medium").length;
          const lowCount = result.vulnerabilities.filter((v) => v.severity === "low").length;

          await collection.insertOne({
            user_id: req.user.userId,
            target_url: targetUrl,
            scan_types: Object.keys(attackTypes || {}).filter((k) => attackTypes[k]),
            vulnerabilities_found: result.vulnerabilities.length,
            critical_count: criticalCount,
            high_count: highCount,
            medium_count: mediumCount,
            low_count: lowCount,
            scan_duration: result.scanDuration,
            status: "completed",
            results: result.vulnerabilities,
            endpoints: result.endpoints,
            report: result.report,
            created_at: new Date(),
            updated_at: new Date(),
          });

          console.log(`✅ Scan completed and saved: ${scanId}`);
        } else {
          console.error(`❌ Scan failed: ${result.error}`);
        }
      })
      .catch((error) => {
        console.error(`❌ Scan error: ${error.message}`);
      });

    // Return scan ID immediately
    res.json({
      scanId: scanId,
      status: "started",
      message: "Scan started successfully. Results will be saved when complete.",
    });
  } catch (error) {
    console.error("❌ Error starting scan:", error);
    res.status(500).json({ error: "Failed to start scan", details: error.message });
  }
});

// Get scan status (for polling)
app.get("/api/scan/status/:scanId", authenticateToken, async (req, res) => {
  try {
    const { scanId } = req.params;
    const db = getDB();
    const collection = db.collection("scan_history");

    // Find scan by ID pattern (scan_*_userId)
    const scan = await collection.findOne({
      _id: { $regex: scanId },
      user_id: req.user.userId,
    });

    if (!scan) {
      return res.json({ status: "running", progress: 50 });
    }

    res.json({
      status: scan.status || "completed",
      progress: 100,
      results: scan.results || [],
    });
  } catch (error) {
    console.error("Error getting scan status:", error);
    res.status(500).json({ error: "Failed to get scan status" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⚠️  Shutting down server...");
  const { closeDB } = await import("./db.js");
  await closeDB();
  process.exit(0);
});

