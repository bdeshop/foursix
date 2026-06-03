const express = require("express");
const bcrypt = require("bcryptjs");
const Authrouter = express.Router();
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const Affiliate = require("../models/Affiliate");
const mongoose = require("mongoose");
const axios=require("axios")
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
// ==================== OTP & PHONE VERIFICATION ROUTES ====================

// OTP Configuration
const OTP_CONFIG = {
    EXPIRY_MINUTES: 5,
    CODE_LENGTH: 6,
    MAX_ATTEMPTS: 3,
    RESEND_COOLDOWN_SECONDS: 60,
    SENDER_ID:'8809617611338',
    API_BASE_URL:'https://xend.positiveapi.com/api/v3',
    TOKEN:"419|xFSHHY3vGlHDNE3XFijfExhQBpWsC64VsL51BYPO"
};

// Helper function to generate OTP
function generateOTP(length = OTP_CONFIG.CODE_LENGTH) {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Always 6 digits
}

// Helper function to format phone number for Bangladesh
function formatBangladeshPhone(phone) {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, remove it
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // If it starts with 880, remove the 88 part
    if (cleaned.startsWith('880')) {
        cleaned = cleaned.substring(2);
    }
    
    // Ensure it's a valid Bangladeshi number (10 digits starting with 1)
    if (cleaned.length === 10 && cleaned.startsWith('1')) {
        return `+880${cleaned}`;
    }
    
    return null;
}

