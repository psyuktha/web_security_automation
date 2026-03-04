// Quick script to check MongoDB data
import { connectDB, getDB } from "./db.js";

async function checkMongoDB() {
  try {
    console.log("🔍 Checking MongoDB connection and data...\n");
    
    await connectDB();
    const db = getDB();
    const collection = db.collection("scan_history");
    
    // Get count of documents
    const count = await collection.countDocuments();
    console.log(`📊 Total scan history entries: ${count}\n`);
    
    if (count > 0) {
      // Get latest 5 entries
      const latest = await collection
        .find({})
        .sort({ created_at: -1 })
        .limit(5)
        .toArray();
      
      console.log("📋 Latest 5 scan entries:\n");
      latest.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.target_url || "N/A"}`);
        console.log(`   ID: ${doc._id}`);
        console.log(`   Date: ${doc.created_at}`);
        console.log(`   Vulnerabilities: ${doc.vulnerabilities_found || 0}`);
        console.log(`   Status: ${doc.status || "N/A"}`);
        console.log("");
      });
    } else {
      console.log("⚠️  No scan history found. Run a scan in the frontend to create data.\n");
    }
    
    // Show database stats
    const stats = await db.stats();
    console.log(`💾 Database: ${db.databaseName}`);
    console.log(`📦 Collections: ${stats.collections}`);
    console.log(`📄 Data size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkMongoDB();

