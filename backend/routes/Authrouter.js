const express = require("express");
const bcrypt = require("bcryptjs");
const Authrouter = express.Router();
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const Affiliate = require("../models/Affiliate");
const mongoose = require("mongoose");

// JWT Secret Keys
const JWT_SECRET = process.env.JWT_SECRET || "fsdfsdfsd43534";
const AFFILIATE_JWT_SECRET = process.env.AFFILIATE_JWT_SECRET || "dfsdfsdf535345";

// Function to generate a random player ID
const generatePlayerId = () => {
  const prefix = "PID";
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${randomNum}`;
};

// Helper function to get device info
const getDeviceInfo = (userAgent) => {
  let deviceType = 'unknown';
  let browser = 'unknown';
  let os = 'unknown';
  
  if (userAgent.includes('Mobile')) deviceType = 'mobile';
  else if (userAgent.includes('Tablet')) deviceType = 'tablet';
  else deviceType = 'desktop';
  
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return { deviceType, browser, os };
};

// Import models
const LoginLog = require('../models/LoginLog');
const MasterAffiliate = require("../models/MasterAffiliate");

// Try to import ClickTrack, but handle if it doesn't exist
let ClickTrack;
try {
  ClickTrack = require('../models/ClickTrack');
} catch (error) {
  console.log('ClickTrack model not found, creating simplified version...');
  ClickTrack = {
    findOne: () => Promise.resolve(null),
    findOneAndUpdate: () => Promise.resolve(null),
    prototype: {
      save: () => Promise.resolve()
    }
  };
}

// Helper function to validate payment details
const validatePaymentDetails = (paymentMethod, paymentData) => {
  switch (paymentMethod) {
    case 'bkash':
    case 'nagad':
    case 'rocket':
      if (!paymentData.phoneNumber) {
        return { isValid: false, message: `${paymentMethod} phone number is required` };
      }
      const phoneRegex = /^01[3-9]\d{8}$/;
      if (!phoneRegex.test(paymentData.phoneNumber)) {
        return { isValid: false, message: `Invalid ${paymentMethod} phone number format. Use Bangladeshi format: 01XXXXXXXXX` };
      }
      break;

    case 'binance':
      if (!paymentData.email) {
        return { isValid: false, message: 'Binance email is required' };
      }
      if (!paymentData.walletAddress) {
        return { isValid: false, message: 'Binance wallet address is required' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(paymentData.email)) {
        return { isValid: false, message: 'Invalid Binance email format' };
      }
      break;

    default:
      return { isValid: false, message: 'Invalid payment method' };
  }
  return { isValid: true };
};

// ==================== SIMPLIFIED SIGNUP ROUTE (NO OTP) ====================

Authrouter.post("/signup", async (req, res) => {
  try {
    const { currency, phone, username, password, confirmPassword, fullName, referralCode, affiliateCode } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    // Validation checks
    if (!phone || !username || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Phone, username, password, and confirm password are required" 
      });
    }

    if (!/^1[0-9]{9}$/.test(phone)) {
      return res.status(400).json({ 
        success: false,
        message: "Please enter a valid Bangladeshi phone number, starting with 1." 
      });
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        success: false,
        message: "Username can only contain lowercase letters, numbers, and underscores." 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: "Username must be at least 3 characters long." 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long." 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Passwords do not match." 
      });
    }

    // Handle regular user referral (manual input)
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid referral code" 
        });
      }
      referredBy = referrer._id;
    }

    // Check if user already exists (only username and phone, no email)
    const formattedPhone = `+880${phone}`;
    const existingUser = await User.findOne({
      $or: [{ username }, { phone: formattedPhone }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false,
          message: "Username already exists." 
        });
      }
      if (existingUser.phone === formattedPhone) {
        return res.status(400).json({ 
          success: false,
          message: "Phone number already registered." 
        });
      }
    }

    // Generate a unique player_id
    let player_id;
    let isUnique = false;
    
    while (!isUnique) {
      player_id = 'PL' + Math.random().toString(36).substr(2, 8).toUpperCase();
      const existingPlayer = await User.findOne({ player_id });
      if (!existingPlayer) {
        isUnique = true;
      }
    }

    // Create registration source tracking
    const registrationSource = {
      type: referredBy ? 'user_referral' : affiliateCode ? 'affiliate_referral' : 'direct',
      source: 'website',
      medium: 'organic',
      campaign: 'signup',
      userReferralCode: referralCode,
      affiliateCode: affiliateCode,
      landingPage: '/register',
      ipAddress,
      userAgent,
      timestamp: new Date()
    };

    // Create new user (no email field)
    const newUser = new User({
      currency: currency || "BDT",
      phone: formattedPhone,
      username,
      password,
      fullName: fullName || username,
      player_id,
      referredBy,
      registrationSource,
      isPhoneVerified: true // Auto-verified since no OTP
    });

    await newUser.save();

    // ------------------affiliate-part-----------------------
    let affiliateId = null;
    if (affiliateCode) {
      const affiliate = await Affiliate.findOne({ 
        affiliateCode: affiliateCode.toUpperCase(),
        status: 'active' 
      });

      if (affiliate) {
        affiliateId = affiliate._id;
        
        const registrationBonus = Number(affiliate.cpaRate) || 0;
        
        const validEarningsHistory = (affiliate.earningsHistory || []).filter(earning => 
          earning && 
          earning.sourceAmount !== undefined && 
          earning.sourceType !== undefined && 
          earning.sourceId !== undefined && 
          earning.referredUser !== undefined
        );
        
        const earningRecord = {
          amount: registrationBonus,
          type: 'registration_bonus',
          description: 'New user registration bonus',
          status: 'pending',
          referredUser: newUser._id,
          sourceId: newUser._id,
          sourceType: 'registration',
          commissionRate: 1,
          sourceAmount: registrationBonus,
          calculatedAmount: registrationBonus,
          earnedAt: new Date(),
          metadata: { currency: 'BDT' }
        };
        
        validEarningsHistory.push(earningRecord);
        
        await Affiliate.findByIdAndUpdate(affiliate._id, {
          $set: {
            earningsHistory: validEarningsHistory
          },
          $inc: { 
            totalEarnings: registrationBonus,
            pendingEarnings: registrationBonus,
            referralCount: 1
          },
          $push: {
            referredUsers: {
              user: newUser._id,
              joinedAt: new Date(),
              earnedAmount: registrationBonus,
              userStatus: 'active',
              lastActivity: new Date()
            }
          }
        });

        console.log(`Affiliate commission recorded: Affiliate ${affiliate._id} earned ${registrationBonus} BDT`);
      }
    }

    // Update regular user referrer's count if applicable
    if (referredBy) {
      try {
        await User.findByIdAndUpdate(referredBy, {
          $inc: { 
            referralCount: 1,
            referralEarnings: 50
          },
          $push: {
            referralUsers: {
              username: newUser.username,
              user: newUser._id,
              joinedAt: new Date(),
              earnedAmount: 50
            }
          }
        });

        await User.findByIdAndUpdate(referredBy, {
          $inc: { balance: 50 }
        });

        console.log(`User referral recorded: ${referredBy} earned 50 taka for referral`);

      } catch (referralError) {
        console.error('Error recording user referral:', referralError);
      }
    }

    // Update login information for the new user
    newUser.login_count = 1;
    newUser.last_login = new Date();
    newUser.first_login = false;
    await newUser.save();

    // Create a login log entry
    const { deviceType, browser, os } = getDeviceInfo(userAgent);
    
    const loginLog = new LoginLog({
      userId: newUser._id,
      username: newUser.username,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      status: 'success',
      failureReason: null
    });
    
    await loginLog.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return success response with token (no email in response)
    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: newUser._id,
        player_id: newUser.player_id,
        username: newUser.username,
        phone: newUser.phone,
        currency: newUser.currency,
        balance: newUser.balance,
        bonusBalance: newUser.bonusBalance,
        referralCode: newUser.referralCode,
        affiliateId: affiliateId,
        first_login: newUser.first_login,
        login_count: newUser.login_count,
        last_login: newUser.last_login,
        isUserReferred: !!referredBy,
        isAffiliateReferred: !!affiliateId,
        isPhoneVerified: true,
        isEmailVerified: false,
        kycStatus: newUser.kycStatus
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});
// ==================== SIMPLIFIED LOGIN ROUTE ====================

Authrouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Username and password are required" 
      });
    }

    const user = await User.findOne({ username }).select("+password");
    
    const { deviceType, browser, os } = getDeviceInfo(userAgent);

    if (!user) {
      const loginLog = new LoginLog({
        userId: null,
        username,
        ipAddress,
        userAgent,
        deviceType,
        browser,
        os,
        status: 'failed',
        failureReason: 'user_not_found'
      });
      
      await loginLog.save();
      
      return res.status(401).json({ 
        success: false,
        message: "Invalid username or password" 
      });
    }

    if (user.status !== 'active') {
      const loginLog = new LoginLog({
        userId: user._id,
        username,
        ipAddress,
        userAgent,
        deviceType,
        browser,
        os,
        status: 'failed',
        failureReason: `account_${user.status}`
      });
      
      await loginLog.save();
      
      return res.status(403).json({ 
        success: false,
        message: `Your account is ${user.status}. Please contact support.` 
      });
    }

    const isPasswordValid = await user.verifyPassword(password);
    
    if (!isPasswordValid) {
      const loginLog = new LoginLog({
        userId: user._id,
        username,
        ipAddress,
        userAgent,
        deviceType,
        browser,
        os,
        status: 'failed',
        failureReason: 'invalid_password'
      });
      
      await loginLog.save();
      
      return res.status(401).json({ 
        success: false,
        message: "Invalid username or password" 
      });
    }

    user.login_count = (user.login_count || 0) + 1;
    user.last_login = new Date();
    user.first_login = false;
    
    if (!user.loginHistory) {
      user.loginHistory = [];
    }
    
    user.loginHistory.push({
      ipAddress,
      device: deviceType,
      userAgent,
      location: 'Unknown',
      timestamp: new Date()
    });
    
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }
    
    await user.save();

    const loginLog = new LoginLog({
      userId: user._id,
      username,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      status: 'success',
      failureReason: null
    });
    
    await loginLog.save();

    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        player_id: user.player_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        currency: user.currency,
        balance: user.balance,
        bonusBalance: user.bonusBalance,
        total_deposit: user.total_deposit,
        total_withdraw: user.total_withdraw,
        total_bet: user.total_bet,
        total_wins: user.total_wins,
        referralCode: user.referralCode,
        role: user.role,
        status: user.status,
        first_login: user.first_login,
        login_count: user.login_count,
        last_login: user.last_login,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        kycStatus: user.kycStatus,
        language: user.language,
        themePreference: user.themePreference,
        avatar: user.avatar,
        accountAgeInDays: user.accountAgeInDays,
        isNewUser: user.isNewUser,
        availableBalance: user.availableBalance,
        withdrawableAmount: user.withdrawableAmount,
        wageringStatus: user.wageringStatus,
        isAffiliateReferred: user.isAffiliateReferred,
        availableBonuses: user.getAvailableBonusOffers ? user.getAvailableBonusOffers() : []
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error during login" 
    });
  }
});

// ==================== OTP ROUTES (KEPT BUT MODIFIED TO RETURN SUCCESS WITHOUT OTP) ====================

// Request OTP for signup - Now just returns success without sending OTP
Authrouter.post("/request-signup-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Format phone number for Bangladesh
    const formattedPhone = formatBangladeshPhone(phone);
    
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladeshi phone number. Please use a valid 11-digit number starting with 01"
      });
    }

    // Check if phone is already registered
    const existingUser = await User.findOne({ phone: formattedPhone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This phone number is already registered. Please login instead."
      });
    }

    // Return success without OTP (OTP is removed)
    res.json({
      success: true,
      message: "Phone number verified. Please complete your registration.",
      data: {
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        phone: formattedPhone
      }
    });

  } catch (error) {
    console.error("Request signup OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Verify OTP and signup - Now just creates user directly
Authrouter.post("/verify-signup-otp", async (req, res) => {
  try {
    const { phone, userData } = req.body;

    if (!phone || !userData) {
      return res.status(400).json({
        success: false,
        message: "Phone and user data are required"
      });
    }

    // Format phone number
    const formattedPhone = formatBangladeshPhone(phone);
    
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladeshi phone number"
      });
    }

    // Now create the user
    const { username, password, confirmPassword, fullName, email, referralCode, affiliateCode } = userData;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    // Validation checks
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Username, password, and confirm password are required" 
      });
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        success: false,
        message: "Username can only contain lowercase letters, numbers, and underscores." 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: "Username must be at least 3 characters long." 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long." 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Passwords do not match." 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { phone: formattedPhone }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false,
          message: "Username already exists." 
        });
      }
      if (existingUser.phone === formattedPhone) {
        return res.status(400).json({ 
          success: false,
          message: "Phone number already registered." 
        });
      }
      if (email && existingUser.email === email) {
        return res.status(400).json({ 
          success: false,
          message: "Email already registered." 
        });
      }
    }

    // Handle referrals
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid referral code" 
        });
      }
      referredBy = referrer._id;
    }

    // Generate unique player_id
    let player_id;
    let isUnique = false;
    
    while (!isUnique) {
      player_id = 'PL' + Math.random().toString(36).substr(2, 8).toUpperCase();
      const existingPlayer = await User.findOne({ player_id });
      if (!existingPlayer) {
        isUnique = true;
      }
    }

    // Create registration source tracking
    const registrationSource = {
      type: referredBy ? 'user_referral' : affiliateCode ? 'affiliate_referral' : 'direct',
      source: 'website',
      medium: 'organic',
      campaign: 'signup',
      userReferralCode: referralCode,
      affiliateCode: affiliateCode,
      landingPage: '/register',
      ipAddress,
      userAgent,
      timestamp: new Date()
    };

    // Create new user
    const newUser = new User({
      phone: formattedPhone,
      username,
      password,
      fullName: fullName || username,
      email: email || null,
      player_id,
      referredBy,
      registrationSource,
      isPhoneVerified: true
    });

    await newUser.save();

    // Handle affiliate referral
    let affiliateId = null;
    if (affiliateCode) {
      const affiliate = await Affiliate.findOne({ 
        affiliateCode: affiliateCode.toUpperCase(),
        status: 'active' 
      });

      if (affiliate) {
        affiliateId = affiliate._id;
        const registrationBonus = Number(affiliate.cpaRate) || 0;
        
        const validEarningsHistory = (affiliate.earningsHistory || []).filter(earning => 
          earning && earning.sourceAmount !== undefined
        );
        
        const earningRecord = {
          amount: registrationBonus,
          type: 'registration_bonus',
          description: 'New user registration bonus',
          status: 'pending',
          referredUser: newUser._id,
          sourceId: newUser._id,
          sourceType: 'registration',
          commissionRate: 1,
          sourceAmount: registrationBonus,
          calculatedAmount: registrationBonus,
          earnedAt: new Date(),
          metadata: { currency: 'BDT' }
        };
        
        validEarningsHistory.push(earningRecord);
        
        await Affiliate.findByIdAndUpdate(affiliate._id, {
          $set: { earningsHistory: validEarningsHistory },
          $inc: { 
            totalEarnings: registrationBonus,
            pendingEarnings: registrationBonus,
            referralCount: 1
          },
          $push: {
            referredUsers: {
              user: newUser._id,
              joinedAt: new Date(),
              earnedAmount: registrationBonus,
              userStatus: 'active',
              lastActivity: new Date()
            }
          }
        });
      }
    }

    // Handle user referral
    if (referredBy) {
      try {
        await User.findByIdAndUpdate(referredBy, {
          $inc: { 
            referralCount: 1,
            referralEarnings: 50
          },
          $push: {
            referralUsers: {
              username: newUser.username,
              user: newUser._id,
              joinedAt: new Date(),
              earnedAmount: 50
            }
          }
        });

        await User.findByIdAndUpdate(referredBy, {
          $inc: { balance: 50 }
        });

      } catch (referralError) {
        console.error('Error recording user referral:', referralError);
      }
    }

    // Update login information
    newUser.login_count = 1;
    newUser.last_login = new Date();
    newUser.first_login = false;
    await newUser.save();

    // Create login log
    const { deviceType, browser, os } = getDeviceInfo(userAgent);
    
    const loginLog = new LoginLog({
      userId: newUser._id,
      username: newUser.username,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      status: 'success'
    });
    
    await loginLog.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: newUser._id,
        player_id: newUser.player_id,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        currency: newUser.currency,
        balance: newUser.balance,
        referralCode: newUser.referralCode,
        affiliateId: affiliateId,
        first_login: newUser.first_login,
        login_count: newUser.login_count,
        last_login: newUser.last_login,
        isPhoneVerified: true
      }
    });

  } catch (error) {
    console.error("Verify signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});

// Request OTP for login - Now just returns success
Authrouter.post("/request-login-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const formattedPhone = formatBangladeshPhone(phone);
    
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladeshi phone number"
      });
    }

    const user = await User.findOne({ phone: formattedPhone });
    
    if (!user) {
      return res.json({
        success: true,
        message: "If this phone number is registered, you can login with your password"
      });
    }

    res.json({
      success: true,
      message: "Please login with your username and password",
      data: {
        phone: formattedPhone,
        username: user.username
      }
    });

  } catch (error) {
    console.error("Request login OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Verify OTP and login - Now just returns login info
Authrouter.post("/verify-login-otp", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const isPasswordValid = await user.verifyPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password"
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';
    
    user.login_count = (user.login_count || 0) + 1;
    user.last_login = new Date();
    user.first_login = false;
    
    await user.save();

    const { deviceType, browser, os } = getDeviceInfo(userAgent);
    
    const loginLog = new LoginLog({
      userId: user._id,
      username: user.username,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
      status: 'success'
    });
    
    await loginLog.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        player_id: user.player_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        currency: user.currency,
        balance: user.balance,
        bonusBalance: user.bonusBalance,
        referralCode: user.referralCode,
        first_login: user.first_login,
        login_count: user.login_count,
        last_login: user.last_login,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        kycStatus: user.kycStatus
      }
    });

  } catch (error) {
    console.error("Verify login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Resend OTP for signup - Now just returns success
Authrouter.post("/resend-signup-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const formattedPhone = formatBangladeshPhone(phone);
    
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladeshi phone number"
      });
    }

    res.json({
      success: true,
      message: "Please complete your registration with username and password",
      data: {
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        phone: formattedPhone
      }
    });

  } catch (error) {
    console.error("Resend signup OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Request OTP for password reset - Now just returns success
Authrouter.post("/request-password-reset-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const formattedPhone = formatBangladeshPhone(phone);
    
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladeshi phone number"
      });
    }

    const user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      return res.json({
        success: true,
        message: "If this phone number is registered, you can reset your password"
      });
    }

    res.json({
      success: true,
      message: "Please contact support to reset your password",
      data: {
        phone: formattedPhone
      }
    });

  } catch (error) {
    console.error("Request password reset OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Forgot password request OTP
Authrouter.post("/forgot-password/request-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const formattedPhone = formatBangladeshPhone(phone);
    
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladeshi phone number"
      });
    }

    const user = await User.findOne({ phone: formattedPhone });
    
    if (!user) {
      return res.json({
        success: true,
        message: "If this phone number is registered, you can reset your password"
      });
    }

    res.json({
      success: true,
      message: "Please contact support to reset your password",
      data: {
        phone: formattedPhone
      }
    });

  } catch (error) {
    console.error("Request password reset OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Verify OTP for password reset - Now just returns token
Authrouter.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const formattedPhone = formatBangladeshPhone(phone);
    
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladeshi phone number"
      });
    }

    const user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const resetToken = jwt.sign(
      { 
        userId: user._id, 
        purpose: 'password_reset',
        phone: user.phone 
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: "Verification successful",
      data: {
        resetToken,
        phone: formattedPhone
      }
    });

  } catch (error) {
    console.error("Verify password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Reset password
Authrouter.post("/forgot-password/reset", async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token, new password, and confirm password are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      
      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({
          success: false,
          message: "Invalid reset token purpose"
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: "Reset token has expired. Please request a new password reset."
        });
      }
      return res.status(400).json({
        success: false,
        message: "Invalid reset token"
      });
    }

    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Resend OTP for password reset
Authrouter.post("/forgot-password/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const formattedPhone = formatBangladeshPhone(phone);
    
    if (!formattedPhone) {
      return res.status(400).json({
        success: false,
        message: "Invalid Bangladeshi phone number"
      });
    }

    res.json({
      success: true,
      message: "Please contact support to reset your password",
      data: {
        phone: formattedPhone
      }
    });

  } catch (error) {
    console.error("Resend password reset OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Reset password with OTP (simplified)
Authrouter.post("/reset-password-with-otp", async (req, res) => {
  try {
    const { phone, newPassword, confirmPassword } = req.body;

    if (!phone || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone, new password, and confirm password are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const formattedPhone = formatBangladeshPhone(phone);
    const user = await User.findOne({ phone: formattedPhone }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successfully. You can now login with your new password."
    });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Helper function to format phone number for Bangladesh
function formatBangladeshPhone(phone) {
  if (!phone) return null;
  
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(2);
  }
  
  if (cleaned.length === 10 && cleaned.startsWith('1')) {
    return `+880${cleaned}`;
  }
  
  return null;
}

// ==================== REMAINING ROUTES (UNCHANGED) ====================

// Check if regular user referral code exists
Authrouter.get("/check-referral/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required"
      });
    }
    
    const user = await User.findOne({ referralCode: code.toUpperCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Referral code is valid",
      referrer: {
        username: user.username,
        player_id: user.player_id
      }
    });
  } catch (error) {
    console.error("Check referral error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get referral statistics
Authrouter.get("/referral-stats", async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const stats = {
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralEarnings: user.referralEarnings,
      referralUsers: user.referralUsers.length,
      referralLink: `${process.env.FRONTEND_URL || 'https://your-site.com'}/register?ref=${user.referralCode}`
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Referral stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Track affiliate click
Authrouter.post("/track-click", async (req, res) => {
  try {
    const { affiliateCode, source, campaign, medium, landingPage } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!affiliateCode) {
      return res.status(400).json({
        success: false,
        message: "Affiliate code is required"
      });
    }

    const affiliate = await Affiliate.findOne({
      affiliateCode: affiliateCode.toUpperCase(),
      status: 'active'
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Invalid affiliate code"
      });
    }

    const clickId = 'CLK' + Math.random().toString(36).substr(2, 12).toUpperCase();

    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: { clickCount: 1 }
    });

    if (ClickTrack && ClickTrack.prototype && ClickTrack.prototype.save) {
      const clickData = new ClickTrack({
        affiliateId: affiliate._id,
        affiliateCode: affiliateCode.toUpperCase(),
        clickId,
        source: source || 'direct',
        campaign: campaign || 'general',
        medium: medium || 'referral',
        landingPage: landingPage || '/register',
        ipAddress,
        userAgent,
        timestamp: new Date()
      });
      await clickData.save();
    }

    res.cookie('affiliate_ref', affiliateCode.toUpperCase(), {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.cookie('click_id', clickId, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.json({
      success: true,
      message: "Click tracked successfully",
      clickId,
      affiliate: {
        name: affiliate.fullName,
        code: affiliate.affiliateCode
      }
    });

  } catch (error) {
    console.error("Track click error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Affiliate Registration Route
Authrouter.post("/affiliate/register", async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      company,
      website,
      promoMethod,
      paymentMethod,
      paymentDetails
    } = req.body;

    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email, password, first name, last name, and phone are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    if (paymentMethod) {
      switch (paymentMethod) {
        case 'bkash':
        case 'nagad':
        case 'rocket':
          if (!paymentDetails?.phoneNumber) {
            return res.status(400).json({
              success: false,
              message: `${paymentMethod} phone number is required`
            });
          }
          if (!/^01[3-9]\d{8}$/.test(paymentDetails.phoneNumber)) {
            return res.status(400).json({
              success: false,
              message: `Invalid ${paymentMethod} phone number. Use format: 01XXXXXXXXX`
            });
          }
          break;
        
        case 'binance':
          if (!paymentDetails?.email) {
            return res.status(400).json({
              success: false,
              message: "Binance email is required"
            });
          }
          if (!/\S+@\S+\.\S+/.test(paymentDetails.email)) {
            return res.status(400).json({
              success: false,
              message: "Binance email is invalid"
            });
          }
          if (!paymentDetails?.walletAddress) {
            return res.status(400).json({
              success: false,
              message: "Binance wallet address is required"
            });
          }
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: "Please select a valid payment method"
          });
      }
    }

    const existingAffiliate = await Affiliate.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    });

    if (existingAffiliate) {
      return res.status(400).json({
        success: false,
        message: "Affiliate with this email or phone already exists"
      });
    }

    const dbPaymentDetails = {};
    if (paymentMethod && paymentDetails) {
      dbPaymentDetails[paymentMethod] = paymentDetails;
      
      if (['bkash', 'nagad', 'rocket'].includes(paymentMethod)) {
        if (!dbPaymentDetails[paymentMethod].accountType) {
          dbPaymentDetails[paymentMethod].accountType = 'personal';
        }
      }
    }

    const affiliate = new Affiliate({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      phone,
      company: company || '',
      website: website || '',
      promoMethod: promoMethod || 'other',
      paymentMethod: paymentMethod || 'bkash',
      paymentDetails: dbPaymentDetails,
      status: 'pending',
      verificationStatus: 'unverified'
    });

    await affiliate.save();

    res.status(201).json({
      success: true,
      message: "Affiliate registered successfully. Please wait for admin approval.",
      affiliate: {
        id: affiliate._id,
        email: affiliate.email,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status,
        verificationStatus: affiliate.verificationStatus
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Affiliate with this email or phone already exists"
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error during registration"
    });
  }
});

// Affiliate login
Authrouter.post("/affiliate/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const affiliate = await Affiliate.findOne({ email: email.toLowerCase() });
    if (!affiliate) {
      return res.json({
        success: false,
        message: "Email or password is wrong!"
      });
    }

    if (affiliate.status !== 'active') {
      return res.json({
        success: false,
        message: `Your account is ${affiliate.status}. Please wait for admin approval before logging in.`
      });
    }

    const isPasswordValid = await affiliate.comparePassword(password);
    if (!isPasswordValid) {
      return res.json({
        success: false,
        message: "Email or password is wrong!"
      });
    }

    affiliate.lastLogin = new Date();
    await affiliate.save();

    const token = jwt.sign(
      { affiliateId: affiliate._id, email: affiliate.email },
      AFFILIATE_JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      affiliate: {
        id: affiliate._id,
        email: affiliate.email,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        fullName: affiliate.fullName,
        affiliateCode: affiliate.affiliateCode,
        status: affiliate.status,
        verificationStatus: affiliate.verificationStatus,
        lastLogin: affiliate.lastLogin
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login"
    });
  }
});

// Master Affiliate Login Route
Authrouter.post("/master-affiliate/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const masterAffiliate = await MasterAffiliate.findOne({ 
      email: email.toLowerCase(),
      role: 'master_affiliate'
    });

    if (!masterAffiliate) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (masterAffiliate.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your master affiliate account is ${masterAffiliate.status}. Please contact admin or your super affiliate for activation.`
      });
    }

    const isPasswordValid = await masterAffiliate.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    masterAffiliate.lastLogin = new Date();
    await masterAffiliate.save();

    const token = jwt.sign(
      { 
        masterAffiliateId: masterAffiliate._id, 
        email: masterAffiliate.email,
        role: 'master_affiliate',
        createdBy: masterAffiliate.createdBy
      },
      AFFILIATE_JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: "Master affiliate login successful",
      token,
      masterAffiliate: {
        id: masterAffiliate._id,
        email: masterAffiliate.email,
        firstName: masterAffiliate.firstName,
        lastName: masterAffiliate.lastName,
        fullName: masterAffiliate.fullName,
        affiliateCode: masterAffiliate.affiliateCode,
        role: masterAffiliate.role,
        status: masterAffiliate.status,
        verificationStatus: masterAffiliate.verificationStatus,
        commissionRate: masterAffiliate.commissionRate,
        depositRate: masterAffiliate.depositRate,
        totalEarnings: masterAffiliate.totalEarnings,
        pendingEarnings: masterAffiliate.pendingEarnings,
        paidEarnings: masterAffiliate.paidEarnings,
        referralCount: masterAffiliate.referralCount,
        lastLogin: masterAffiliate.lastLogin,
        createdBy: masterAffiliate.createdBy
      }
    });

  } catch (error) {
    console.error("Master affiliate login error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(500).json({
        success: false,
        message: "Token generation error"
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error during login"
    });
  }
});