// Helper function to send SMS via Xend API
// Helper function to send SMS via Xend API
async function sendSMS(phoneNumber, message) {
    try {
        // Format phone number for API (remove + and ensure 880 format)
        let apiPhone = phoneNumber.replace(/\D/g, '');
        if (apiPhone.startsWith('880')) {
            apiPhone = apiPhone;
        } else if (apiPhone.startsWith('1')) {
            apiPhone = '880' + apiPhone;
        }
        
        const url = `${OTP_CONFIG.API_BASE_URL}/sms/send`;
        
        // Prepare the request body
        const requestBody = {
            recipient: apiPhone,
            sender_id: OTP_CONFIG.SENDER_ID,
            message: message
        };

        console.log(`Sending SMS to ${apiPhone}: ${message.substring(0, 20)}...`);

        // Make POST request with Authorization header
        const response = await axios.post(url, requestBody, {
            headers: {
                'Authorization': `Bearer ${OTP_CONFIG.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Check response status
        if (response.data && response.data.status === 'success') {
            return { success: true, data: response.data };
        } else {
            console.error('SMS sending failed:', response.data);
            return { success: false, error: 'SMS sending failed' };
        }
    } catch (error) {
        console.error('Error sending SMS:', error.response?.data || error.message);
        return { 
            success: false, 
            error: error.response?.data?.message || error.message 
        };
    }
}

// Request OTP for phone verification during signup
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

        // Generate OTP
        const otpCode = generateOTP();
        
        // Calculate expiry time
        const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

        // Store OTP in memory (you can also use a separate OTP model in production)
        global.otpStore = global.otpStore || {};
        
        global.otpStore[formattedPhone] = {
            code: otpCode,
            expiresAt: expiresAt,
            attempts: 0,
            purpose: 'signup',
            createdAt: new Date()
        };

        // Prepare SMS message in Bengali for better user experience
        const message = `আপনার ভেরিফিকেশন কোড: ${otpCode}\nএই কোডটি ${OTP_CONFIG.EXPIRY_MINUTES} মিনিটের জন্য বৈধ।\n\nYour verification code is: ${otpCode}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`;

        // Send SMS
        const smsResult = await sendSMS(formattedPhone, message);

        // For development/testing, always return success with OTP
        if (process.env.NODE_ENV === 'development') {
            return res.json({
                success: true,
                message: 'OTP sent successfully (Development Mode)',
                data: {
                    otp: otpCode, // Only in development
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        }

        if (smsResult.success) {
            res.json({
                success: true,
                message: 'OTP sent successfully. Please check your phone.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        } else {
            console.error('SMS sending failed but OTP saved:', smsResult.error);
            res.json({
                success: true,
                message: 'OTP generated but SMS delivery failed. Please try again or use development mode.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone,
                    devOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
                }
            });
        }

    } catch (error) {
        console.error("Request signup OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Request OTP for login
Authrouter.post("/request-login-otp", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
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

        // Check if user exists with this phone
        const user = await User.findOne({ phone: formattedPhone });
        
        if (!user) {
            // Don't reveal that user doesn't exist for security reasons
            return res.json({
                success: true,
                message: "If this phone number is registered, you will receive an OTP"
            });
        }

        // Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

        // Store OTP in user record
        user.otp = {
            code: otpCode,
            expiresAt: expiresAt,
            purpose: 'login',
            verified: false
        };
        
        await user.save();

        // Prepare SMS message
        const message = `আপনার লগইন ভেরিফিকেশন কোড: ${otpCode}\nএই কোডটি ${OTP_CONFIG.EXPIRY_MINUTES} মিনিটের জন্য বৈধ।\n\nYour login verification code is: ${otpCode}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`;

        // Send SMS
        const smsResult = await sendSMS(formattedPhone, message);

        // For development/testing
        if (process.env.NODE_ENV === 'development') {
            return res.json({
                success: true,
                message: 'OTP sent successfully (Development Mode)',
                data: {
                    otp: otpCode,
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        }

        if (smsResult.success) {
            res.json({
                success: true,
                message: 'OTP sent successfully. Please check your phone.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        } else {
            console.error('SMS sending failed but OTP saved:', smsResult.error);
            res.json({
                success: true,
                message: 'OTP generated but SMS delivery failed. Please try again or contact support.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        }

    } catch (error) {
        console.error("Request login OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Verify OTP and signup
Authrouter.post("/verify-signup-otp", async (req, res) => {
    try {
        const { phone, otp, userData } = req.body;

        if (!phone || !otp || !userData) {
            return res.status(400).json({
                success: false,
                message: "Phone, OTP, and user data are required"
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

        // Check OTP from store
        global.otpStore = global.otpStore || {};
        const storedOTP = global.otpStore[formattedPhone];

        if (!storedOTP) {
            return res.status(400).json({
                success: false,
                message: "No OTP request found. Please request a new OTP."
            });
        }

        if (storedOTP.purpose !== 'signup') {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP purpose. Please request a new OTP."
            });
        }

        if (new Date() > new Date(storedOTP.expiresAt)) {
            // Clear expired OTP
            delete global.otpStore[formattedPhone];
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Track attempts
        storedOTP.attempts = (storedOTP.attempts || 0) + 1;
        
        if (storedOTP.attempts > OTP_CONFIG.MAX_ATTEMPTS) {
            delete global.otpStore[formattedPhone];
            return res.status(400).json({
                success: false,
                message: "Too many failed attempts. Please request a new OTP."
            });
        }

        // Verify OTP
        if (storedOTP.code !== otp.toString()) {
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${OTP_CONFIG.MAX_ATTEMPTS - storedOTP.attempts} attempts remaining.`
            });
        }

        // Clear OTP after successful verification
        delete global.otpStore[formattedPhone];

        // Now create the user (use your existing user creation logic)
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
            fullName,
            email: email || null,
            player_id,
            referredBy,
            registrationSource,
            isPhoneVerified: true // Phone is verified via OTP
        });

        await newUser.save();

        // Handle affiliate referral (use your existing affiliate logic)
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

        // Handle user referral (use your existing logic)
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
        console.error("Verify signup OTP error:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
});

