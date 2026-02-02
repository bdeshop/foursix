const express = require("express");
const Authrouter = require("./routes/Authrouter");
const app = express();
const port = process.env.PORT || 4500;
const cors = require("cors");
const connectDB = require("./config/Db");
const Adminauth = require("./routes/Adminauth");
const Adminrouter = require("./routes/Adminroute");
const Userrouter = require("./routes/Userroute");
const router = require("./routes/router");
const Affiliateroute = require("./routes/Affiliateroute");
const Masteraffiliateroute = require("./routes/Masteraffiliateroute");
const mongoose = require("mongoose");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "https://trickboy.xyz",
      "https://affiliate.trickboy.xyz",
      "https://m-affiliate.trickboy.xyz",
      "https://trickboy-admin.trickboy.xyz",
      "https://admin.brenbaji.com",
      "https://brenbaji.com",
      "https://m-affiliate.brenbaji.com",
      "https://affiliate.brenbaji.com",
      "https://foursix.live",
      "https://affiliate.foursix.live",
      "https://m-affiliate.foursix.live",
      "https://admin.foursix.live",
      "https://admin.bajiman.com",
      "https://bajiman.com",
      "https://m-affiliate.bajiman.com",
      "https://affiliate.bajiman.com",

      "*",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
      "x-merchant-id",
      "x-timestamp",
      "x-nonce",
      "x-sign",
      "Access-Control-Allow-Origin",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Connect to database and initialize app.locals
async function initializeApp() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("MongoDB connected successfully");

    // Get the database instance
    const db = mongoose.connection.db;
    
    // Store database instance in app.locals
    app.locals.db = db;
    console.log("Database initialized in app.locals");

    // Import and setup Opay route
    const settingsCollection = db.collection("settings");
    const opayApi = require("./routes/Opayroute");
    app.use("/api/opay", opayApi(settingsCollection));
    console.log("Opay API routes initialized");

    // Start server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to initialize app:", error);
    process.exit(1);
  }
}

// Other routes (these can be set up before DB connection)
app.use("/api/auth", Authrouter);
app.use("/api/auth/admin", Adminauth);
app.use("/api/admin", Adminrouter);
app.use("/api/user", Userrouter);
app.use("/api", router);
app.use("/api/affiliate", Affiliateroute);
app.use("/api/master-affiliate", Masteraffiliateroute);

app.get("/", (req, res) => {
  res.send("server is running");
});

// Initialize the app
initializeApp();