// Check if affiliate referral code exists
Authrouter.get("/affiliate/check-referral/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Affiliate code is required"
      });
    }
    
    const affiliate = await Affiliate.findOne({ 
      affiliateCode: code.toUpperCase(),
      status: 'active'
    });
    
    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Invalid affiliate code"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Affiliate code is valid",
      affiliate: {
        name: affiliate.fullName,
        company: affiliate.company,
        affiliateCode: affiliate.affiliateCode
      }
    });
  } catch (error) {
    console.error("Check affiliate referral error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get affiliate profile
Authrouter.get("/affiliate/profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required"
      });
    }

    const decoded = jwt.verify(token, AFFILIATE_JWT_SECRET);
    const affiliate = await Affiliate.findById(decoded.affiliateId);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    res.json({
      success: true,
      affiliate: {
        id: affiliate._id,
        email: affiliate.email,
        firstName: affiliate.firstName,
        lastName: affiliate.lastName,
        fullName: affiliate.fullName,
        phone: affiliate.phone,
        company: affiliate.company,
        website: affiliate.website,
        affiliateCode: affiliate.affiliateCode,
        commissionRate: affiliate.commissionRate,
        totalEarnings: affiliate.totalEarnings,
        pendingEarnings: affiliate.pendingEarnings,
        paidEarnings: affiliate.paidEarnings,
        referralCount: affiliate.referralCount,
        clickCount: affiliate.clickCount,
        isActive: affiliate.isActive,
        isVerified: affiliate.isVerified,
        paymentMethod: affiliate.paymentMethod,
        minimumPayout: affiliate.minimumPayout,
        lastLogin: affiliate.lastLogin,
        createdAt: affiliate.createdAt
      }
    });
  } catch (error) {
    console.error("Get affiliate profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Get affiliate statistics
Authrouter.get("/affiliate-stats", async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied"
      });
    }

    const decoded = jwt.verify(token, AFFILIATE_JWT_SECRET);
    const affiliate = await Affiliate.findById(decoded.affiliateId);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        message: "Affiliate not found"
      });
    }

    const stats = {
      affiliateCode: affiliate.affiliateCode,
      customAffiliateCode: affiliate.customAffiliateCode,
      totalEarnings: affiliate.totalEarnings,
      pendingEarnings: affiliate.pendingEarnings,
      paidEarnings: affiliate.paidEarnings,
      referralCount: affiliate.referralCount,
      clickCount: affiliate.clickCount,
      conversionRate: affiliate.clickCount > 0 ? (affiliate.referralCount / affiliate.clickCount * 100).toFixed(2) : 0,
      commissionRate: (affiliate.commissionRate * 100).toFixed(1) + '%',
      referralLinks: {
        main: `${process.env.FRONTEND_URL || 'https://your-site.com'}/register?aff=${affiliate.affiliateCode}`,
        deposit: `${process.env.FRONTEND_URL || 'https://your-site.com'}/deposit?aff=${affiliate.affiliateCode}`,
        sports: `${process.env.FRONTEND_URL || 'https://your-site.com'}/sports?aff=${affiliate.affiliateCode}`
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Affiliate stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

module.exports = Authrouter;