// Verify OTP and login
Authrouter.post("/verify-login-otp", async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone and OTP are required"
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

        // Find user by phone
        const user = await User.findOne({ phone: formattedPhone }).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this phone number"
            });
        }

        // Check OTP
        if (!user.otp || user.otp.purpose !== 'login') {
            return res.status(400).json({
                success: false,
                message: "No login OTP request found. Please request a new OTP."
            });
        }

        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        if (user.otp.code !== otp.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again."
            });
        }

        // Mark OTP as verified
        user.otp.verified = true;
        
        // Update login info
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent') || 'unknown';
        
        user.login_count = (user.login_count || 0) + 1;
        user.last_login = new Date();
        user.first_login = false;
        
        await user.save();

        // Create login log
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

        // Generate JWT token
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
        console.error("Verify login OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Resend OTP for signup
Authrouter.post("/resend-signup-otp", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
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

        // Check cooldown
        global.otpStore = global.otpStore || {};
        const existingOTP = global.otpStore[formattedPhone];
        
        if (existingOTP) {
            const timeSinceLastRequest = (new Date() - new Date(existingOTP.createdAt)) / 1000;
            if (timeSinceLastRequest < OTP_CONFIG.RESEND_COOLDOWN_SECONDS) {
                const waitSeconds = Math.ceil(OTP_CONFIG.RESEND_COOLDOWN_SECONDS - timeSinceLastRequest);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitSeconds} seconds before requesting a new OTP`
                });
            }
        }

        // Generate new OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

        // Store new OTP
        global.otpStore[formattedPhone] = {
            code: otpCode,
            expiresAt: expiresAt,
            attempts: 0,
            purpose: 'signup',
            createdAt: new Date()
        };

        // Send SMS
        const message = `আপনার নতুন ভেরিফিকেশন কোড: ${otpCode}\nএই কোডটি ${OTP_CONFIG.EXPIRY_MINUTES} মিনিটের জন্য বৈধ।\n\nYour new verification code is: ${otpCode}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`;
        
        const smsResult = await sendSMS(formattedPhone, message);

        if (process.env.NODE_ENV === 'development') {
            return res.json({
                success: true,
                message: 'OTP resent successfully (Development Mode)',
                data: {
                    otp: otpCode,
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        }

        if (smsResult.success) {
            res.json({
                success: true,
                message: 'OTP resent successfully. Please check your phone.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        } else {
            res.json({
                success: true,
                message: 'OTP regenerated but SMS delivery failed. Please try again.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        }

    } catch (error) {
        console.error("Resend signup OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Request OTP for password reset
Authrouter.post("/request-password-reset-otp", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
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

        // Find user by phone
        const user = await User.findOne({ phone: formattedPhone });

        if (!user) {
            // Don't reveal that user doesn't exist for security
            return res.json({
                success: true,
                message: "If this phone number is registered, you will receive an OTP"
            });
        }

        // Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

        // Store OTP in user record
        user.otp = {
            code: otpCode,
            expiresAt: expiresAt,
            purpose: 'password_reset',
            verified: false
        };
        
        await user.save();

        // Send SMS
        const message = `আপনার পাসওয়ার্ড রিসেট কোড: ${otpCode}\nএই কোডটি ${OTP_CONFIG.EXPIRY_MINUTES} মিনিটের জন্য বৈধ।\n\nYour password reset code is: ${otpCode}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`;
        
        await sendSMS(formattedPhone, message);

        res.json({
            success: true,
            message: "If this phone number is registered, you will receive an OTP",
            data: process.env.NODE_ENV === 'development' ? { otp: otpCode } : undefined
        });

    } catch (error) {
        console.error("Request password reset OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
// Update the request-otp route - replace the existing one
Authrouter.post("/forgot-password/request-otp", async (req, res) => {
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

        // Check if user exists with this phone
        const user = await User.findOne({ phone: formattedPhone });
        
        if (!user) {
            // For security, don't reveal that user doesn't exist
            return res.json({
                success: true,
                message: "If this phone number is registered, you will receive an OTP"
            });
        }

        // Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

        // Store OTP in the EXISTING otp field (not resetPasswordOTP)
        user.otp = {
            code: otpCode,
            expiresAt: expiresAt,
            purpose: 'password_reset', // Change purpose to password_reset
            verified: false,
            attempts: 0,
            createdAt: new Date()
        };
        
        await user.save();

        // Prepare SMS message
        const message = `আপনার পাসওয়ার্ড রিসেট কোড: ${otpCode}\nএই কোডটি ${OTP_CONFIG.EXPIRY_MINUTES} মিনিটের জন্য বৈধ।\n\nYour password reset code is: ${otpCode}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`;

        // Send SMS
        const smsResult = await sendSMS(formattedPhone, message);

        // For development/testing
        if (process.env.NODE_ENV === 'development') {
            return res.json({
                success: true,
                message: 'OTP sent successfully (Development Mode)',
                data: {
                    otp: otpCode,
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        }

        if (smsResult.success) {
            res.json({
                success: true,
                message: 'OTP sent successfully. Please check your phone.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        } else {
            console.error('SMS sending failed but OTP saved:', smsResult.error);
            res.json({
                success: true,
                message: 'OTP generated but SMS delivery failed. Please try again or contact support.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone,
                    devOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
                }
            });
        }

    } catch (error) {
        console.error("Request password reset OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Update verify-otp route
Authrouter.post("/forgot-password/verify-otp", async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: "Phone number and OTP are required"
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

        // Find user by phone
        const user = await User.findOne({ phone: formattedPhone });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this phone number"
            });
        }

        // Check if OTP exists in the otp field
        if (!user.otp || user.otp.purpose !== 'password_reset') {
            return res.status(400).json({
                success: false,
                message: "No password reset request found. Please request a new OTP."
            });
        }

        // Track attempts
        user.otp.attempts = (user.otp.attempts || 0) + 1;
        
        if (user.otp.attempts > OTP_CONFIG.MAX_ATTEMPTS) {
            // Clear OTP after too many attempts
            user.otp = undefined;
            await user.save();
            
            return res.status(400).json({
                success: false,
                message: "Too many failed attempts. Please request a new OTP."
            });
        }

        // Check expiry
        if (new Date() > new Date(user.otp.expiresAt)) {
            user.otp = undefined;
            await user.save();
            
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        // Verify OTP
        if (user.otp.code !== otp.toString()) {
            await user.save(); // Save attempt count
            
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${OTP_CONFIG.MAX_ATTEMPTS - user.otp.attempts} attempts remaining.`
            });
        }

        // Mark OTP as verified
        user.otp.verified = true;
        user.otp.verifiedAt = new Date();
        
        // Generate a temporary token for password reset (valid for 15 minutes)
        const resetToken = jwt.sign(
            { 
                userId: user._id, 
                purpose: 'password_reset',
                phone: user.phone 
            },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        await user.save();

        res.json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                resetToken,
                phone: formattedPhone
            }
        });

    } catch (error) {
        console.error("Verify password reset OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// Update reset password route
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

        // Verify reset token
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
                    message: "Reset token has expired. Please request a new OTP."
                });
            }
            return res.status(400).json({
                success: false,
                message: "Invalid reset token"
            });
        }

        // Find user
        const user = await User.findById(decoded.userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if OTP was verified
        if (!user.otp || !user.otp.verified || user.otp.purpose !== 'password_reset') {
            return res.status(400).json({
                success: false,
                message: "OTP not verified. Please complete OTP verification first."
            });
        }

        // Update password
        user.password = newPassword;
        
        // Clear OTP data
        user.otp = undefined;
        
        // Update password change timestamp (add this field to your schema if needed)
        user.passwordChangedAt = new Date();
        
        await user.save();

        // Send confirmation SMS
        const message = `আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।\n\nYour password has been changed successfully.`;
        await sendSMS(user.phone, message).catch(err => 
            console.error('Failed to send password change SMS:', err)
        );

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

// Update resend OTP route
Authrouter.post("/forgot-password/resend-otp", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
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

        // Find user
        const user = await User.findOne({ phone: formattedPhone });

        if (!user) {
            return res.json({
                success: true,
                message: "If this phone number is registered, you will receive an OTP"
            });
        }

        // Check cooldown
        if (user.otp && user.otp.createdAt) {
            const timeSinceLastRequest = (new Date() - new Date(user.otp.createdAt)) / 1000;
            if (timeSinceLastRequest < OTP_CONFIG.RESEND_COOLDOWN_SECONDS) {
                const waitSeconds = Math.ceil(OTP_CONFIG.RESEND_COOLDOWN_SECONDS - timeSinceLastRequest);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${waitSeconds} seconds before requesting a new OTP`
                });
            }
        }

        // Generate new OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000);

        // Store new OTP in the existing otp field
        user.otp = {
            code: otpCode,
            expiresAt: expiresAt,
            purpose: 'password_reset',
            verified: false,
            attempts: 0,
            createdAt: new Date()
        };
        
        await user.save();

        // Send SMS
        const message = `আপনার নতুন পাসওয়ার্ড রিসেট কোড: ${otpCode}\nএই কোডটি ${OTP_CONFIG.EXPIRY_MINUTES} মিনিটের জন্য বৈধ।\n\nYour new password reset code is: ${otpCode}. Valid for ${OTP_CONFIG.EXPIRY_MINUTES} minutes.`;
        
        const smsResult = await sendSMS(formattedPhone, message);

        if (process.env.NODE_ENV === 'development') {
            return res.json({
                success: true,
                message: 'OTP resent successfully (Development Mode)',
                data: {
                    otp: otpCode,
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        }

        if (smsResult.success) {
            res.json({
                success: true,
                message: 'OTP resent successfully. Please check your phone.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        } else {
            res.json({
                success: true,
                message: 'OTP regenerated but SMS delivery failed. Please try again.',
                data: {
                    expiresAt: expiresAt,
                    phone: formattedPhone
                }
            });
        }

    } catch (error) {
        console.error("Resend password reset OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});
// Verify OTP and reset password
Authrouter.post("/reset-password-with-otp", async (req, res) => {
    try {
        const { phone, otp, newPassword, confirmPassword } = req.body;

        if (!phone || !otp || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Phone, OTP, new password, and confirm password are required"
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

        // Format phone number
        const formattedPhone = formatBangladeshPhone(phone);

        // Find user by phone
        const user = await User.findOne({ phone: formattedPhone }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check OTP
        if (!user.otp || user.otp.purpose !== 'password_reset') {
            return res.status(400).json({
                success: false,
                message: "No password reset request found. Please request a new OTP."
            });
        }

        if (new Date() > new Date(user.otp.expiresAt)) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        if (user.otp.code !== otp.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again."
            });
        }

        // Update password
        user.password = newPassword;
        user.otp.verified = true;
        
        await user.save();

        res.json({
            success: true,
            message: "Password reset successfully. You can now login with your new password."
        });

    } catch (error) {
        console.error("Reset password with OTP error:", error);
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
      paymentDetails // This should be the specific payment details for the selected method
    } = req.body;

    // Validation
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

    // Validate payment method and details based on selected method
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

    // Check if affiliate already exists
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

    // Prepare payment details for database (match the Mongoose schema structure)
    const dbPaymentDetails = {};
    if (paymentMethod && paymentDetails) {
      // Initialize the payment method object
      dbPaymentDetails[paymentMethod] = paymentDetails;
      
      // Set default accountType for mobile payment methods if not provided
      if (['bkash', 'nagad', 'rocket'].includes(paymentMethod)) {
        if (!dbPaymentDetails[paymentMethod].accountType) {
          dbPaymentDetails[paymentMethod].accountType = 'personal';
        }
      }
    }

    // Create new affiliate
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
        message: "email or password is worng!"
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
        message: "email or password is wrong!"
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

    // Find affiliate with master_affiliate role
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

    // Check if master affiliate account is active
    if (masterAffiliate.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Your master affiliate account is ${masterAffiliate.status}. Please contact admin or your super affiliate for activation.`
      });
    }

    // Verify password
    const isPasswordValid = await masterAffiliate.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Update last login
    masterAffiliate.lastLogin = new Date();
    await masterAffiliate.save();

    // Generate master affiliate specific JWT token
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
    
    const user = await User.findOne({ referralCode: code });
    
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

// Track affiliate click
Authrouter.post("/track-click", async (req, res) => {
  try {
    const { affiliateCode, source, campaign, medium, landingPage } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    if (!affiliateCode) {
      return res.status(400).json({
        success: false,
        error: "Affiliate code is required"
      });
    }

    const affiliate = await Affiliate.findOne({
      affiliateCode: affiliateCode.toUpperCase(),
      status: 'active'
    });

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: "Invalid affiliate code"
      });
    }

    // Generate unique click ID
    const clickId = 'CLK' + Math.random().toString(36).substr(2, 12).toUpperCase();

    // Update affiliate's click count
    await Affiliate.findByIdAndUpdate(affiliate._id, {
      $inc: { clickCount: 1 }
    });

    // Save click data to ClickTrack if available
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

    // Set cookies for tracking (30 days)
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
      error: "Internal server error"
    });
  }
});

