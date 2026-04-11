import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "redteam_scanner";

let client = null;
let db = null;

export const connectDB = async () => {
  try {
    if (client && db) {
      return { client, db };
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    console.log("✅ Connected to MongoDB");
    
    // Create collections and indexes if they don't exist
    await setupCollections(db);
    
    return { client, db };
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

const setupCollections = async (db) => {
  try {
    // Create users collection with indexes
    const usersCollection = db.collection("users");
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ created_at: -1 });
    
    // Create scan_history collection with indexes
    const scanHistoryCollection = db.collection("scan_history");
    await scanHistoryCollection.createIndex({ user_id: 1, created_at: -1 });
    await scanHistoryCollection.createIndex({ created_at: -1 });
    
    console.log("✅ Collections and indexes created");
  } catch (error) {
    console.error("Error setting up collections:", error);
  }
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database not connected. Call connectDB() first.");
  }
  return db;
};

export const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("✅ MongoDB connection closed");
  }
};

