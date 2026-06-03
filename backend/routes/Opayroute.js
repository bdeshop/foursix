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
const addDepositCoinBonus = async (userId, depositAmount, transactionId, sessionCode, bank) => {
  try {
    let coinBonus = 0;
    
    // Calculate coin bonus based on deposit amount
    if (depositAmount >= 10000) {
      coinBonus = 1500;
    } else if (depositAmount >= 5000) {
      coinBonus = 500;
    } else if (depositAmount >= 1000) {
      coinBonus = 100;
    }
    
    if (coinBonus > 0) {
      const usersCol = req.app.locals?.db.collection("users");
      const user = await usersCol.findOne({ _id: userId });
      
      if (!user) {
        console.log(`User ${userId} not found for coin bonus`);
        return { success: false, message: "User not found" };
      }
      
      // Update coin balance
      const currentCoinBalance = user.coinBalance || 0;
      const newCoinBalance = currentCoinBalance + coinBonus;
      
      // Prepare coin history entry
      const coinHistoryEntry = {
        amount: coinBonus,
        reason: `deposit_bonus_${depositAmount}_BDT`,
        date: new Date(),
        metadata: {
          depositAmount: depositAmount,
          transactionId: transactionId,
          sessionCode: sessionCode,
          bank: bank
        }
      };
      
      // Update user with coin bonus
      const updateResult = await usersCol.updateOne(
        { _id: userId },
        {
          $set: {
            coinBalance: newCoinBalance
          },
          $push: {
            coinHistory: coinHistoryEntry,
            transactionHistory: {
              type: "coin_bonus",
              amount: coinBonus,
              balanceBefore: currentCoinBalance,
              balanceAfter: newCoinBalance,
              description: `Deposit bonus: ${coinBonus} coins for depositing ${depositAmount} BDT via ${bank}`,
              referenceId: transactionId,
              metadata: {
                depositAmount: depositAmount,
                sessionCode: sessionCode
              },
              createdAt: new Date()
            }
          }
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log(`✅ Added ${coinBonus} coins to user ${userId} for deposit of ${depositAmount} BDT`);
        return { 
          success: true, 
          coinBonus: coinBonus,
          message: `Added ${coinBonus} coins for deposit of ${depositAmount} BDT`
        };
      }
    }
    
    return { 
      success: true, 
      coinBonus: 0,
      message: "No coin bonus for this deposit amount"
    };
    
  } catch (error) {
    console.error("Error adding deposit coin bonus:", error);
    return { success: false, error: error.message };
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

  // OraclePay Callback webhook endpoint
  // router.post("/oraclepay-callback", async (req, res) => {
  //   try {
  //     const db = req.app.locals?.db;
  //     if (!db) {
  //       return res.status(500).json({ success: false, message: "Database not initialized" });
  //     }

  //     // OraclePay sends the webhook payload according to their documentation
  //     const payload = req.body || {};
  //     const {
  //       status,
  //       invoice_number,
  //       amount,
  //       transaction_id,
  //       session_code,
  //       user_identity,
  //       checkout_items,
  //       footprint,
  //       bank
  //     } = payload;

  //     console.log("OraclePay Callback received:", {
  //       status,
  //       invoice_number,
  //       amount,
  //       transaction_id,
  //       session_code,
  //       user_identity,
  //       bank
  //     });

  //     // ALWAYS respond with 'OK' first as per OraclePay documentation
  //     // This acknowledges receipt of the webhook
  //     res.status(200).send('OK');

  //     // Collections
  //     const oraclePayDepositCol = db.collection("OraclePay-deposit");
  //     const usersCol = db.collection("users");
  //     const depositsCol = db.collection("deposits");
  //     const ObjectId = require('mongodb').ObjectId;

  //     // Ensure unique index on transaction_id to avoid duplicates
  //     try {
  //       await oraclePayDepositCol.createIndex({ transaction_id: 1 }, { unique: true, sparse: true });
  //       await oraclePayDepositCol.createIndex({ session_code: 1 }, { sparse: true });
  //     } catch (e) {
  //       // ignore if already exists
  //     }

  //     // Only process COMPLETED payments
  //     if (status !== "COMPLETED") {
  //       console.log(`Payment not completed: ${status}`);
        
  //       // Save the payload for record keeping
  //       await oraclePayDepositCol.insertOne({
  //         ...payload,
  //         receivedAt: new Date(),
  //         processed: false,
  //         reason: `STATUS_${status}`
  //       }).catch(err => {
  //         if (err.code !== 11000) console.error("Error saving non-completed payload:", err);
  //       });
        
  //       return;
  //     }

  //     // Validate required fields for completed payment
  //     if (!transaction_id || !user_identity || !amount || amount <= 0) {
  //       console.error("Missing required fields in completed payment:", {
  //         transaction_id,
  //         user_identity,
  //         amount
  //       });
        
  //       // Save invalid payload
  //       await oraclePayDepositCol.insertOne({
  //         ...payload,
  //         receivedAt: new Date(),
  //         processed: false,
  //         reason: "MISSING_REQUIRED_FIELDS"
  //       }).catch(err => {
  //         if (err.code !== 11000) console.error("Error saving invalid payload:", err);
  //       });
        
  //       return;
  //     }

  //     // Check for duplicate transaction
  //     const existing = await oraclePayDepositCol.findOne({ transaction_id });
  //     if (existing && existing.processed === true) {
  //       console.log(`Duplicate webhook for transaction: ${transaction_id} - already processed`);
  //       return;
  //     }

  //     // Save incoming payload
  //     const baseDoc = {
  //       ...payload,
  //       receivedAt: new Date(),
  //       processed: false,
  //       checkout_items: checkout_items || {},
  //       bank: bank || 'unknown'
  //     };

  //     let insertedId = null;
  //     try {
  //       const insertResult = await oraclePayDepositCol.insertOne(baseDoc);
  //       insertedId = insertResult.insertedId;
  //       console.log(`Saved OraclePay callback with ID: ${insertedId}`);
  //     } catch (err) {
  //       if (err.code === 11000) {
  //         // Duplicate transaction_id - already processed
  //         console.log(`Duplicate transaction_id: ${transaction_id} - already exists`);
  //         return;
  //       }
  //       console.error("Error saving payload:", err);
  //       return;
  //     }

  //     // Process the payment
  //     const amountNum = Number(amount);
  //     let userId = null;
  //     let user = null;

  //     // Extract user ID from user_identity (format: ${userId}-${timestamp}-${random})
  //     if (user_identity && user_identity.includes('-')) {
  //       const parts = user_identity.split('-');
  //       if (parts.length >= 1) {
  //         const possibleUserId = parts[0];
  //         try {
  //           if (ObjectId.isValid(possibleUserId)) {
  //             user = await usersCol.findOne({ _id: new ObjectId(possibleUserId) });
  //             if (user) userId = user._id;
  //           }
  //         } catch (err) {
  //           console.log("Error finding user by ID from user_identity:", err.message);
  //         }
  //       }
  //     }

  //     // If not found, try to find by invoice_number
  //     if (!user && invoice_number) {
  //       // Try to extract from invoice_number (format: INV-${userId}-${timestamp})
  //       if (invoice_number.startsWith('INV-')) {
  //         const parts = invoice_number.split('-');
  //         if (parts.length >= 2) {
  //           const possibleUserId = parts[1];
  //           try {
  //             if (ObjectId.isValid(possibleUserId)) {
  //               user = await usersCol.findOne({ _id: new ObjectId(possibleUserId) });
  //               if (user) userId = user._id;
  //             }
  //           } catch (err) {
  //             console.log("Error finding user by ID from invoice_number:", err.message);
  //           }
  //         }
  //       }
  //     }

  //     // Try to find by checkout_items.userId
  //     if (!user && checkout_items && checkout_items.userId) {
  //       try {
  //         if (ObjectId.isValid(checkout_items.userId)) {
  //           user = await usersCol.findOne({ _id: new ObjectId(checkout_items.userId) });
  //           if (user) userId = user._id;
  //         }
  //       } catch (err) {
  //         console.log("Error finding user by checkout_items.userId:", err.message);
  //       }
  //     }

  //     // Try to find by user_identity as username
  //     if (!user) {
  //       user = await usersCol.findOne({ username: user_identity });
  //       if (user) userId = user._id;
  //     }

  //     // Try to find by user_identity as email
  //     if (!user) {
  //       user = await usersCol.findOne({ email: user_identity });
  //       if (user) userId = user._id;
  //     }

  //     // Try to find by user_identity as phone
  //     if (!user) {
  //       user = await usersCol.findOne({ phone: user_identity });
  //       if (user) userId = user._id;
  //     }

  //     if (!user) {
  //       console.error(`User not found for user_identity: ${user_identity}`);
        
  //       // Update record to indicate user not found
  //       await oraclePayDepositCol.updateOne(
  //         { _id: insertedId },
  //         { 
  //           $set: { 
  //             processed: false, 
  //             reason: "USER_NOT_FOUND",
  //             user_identity: user_identity,
  //             invoice_number: invoice_number,
  //             checkedAt: new Date() 
  //           } 
  //         }
  //       );
        
  //       return;
  //     }

  //     console.log(`Found user: ${user.username} (${user._id})`);

  //     // Find the original deposit record from deposits collection
  //     let originalDeposit = null;
      
  //     // Try to find by paymentId or userIdentifyAddress from checkout_items
  //     if (checkout_items && checkout_items.userId) {
  //       originalDeposit = await depositsCol.findOne({
  //         userId: user._id,
  //         status: "pending",
  //         "checkoutItems.userId": user._id.toString()
  //       });
  //     }

  //     // Try to find by invoice_number
  //     if (!originalDeposit && invoice_number) {
  //       originalDeposit = await depositsCol.findOne({
  //         userId: user._id,
  //         status: "pending",
  //         invoiceNumber: invoice_number
  //       });
  //     }

  //     // Try to find by session_code
  //     if (!originalDeposit && session_code) {
  //       originalDeposit = await depositsCol.findOne({
  //         userId: user._id,
  //         status: "pending",
  //         oraclePaySessionCode: session_code
  //       });
  //     }

  //     // Find most recent pending deposit
  //     if (!originalDeposit) {
  //       originalDeposit = await depositsCol.findOne({
  //         userId: user._id,
  //         status: "pending"
  //       }, {
  //         sort: { createdAt: -1 }
  //       });
  //     }

  //     // Extract bonus information from checkout_items
  //     let bonusInfo = {
  //       bonusType: 'none',
  //       bonusCode: '',
  //       bonusAmount: 0,
  //       wageringRequirement: 0,
  //       method: bank || 'oraclepay'
  //     };

  //     if (checkout_items && checkout_items.selectedBonus) {
  //       bonusInfo = {
  //         bonusType: checkout_items.selectedBonus.type || checkout_items.selectedBonus.bonusType || 'none',
  //         bonusCode: checkout_items.selectedBonus.code || checkout_items.selectedBonus.bonusCode || '',
  //         bonusAmount: Number(checkout_items.selectedBonus.calculatedAmount) || 0,
  //         wageringRequirement: Number(checkout_items.selectedBonus.wageringRequirement) || 0,
  //         method: checkout_items.method || bank || 'oraclepay'
  //       };
  //     } else if (originalDeposit) {
  //       bonusInfo = {
  //         bonusType: originalDeposit.bonusType || 'none',
  //         bonusCode: originalDeposit.bonusCode || '',
  //         bonusAmount: Number(originalDeposit.bonusAmount) || 0,
  //         wageringRequirement: Number(originalDeposit.wageringRequirement) || 0,
  //         method: originalDeposit.method || bank || 'oraclepay'
  //       };
  //     }

  //     // Calculate total credit with bonus
  //     const totalCredit = amountNum + bonusInfo.bonusAmount;

  //     // Prepare deposit record for user's depositHistory
  //     const depositRecord = {
  //       method: bonusInfo.method,
  //       amount: amountNum,
  //       status: 'completed',
  //       transactionId: transaction_id,
  //       sessionCode: session_code,
  //       bank: bank,
  //       invoiceNumber: invoice_number,
  //       bonusApplied: bonusInfo.bonusAmount > 0,
  //       bonusType: bonusInfo.bonusType,
  //       bonusAmount: bonusInfo.bonusAmount,
  //       bonusCode: bonusInfo.bonusCode,
  //       wageringRequirement: bonusInfo.wageringRequirement,
  //       orderId: `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  //       paymentUrl: footprint || '',
  //       playerbalance: originalDeposit?.playerbalance || user.balance || 0,
  //       processedAt: new Date(),
  //       completedAt: new Date(),
  //       createdAt: new Date()
  //     };

  //     // Get the matched user instance for mongoose operations if needed
  //     const matchedUser = await User.findById(user._id);
      
  //     if (matchedUser) {
  //       matchedUser.depositamount = amountNum;
  //       matchedUser.waigeringneed = bonusInfo.wageringRequirement;
  //       matchedUser.total_bet = 0;
  //       matchedUser.affiliatedeposit = (matchedUser.affiliatedeposit || 0) + amountNum;
  //       await matchedUser.save();
  //     }

  //     // Prepare transaction record
  //     const transactionRecord = {
  //       type: 'deposit',
  //       amount: amountNum,
  //       balanceBefore: user.balance || 0,
  //       balanceAfter: (user.balance || 0) + totalCredit,
  //       description: `Deposit via OraclePay (${bank})${bonusInfo.bonusAmount > 0 ? ` with ${bonusInfo.bonusType} bonus` : ''}`,
  //       referenceId: transaction_id,
  //       sessionCode: session_code,
  //       metadata: {
  //         bank,
  //         invoice_number,
  //         footprint
  //       },
  //       createdAt: new Date()
  //     };

  //     // Update user balance and records
  //     const updateOperations = {
  //       $inc: {
  //         balance: totalCredit,
  //         total_deposit: amountNum,
  //         lifetime_deposit: amountNum
  //       },
  //       $push: {
  //         transactionHistory: transactionRecord
  //       }
  //     };

  //     // Handle bonus if applicable
  //     if (bonusInfo.bonusAmount > 0) {
  //       // Add to bonusBalance
  //       updateOperations.$inc.bonusBalance = bonusInfo.bonusAmount;

  //       // Prepare bonus activity log
  //       const bonusActivityLog = {
  //         bonusType: bonusInfo.bonusType,
  //         bonusAmount: bonusInfo.bonusAmount,
  //         depositAmount: amountNum,
  //         sessionCode: session_code,
  //         transactionId: transaction_id,
  //         activatedAt: new Date(),
  //         status: 'active'
  //       };
        
  //       if (bonusInfo.bonusCode) {
  //         bonusActivityLog.bonusCode = bonusInfo.bonusCode;
  //       }
        
  //       updateOperations.$push = updateOperations.$push || {};
  //       updateOperations.$push.bonusActivityLogs = bonusActivityLog;

  //       // Prepare active bonus record
  //       const activeBonusRecord = {
  //         bonusType: bonusInfo.bonusType,
  //         amount: bonusInfo.bonusAmount,
  //         originalAmount: bonusInfo.bonusAmount,
  //         wageringRequirement: bonusInfo.wageringRequirement > 0 ? bonusInfo.wageringRequirement : 
  //                             bonusInfo.bonusType === 'first_deposit' ? 30 : 
  //                             bonusInfo.bonusType === 'special_bonus' ? 30 : 3,
  //         amountWagered: 0,
  //         sessionCode: session_code,
  //         transactionId: transaction_id,
  //         createdAt: new Date(),
  //         expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  //         status: 'active'
  //       };
        
  //       if (bonusInfo.bonusCode) {
  //         activeBonusRecord.bonusCode = bonusInfo.bonusCode;
  //       }
        
  //       // Initialize activeBonuses array if it doesn't exist
  //       if (!user.bonusInfo || !user.bonusInfo.activeBonuses) {
  //         updateOperations.$set = updateOperations.$set || {};
  //         updateOperations.$set["bonusInfo.activeBonuses"] = [];
  //       }
        
  //       updateOperations.$push["bonusInfo.activeBonuses"] = activeBonusRecord;

  //       // Mark first deposit bonus as claimed if applicable
  //       if (bonusInfo.bonusType === 'first_deposit') {
  //         updateOperations.$set = updateOperations.$set || {};
  //         updateOperations.$set["bonusInfo.firstDepositBonusClaimed"] = true;
  //       }
  //     }

  //     // Execute the update
  //     const updateResult = await usersCol.updateOne(
  //       { _id: user._id },
  //       updateOperations
  //     );

  //     if (updateResult.modifiedCount === 0) {
  //       throw new Error("Failed to update user record");
  //     }

  //     console.log(`User balance updated: +${totalCredit} (${amountNum} + ${bonusInfo.bonusAmount} bonus)`);

  //     // Update the deposit record in deposits collection to completed
  //     if (originalDeposit && originalDeposit._id) {
  //       await depositsCol.updateOne(
  //         { _id: originalDeposit._id },
  //         {
  //           $set: {
  //             status: "completed",
  //             transactionId: transaction_id,
  //             sessionCode: session_code,
  //             bank: bank,
  //             completedAt: new Date(),
  //             updatedAt: new Date()
  //           }
  //         }
  //       );
  //       console.log(`Updated deposit record: ${originalDeposit._id}`);
  //     }

  //     // Update user's depositHistory
  //     await usersCol.updateOne(
  //       { 
  //         _id: user._id,
  //         "depositHistory.status": "pending"
  //       },
  //       {
  //         $set: {
  //           "depositHistory.$[elem].status": "completed",
  //           "depositHistory.$[elem].transactionId": transaction_id,
  //           "depositHistory.$[elem].sessionCode": session_code,
  //           "depositHistory.$[elem].bank": bank,
  //           "depositHistory.$[elem].completedAt": new Date(),
  //           "depositHistory.$[elem].processedAt": new Date()
  //         }
  //       },
  //       {
  //         arrayFilters: [{ "elem.status": "pending" }],
  //         multi: false,
  //         sort: { "elem.createdAt": -1 }
  //       }
  //     );

  //     // Add the new completed deposit to history
  //     await usersCol.updateOne(
  //       { _id: user._id },
  //       {
  //         $push: {
  //           depositHistory: {
  //             $each: [depositRecord],
  //             $position: 0,
  //             $slice: 20 // Keep only last 20 deposits
  //           }
  //         }
  //       }
  //     );

  //     // Mark this deposit as processed in OraclePay collection
  //     await oraclePayDepositCol.updateOne(
  //       { _id: insertedId },
  //       {
  //         $set: {
  //           processed: true,
  //           processedAt: new Date(),
  //           userId: user._id,
  //           username: user.username,
  //           amount: amountNum,
  //           bonusAmount: bonusInfo.bonusAmount,
  //           totalCredit: totalCredit,
  //           bank: bank,
  //           userData: {
  //             previousBalance: user.balance || 0,
  //             newBalance: (user.balance || 0) + totalCredit,
  //             previousBonusBalance: user.bonusBalance || 0,
  //             newBonusBalance: (user.bonusBalance || 0) + bonusInfo.bonusAmount
  //           },
  //           bonusDetails: bonusInfo
  //         }
  //       }
  //     );

  //     console.log(`Successfully processed OraclePay payment for user ${user.username}: ${amountNum} ${bank}`);

  //   } catch (err) {
  //     console.error("OraclePay callback processing error:", err);
  //     // Don't return error response since we already sent 'OK'
  //   }
  // });

// OraclePay Callback webhook endpoint (UPDATED WITH COIN BONUS)
router.post("/oraclepay-callback", async (req, res) => {
  try {
    const db = req.app.locals?.db;
    if (!db) {
      return res.status(500).json({ success: false, message: "Database not initialized" });
    }

    // OraclePay sends the webhook payload according to their documentation
    const payload = req.body || {};
    const {
      status,
      invoice_number,
      amount,
      transaction_id,
      session_code,
      user_identity,
      checkout_items,
      footprint,
      bank
    } = payload;

    console.log("OraclePay Callback received:", {
      status,
      invoice_number,
      amount,
      transaction_id,
      session_code,
      user_identity,
      bank
    });

    // ALWAYS respond with 'OK' first as per OraclePay documentation
    res.status(200).send('OK');

    // Collections
    const oraclePayDepositCol = db.collection("OraclePay-deposit");
    const usersCol = db.collection("users");
    const depositsCol = db.collection("deposits");
    const ObjectId = require('mongodb').ObjectId;

    // Ensure unique index on transaction_id to avoid duplicates
    try {
      await oraclePayDepositCol.createIndex({ transaction_id: 1 }, { unique: true, sparse: true });
      await oraclePayDepositCol.createIndex({ session_code: 1 }, { sparse: true });
    } catch (e) {
      // ignore if already exists
    }

    // Only process COMPLETED payments
    if (status !== "COMPLETED") {
      console.log(`Payment not completed: ${status}`);
      
      await oraclePayDepositCol.insertOne({
        ...payload,
        receivedAt: new Date(),
        processed: false,
        reason: `STATUS_${status}`
      }).catch(err => {
        if (err.code !== 11000) console.error("Error saving non-completed payload:", err);
      });
      
      return;
    }

    // Validate required fields for completed payment
    if (!transaction_id || !user_identity || !amount || amount <= 0) {
      console.error("Missing required fields in completed payment:", {
        transaction_id,
        user_identity,
        amount
      });
      
      await oraclePayDepositCol.insertOne({
        ...payload,
        receivedAt: new Date(),
        processed: false,
        reason: "MISSING_REQUIRED_FIELDS"
      }).catch(err => {
        if (err.code !== 11000) console.error("Error saving invalid payload:", err);
      });
      
      return;
    }

    // Check for duplicate transaction
    const existing = await oraclePayDepositCol.findOne({ transaction_id });
    if (existing && existing.processed === true) {
      console.log(`Duplicate webhook for transaction: ${transaction_id} - already processed`);
      return;
    }

    // Save incoming payload
    const baseDoc = {
      ...payload,
      receivedAt: new Date(),
      processed: false,
      checkout_items: checkout_items || {},
      bank: bank || 'unknown'
    };

    let insertedId = null;
    try {
      const insertResult = await oraclePayDepositCol.insertOne(baseDoc);
      insertedId = insertResult.insertedId;
      console.log(`Saved OraclePay callback with ID: ${insertedId}`);
    } catch (err) {
      if (err.code === 11000) {
        console.log(`Duplicate transaction_id: ${transaction_id} - already exists`);
        return;
      }
      console.error("Error saving payload:", err);
      return;
    }

    // Process the payment
    const amountNum = Number(amount);
    let userId = null;
    let user = null;

    // Extract user ID from user_identity (format: ${userId}-${timestamp}-${random})
    if (user_identity && user_identity.includes('-')) {
      const parts = user_identity.split('-');
      if (parts.length >= 1) {
        const possibleUserId = parts[0];
        try {
          if (ObjectId.isValid(possibleUserId)) {
            user = await usersCol.findOne({ _id: new ObjectId(possibleUserId) });
            if (user) userId = user._id;
          }
        } catch (err) {
          console.log("Error finding user by ID from user_identity:", err.message);
        }
      }
    }

    // If not found, try to find by invoice_number
    if (!user && invoice_number) {
      if (invoice_number.startsWith('INV-')) {
        const parts = invoice_number.split('-');
        if (parts.length >= 2) {
          const possibleUserId = parts[1];
          try {
            if (ObjectId.isValid(possibleUserId)) {
              user = await usersCol.findOne({ _id: new ObjectId(possibleUserId) });
              if (user) userId = user._id;
            }
          } catch (err) {
            console.log("Error finding user by ID from invoice_number:", err.message);
          }
        }
      }
    }

    // Try to find by checkout_items.userId
    if (!user && checkout_items && checkout_items.userId) {
      try {
        if (ObjectId.isValid(checkout_items.userId)) {
          user = await usersCol.findOne({ _id: new ObjectId(checkout_items.userId) });
          if (user) userId = user._id;
        }
      } catch (err) {
        console.log("Error finding user by checkout_items.userId:", err.message);
      }
    }

    // Try to find by user_identity as username
    if (!user) {
      user = await usersCol.findOne({ username: user_identity });
      if (user) userId = user._id;
    }

    // Try to find by user_identity as email
    if (!user) {
      user = await usersCol.findOne({ email: user_identity });
      if (user) userId = user._id;
    }

    // Try to find by user_identity as phone
    if (!user) {
      user = await usersCol.findOne({ phone: user_identity });
      if (user) userId = user._id;
    }

    if (!user) {
      console.error(`User not found for user_identity: ${user_identity}`);
      
      await oraclePayDepositCol.updateOne(
        { _id: insertedId },
        { 
          $set: { 
            processed: false, 
            reason: "USER_NOT_FOUND",
            user_identity: user_identity,
            invoice_number: invoice_number,
            checkedAt: new Date() 
          } 
        }
      );
      
      return;
    }

    console.log(`Found user: ${user.username} (${user._id})`);

    // Find the original deposit record from deposits collection
    let originalDeposit = null;
    
    if (checkout_items && checkout_items.userId) {
      originalDeposit = await depositsCol.findOne({
        userId: user._id,
        status: "pending",
        "checkoutItems.userId": user._id.toString()
      });
    }

    if (!originalDeposit && invoice_number) {
      originalDeposit = await depositsCol.findOne({
        userId: user._id,
        status: "pending",
        invoiceNumber: invoice_number
      });
    }

    if (!originalDeposit && session_code) {
      originalDeposit = await depositsCol.findOne({
        userId: user._id,
        status: "pending",
        oraclePaySessionCode: session_code
      });
    }

    if (!originalDeposit) {
      originalDeposit = await depositsCol.findOne({
        userId: user._id,
        status: "pending"
      }, {
        sort: { createdAt: -1 }
      });
    }

    // Extract bonus information from checkout_items
    let bonusInfo = {
      bonusType: 'none',
      bonusCode: '',
      bonusAmount: 0,
      wageringRequirement: 0,
      method: bank || 'oraclepay'
    };

    if (checkout_items && checkout_items.selectedBonus) {
      bonusInfo = {
        bonusType: checkout_items.selectedBonus.type || checkout_items.selectedBonus.bonusType || 'none',
        bonusCode: checkout_items.selectedBonus.code || checkout_items.selectedBonus.bonusCode || '',
        bonusAmount: Number(checkout_items.selectedBonus.calculatedAmount) || 0,
        wageringRequirement: Number(checkout_items.selectedBonus.wageringRequirement) || 0,
        method: checkout_items.method || bank || 'oraclepay'
      };
    } else if (originalDeposit) {
      bonusInfo = {
        bonusType: originalDeposit.bonusType || 'none',
        bonusCode: originalDeposit.bonusCode || '',
        bonusAmount: Number(originalDeposit.bonusAmount) || 0,
        wageringRequirement: Number(originalDeposit.wageringRequirement) || 0,
        method: originalDeposit.method || bank || 'oraclepay'
      };
    }

    // Calculate total credit with bonus
    const totalCredit = amountNum + bonusInfo.bonusAmount;

    // ========== ADD COIN BONUS HERE ==========
    // Calculate and add coin bonus based on deposit amount
    let coinBonus = 0;
    if (amountNum >= 10000) {
      coinBonus = 1500;
    } else if (amountNum >= 5000) {
      coinBonus = 500;
    } else if (amountNum >= 1000) {
      coinBonus = 100;
    }
    
    // If coin bonus is applicable, add to user's coinBalance
    if (coinBonus > 0) {
      const currentCoinBalance = user.coinBalance || 0;
      const newCoinBalance = currentCoinBalance + coinBonus;
      
      // Prepare coin history entry
      const coinHistoryEntry = {
        amount: coinBonus,
        reason: `deposit_bonus_${amountNum}_BDT`,
        date: new Date(),
        metadata: {
          depositAmount: amountNum,
          transactionId: transaction_id,
          sessionCode: session_code,
          bank: bank
        }
      };
      
      // We'll add this to the update operations below
      console.log(`🎉 User ${user.username} will receive ${coinBonus} coins for deposit of ${amountNum} BDT`);
    }
    // ========== END COIN BONUS ==========

    // Prepare deposit record for user's depositHistory
    const depositRecord = {
      method: bonusInfo.method,
      amount: amountNum,
      status: 'completed',
      transactionId: transaction_id,
      sessionCode: session_code,
      bank: bank,
      invoiceNumber: invoice_number,
      bonusApplied: bonusInfo.bonusAmount > 0,
      bonusType: bonusInfo.bonusType,
      bonusAmount: bonusInfo.bonusAmount,
      bonusCode: bonusInfo.bonusCode,
      wageringRequirement: bonusInfo.wageringRequirement,
      orderId: `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paymentUrl: footprint || '',
      playerbalance: originalDeposit?.playerbalance || user.balance || 0,
      processedAt: new Date(),
      completedAt: new Date(),
      createdAt: new Date()
    };

    // Get the matched user instance for mongoose operations if needed
    const matchedUser = await User.findById(user._id);
    
    if (matchedUser) {
      matchedUser.depositamount = amountNum;
      matchedUser.waigeringneed = bonusInfo.wageringRequirement;
      matchedUser.total_bet = 0;
      matchedUser.affiliatedeposit = (matchedUser.affiliatedeposit || 0) + amountNum;
      await matchedUser.save();
    }

    // Prepare transaction record
    const transactionRecord = {
      type: 'deposit',
      amount: amountNum,
      balanceBefore: user.balance || 0,
      balanceAfter: (user.balance || 0) + totalCredit,
      description: `Deposit via OraclePay (${bank})${bonusInfo.bonusAmount > 0 ? ` with ${bonusInfo.bonusType} bonus` : ''}`,
      referenceId: transaction_id,
      sessionCode: session_code,
      metadata: {
        bank,
        invoice_number,
        footprint
      },
      createdAt: new Date()
    };

    // Update user balance and records
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

    // Add coin bonus to update operations if applicable
    if (coinBonus > 0) {
      updateOperations.$inc.coinBalance = coinBonus;
      updateOperations.$push.coinHistory = {
        amount: coinBonus,
        reason: `deposit_bonus_${amountNum}_BDT`,
        date: new Date(),
        metadata: {
          depositAmount: amountNum,
          transactionId: transaction_id,
          sessionCode: session_code,
          bank: bank
        }
      };
      
      // Also add to transaction history for tracking
      updateOperations.$push.transactionHistory = {
        type: "coin_bonus",
        amount: coinBonus,
        balanceBefore: user.coinBalance || 0,
        balanceAfter: (user.coinBalance || 0) + coinBonus,
        description: `Deposit bonus: ${coinBonus} coins for depositing ${amountNum} BDT via ${bank}`,
        referenceId: transaction_id,
        metadata: {
          depositAmount: amountNum,
          sessionCode: session_code
        },
        createdAt: new Date()
      };
    }

    // Handle bonus if applicable
    if (bonusInfo.bonusAmount > 0) {
      updateOperations.$inc.bonusBalance = bonusInfo.bonusAmount;

      const bonusActivityLog = {
        bonusType: bonusInfo.bonusType,
        bonusAmount: bonusInfo.bonusAmount,
        depositAmount: amountNum,
        sessionCode: session_code,
        transactionId: transaction_id,
        activatedAt: new Date(),
        status: 'active'
      };
      
      if (bonusInfo.bonusCode) {
        bonusActivityLog.bonusCode = bonusInfo.bonusCode;
      }
      
      updateOperations.$push.bonusActivityLogs = bonusActivityLog;

      const activeBonusRecord = {
        bonusType: bonusInfo.bonusType,
        amount: bonusInfo.bonusAmount,
        originalAmount: bonusInfo.bonusAmount,
        wageringRequirement: bonusInfo.wageringRequirement > 0 ? bonusInfo.wageringRequirement : 
                            bonusInfo.bonusType === 'first_deposit' ? 30 : 
                            bonusInfo.bonusType === 'special_bonus' ? 30 : 3,
        amountWagered: 0,
        sessionCode: session_code,
        transactionId: transaction_id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'active'
      };
      
      if (bonusInfo.bonusCode) {
        activeBonusRecord.bonusCode = bonusInfo.bonusCode;
      }
      
      if (!user.bonusInfo || !user.bonusInfo.activeBonuses) {
        updateOperations.$set = updateOperations.$set || {};
        updateOperations.$set["bonusInfo.activeBonuses"] = [];
      }
      
      updateOperations.$push["bonusInfo.activeBonuses"] = activeBonusRecord;

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

    console.log(`✅ User balance updated: +${totalCredit} (${amountNum} + ${bonusInfo.bonusAmount} bonus)`);
    if (coinBonus > 0) {
      console.log(`✅ Added ${coinBonus} coins to user ${user.username} for deposit of ${amountNum} BDT`);
    }

    // Update the deposit record in deposits collection to completed
    if (originalDeposit && originalDeposit._id) {
      await depositsCol.updateOne(
        { _id: originalDeposit._id },
        {
          $set: {
            status: "completed",
            transactionId: transaction_id,
            sessionCode: session_code,
            bank: bank,
            coinBonus: coinBonus,
            completedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );
      console.log(`Updated deposit record: ${originalDeposit._id}`);
    }

    // Update user's depositHistory
    await usersCol.updateOne(
      { 
        _id: user._id,
        "depositHistory.status": "pending"
      },
      {
        $set: {
          "depositHistory.$[elem].status": "completed",
          "depositHistory.$[elem].transactionId": transaction_id,
          "depositHistory.$[elem].sessionCode": session_code,
          "depositHistory.$[elem].bank": bank,
          "depositHistory.$[elem].coinBonus": coinBonus,
          "depositHistory.$[elem].completedAt": new Date(),
          "depositHistory.$[elem].processedAt": new Date()
        }
      },
      {
        arrayFilters: [{ "elem.status": "pending" }],
        multi: false,
        sort: { "elem.createdAt": -1 }
      }
    );

    // Add the new completed deposit to history
    await usersCol.updateOne(
      { _id: user._id },
      {
        $push: {
          depositHistory: {
            $each: [depositRecord],
            $position: 0,
            $slice: 20
          }
        }
      }
    );

    // Mark this deposit as processed in OraclePay collection
    await oraclePayDepositCol.updateOne(
      { _id: insertedId },
      {
        $set: {
          processed: true,
          processedAt: new Date(),
          userId: user._id,
          username: user.username,
          amount: amountNum,
          bonusAmount: bonusInfo.bonusAmount,
          coinBonus: coinBonus,
          totalCredit: totalCredit,
          bank: bank,
          userData: {
            previousBalance: user.balance || 0,
            newBalance: (user.balance || 0) + totalCredit,
            previousBonusBalance: user.bonusBalance || 0,
            newBonusBalance: (user.bonusBalance || 0) + bonusInfo.bonusAmount,
            previousCoinBalance: user.coinBalance || 0,
            newCoinBalance: (user.coinBalance || 0) + coinBonus
          },
          bonusDetails: bonusInfo
        }
      }
    );

    console.log(`✅ Successfully processed OraclePay payment for user ${user.username}: ${amountNum} ${bank} + ${coinBonus} coins`);

  } catch (err) {
    console.error("OraclePay callback processing error:", err);
  }
});


  // List OraclePay deposits
  router.get("/oraclepay-deposits", async (req, res) => {
    try {
      const db = req.app.locals?.db;
      if (!db) {
        return res.status(500).json({ success: false, message: "Database not initialized" });
      }
      
      const { username, bank, processed, transaction_id, session_code } = req.query;
      const { dateFrom, dateTo, page = "1", limit = "20" } = req.query;

      const col = db.collection("OraclePay-deposit");
      const filter = {};

      if (username) {
        filter.$or = [
          { username },
          { user_identity: username }
        ];
      }
      
      if (bank) {
        filter.bank = bank;
      }
      
      if (typeof processed !== "undefined") {
        filter.processed = String(processed).toLowerCase() === "true";
      }
      
      if (transaction_id) {
        filter.transaction_id = transaction_id;
      }
      
      if (session_code) {
        filter.session_code = session_code;
      }
      
      if (dateFrom || dateTo) {
        filter.receivedAt = {};
        if (dateFrom) {
          const start = new Date(dateFrom);
          if (!isNaN(start.getTime())) filter.receivedAt.$gte = start;
        }
        if (dateTo) {
          const end = new Date(dateTo);
          if (!isNaN(end.getTime())) {
            const endExclusive = new Date(end.getTime() + 24 * 60 * 60 * 1000);
            filter.receivedAt.$lt = endExclusive;
          }
        }
      }

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      const sort = { processedAt: -1, receivedAt: -1 };

      // Aggregation pipeline to join user info
      const pipeline = [
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        {
          $unwind: {
            path: "$userInfo",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            "userInfo.password": 0,
            "userInfo.twoFactorSecret": 0
          }
        }
      ];

      const [items, total] = await Promise.all([
        col.aggregate(pipeline).toArray(),
        col.countDocuments(filter)
      ]);

      return res.status(200).json({
        success: true,
        data: items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasMore: skip + items.length < total
        }
      });
      
    } catch (err) {
      console.error("Error fetching OraclePay deposits:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch deposits",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  // Get OraclePay deposit by transaction_id or session_code
  router.get("/oraclepay-deposit/:identifier", async (req, res) => {
    try {
      const db = req.app.locals?.db;
      if (!db) {
        return res.status(500).json({ success: false, message: "Database not initialized" });
      }

      const { identifier } = req.params;
      const col = db.collection("OraclePay-deposit");

      // Try to find by transaction_id or session_code
      const deposit = await col.findOne({
        $or: [
          { transaction_id: identifier },
          { session_code: identifier }
        ]
      });

      if (!deposit) {
        return res.status(404).json({ 
          success: false, 
          message: "Deposit not found" 
        });
      }

      // Get user info if userId exists
      let userInfo = null;
      if (deposit.userId) {
        const usersCol = db.collection("users");
        userInfo = await usersCol.findOne(
          { _id: deposit.userId },
          { projection: { password: 0, twoFactorSecret: 0 } }
        );
      }

      return res.status(200).json({
        success: true,
        data: {
          ...deposit,
          userInfo
        }
      });

    } catch (err) {
      console.error("Error fetching OraclePay deposit:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch deposit",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });

  return router;
};