Authrouter.post("/signup", async (req, res) => {
  try {
    const { currency, phone, username, password, confirmPassword, fullName, email, referralCode, affiliateCode } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    // Validation checks (unchanged)
    if (!phone || !username || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        error: "Phone, username, password, and confirm password are required" 
      });
    }

    if (!/^1[0-9]{9}$/.test(phone)) {
      return res.status(400).json({ 
        success: false,
        error: "Please enter a valid Bangladeshi phone number, starting with 1." 
      });
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        success: false,
        error: "Username can only contain lowercase letters, numbers, and underscores." 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        error: "Username must be at least 3 characters long." 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: "Password must be at least 6 characters long." 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        error: "Passwords do not match." 
      });
    }

    // Handle regular user referral (manual input)
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (!referrer) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid referral code" 
        });
      }
      referredBy = referrer._id;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { phone: `+880${phone}` }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ 
          success: false,
          error: "Username already exists." 
        });
      }
      if (existingUser.phone === `+880${phone}`) {
        return res.status(400).json({ 
          success: false,
          error: "Phone number already registered." 
        });
      }
      if (email && existingUser.email === email) {
        return res.status(400).json({ 
          success: false,
          error: "Email already registered." 
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

    // Create new user
    const newUser = new User({
      currency: currency || "BDT",
      phone: `+880${phone}`,
      username,
      password,
      fullName,
      player_id,
      referredBy,
      registrationSource
    });

    await newUser.save();

    // ------------------affiliate-part-----------------------
    let affiliateId = null;
    if (affiliateCode) {
      // Find the affiliate directly using the affiliate code
      const affiliate = await Affiliate.findOne({ 
        affiliateCode: affiliateCode.toUpperCase(),
        status: 'active' 
      });

      if (!affiliate) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid affiliate code" 
        });
      }

      affiliateId = affiliate._id;
      
      // Ensure CPA rate is a valid number
      const registrationBonus = Number(affiliate.cpaRate) || 0;
      
      // Clean up any invalid earningsHistory entries first
      // Remove entries that are missing required fields
      const validEarningsHistory = affiliate.earningsHistory.filter(earning => 
        earning && 
        earning.sourceAmount !== undefined && 
        earning.sourceType !== undefined && 
        earning.sourceId !== undefined && 
        earning.referredUser !== undefined
      );
      
      // Create the earning record with all required fields
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
      
      // Add the new valid record
      validEarningsHistory.push(earningRecord);
      
      // Update the affiliate with clean history and new record
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
      }, { 
        runValidators: true,
        new: true 
      });

      console.log(`Affiliate commission recorded: Affiliate ${affiliate._id} earned ${registrationBonus} BDT`);
    }

    // Update regular user referrer's count if applicable
    if (referredBy) {
      try {
        await User.findByIdAndUpdate(referredBy, {
          $inc: { 
            referralCount: 1,
            referralEarnings: 50 // Example: 50 taka bonus for regular referral
          },
          $push: {
            referralUsers: {
              username:newUser.username,
              user: newUser._id,
              joinedAt: new Date(),
              earnedAmount: 50
            }
          }
        });

        // Add bonus to referrer's account
        await User.findByIdAndUpdate(referredBy, {
          $inc: { balance: 50 }
        });

        console.log(`User referral recorded: ${referredBy} earned 50 taka for referral`);

      } catch (referralError) {
        console.error('Error recording user referral:', referralError);
        // Don't fail the user registration if referral tracking fails
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
      { userId: newUser._id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return success response with token
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
        isUserReferred: !!referredBy,
        isAffiliateReferred: !!affiliateId
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error" 
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
        error: "Access denied"
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
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
      error: "Internal server error"
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
        error: "Access denied"
      });
    }

    const decoded = jwt.verify(token, AFFILIATE_JWT_SECRET);
    const affiliate = await Affiliate.findById(decoded.affiliateId);

    if (!affiliate) {
      return res.status(404).json({
        success: false,
        error: "Affiliate not found"
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
      error: "Internal server error"
    });
  }
});

