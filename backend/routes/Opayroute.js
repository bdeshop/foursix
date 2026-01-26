const express = require("express");
const axios = require("axios");
const { User } = require("../models/User");

module.exports = function opayApi(settingsCollection) {
  const router = express.Router();

  const SETTINGS_KEY = "opay";
  const externalUrl = "https://api.oraclepay.org/api/external/key/validate";

  const getAllowedDomain = () => {
    return process.env.DOMAIN || null;
  };

  const getSettings = async () => {
    if (!settingsCollection) return null;
    return await settingsCollection.findOne({ key: SETTINGS_KEY });
  };

  const saveSettings = async (doc) => {
    if (!settingsCollection) return;
    await settingsCollection.updateOne(
      { key: SETTINGS_KEY },
      { $set: { ...doc, key: SETTINGS_KEY, updatedAt: new Date() } },
      { upsert: true }
    );
  };

  // Helper: perform external validation + domain check
  const performValidation = async (apiKey, persistOnMismatch = true) => {
    try {
      console.log("Validating API key against OraclePay...");
      
      const response = await axios.get(externalUrl, {
        headers: { 
          "X-API-Key": apiKey,
          "User-Agent": "Opay-Integration/1.0"
        },
        timeout: 30000, // Increased timeout
      });
      
      console.log("Validation response status:", response.status);
      const payload = response.data || {};
      
      const allowed = getAllowedDomain();
      if (allowed) {
        const domains = Array.isArray(payload.domains) ? payload.domains : [];
        const primary = payload.primaryDomain || "";
        const match = domains.includes(allowed) || primary === allowed;
        
        if (!match) {
          if (persistOnMismatch) {
            await saveSettings({ 
              apiKey, 
              validation: { ...payload, valid: false, reason: "DOMAIN_MISMATCH" }
            });
          }
          return {
            status: 400,
            body: {
              success: false,
              valid: false,
              reason: "DOMAIN_MISMATCH",
              message: "Your domain is not whitelisted for this API key",
              allowedDomain: allowed,
              domains,
              primaryDomain: primary,
            },
          };
        }
      }
      
      // Save successful validation
      await saveSettings({ 
        apiKey, 
        validation: { ...payload, valid: true }
      });
      
      return { 
        status: 200, 
        body: { 
          ...payload, 
          success: true,
          valid: true 
        } 
      };
      
    } catch (err) {
      console.error("External validation error:", err.message);
      console.error("Error details:", {
        code: err.code,
        response: err.response?.status,
        data: err.response?.data
      });
      
      let errorResponse = {
        status: 500,
        body: {
          success: false,
          valid: false,
          reason: "REQUEST_FAILED",
          message: "Failed to validate API key with OraclePay",
        }
      };
      
      if (err.response) {
        // OraclePay API returned an error
        errorResponse.status = err.response.status;
        errorResponse.body = {
          ...err.response.data,
          success: false,
          valid: false,
          reason: err.response.data?.reason || "UPSTREAM_ERROR"
        };
      } else if (err.code === 'ECONNABORTED') {
        errorResponse.body = {
          success: false,
          valid: false,
          reason: "TIMEOUT",
          message: "OraclePay API timeout - please try again"
        };
      } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        errorResponse.body = {
          success: false,
          valid: false,
          reason: "NETWORK_ERROR",
          message: "Cannot connect to OraclePay API - check your internet connection"
        };
      }
      
      // Save error state
      if (persistOnMismatch) {
        await saveSettings({ 
          apiKey, 
          validation: errorResponse.body,
          lastError: new Date()
        });
      }
      
      return errorResponse;
    }
  };

  // Return Opay settings; always refresh validation if apiKey exists unless ?cached=true
  router.get("/settings", async (req, res) => {
    try {
      const useCached = req.query.cached === "true";
      const saved = await getSettings();
      let currentValidation = saved?.validation || null;
      
      if (saved?.apiKey && !useCached) {
        try {
          const result = await performValidation(saved.apiKey, false);
          currentValidation = result.body;
        } catch (e) {
          console.error("Error refreshing validation:", e.message);
          // Keep previous validation if external fails
        }
      }
      
      return res.status(200).json({
        apiKey: saved?.apiKey || "",
        validation: currentValidation,
        updatedAt: saved?.updatedAt || null,
        running: saved?.running === true,
        refreshed: !useCached && !!saved?.apiKey,
      });
    } catch (err) {
      console.error("Settings error:", err);
      return res.status(500).json({ 
        success: false, 
        reason: "READ_FAILED", 
        message: err.message 
      });
    }
  });

  // Validate API key (from body or saved), domain-check, then persist
  router.post("/validate", async (req, res) => {
    try {
      let { apiKey } = req.body || {};

      if (!apiKey) {
        const saved = await getSettings();
        apiKey = saved?.apiKey;
      }

      if (!apiKey) {
        return res.status(400).json({ 
          success: false, 
          valid: false, 
          reason: "MISSING_API_KEY",
          message: "API key is required"
        });
      }

      const result = await performValidation(apiKey, true);
      return res.status(result.status).json(result.body);
      
    } catch (err) {
      console.error("Validate endpoint error:", err);
      return res.status(500).json({ 
        success: false, 
        valid: false, 
        reason: "SERVER_ERROR", 
        message: err.message 
      });
    }
  });

  // Toggle running status
  router.patch("/running", async (req, res) => {
    try {
      const { running } = req.body || {};
      if (typeof running !== "boolean") {
        return res.status(400).json({ 
          success: false, 
          reason: "INVALID_RUNNING_VALUE",
          message: "Running must be a boolean value"
        });
      }
      const saved = (await getSettings()) || {};
      await saveSettings({ ...saved, running });
      return res.status(200).json({ success: true, running });
    } catch (err) {
      console.error("Running update error:", err);
      return res.status(500).json({ 
        success: false, 
        reason: "RUNNING_UPDATE_FAILED", 
        message: err.message 
      });
    }
  });
  // Callback deposit webhook: save payload and credit user balance if success === true
   router.post("/callback-deposit", async (req, res) => {
  try {
    const db = req.app.locals?.db;
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not initialized" });
    }

    const payload = req.body || {};
    const {
      success,
      userIdentifyAddress,
      amount,
      trxid,
    } = payload;

    console.log("Callback received:", {
      success,
      userIdentifyAddress,
      amount,
      trxid
    });

    // Collections
    const opayDepositCol = db.collection("Opay-deposit");
    const usersCol = db.collection("users");
    const depositsCol = db.collection("deposits");
    const ObjectId = require('mongodb').ObjectId;

    // Ensure unique index on trxid to avoid duplicates
    try {
      await opayDepositCol.createIndex({ trxid: 1 }, { unique: true, sparse: true });
    } catch (e) {
      // ignore if already exists or cannot be created right now
    }

    // Normalize amount
    const amountNum = typeof amount === "number" ? amount : Number(amount);

    // Save incoming payload first (idempotent on trxid)
    const baseDoc = {
      ...payload,
      receivedAt: new Date(),
      applied: false,
    };

    let insertedId = null;
    try {
      const insertResult = await opayDepositCol.insertOne(baseDoc);
      insertedId = insertResult.insertedId;
    } catch (err) {
      // Duplicate trxid (already processed/recorded)
      if (err && err.code === 11000) {
        // Already recorded; do not apply again
        const existing = await opayDepositCol.findOne({ trxid });
        return res.status(200).json({
          success: true,
          message: "Already recorded",
          applied: !!existing?.applied,
        });
      }
      // Any other error
      return res.status(500).json({ success: false, message: "Failed to record payload", error: err.message });
    }

    // Only apply balance if marked success and required fields are valid
    if (success === true && trxid && userIdentifyAddress && Number.isFinite(amountNum) && amountNum > 0) {
      let userId;
      let user;
      
      // Extract user ID from userIdentifyAddress (format: order-${userId}-${timestamp})
      if (userIdentifyAddress.startsWith('order-')) {
        const parts = userIdentifyAddress.split('-');
        if (parts.length >= 3) {
          userId = parts[1]; // order-${userId}-${timestamp}
          try {
            if (ObjectId.isValid(userId)) {
              user = await usersCol.findOne({ _id: new ObjectId(userId) });
            }
          } catch (err) {
            console.log("Error finding user by ID:", err.message);
          }
        }
      }
      
      // If not found by ID, try to find by paymentId in deposits collection
      if (!user) {
        // Find deposit record first
        const depositRecord = await depositsCol.findOne({
          paymentId: userIdentifyAddress,
          status: "pending"
        });
        
        if (depositRecord && depositRecord.userId) {
          if (ObjectId.isValid(depositRecord.userId)) {
            user = await usersCol.findOne({ _id: new ObjectId(depositRecord.userId) });
          }
        }
      }
      
      // Try to find by username if userIdentifyAddress is username
      if (!user) {
        user = await usersCol.findOne({ username: userIdentifyAddress });
      }
      
      // Try to find by player_id
      if (!user) {
        user = await usersCol.findOne({ player_id: userIdentifyAddress });
      }
      
      // Try to find by phone
      if (!user) {
        user = await usersCol.findOne({ phone: userIdentifyAddress });
      }

      if (!user) {
        // Update the record to indicate not applied due to missing user
        await opayDepositCol.updateOne(
          { _id: insertedId },
          { $set: { applied: false, reason: "USER_NOT_FOUND", checkedAt: new Date() } }
        );
        return res.status(404).json({ 
          success: false, 
          message: "User not found", 
          userIdentifyAddress: userIdentifyAddress 
        });
      }

      // Find the original deposit record from deposits collection
      const matcheduser=await User.findById({_id:user._id})
      let originalDeposit = await depositsCol.findOne({
        paymentId: userIdentifyAddress,
        userId: user._id,
        status: "pending"
      });

      // If not found by paymentId, try to find by userIdentifyAddress
      if (!originalDeposit) {
        originalDeposit = await depositsCol.findOne({
          userIdentifyAddress: userIdentifyAddress,
          userId: user._id,
          status: "pending"
        });
      }

      // If still not found, try to find by transactionId (recent pending deposit)
      if (!originalDeposit) {
        originalDeposit = await depositsCol.findOne({
          userId: user._id,
          status: "pending",
          createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Last 30 minutes
        });
      }

      // Try to find matching pending deposit in user's depositHistory
      let pendingDepositInHistory = null;
      if (user.depositHistory) {
        // Find the most recent pending deposit that matches the amount
        pendingDepositInHistory = user.depositHistory.find(dep => 
          dep.status === 'pending' && 
          Math.abs(dep.amount - amountNum) <= 1 // Match amount
        );
      }

      if (!originalDeposit && !pendingDepositInHistory) {
        // Check user's depositHistory for any pending deposits
        const userWithHistory = await usersCol.findOne(
          { 
            _id: user._id,
            "depositHistory.status": "pending",
            "depositHistory.createdAt": { $gte: new Date(Date.now() - 30 * 60 * 1000) }
          },
          {
            projection: {
              depositHistory: {
                $filter: {
                  input: "$depositHistory",
                  as: "deposit",
                  cond: {
                    $and: [
                      { $eq: ["$$deposit.status", "pending"] },
                      { $gte: ["$$deposit.createdAt", new Date(Date.now() - 30 * 60 * 1000)] }
                    ]
                  }
                }
              }
            }
          }
        );

        if (userWithHistory && userWithHistory.depositHistory && userWithHistory.depositHistory.length > 0) {
          const matchingDeposit = userWithHistory.depositHistory.find(dep => 
            Math.abs(dep.amount - amountNum) <= 1 // Allow small rounding differences
          ) || userWithHistory.depositHistory[0];
          
          originalDeposit = {
            _id: new ObjectId(),
            userId: user._id,
            type: "deposit",
            method: matchingDeposit.method || "external_gateway",
            amount: matchingDeposit.amount || amountNum,
            bonusType: matchingDeposit.bonusType || 'none',
            bonusAmount: matchingDeposit.bonusAmount || 0,
            bonusCode: matchingDeposit.bonusCode || '',
            wageringRequirement: matchingDeposit.wageringRequirement || 0,
            phoneNumber: matchingDeposit.phoneNumber || user.phone || "",
            transactionId: matchingDeposit.transactionId || `EXT_${Date.now()}`,
            paymentId: matchingDeposit.paymentId || userIdentifyAddress,
            description: matchingDeposit.description || `Deposit via ${matchingDeposit.method || 'external_gateway'}`,
            status: "pending",
            createdAt: matchingDeposit.createdAt || new Date()
          };
        }
      }
     
      // Get bonus info - prioritize from pending deposit, then original deposit
      const sourceDeposit = pendingDepositInHistory || originalDeposit;
      const bonusInfo = {
        bonusType: sourceDeposit?.bonusType || 'none',
        bonusCode: sourceDeposit?.bonusCode || '',
        bonusAmount: sourceDeposit?.bonusAmount || 0,
        wageringRequirement: sourceDeposit?.wageringRequirement || 0,
        method: sourceDeposit?.method || 'external_gateway'
      };

      // Calculate total amount with bonus
      const totalCredit = amountNum + bonusInfo.bonusAmount;
      
      // Prepare deposit record for user's depositHistory
      const depositRecord = {
        method: bonusInfo.method,
        amount: amountNum,
        status: 'completed',
        transactionId: trxid,
        bonusApplied: bonusInfo.bonusAmount > 0,
        bonusType: bonusInfo.bonusType,
        bonusAmount: bonusInfo.bonusAmount,
        bonusCode: bonusInfo.bonusCode, // Keep the actual bonus code
        orderId: `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        paymentUrl: payload.payment_page_url || '',
        processedAt: new Date(),
        completedAt: new Date(),
        createdAt: new Date()
      };
      
    matcheduser.depositamount=amountNum;
    matcheduser.waigeringneed=sourceDeposit?.wageringRequirement;
    matcheduser.total_bet=0;
    matcheduser.affiliatedeposit+=amountNum;
    matcheduser.save();
      // Keep playerbalance if it exists in the pending deposit
      if (pendingDepositInHistory && pendingDepositInHistory.playerbalance !== undefined) {
        depositRecord.playerbalance = pendingDepositInHistory.playerbalance;
      }

      // Check if there's a bonusCode in the pending deposit
      let bonusCodeToActivate = null;
      if (pendingDepositInHistory && pendingDepositInHistory.bonusCode && pendingDepositInHistory.bonusCode.trim() !== '') {
        bonusCodeToActivate = pendingDepositInHistory.bonusCode;
      } else if (originalDeposit && originalDeposit.bonusCode && originalDeposit.bonusCode.trim() !== '') {
        bonusCodeToActivate = originalDeposit.bonusCode;
      }

      // Prepare transaction record
      const transactionRecord = {
        type: 'deposit',
        amount: amountNum,
        balanceBefore: user.balance || 0,
        balanceAfter: (user.balance || 0) + totalCredit,
        description: `Deposit via ${bonusInfo.method}${bonusInfo.bonusAmount > 0 ? ` with ${bonusInfo.bonusType} bonus` : ''}`,
        referenceId: trxid,
        createdAt: new Date()
      };

      // Update operations
      const updateOperations = {
        $inc: {
          balance: totalCredit,
          total_deposit: amountNum,
          lifetime_deposit: amountNum
        },
        $push: {
          transactionHistory: transactionRecord
        }
      };

      // Handle bonus if applicable
      if (bonusInfo.bonusAmount > 0) {
        // Add to bonusBalance
        updateOperations.$inc.bonusBalance = bonusInfo.bonusAmount;

        // Prepare bonus activity log
        const bonusActivityLog = {
          bonusType: bonusInfo.bonusType,
          bonusAmount: bonusInfo.bonusAmount,
          depositAmount: amountNum,
          activatedAt: new Date(),
          status: 'active'
        };
        
        // If we found a bonusCode to activate, add it to the log
        if (bonusCodeToActivate) {
          bonusActivityLog.bonusCode = bonusCodeToActivate;
        }
        
        updateOperations.$push.bonusActivityLogs = bonusActivityLog;

        // Prepare active bonus record
        const activeBonusRecord = {
          bonusType: bonusInfo.bonusType,
          amount: bonusInfo.bonusAmount,
          originalAmount: bonusInfo.bonusAmount,
          wageringRequirement: bonusInfo.wageringRequirement > 0 ? bonusInfo.wageringRequirement : 
                              bonusInfo.bonusType === 'first_deposit' ? 30 : 
                              bonusInfo.bonusType === 'special_bonus' ? 30 : 3, // Default wagering requirements
          amountWagered: 0,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'active'
        };
        
        // Add bonusCode to active bonus record if it exists
        if (bonusCodeToActivate) {
          activeBonusRecord.bonusCode = bonusCodeToActivate;
        }
        
        // Initialize activeBonuses array if it doesn't exist
        if (!user.bonusInfo || !user.bonusInfo.activeBonuses) {
          updateOperations.$set = updateOperations.$set || {};
          updateOperations.$set["bonusInfo.activeBonuses"] = [];
        }
        
        updateOperations.$push["bonusInfo.activeBonuses"] = activeBonusRecord;

        // Mark first deposit bonus as claimed if it's the first deposit
        if (bonusInfo.bonusType === 'first_deposit') {
          updateOperations.$set = updateOperations.$set || {};
          updateOperations.$set["bonusInfo.firstDepositBonusClaimed"] = true;
        }
      }

      // Execute the update
      const updateResult = await usersCol.updateOne(
        { _id: user._id },
        updateOperations
      );

      if (updateResult.modifiedCount === 0) {
        throw new Error("Failed to update user record");
      }

      // If we found a bonusCode to activate, update pending bonusActivityLogs
      if (bonusCodeToActivate) {
        // Find the pending bonus activity log with the same bonusCode
        const pendingBonusLog = await usersCol.findOne({
          _id: user._id,
          "bonusActivityLogs.status": "pending",
          "bonusActivityLogs.bonusCode": bonusCodeToActivate
        });

        if (pendingBonusLog && pendingBonusLog.bonusActivityLogs) {
          // Find the specific pending log
          const specificPendingLog = pendingBonusLog.bonusActivityLogs.find(log => 
            log.status === "pending" && 
            log.bonusCode === bonusCodeToActivate
          );

          if (specificPendingLog) {
            // Update the pending bonus activity log to active
            await usersCol.updateOne(
              { 
                _id: user._id,
                "bonusActivityLogs._id": specificPendingLog._id
              },
              {
                $set: {
                  "bonusActivityLogs.$.status": "active",
                  "bonusActivityLogs.$.activatedAt": new Date(),
                  "bonusActivityLogs.$.depositAmount": amountNum
                }
              }
            );
            console.log(`Updated pending bonus activity log for bonusCode: ${bonusCodeToActivate} to active`);
          }
        }
      }

      // Update the deposit record in deposits collection to completed
      if (originalDeposit && originalDeposit._id) {
        await depositsCol.updateOne(
          { _id: originalDeposit._id },
          {
            $set: {
              status: "completed",
              transactionId: trxid,
              updatedAt: new Date(),
              completedAt: new Date()
            }
          }
        );
      }

      // Also update the specific pending deposit in user's depositHistory to completed
      // This is where we need to preserve the bonusCode and playerbalance
      if (pendingDepositInHistory && pendingDepositInHistory._id) {
        await usersCol.updateOne(
          { 
            _id: user._id,
            "depositHistory._id": pendingDepositInHistory._id
          },
          {
            $set: {
              "depositHistory.$.status": "completed",
              "depositHistory.$.transactionId": trxid,
              "depositHistory.$.completedAt": new Date(),
              "depositHistory.$.processedAt": new Date()
              // Keep existing fields like bonusCode, playerbalance, etc.
            }
          }
        );
        
        console.log(`Updated specific pending deposit with ID: ${pendingDepositInHistory._id} to completed`);
      } else {
        // If no specific pending deposit found, push a new completed deposit record
        await usersCol.updateOne(
          { _id: user._id },
          {
            $push: {
              depositHistory: depositRecord
            }
          }
        );
      }

      // Mark this deposit as applied in opay-deposit collection
      await opayDepositCol.updateOne(
        { _id: insertedId },
        {
          $set: {
            applied: true,
            appliedAt: new Date(),
            username: user.username,
            userId: user._id,
            amount: amountNum,
            bonusAmount: bonusInfo.bonusAmount,
            totalCredit: totalCredit,
            userData: {
              previousBalance: user.balance || 0,
              newBalance: (user.balance || 0) + totalCredit,
              previousBonusBalance: user.bonusBalance || 0,
              newBonusBalance: (user.bonusBalance || 0) + bonusInfo.bonusAmount
            },
            bonusCodeActivated: bonusCodeToActivate || null
          },
        }
      );

      // Get updated user data for response
      const updatedUser = await usersCol.findOne({ _id: user._id });

      // Respond success
      return res.status(200).json({
        success: true,
        applied: true,
        message: "Deposit processed successfully",
        data: {
          username: user.username,
          userId: user._id,
          amount: amountNum,
          bonusAmount: bonusInfo.bonusAmount,
          totalCredit: totalCredit,
          previousBalance: user.balance || 0,
          newBalance: updatedUser?.balance || (user.balance || 0) + totalCredit,
          previousBonusBalance: user.bonusBalance || 0,
          newBonusBalance: updatedUser?.bonusBalance || (user.bonusBalance || 0) + bonusInfo.bonusAmount,
          transactionId: trxid,
          depositRecord: depositRecord,
          wageringRequirement: bonusInfo.wageringRequirement,
          bonusCodeActivated: bonusCodeToActivate
        }
      });
    }

    // If not success or invalid payload, keep record but don't apply
    await opayDepositCol.updateOne(
      { _id: insertedId },
      { $set: { applied: false, reason: "NOT_APPLIED", checkedAt: new Date() } }
    );

    return res.status(200).json({ 
      success: true, 
      applied: false, 
      message: "Recorded but not applied - missing required fields or not successful" 
    });
  } catch (err) {
    console.error("Callback deposit error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
   });
  // List Opay deposits (global or by user) with filters + pagination
  // GET /opay/deposits?username=johndoe&method=bkash&applied=true&trxid=ABC&from=017&dateFrom=2025-11-01&dateTo=2025-11-30&page=1&limit=20
  router.get("/deposits", async (req, res) => {
    try {
      const db = req.app.locals?.db;
      if (!db) {
        return res.status(500).json({ success: false, message: "Database not initialized" });
      }
      const { username, method, applied, trxid, from } = req.query;
      const { dateFrom, dateTo, page = "1", limit = "20" } = req.query;

      const col = db.collection("Opay-deposit");
      const and = [];
      if (username) {
        and.push({ $or: [{ username }, { userIdentifyAddress: username }] });
      }
      if (method) {
        and.push({ method });
      }
      if (typeof applied !== "undefined") {
        and.push({ applied: String(applied).toLowerCase() === "true" });
      }
      if (trxid) {
        and.push({ trxid: { $regex: trxid, $options: "i" } });
      }
      if (from) {
        and.push({ from: { $regex: from, $options: "i" } });
      }
      if (dateFrom || dateTo) {
        const range = {};
        if (dateFrom) {
          const start = new Date(dateFrom);
          if (!isNaN(start.getTime())) range.$gte = start;
        }
        if (dateTo) {
          const end = new Date(dateTo);
          if (!isNaN(end.getTime())) {
            // make end inclusive by adding 1 day and using $lt
            const endExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);
            range.$lt = endExclusive;
          }
        }
        if (Object.keys(range).length) and.push({ receivedAt: range });
      }

      const filter = and.length ? { $and: and } : {};
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      const sort = { appliedAt: -1, receivedAt: -1 };
      // Aggregation pipeline to join user info
      const pipeline = [
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: "users",
            let: { depUsername: "$username", depIdentify: "$userIdentifyAddress" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$username", "$$depUsername"] },
                      { $eq: ["$username", "$$depIdentify"] },
                    ],
                  },
                },
              },
              { $project: { username: 1, balance: 1, number: 1, email: 1 } },
            ],
            as: "userInfo",
          },
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
      ];

      const [items, total] = await Promise.all([
        col.aggregate(pipeline).toArray(),
        col.countDocuments(filter),
      ]);

      return res.status(200).json({
        success: true,
        data: items,
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: skip + items.length < total,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message || "Server error" });
    }
  });

  return router;
};