// Login route - Complete version
Authrouter.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'unknown';

    // Validation
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: "Username and password are required" 
      });
    }

    // Find user by username and explicitly select password field
    const user = await User.findOne({ username }).select("+password");
    
    const { deviceType, browser, os } = getDeviceInfo(userAgent);

    // Check if user exists
    if (!user) {
      // Create failed login log without userId
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
        error: "Invalid username or password" 
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      // Create failed login log
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
        error: `Your account is ${user.status}. Please contact support.` 
      });
    }

    // Verify password using the method from your User model
    const isPasswordValid = await user.verifyPassword(password);
    
    if (!isPasswordValid) {
      // Create failed login log
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
        error: "Invalid username or password" 
      });
    }

    // Update user login information
    user.login_count = (user.login_count || 0) + 1;
    user.last_login = new Date();
    user.first_login = false;
    
    // Add login history
    if (!user.loginHistory) {
      user.loginHistory = [];
    }
    
    user.loginHistory.push({
      ipAddress,
      device: deviceType,
      userAgent,
      location: 'Unknown', // You can add IP geolocation later
      timestamp: new Date()
    });
    
    // Keep only last 10 login history entries
    if (user.loginHistory.length > 10) {
      user.loginHistory = user.loginHistory.slice(-10);
    }
    
    await user.save();

    // Create successful login log
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Return success response with user data (excluding sensitive information)
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
        // Virtual fields
        accountAgeInDays: user.accountAgeInDays,
        isNewUser: user.isNewUser,
        availableBalance: user.availableBalance,
        withdrawableAmount: user.withdrawableAmount,
        wageringStatus: user.wageringStatus,
        isAffiliateReferred: user.isAffiliateReferred,
        // Bonus offers if applicable
        availableBonuses: user.getAvailableBonusOffers ? user.getAvailableBonusOffers() : []
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    
    // Log the error but don't expose internal details
    res.status(500).json({ 
      success: false,
      error: "Internal server error during login" 
    });
  }
});


module.exports = Authrouter;