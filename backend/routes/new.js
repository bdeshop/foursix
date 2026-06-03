const express = require("express");
const { User } = require("../models/User");
const Userrouter = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Deposit = require("../models/Deposit");
const Withdrawal = require("../models/Withdrawal");
const mongoose = require("mongoose");
const axios = require("axios");
const nodemailer=require("nodemailer");
const qs = require("qs");
const CashBonus = require("../models/CashBonusModel");
// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || "fsdfsdfsd43534";

// ==================== EMAIL CONFIGURATION ====================
// Configure nodemailer transporter
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Helper function to generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to send email
async function sendEmail(to, subject, html) {
    try {
        await emailTransporter.sendMail({
            from: `"Your Platform" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        return true;
    } catch (error) {
        console.error("Email sending error:", error);
        return false;
    }
}

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        success: false,
        message: "Token expired",
      });
    }

    console.error("Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// -------- USER INFORMATION ROUTES --------
Userrouter.get("/all-information/:id", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params.id });
    if (!user) {
      return res.send({ success: false, message: "User did not find!" });
    }
    res.send({ success: true, data: user });
  } catch (error) {
    console.error("User information error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get user information
// Get user information
Userrouter.get("/my-information", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.send({
      success: true,
      message: "User found successfully",
      data: {
        id: user._id,
        player_id: user.player_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        currency: user.currency,
        balance: user.balance,
        bonusBalance: user.bonusBalance,
        first_login: user.first_login,
        login_count: user.login_count,
        last_login: user.last_login,
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        kycStatus: user.kycStatus,
        coinBalance: user.coinBalance,
        lifetime_bet: user.lifetime_bet,
        claimedLevels: user.claimedLevels || [],  // ADD THIS LINE
        claimedLevelsAt: user.claimedLevelsAt || {}  // ADD THIS LINE (optional)
      },
    });
  } catch (error) {
    console.error("User information error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update personal information
Userrouter.put("/update-personal-info", authenticateToken, async (req, res) => {
  try {
    const { fullName, dateOfBirth, phone } = req.body;
    const user = req.user;

    if (fullName !== undefined) {
      if (fullName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Full name must be at least 2 characters long"
        });
      }
      user.fullName = fullName.trim();
    }
    
    if (dateOfBirth !== undefined) {
      const dob = new Date(dateOfBirth);
      const age = Math.floor((new Date() - dob) / (1000 * 60 * 60 * 24 * 365.25));
      if (age < 18) {
        return res.status(400).json({
          success: false,
          message: "You must be at least 18 years old"
        });
      }
      if (age > 120) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth"
        });
      }
      user.dateOfBirth = dob;
    }
    
    if (phone !== undefined) user.phone = phone;

    await user.save();

    res.send({
      success: true,
      message: "Personal information updated successfully",
      data: {
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Update personal info error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
// ==================== FULL NAME UPDATE ROUTE (SEPARATE) ====================

// Update full name only - Separate route
Userrouter.put("/update-fullname", authenticateToken, async (req, res) => {
  try {
    const { fullName } = req.body;
    const user = req.user;

    // Validate full name
    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: "Full name is required"
      });
    }

    // Trim and validate length
    const trimmedFullName = fullName.trim();
    if (trimmedFullName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters long"
      });
    }

    if (trimmedFullName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Full name cannot exceed 100 characters"
      });
    }

    // Validate name format (only letters, spaces, hyphens, and apostrophes)
    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!nameRegex.test(trimmedFullName)) {
      return res.status(400).json({
        success: false,
        message: "Full name can only contain letters, spaces, hyphens, and apostrophes"
      });
    }

    // Update full name
    const oldFullName = user.fullName;
    user.fullName = trimmedFullName;
    await user.save();

    // Log the name change in transaction history
    user.transactionHistory.push({
      type: "profile_update",
      amount: 0,
      balanceBefore: user.balance,
      balanceAfter: user.balance,
      description: `Full name updated from "${oldFullName || 'Not set'}" to "${trimmedFullName}"`,
      referenceId: `NAME-${Date.now()}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "Full name updated successfully",
      data: {
        fullName: user.fullName,
        previousName: oldFullName || null,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Update full name error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update full name",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});
// ==================== DATE OF BIRTH UPDATE ROUTE (SEPARATE) ====================

// Update date of birth only - Separate route
Userrouter.put("/update-dob", authenticateToken, async (req, res) => {
  try {
    const { dateOfBirth } = req.body;
    const user = req.user;

    // Validate date of birth is provided
    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Date of birth is required"
      });
    }

    // Parse and validate date
    const dob = new Date(dateOfBirth);
    
    // Check if date is valid
    if (isNaN(dob.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD format."
      });
    }

    // Check if date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dob > today) {
      return res.status(400).json({
        success: false,
        message: "Date of birth cannot be in the future"
      });
    }

    // Calculate age
    const age = Math.floor((today - dob) / (1000 * 60 * 60 * 24 * 365.25));
    
    // Age validation (must be at least 18 years old)
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: `You must be at least 18 years old. Your age is ${age} years.`
      });
    }

    // Maximum age validation (120 years)
    if (age > 120) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth. Age cannot exceed 120 years."
      });
    }

    // Store old date of birth for logging
    const oldDOB = user.dateOfBirth;

    // Update date of birth
    user.dateOfBirth = dob;
    await user.save();

    // Log the DOB change in transaction history (optional)
    user.transactionHistory = user.transactionHistory || [];
    user.transactionHistory.push({
      type: "profile_update",
      amount: 0,
      balanceBefore: user.balance,
      balanceAfter: user.balance,
      description: `Date of birth updated${oldDOB ? ` from ${oldDOB.toLocaleDateString()} to ${dob.toLocaleDateString()}` : ''}`,
      referenceId: `DOB-${Date.now()}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "Date of birth updated successfully",
      data: {
        dateOfBirth: dob,
        formattedDate: dob.toLocaleDateString(),
        age: age,
        previousDateOfBirth: oldDOB || null,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Update date of birth error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update date of birth",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});
// ==================== EMAIL UPDATE ROUTES ====================

// Request email update (send OTP to new email)
Userrouter.post("/request-email-update", authenticateToken, async (req, res) => {
  try {
    const { newEmail } = req.body;
    const user = req.user;

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email is required"
      });
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP and pending email
    user.pendingEmail = newEmail.toLowerCase();
    user.emailVerificationOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified: false,
      attempts: 0,
      lastAttemptAt: new Date()
    };

    await user.save();

    // Send OTP email
    const emailSent = await sendEmail(
      newEmail,
      "Email Verification - Update Your Email",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Hello ${user.username},</p>
          <p>You requested to update your email address to ${newEmail}. Please use the following OTP code to verify:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email and contact support.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email"
      });
    }

    res.json({
      success: true,
      message: "Verification code sent to your new email address",
      data: {
        email: newEmail,
        expiresIn: 10
      }
    });
  } catch (error) {
    console.error("Request email update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process email update request"
    });
  }
});

// Verify and update email with OTP
Userrouter.post("/verify-email-update", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required"
      });
    }

    // Check if there's a pending email
    if (!user.pendingEmail) {
      return res.status(400).json({
        success: false,
        message: "No pending email update request"
      });
    }

    // Check if OTP exists
    if (!user.emailVerificationOTP || !user.emailVerificationOTP.code) {
      return res.status(400).json({
        success: false,
        message: "No verification request found. Please request a new code"
      });
    }

    // Check if OTP is expired
    if (new Date() > user.emailVerificationOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one"
      });
    }

    // Verify OTP
    if (user.emailVerificationOTP.code !== otp) {
      user.emailVerificationOTP.attempts = (user.emailVerificationOTP.attempts || 0) + 1;
      await user.save();
      
      const remainingAttempts = Math.max(0, 3 - (user.emailVerificationOTP.attempts || 0));
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remainingAttempts} attempts remaining`
      });
    }

    // Update email
    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.pendingEmail = undefined;
    user.emailVerificationOTP = undefined;

    await user.save();

    // Send confirmation email to old email
    if (oldEmail) {
      await sendEmail(
        oldEmail,
        "Email Changed - Security Alert",
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Address Changed</h2>
            <p>Hello ${user.username},</p>
            <p>Your email address has been changed from ${oldEmail} to ${user.email}.</p>
            <p>If you did not make this change, please contact our support immediately.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        `
      );
    }

    res.json({
      success: true,
      message: "Email updated successfully",
      data: {
        email: user.email,
        verifiedAt: user.emailVerifiedAt
      }
    });
  } catch (error) {
    console.error("Verify email update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify and update email"
    });
  }
});

// ==================== EMAIL VERIFICATION ROUTES ====================

// Request email verification
Userrouter.post("/request-email-verification", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "No email address found. Please add an email first"
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Check rate limiting
    const lastAttempt = user.emailVerificationOTP?.lastAttemptAt;
    const attempts = user.emailVerificationOTP?.attempts || 0;
    
    if (lastAttempt && attempts >= 3) {
      const timeSinceLastAttempt = Date.now() - new Date(lastAttempt);
      const oneHour = 60 * 60 * 1000;
      
      if (timeSinceLastAttempt < oneHour) {
        const minutesLeft = Math.ceil((oneHour - timeSinceLastAttempt) / (60 * 1000));
        return res.status(429).json({
          success: false,
          message: `Too many attempts. Please try again in ${minutesLeft} minutes`
        });
      }
    }

    const otp = generateOTP();

    user.emailVerificationOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified: false,
      attempts: (user.emailVerificationOTP?.attempts || 0) + 1,
      lastAttemptAt: new Date()
    };

    await user.save();

    const emailSent = await sendEmail(
      user.email,
      "Email Verification - Verify Your Account",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Hello ${user.username},</p>
          <p>Please verify your email address by entering the following OTP code:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.send({
      success: true,
      message: "Verification email sent",
      data: { expiresIn: 10 }
    });
  } catch (error) {
    console.error("Request email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Verify email with OTP
Userrouter.post("/verify-email", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required"
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (!user.emailVerificationOTP || !user.emailVerificationOTP.code) {
      return res.status(400).json({
        success: false,
        message: "No verification request found. Please request a new code",
      });
    }

    if (user.emailVerificationOTP.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one",
      });
    }

    if (user.emailVerificationOTP.code !== otp) {
      user.emailVerificationOTP.attempts = (user.emailVerificationOTP.attempts || 0) + 1;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - (user.emailVerificationOTP.attempts || 0)} attempts remaining`,
      });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationOTP.verified = true;
    await user.save();

    res.send({
      success: true,
      message: "Email verified successfully",
      data: {
        email: user.email,
        verifiedAt: user.emailVerifiedAt
      }
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Resend verification email
Userrouter.post("/resend-verification-email", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "No email address found"
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified"
      });
    }

    // Check if last attempt was within 30 seconds
    const lastAttempt = user.emailVerificationOTP?.lastAttemptAt;
    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - new Date(lastAttempt);
      if (timeSinceLastAttempt < 30 * 1000) {
        const secondsLeft = Math.ceil((30 * 1000 - timeSinceLastAttempt) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsLeft} seconds before requesting another code`
        });
      }
    }

    const otp = generateOTP();

    user.emailVerificationOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verified: false,
      attempts: 0,
      lastAttemptAt: new Date()
    };

    await user.save();

    const emailSent = await sendEmail(
      user.email,
      "Email Verification - Resend",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Hello ${user.username},</p>
          <p>Your new verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email"
      });
    }

    res.send({
      success: true,
      message: "Verification code resent",
      data: { expiresIn: 10 }
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// ==================== PASSWORD RESET ROUTES ====================

// Request password reset (forgot password)
Userrouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Don't reveal if user exists or not (security)
    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link"
      });
    }

    // Check if user has email
    if (!user.email) {
      return res.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link"
      });
    }

    // Generate reset token and OTP
    const resetToken = Math.random().toString(36).substr(2, 32);
    const otp = generateOTP();

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    user.passwordResetOTP = {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0
    };

    await user.save();

    // Send password reset email
    const emailSent = await sendEmail(
      user.email,
      "Password Reset Request",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.username},</p>
          <p>We received a request to reset your password. Please use the following OTP code to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email and ensure your account is secure.</p>
          <p>You can also use this link: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    );

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email"
      });
    }

    res.json({
      success: true,
      message: "Password reset instructions sent to your email",
      data: {
        resetToken,
        expiresIn: 60
      }
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request"
    });
  }
});

// Verify OTP and reset password
Userrouter.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, otp, newPassword, confirmNewPassword } = req.body;

    if (!resetToken || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token, OTP, and new password are required"
      });
    }

    if (newPassword !== confirmNewPassword) {
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

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() }
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Check OTP
    if (!user.passwordResetOTP || !user.passwordResetOTP.code) {
      return res.status(400).json({
        success: false,
        message: "No OTP request found. Please request a new password reset"
      });
    }

    if (new Date() > user.passwordResetOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new password reset"
      });
    }

    if (user.passwordResetOTP.code !== otp) {
      user.passwordResetOTP.attempts = (user.passwordResetOTP.attempts || 0) + 1;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${3 - (user.passwordResetOTP.attempts || 0)} attempts remaining`
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordResetOTP = undefined;

    await user.save();

    // Send confirmation email
    await sendEmail(
      user.email,
      "Password Changed Successfully",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Changed Successfully</h2>
          <p>Hello ${user.username},</p>
          <p>Your password has been successfully changed.</p>
          <p>If you did not make this change, please contact our support immediately.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    );

    res.json({
      success: true,
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password"
    });
  }
});

// ==================== ENHANCED PASSWORD CHANGE ROUTE ====================

// Change password (when logged in)
Userrouter.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    if (newPassword.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Password cannot exceed 50 characters",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check password history (prevent reuse of last 5 passwords)
    if (user.passwordHistory && user.passwordHistory.length > 0) {
      for (const oldPassword of user.passwordHistory.slice(-5)) {
        const isReused = await bcrypt.compare(newPassword, oldPassword.password);
        if (isReused) {
          return res.status(400).json({
            success: false,
            message: "Cannot reuse a recent password",
          });
        }
      }
    }

    user.password = newPassword;
    await user.save();

    // Send notification email
    if (user.email && user.isEmailVerified) {
      await sendEmail(
        user.email,
        "Password Changed - Security Alert",
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Changed</h2>
            <p>Hello ${user.username},</p>
            <p>Your password was changed successfully.</p>
            <p>If you did not make this change, please contact our support immediately.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        `
      );
    }

    res.send({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ==================== FULL NAME UPDATE ROUTE ====================

// Update full name
Userrouter.put("/update-fullname", authenticateToken, async (req, res) => {
  try {
    const { fullName } = req.body;
    const user = req.user;

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters long"
      });
    }

    user.fullName = fullName.trim();
    await user.save();

    res.json({
      success: true,
      message: "Full name updated successfully",
      data: { fullName: user.fullName }
    });
  } catch (error) {
    console.error("Update full name error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update full name"
    });
  }
});

// ==================== DATE OF BIRTH UPDATE ROUTE ====================

// Update date of birth
Userrouter.put("/update-dob", authenticateToken, async (req, res) => {
  try {
    const { dateOfBirth } = req.body;
    const user = req.user;

    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Date of birth is required"
      });
    }

    const dob = new Date(dateOfBirth);
    const age = Math.floor((new Date() - dob) / (1000 * 60 * 60 * 24 * 365.25));

    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: "You must be at least 18 years old"
      });
    }

    if (age > 120) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth"
      });
    }

    user.dateOfBirth = dob;
    await user.save();

    res.json({
      success: true,
      message: "Date of birth updated successfully",
      data: { dateOfBirth: user.dateOfBirth }
    });
  } catch (error) {
    console.error("Update DOB error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update date of birth"
    });
  }
});

// Set/update transaction password
Userrouter.post(
  "/set-transaction-password",
  authenticateToken,
  async (req, res) => {
    try {
      const { transactionPassword } = req.body;
      const user = await User.findById(req.user._id);

      user.transactionPassword = transactionPassword;
      await user.save();

      res.send({
        success: true,
        message: "Transaction password set successfully",
      });
    } catch (error) {
      console.error("Set transaction password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// -------- VERIFICATION ROUTES --------

// Request email verification
Userrouter.post(
  "/request-email-verification",
  authenticateToken,
  async (req, res) => {
    try {
      const user = req.user;

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      // Generate OTP (in a real app, you would send this via email)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.otp = {
        code: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        purpose: "email_verification",
        verified: false,
      };

      await user.save();

      // In a real app, you would send the OTP via email here
      console.log(`Email verification OTP for ${user.email}: ${otpCode}`);

      res.send({
        success: true,
        message: "Verification email sent",
      });
    } catch (error) {
      console.error("Request email verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Verify email with OTP
Userrouter.post("/verify-email", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    if (!user.otp || user.otp.purpose !== "email_verification") {
      return res.status(400).json({
        success: false,
        message: "No verification request found",
      });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isEmailVerified = true;
    user.otp.verified = true;
    await user.save();

    res.send({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Request phone verification
Userrouter.post(
  "/request-phone-verification",
  authenticateToken,
  async (req, res) => {
    try {
      const user = req.user;

      if (!user.phone) {
        return res.status(400).json({
          success: false,
          message: "Phone number not set",
        });
      }

      if (user.isPhoneVerified) {
        return res.status(400).json({
          success: false,
          message: "Phone is already verified",
        });
      }

      // Generate OTP (in a real app, you would send this via SMS)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      user.otp = {
        code: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        purpose: "phone_verification",
        verified: false,
      };

      await user.save();

      // In a real app, you would send the OTP via SMS here
      console.log(`Phone verification OTP for ${user.phone}: ${otpCode}`);

      res.send({
        success: true,
        message: "Verification SMS sent",
      });
    } catch (error) {
      console.error("Request phone verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Verify phone with OTP
Userrouter.post("/verify-phone", authenticateToken, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: "Phone is already verified",
      });
    }

    if (!user.otp || user.otp.purpose !== "phone_verification") {
      return res.status(400).json({
        success: false,
        message: "No verification request found",
      });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isPhoneVerified = true;
    user.otp.verified = true;
    await user.save();

    res.send({
      success: true,
      message: "Phone verified successfully",
    });
  } catch (error) {
    console.error("Verify phone error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get verification status
Userrouter.get("/verification-status", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    res.send({
      success: true,
      data: {
        email: user.isEmailVerified ? "verified" : "pending",
        phone: user.isPhoneVerified ? "verified" : "pending",
        identity: user.kycStatus,
        address: "not_started", // You might want to add address verification to your model
      },
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// -------- SECURITY SETTINGS ROUTES --------

// Enable/disable two-factor authentication
Userrouter.post("/toggle-2fa", authenticateToken, async (req, res) => {
  try {
    const { enable } = req.body;
    const user = req.user;

    user.twoFactorEnabled = enable;
    await user.save();

    res.send({
      success: true,
      message: `Two-factor authentication ${enable ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    console.error("Toggle 2FA error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get active sessions
Userrouter.get("/active-sessions", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Return limited session information
    const sessions = user.loginHistory.slice(-5).map((session) => ({
      device: session.device,
      location: session.location,
      timestamp: session.timestamp,
    }));

    res.send({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// -------- PREFERENCES ROUTES --------
// Update notification preferences
Userrouter.put(
  "/notification-preferences",
  authenticateToken,
  async (req, res) => {
    try {
      const { email, sms, push } = req.body;
      const user = req.user;

      if (email !== undefined) user.notificationPreferences.email = email;
      if (sms !== undefined) user.notificationPreferences.sms = sms;
      if (push !== undefined) user.notificationPreferences.push = push;

      await user.save();

      res.send({
        success: true,
        message: "Notification preferences updated",
        data: user.notificationPreferences,
      });
    } catch (error) {
      console.error("Update notification preferences error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Update theme preference
Userrouter.put("/theme-preference", authenticateToken, async (req, res) => {
  try {
    const { theme } = req.body;
    const user = req.user;

    if (theme && ["light", "dark", "system"].includes(theme)) {
      user.themePreference = theme;
      await user.save();

      res.send({
        success: true,
        message: "Theme preference updated",
        data: { themePreference: user.themePreference },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid theme preference",
      });
    }
  } catch (error) {
    console.error("Update theme preference error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
Userrouter.post("/play-game", async (req, res) => {
  try {
    const { slug, username, money, userid } = req.body;
    console.log(req.body);
    const postData = {
      home_url: "https://bajibet24.live",
      token: "f9d21d76de9f32f16d7e189bf0b729a7",
      username: username + "45",
      money: money,
      gameid: req.body.gameID,
    };
    console.log("Sending POST request to joyhobe.com with data:", postData);

    // POST রিকোয়েস্ট
    const response = await axios.post(
      "https://dstplay.net/getgameurl",
      qs.stringify(postData),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-dst-game": "f9d21d76de9f32f16d7e189bf0b729a7",
        },
      }
    );

    console.log(
      "Response from bajibet24.com:",
      response.data,
      "Status:",
      response.status
    );
    res.status(200).json({
      message: "POST request successful",
      joyhobeResponse: response.data,
    });
  } catch (error) {
    console.error("Error in POST /api/test/game:", error);
    res.status(500).json({
      error: "Failed to forward POST request",
      details: error.message,
    });
  }
});

// Deposit route
// Userrouter.post("/deposit", authenticateToken, async (req, res) => {
//   try {
//     const { 
//       method, 
//       phoneNumber, 
//       amount, 
//       transactionId,
//       bonusType = 'none',
//       bonusAmount = 0,
//       wageringRequirement = 0,
//       bonusCode = '',
//       paymentId,
//       externalPaymentId,
//       userIdentifyAddress,
//       paymentUrl,
//       playerbalance,
//       expiresAt,
//       externalMethods,
//       currency = 'BDT',
//       rate = 1,
//       charge = { fixed: 0, percent: 0 }
//     } = req.body;
    
//     const userId = req.user._id;
//     console.log("Deposit request:", req.body);

//     // Validate input
//     if (!method || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Method and amount are required",
//       });
//     }

//     // Validate amount
//     if (amount < 100 || amount > 30000) {
//       return res.status(400).json({
//         success: false,
//         message: "Amount must be between 100 and 30,000 BDT",
//       });
//     }

//     // Create transaction record with all fields
//     const transaction = new Deposit({
//       userId,
//       type: "deposit",
//       method,
//       amount: parseFloat(amount),
//       phoneNumber,
//       transactionId,
//       bonusType,
//       bonusAmount: parseFloat(bonusAmount) || 0,
//       wageringRequirement: parseFloat(wageringRequirement) || 0,
//       bonusCode,
//       paymentId,
//       externalPaymentId,
//       userIdentifyAddress,
//       paymentUrl,
//       expiresAt: expiresAt ? new Date(expiresAt) : undefined,
//       externalMethods,
//       currency,
//       rate: parseFloat(rate) || 1,
//       charge,
//       playerbalance,
//       status: "pending",
//       description: `Deposit via ${method}${bonusAmount > 0 ? ` with ${bonusType} bonus` : ''}`,
//     });

//     await transaction.save();

//     // Update user's deposit history with all bonus info
//     const depositRecord = {
//       method,
//       amount: parseFloat(amount),
//       status: "pending",
//       transactionId,
//       bonusApplied: bonusAmount > 0,
//       bonusType,
//       bonusAmount: parseFloat(bonusAmount) || 0,
//       wageringRequirement: parseFloat(wageringRequirement) || 0,
//       bonusCode,
//       paymentId,
//       playerbalance,
//       externalPaymentId,
//       userIdentifyAddress,
//       paymentUrl,
//       currency,
//       rate: parseFloat(rate) || 1,
//       charge,
//       createdAt: new Date()
//     };

//     await User.findByIdAndUpdate(userId, {
//       $push: {
//         depositHistory: depositRecord,
//       },
//     });

//     // If bonus is applied, add to bonusActivityLogs with pending status
//     if (bonusAmount > 0 && bonusCode) {
//       await User.findByIdAndUpdate(userId, {
//         $push: {
//           bonusActivityLogs: {
//             bonusType: bonusType,
//             bonusCode: bonusCode,
//             bonusAmount: parseFloat(bonusAmount) || 0,
//             depositAmount: parseFloat(amount),
//             wageringRequirement: parseFloat(wageringRequirement) || 0,
//             status: "pending",
//             createdAt: new Date()
//           },
//         },
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Deposit request received and is being processed",
//       data: {
//         transactionId: transaction._id,
//         paymentId: transaction.paymentId,
//         amount: parseFloat(amount),
//         bonusAmount: parseFloat(bonusAmount) || 0,
//         wageringRequirement: parseFloat(wageringRequirement) || 0,
//         totalAmount: parseFloat(amount) + (parseFloat(bonusAmount) || 0),
//         method,
//         bonusType,
//         bonusCode,
//         status: "pending",
//         depositRecord: depositRecord
//       },
//     });
//   } catch (error) {
//     console.error("Deposit error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message
//     });
//   }
// });

Userrouter.post("/deposit", authenticateToken, async (req, res) => {
  try {
    const { 
      method, 
      phoneNumber, 
      amount, 
      transactionId,
      bonusType = 'none',
      bonusAmount = 0,
      wageringRequirement = 0,
      bonusCode = '',
      
      // OraclePay specific fields
      paymentId, // This is userIdentifyAddress from OraclePay
      externalPaymentId,
      userIdentifyAddress,
      paymentUrl,
      playerbalance,
      expiresAt,
      externalMethods,
      
      // New OraclePay fields
      oraclePaySessionCode, // session_code from OraclePay
      invoiceNumber, // invoice_number from OraclePay
      checkoutItems, // checkout_items from OraclePay
      
      currency = 'BDT',
      rate = 1,
      charge = { fixed: 0, percent: 0 }
    } = req.body;
    
    const userId = req.user._id;
    console.log("Deposit request received:", {
      method,
      amount,
      bonusType,
      bonusAmount,
      oraclePaySessionCode,
      invoiceNumber
    });

    // Validate input
    if (!method || !amount) {
      return res.status(400).json({
        success: false,
        message: "Method and amount are required",
      });
    }

    // Validate amount (minimum 5 as per OraclePay)
    if (amount < 5) {
      return res.status(400).json({
        success: false,
        message: "Minimum deposit amount is 5 BDT",
      });
    }

    if (amount > 50000) {
      return res.status(400).json({
        success: false,
        message: "Maximum deposit amount is 50,000 BDT",
      });
    }

    // Generate OraclePay specific fields if not provided
    const finalUserIdentifyAddress = userIdentifyAddress || `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const finalInvoiceNumber = invoiceNumber || `INV-${userId}-${Date.now()}`;
    const finalPaymentId = paymentId || finalUserIdentifyAddress;

    // Prepare checkout items with bonus info
    const finalCheckoutItems = checkoutItems || {
      userId: userId.toString(),
      username: req.user.username,
      method: method,
      selectedBonus: bonusAmount > 0 ? {
        type: bonusType,
        code: bonusCode,
        amount: bonusAmount,
        wageringRequirement: wageringRequirement
      } : null,
      timestamp: new Date().toISOString()
    };

    // Create transaction record with all fields including OraclePay specific ones
    const transaction = new Deposit({
      userId,
      type: "deposit",
      method,
      amount: parseFloat(amount),
      phoneNumber,
      transactionId: transactionId || `TXN-${Date.now()}`,
      
      // Bonus fields
      bonusType,
      bonusAmount: parseFloat(bonusAmount) || 0,
      wageringRequirement: parseFloat(wageringRequirement) || 0,
      bonusCode,
      
      // OraclePay specific fields
      paymentId: finalPaymentId, // This is userIdentifyAddress
      externalPaymentId: externalPaymentId || finalPaymentId,
      userIdentifyAddress: finalUserIdentifyAddress,
      invoiceNumber: finalInvoiceNumber,
      oraclePaySessionCode,
      checkoutItems: finalCheckoutItems,
      paymentUrl,
      
      // Additional fields
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      externalMethods,
      currency,
      rate: parseFloat(rate) || 1,
      charge,
      playerbalance: playerbalance || req.user.balance || 0,
      
      status: "pending",
      description: `Deposit via ${method}${bonusAmount > 0 ? ` with ${bonusType} bonus` : ''}`,
      createdAt: new Date()
    });

    await transaction.save();
    console.log(`Deposit transaction saved with ID: ${transaction._id}`);

    // Prepare deposit record for user history
    const depositRecord = {
      method,
      amount: parseFloat(amount),
      status: "pending",
      transactionId: transaction.transactionId,
      
      // Bonus info
      bonusApplied: bonusAmount > 0,
      bonusType,
      bonusAmount: parseFloat(bonusAmount) || 0,
      wageringRequirement: parseFloat(wageringRequirement) || 0,
      bonusCode,
      
      // OraclePay specific fields
      paymentId: finalPaymentId,
      userIdentifyAddress: finalUserIdentifyAddress,
      invoiceNumber: finalInvoiceNumber,
      oraclePaySessionCode,
      checkoutItems: finalCheckoutItems,
      paymentUrl,
      
      // Additional fields
      playerbalance: playerbalance || req.user.balance || 0,
      externalPaymentId: externalPaymentId || finalPaymentId,
      currency,
      rate: parseFloat(rate) || 1,
      charge,
      createdAt: new Date()
    };

    // Update user's deposit history
    await User.findByIdAndUpdate(userId, {
      $push: {
        depositHistory: {
          $each: [depositRecord],
          $position: 0,
          $slice: 50 // Keep last 50 deposits
        }
      }
    });

    // If bonus is applied, add to bonusActivityLogs with pending status
    if (bonusAmount > 0 && bonusCode) {
      const bonusLog = {
        bonusType,
        bonusCode,
        bonusAmount: parseFloat(bonusAmount),
        depositAmount: parseFloat(amount),
        wageringRequirement: parseFloat(wageringRequirement) || 0,
        invoiceNumber: finalInvoiceNumber,
        userIdentifyAddress: finalUserIdentifyAddress,
        status: "pending",
        createdAt: new Date()
      };

      await User.findByIdAndUpdate(userId, {
        $push: {
          bonusActivityLogs: {
            $each: [bonusLog],
            $position: 0,
            $slice: 30 // Keep last 30 bonus activities
          }
        }
      });

      console.log(`Bonus activity log created for user ${userId}: ${bonusType} - ${bonusAmount}`);
    }

    // Prepare success response
    const responseData = {
      transactionId: transaction._id,
      paymentId: finalPaymentId,
      userIdentifyAddress: finalUserIdentifyAddress,
      invoiceNumber: finalInvoiceNumber,
      amount: parseFloat(amount),
      bonusAmount: parseFloat(bonusAmount) || 0,
      wageringRequirement: parseFloat(wageringRequirement) || 0,
      totalAmount: parseFloat(amount) + (parseFloat(bonusAmount) || 0),
      method,
      bonusType,
      bonusCode,
      status: "pending",
      paymentUrl,
      depositRecord: depositRecord
    };

    // If OraclePay session code is available, include it
    if (oraclePaySessionCode) {
      responseData.oraclePaySessionCode = oraclePaySessionCode;
    }

    res.status(200).json({
      success: true,
      message: "Deposit request received successfully",
      data: responseData
    });

  } catch (error) {
    console.error("Deposit endpoint error:", {
      message: error.message,
      stack: error.stack,
      body: req.body
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : "An error occurred while processing your deposit"
    });
  }
});
// Get transaction history
Userrouter.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, type } = req.query;

    const query = { userId };
    if (type) {
      query.type = type;
    }

    const transactions = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Deposit.countDocuments(query);
    console.log(transactions);
    res.json({
      success: true,
      data: transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Transaction history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
// Withdrawal route
// Helper function to validate withdrawal details based on method
const validateWithdrawalDetails = (method, body) => {
  const errors = [];
  
  switch(method) {
    case "bkash":
      if (!body.phoneNumber) {
        errors.push("Phone number is required for bKash");
      } else if (!/^(01[3-9]\d{8})$/.test(body.phoneNumber)) {
        errors.push("Invalid Bangladeshi phone number format");
      }
      if (!body.accountType) {
        errors.push("Account type (personal/agent) is required for bKash");
      } else if (!["personal", "agent"].includes(body.accountType)) {
        errors.push("Account type must be either 'personal' or 'agent'");
      }
      break;
      
    case "rocket":
    case "nagad":
      if (!body.phoneNumber) {
        errors.push(`Phone number is required for ${method.toUpperCase()}`);
      } else if (!/^(01[3-9]\d{8})$/.test(body.phoneNumber)) {
        errors.push("Invalid Bangladeshi phone number format");
      }
      break;
      
    case "bank":
      if (!body.bankName) errors.push("Bank name is required");
      if (!body.accountHolderName) errors.push("Account holder name is required");
      if (!body.accountNumber) errors.push("Account number is required");
      if (!body.branchName) errors.push("Branch name is required");
      if (!body.district) errors.push("District is required");
      if (!body.routingNumber) errors.push("Routing number is required");
      if (body.routingNumber && !/^\d{9}$/.test(body.routingNumber)) {
        errors.push("Routing number must be 9 digits");
      }
      break;
      
    default:
      errors.push("Invalid withdrawal method");
  }
  
  return errors;
};

// Create withdrawal request
Userrouter.post("/withdraw", authenticateToken, async (req, res) => {
  try {
    const { 
      method, 
      amount,
      phoneNumber,
      accountType,
      bankName,
      accountHolderName,
      accountNumber,
      branchName,
      district,
      routingNumber
    } = req.body;
    
    const userId = req.user._id;
    
    console.log("Withdrawal request:", req.body);
    
    // Validate method
    const validMethods = ["bkash", "rocket", "nagad", "bank"];
    if (!validMethods.includes(method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdrawal method. Supported methods: bKash, Rocket, Nagad, Bank"
      });
    }
    
    // Validate withdrawal details
    const validationErrors = validateWithdrawalDetails(method, req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }
    
    // Check minimum withdrawal amount
    const minWithdrawal = 100;
    if (amount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is ${minWithdrawal} Taka`
      });
    }
    
    // Get user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check user balance
    if (amount > user.balance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        balance: user.balance,
        requested: amount
      });
    }
    
    // Prepare withdrawal data based on method
    let withdrawalData = {
      userId,
      method,
      amount,
      status: "pending"
    };
    
    // Add method-specific details
    if (method === "bkash") {
      withdrawalData.mobileBankingDetails = {
        phoneNumber,
        accountType: accountType || "personal"
      };
    } else if (method === "rocket" || method === "nagad") {
      withdrawalData.mobileBankingDetails = {
        phoneNumber,
        accountType: null
      };
    } else if (method === "bank") {
      withdrawalData.bankDetails = {
        bankName,
        accountHolderName,
        accountNumber,
        branchName,
        district,
        routingNumber
      };
    }
    
    // Create withdrawal record
    const withdrawal = new Withdrawal(withdrawalData);
    await withdrawal.save();
    
    // Update user balance
    await User.findByIdAndUpdate(userId, {
      $inc: { balance: -amount }
    });
    
    // Add to withdrawal history array in user document (if you have this field)
    await User.findByIdAndUpdate(userId, {
      $push: {
        withdrawalHistory: {
          withdrawalId: withdrawal._id,
          method,
          amount,
          date: new Date(),
          status: "pending",
          ...(phoneNumber && { phoneNumber }),
          ...(bankName && { bankName, accountNumber })
        }
      }
    });
    
    // Format response based on method
    let responseDetails = { method, amount, withdrawalId: withdrawal._id };
    if (method === "bkash") {
      responseDetails.phoneNumber = phoneNumber;
      responseDetails.accountType = accountType;
    } else if (method === "rocket" || method === "nagad") {
      responseDetails.phoneNumber = phoneNumber;
    } else if (method === "bank") {
      responseDetails.bankName = bankName;
      responseDetails.accountNumber = accountNumber;
    }
    
    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully",
      data: responseDetails
    });
    
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Get withdrawal history
Userrouter.get("/withdraw/history/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Verify the user is requesting their own history
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }
    
    const withdrawals = await Withdrawal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email phone');
    
    const total = await Withdrawal.countDocuments({ userId });
    
    // Format withdrawals for better readability
    const formattedWithdrawals = withdrawals.map(withdrawal => {
      const formatted = {
        id: withdrawal._id,
        method: withdrawal.method,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt,
        transactionId: withdrawal.transactionId,
        processedAt: withdrawal.processedAt
      };
      
      // Add method-specific details
      if (withdrawal.method === "bkash" && withdrawal.mobileBankingDetails) {
        formatted.details = {
          phoneNumber: withdrawal.mobileBankingDetails.phoneNumber,
          accountType: withdrawal.mobileBankingDetails.accountType
        };
      } else if ((withdrawal.method === "rocket" || withdrawal.method === "nagad") && withdrawal.mobileBankingDetails) {
        formatted.details = {
          phoneNumber: withdrawal.mobileBankingDetails.phoneNumber
        };
      } else if (withdrawal.method === "bank" && withdrawal.bankDetails) {
        formatted.details = {
          bankName: withdrawal.bankDetails.bankName,
          accountHolderName: withdrawal.bankDetails.accountHolderName,
          accountNumber: withdrawal.bankDetails.accountNumber,
          branchName: withdrawal.bankDetails.branchName,
          district: withdrawal.bankDetails.district,
          routingNumber: withdrawal.bankDetails.routingNumber
        };
      }
      
      return formatted;
    });
    
    res.json({
      success: true,
      data: formattedWithdrawals,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error("Withdrawal history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Get single withdrawal details
Userrouter.get("/withdraw/:withdrawalId", authenticateToken, async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const userId = req.user._id;
    
    const withdrawal = await Withdrawal.findOne({
      _id: withdrawalId,
      userId
    }).populate('userId', 'name email phone balance');
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found"
      });
    }
    
    // Format response
    const response = {
      id: withdrawal._id,
      method: withdrawal.method,
      amount: withdrawal.amount,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      transactionId: withdrawal.transactionId,
      processedAt: withdrawal.processedAt,
      rejectionReason: withdrawal.rejectionReason,
      adminNote: withdrawal.adminNote
    };
    
    // Add method-specific details
    if (withdrawal.method === "bkash" && withdrawal.mobileBankingDetails) {
      response.details = {
        phoneNumber: withdrawal.mobileBankingDetails.phoneNumber,
        accountType: withdrawal.mobileBankingDetails.accountType
      };
    } else if ((withdrawal.method === "rocket" || withdrawal.method === "nagad") && withdrawal.mobileBankingDetails) {
      response.details = {
        phoneNumber: withdrawal.mobileBankingDetails.phoneNumber
      };
    } else if (withdrawal.method === "bank" && withdrawal.bankDetails) {
      response.details = {
        bankName: withdrawal.bankDetails.bankName,
        accountHolderName: withdrawal.bankDetails.accountHolderName,
        accountNumber: withdrawal.bankDetails.accountNumber,
        branchName: withdrawal.bankDetails.branchName,
        district: withdrawal.bankDetails.district,
        routingNumber: withdrawal.bankDetails.routingNumber
      };
    }
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error("Get withdrawal error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

const Notification = require("../models/Notification"); // Add this at the top with other imports
const BettingHistory = require("../models/BettingHistory");
const Affiliate = require("../models/Affiliate");
const MasterAffiliate = require("../models/MasterAffiliate");
const Game = require("../models/Game");

// -------- NOTIFICATION ROUTES --------

// Get user notifications
Userrouter.get(
  "/notifications/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const { limit = 20, page = 1, unreadOnly = false } = req.query;
      const userId = req.params.userId;
      const userRole = req.user.role || "user";
      console.log(userId);
      // Convert query params to proper types
      const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        unreadOnly: unreadOnly === "true",
      };

      // Convert userId to ObjectId safely
      let userObjectId;
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      // Build the query for notifications accessible to this user
      const query = {
        $or: [
          { targetType: "all" },
          { targetType: "specific", targetUsers: { $in: [userObjectId] } },
          { targetType: "role_based", userRoles: userRole },
        ],
        status: "sent",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
        scheduledFor: { $lte: new Date() },
      };

      // Add unread filter if requested
      if (options.unreadOnly) {
        query["isRead.userId"] = { $ne: userObjectId };
      }

      // Execute the query with pagination
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .lean();

      // Get total count for pagination
      const totalCount = await Notification.countDocuments(query);

      // Format the response with read status for each notification
      const formattedNotifications = notifications.map((notification) => ({
        ...notification,
        isRead: notification.isRead.some(
          (read) => read.userId && read.userId.toString() === userId
        ),
      }));
      console.log(formattedNotifications);
      res.send({
        success: true,
        message: "Notifications retrieved successfully",
        data: {
          notifications: formattedNotifications,
          pagination: {
            page: options.page,
            limit: options.limit,
            total: totalCount,
            pages: Math.ceil(totalCount / options.limit),
          },
        },
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);
// Mark notification as read
Userrouter.post(
  "/notifications/:id/read",
  authenticateToken,
  async (req, res) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user.userId;

      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      // Check if user has access to this notification
      const hasAccess =
        notification.targetType === "all" ||
        (notification.targetType === "specific" &&
          notification.targetUsers.includes(userId)) ||
        (notification.targetType === "role_based" &&
          notification.userRoles.includes(req.user.role));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access to this notification denied",
        });
      }

      await notification.markAsRead(userId);

      res.send({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Mark all notifications as read
Userrouter.post(
  "/notifications/read-all",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role || "user";

      // Get all unread notifications for the user
      const query = {
        $or: [
          { targetType: "all" },
          { targetType: "specific", targetUsers: userId },
          { targetType: "role_based", userRoles: userRole },
        ],
        status: "sent",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ],
        scheduledFor: { $lte: new Date() },
        "isRead.userId": { $ne: userId },
      };

      const unreadNotifications = await Notification.find(query);

      // Mark each notification as read
      for (const notification of unreadNotifications) {
        await notification.markAsRead(userId);
      }

      res.send({
        success: true,
        message: "All notifications marked as read",
        count: unreadNotifications.length,
      });
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Get unread notifications count
// Get unread notifications count
Userrouter.get(
  "/notifications/unread-count",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId; // Changed from req.user.id to req.user._id
      const userRole = req.user.role || "user";
      console.log("fdf", userId);
      // Convert userId to ObjectId safely

      const query = {
        $or: [
          { targetType: "all" },
          { targetType: "specific", targetUsers: { $in: [userId] } }, // Use ObjectId
        ],
        status: "sent",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
        scheduledFor: { $lte: new Date() },
        "isRead.userId": { $ne: userId }, // Use ObjectId
      };

      const count = await Notification.countDocuments(query);

      res.send({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);

// Add this route to your existing Userrouter

// Get all transactions (deposits + withdrawals) for a user
Userrouter.get("/all-transactions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    // Build base query
    const baseQuery = { userId };

    // Add type filter if provided
    if (type && ["deposit", "withdrawal"].includes(type)) {
      baseQuery.type = type;
    }

    // Add status filter if provided
    if (status) {
      baseQuery.status = status;
    }

    // Add date range filter if provided
    let dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }
    if (startDate || endDate) {
      baseQuery.createdAt = dateFilter;
    }

    // Get deposits with filters
    const deposits = await Deposit.find(baseQuery)
      .sort({ createdAt: -1 })
      .lean();

    // For withdrawals, we need to adjust the query since they have different schema
    const withdrawalQuery = { userId };

    // Copy filters that apply to both
    if (status) withdrawalQuery.status = status;
    if (startDate || endDate) withdrawalQuery.createdAt = dateFilter;

    const withdrawals = await Withdrawal.find(withdrawalQuery)
      .sort({ createdAt: -1 })
      .lean();

    // Transform withdrawals to match deposit format for consistency
    const transformedWithdrawals = withdrawals.map((withdrawal) => ({
      _id: withdrawal._id,
      userId: withdrawal.userId,
      type: "withdrawal",
      method: withdrawal.method,
      amount: withdrawal.amount,
      status: withdrawal.status,
      phoneNumber: withdrawal.phoneNumber,
      transactionId: withdrawal.transactionId,
      description: `Withdrawal via ${withdrawal.method}`,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      processedAt: withdrawal.processedAt,
    }));

    // Combine and sort all transactions
    const allTransactions = [...deposits, ...transformedWithdrawals].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedTransactions,
      total: allTransactions.length,
      totalPages: Math.ceil(allTransactions.length / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("All transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}); 

// ?  get the game  old code


Userrouter.post("/getGameLink", async (req, res) => {
  try {
    const { username, money, gameID, provider, category } = req.body;

    console.log("this is body ", req.body);

    // POST রিকোয়েস্ট
    const response = await axios.post('https://oraclegames.net/api/getgameurl',
      {
        username:"rakibhossa",
        amount: money == 0 ? '0' : money,
        game_uid: "3d97f2073a05873b428be0ff20df724c",
        language: "en", // Optional
        currency_code: "BDT" // Optional
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-oracle-key': '665ec86d74fcb110d5a60421002b82df'
        }
      }
    );
    console.log(
      "Response from dstplay.com:",
      response.data,
      "Status:",
      response.status
    );

    res.status(200).json({
      message: "POST request successful",
      joyhobeResponse: response.data,
    });
  } catch (error) {
    console.error("Error in POST /api/test/game:", error);
    res.status(500).json({
      error: "Failed to forward POST request",
      details: error.message,
    });
  }
});

// Userrouter.post("/getGameLink", async (req, res) => {
//     try {
//       const { username, money, gameID, provider, category } = req.body;

//       console.log("this is body ", req.body);

//       // POST রিকোয়েস্ট
//       const response = await axios.post('https://crazybet99.com/getgameurl/v2', 
//         {
//           username: username+"45",
//           money: money==0 ? '0':money,
//           game_code: gameID,
//           provider_code: provider,  // Add provider from request body
//           game_type: category,      // Add category from request body
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'x-dstgame-key': '665ec86d74fcb110d5a60421002b82df'
//           }
//         }
//       );

//       console.log(
//         "Response from dstplay.com:",
//         response.data,
//         "Status:",
//         response.status
//       );
      
//       res.status(200).json({
//         message: "POST request successful",
//         joyhobeResponse: response.data,
//       });
//     } catch (error) {
//       console.error("Error in POST /api/test/game:", error);
//       res.status(500).json({
//         error: "Failed to forward POST request",
//         details: error.message,
//       });
//     }
// });


Userrouter.post("/callback-data-game", async (req, res) => {
   try{
    const {game_uid,game_round,bet_amount,serial_number,win_amount,member_account,currency_code,timestamp}=req.body;
       console.log("response", req.body);
     
      //  match user
      const winamount=parseFloat(win_amount);
       const betamount=parseFloat(bet_amount);
      const matcheduser=await User.findOne({username:member_account});
       if(win_amount <=0){
         matcheduser.balance=matcheduser.balance - betamount;
       }else{
        matcheduser.balance=matcheduser.balance + winamount;
       }
      if(matcheduser){
        console.log("matched user",matcheduser.username);
      }else{
        console.log("no matched user");
      }
      await matcheduser.save();
      
       res.status(200).json({
        success:true,
        balance:matcheduser.balance,
        message:"callback data received",
        data:req.body
       })


   }catch(err){
    console.log(err)
   }
});


Userrouter.post("/refund", async (req, res) => {
  try {
    const {
      account_id,
      username: rawUsername,
      provider_code,
      amount,                // এখানে integer আসবে
      game_code,
      verification_key,
      bet_type,
      transaction_id,
      times,
    } = req.body;

    console.log("Refund/CancelBET callback received →", {
      account_id,
      rawUsername,
      provider_code,
      amount,
      bet_type,
      transaction_id,
    });

    // Required fields + bet_type check
    if (
      !rawUsername ||
      amount === undefined ||
      bet_type !== "CANCELBET"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields or invalid bet_type (only CANCELBET allowed)",
      });
    }

    // Amount কে integer হিসেবে validate করা (যদি string আসে তাহলে convert)
    const amountBDT = Number(amount);   // string হলে number-এ কনভার্ট
    if (!Number.isInteger(amountBDT) || amountBDT < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a non-negative integer (in BDT)",
      });
    }

    // Username clean — শুধুমাত্র শেষের "45" কেটে ফেলা
    let cleanUsername = rawUsername.trim();
    if (cleanUsername.endsWith("45")) {
      cleanUsername = cleanUsername.slice(0, -2); // Remove last 2 characters
    }

    if (!cleanUsername) {
      return res.status(400).json({
        success: false,
        message: "Invalid username format",
      });
    }

    console.log("Username processing:", {
      original: rawUsername,
      cleaned: cleanUsername,
    });

    console.log("Searching user for refund:", cleanUsername);

    // Find user by username
    const player = await User.findOne({ username: cleanUsername });

    if (!player) {
      console.log("User NOT found for refund:", cleanUsername);
      return res.status(404).json({
        success: false,
        message: "User not found",
        debug: { searched: cleanUsername, original: rawUsername },
      });
    }

    console.log(
      "Player found for refund:",
      player.username,
      "Current Balance:",
      player.balance,
      "User ID:",
      player._id
    );

    const refundAmount = amountBDT;  // Direct BDT amount
    const previousBalance = player.balance || 0;
    const newBalance = previousBalance + refundAmount;

    // Generate a unique transaction ID if not provided
    const refundTransactionId = transaction_id || `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update user balance and transaction history
    const updatedPlayer = await User.findOneAndUpdate(
      { _id: player._id },
      {
        $set: { 
          balance: newBalance,
          net_profit: (player.net_profit || 0) + refundAmount
        },
        $inc: { 
          total_wins: refundAmount,
          lifetime_bet: 0 // No bet for refund
        },
        $push: { 
          // Add to betHistory
          betHistory: {
            betAmount: 0,
            betResult: "refund",
            transaction_id: refundTransactionId,
            game_id: game_code || "refund_game",
            bet_time: new Date(),
            status: "refunded",
            provider_code: provider_code,
            bet_type: "CANCELBET"
          },
          // Add to transactionHistory
          transactionHistory: {
            type: "refund",
            amount: refundAmount,
            balanceBefore: previousBalance,
            balanceAfter: newBalance,
            description: `Refund/CANCELBET: ${game_code || 'Game'} via ${provider_code || 'Provider'}`,
            referenceId: refundTransactionId,
            createdAt: new Date(),
          },
          // Optional: Add to profitLossHistory if you want to track
          profitLossHistory: {
            type: "profit",
            amount: refundAmount,
            reason: `Refund for game ${game_code}`,
            date: new Date()
          }
        }
      },
      { 
        new: true,
        runValidators: true 
      }
    );

    // Create BettingHistory record if BettingHistory model exists
    try {
      const bettingHistoryRecord = new BettingHistory({
        member_account: rawUsername,
        original_username: cleanUsername,
        user_id: player._id,
        bet_amount: 0,
        win_amount: refundAmount,
        net_amount: refundAmount,
        game_uid: game_code || "refund_game",
        serial_number: refundTransactionId,
        currency_code: 'BDT',
        status: 'refunded',
        balance_before: previousBalance,
        balance_after: newBalance,
        transaction_time: new Date(),
        processed_at: new Date(),
        platform: 'casino',
        game_type: provider_code || 'refund',
        device_info: 'web',
        provider_code: provider_code,
        bet_type: 'CANCELBET',
        processing_format: 'refund',
        refund_details: {
          original_transaction_id: transaction_id,
          verification_key: verification_key,
          times: times
        }
      });

      await bettingHistoryRecord.save();
      console.log("BettingHistory record created for refund");
    } catch (bettingHistoryError) {
      console.log("Note: BettingHistory record not created:", bettingHistoryError.message);
      // Continue even if BettingHistory fails
    }

    // Apply bet to wagering (0 amount for refund)
    if (updatedPlayer.applyBetToWagering) {
      await updatedPlayer.applyBetToWagering(0);
    }

    return res.json({
      success: true,
      message: "Refund processed successfully (CANCELBET)",
      data: {
        original_username: rawUsername,
        matched_username: player.username,
        user_id: player._id,
        previous_balance: previousBalance,
        refunded_amount: refundAmount,
        new_balance: newBalance,
        amount_bdt: amountBDT,
        transaction_id: refundTransactionId,
        username_processing: {
          received: rawUsername,
          cleaned_to: cleanUsername,
          method: "removed '45' suffix"
        },
        timestamp: new Date()
      },
    });
  } catch (error) {
    console.error("Refund callback error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during refund processing",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});


// ----------------betting-records------------------------
Userrouter.get("/betting-records/:userId", authenticateToken,async(req,res)=>{
      const bettingrecords=await BettingHistory.find({user_id:req.params.userId}).sort({createdAt:-1});
      res.status(200).json({success:true,data:bettingrecords});   
})

// Add this near the top with other model imports
const Bonus = require("../models/Bonus");

// ==================== USER BONUS ROUTES ====================

// GET all active bonuses for user
Userrouter.get("/bonuses/available", authenticateToken, async (req, res) => {
  try {
    const { bonusType } = req.query;
    
    const query = {
      status: 'active',
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    };


    // Check applicableTo criteria
    const user = req.user;
    const userCreatedDate = new Date(user.createdAt);
    const daysSinceRegistration = Math.floor((new Date() - userCreatedDate) / (1000 * 60 * 60 * 24));
    
    // Filter based on applicableTo
    const applicableBonuses = await Bonus.find(query);
    
    // Filter manually based on user eligibility
    const eligibleBonuses = applicableBonuses.filter(bonus => {
      if (bonus.applicableTo === 'all') return true;
      if (bonus.applicableTo === 'new' && daysSinceRegistration <= 7) return true;
      if (bonus.applicableTo === 'existing' && daysSinceRegistration > 7) return true;
      return false;
    });

    // Format bonuses for user display
    const formattedBonuses = eligibleBonuses.map(bonus => ({
      id: bonus._id,
      name: bonus.name,
      bonusCode: bonus.bonusCode,
      bonusType: bonus.bonusType,
      amount: bonus.amount,
      percentage: bonus.percentage,
      minDeposit: bonus.minDeposit,
      maxBonus: bonus.maxBonus,
      wageringRequirement: bonus.wageringRequirement,
      validityDays: bonus.validityDays,
      applicableTo: bonus.applicableTo,
      description: getBonusDescription(bonus)
    }));
console.log(formattedBonuses)
    res.json({
      success: true,
      data: formattedBonuses
    });
  } catch (error) {
    console.error("Error fetching available bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available bonuses"
    });
  }
});

// Helper function to generate bonus description
function getBonusDescription(bonus) {
  let description = '';
  
  if (bonus.amount > 0) {
    description += `Get ${bonus.amount.toFixed(2)} BDT bonus. `;
  }
  
  if (bonus.percentage > 0) {
    description += `Get ${bonus.percentage}% bonus on your deposit. `;
  }
  
  if (bonus.minDeposit > 0) {
    description += `Minimum deposit: ${bonus.minDeposit.toFixed(2)} BDT. `;
  }
  
  if (bonus.maxBonus) {
    description += `Maximum bonus: ${bonus.maxBonus.toFixed(2)} BDT. `;
  }
  
  
  description += `Valid for ${bonus.validityDays} days.`;
  
  return description;
}

// GET user's active bonuses (bonuses they have claimed)
Userrouter.get("/bonuses/my-bonuses", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Get all active bonuses from user's bonusInfo
    const activeBonuses = user.bonusInfo?.activeBonuses || [];
    const bonusActivityLogs = user.bonusActivityLogs || [];
    
    // Format active bonuses with additional info
    const formattedActiveBonuses = activeBonuses.map(bonus => {
      const remainingDays = Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
      
      return {
        bonusId: bonus.bonusId,
        bonusCode: bonus.bonusCode,
        bonusType: bonus.bonusType,
        amount: bonus.amount,
        originalAmount: bonus.originalAmount,
        wageringRequirement: bonus.wageringRequirement,
        wageringCompleted: bonus.wageringCompleted || 0,
        remainingWagering: Math.max(0, (bonus.originalAmount * bonus.wageringRequirement) - (bonus.wageringCompleted || 0)),
        createdAt: bonus.createdAt,
        expiresAt: bonus.expiresAt,
        remainingDays: Math.max(0, remainingDays),
        status: 'active'
      };
    });

    // Get recently claimed/used bonuses from activity logs
    const recentActivity = bonusActivityLogs
      .sort((a, b) => new Date(b.activatedAt) - new Date(a.activatedAt))
      .slice(0, 10)
      .map(log => ({
        bonusType: log.bonusType,
        bonusAmount: log.bonusAmount,
        depositAmount: log.depositAmount || 0,
        activatedAt: log.activatedAt,
        status: log.status,
        source: log.source
      }));

    res.json({
      success: true,
      data: {
        bonusBalance: user.bonusBalance || 0,
        activeBonuses: formattedActiveBonuses,
        recentActivity: recentActivity,
        stats: {
          totalActive: formattedActiveBonuses.length,
          totalWageringRequired: formattedActiveBonuses.reduce((sum, bonus) => 
            sum + (bonus.originalAmount * bonus.wageringRequirement), 0),
          totalWageringCompleted: formattedActiveBonuses.reduce((sum, bonus) => 
            sum + (bonus.wageringCompleted || 0), 0)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user bonuses"
    });
  }
});

// GET specific bonus details by code
Userrouter.get("/bonuses/code/:code", authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const user = req.user;

    // Find bonus by code
    const bonus = await Bonus.findOne({ 
      bonusCode: code.toUpperCase(),
      status: 'active',
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    });

    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus code not found or expired"
      });
    }

    // Check if user is eligible
    const userCreatedDate = new Date(user.createdAt);
    const daysSinceRegistration = Math.floor((new Date() - userCreatedDate) / (1000 * 60 * 60 * 24));
    
    let isEligible = true;
    let eligibilityMessage = 'You are eligible for this bonus';

    if (bonus.applicableTo === 'new' && daysSinceRegistration > 7) {
      isEligible = false;
      eligibilityMessage = 'This bonus is only for new users (registered within 7 days)';
    } else if (bonus.applicableTo === 'existing' && daysSinceRegistration <= 7) {
      isEligible = false;
      eligibilityMessage = 'This bonus is only for existing users (registered more than 7 days ago)';
    }

    // Check if user has already claimed this bonus
    const alreadyClaimed = user.bonusActivityLogs?.some(log => 
      log.bonusCode === bonus.bonusCode && log.status === 'active'
    );

    if (alreadyClaimed) {
      isEligible = false;
      eligibilityMessage = 'You have already claimed this bonus';
    }

    // Calculate example bonus amount
    let exampleAmount = 0;
    if (bonus.percentage > 0 && bonus.minDeposit > 0) {
      exampleAmount = (bonus.minDeposit * bonus.percentage) / 100;
      if (bonus.maxBonus && exampleAmount > bonus.maxBonus) {
        exampleAmount = bonus.maxBonus;
      }
    } else if (bonus.amount > 0) {
      exampleAmount = bonus.amount;
    }

    const response = {
      success: true,
      data: {
        id: bonus._id,
        name: bonus.name,
        bonusCode: bonus.bonusCode,
        bonusType: bonus.bonusType,
        amount: bonus.amount,
        percentage: bonus.percentage,
        minDeposit: bonus.minDeposit,
        maxBonus: bonus.maxBonus,
        wageringRequirement: bonus.wageringRequirement,
        validityDays: bonus.validityDays,
        applicableTo: bonus.applicableTo,
        endDate: bonus.endDate,
        description: getBonusDescription(bonus),
        exampleAmount: exampleAmount,
        isEligible: isEligible,
        eligibilityMessage: eligibilityMessage,
        alreadyClaimed: alreadyClaimed
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching bonus by code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus details"
    });
  }
});

// POST claim bonus (user enters bonus code)
Userrouter.post("/bonuses/claim", authenticateToken, async (req, res) => {
  try {
    const { bonusCode, depositAmount = 0 } = req.body;
    const user = req.user;

    if (!bonusCode) {
      return res.status(400).json({
        success: false,
        message: "Bonus code is required"
      });
    }

    // Find bonus by code
    const bonus = await Bonus.findOne({ 
      bonusCode: bonusCode.toUpperCase(),
      status: 'active',
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    });

    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired bonus code"
      });
    }

    // Check eligibility
    const userCreatedDate = new Date(user.createdAt);
    const daysSinceRegistration = Math.floor((new Date() - userCreatedDate) / (1000 * 60 * 60 * 24));

    if (bonus.applicableTo === 'new' && daysSinceRegistration > 7) {
      return res.status(400).json({
        success: false,
        message: "This bonus is only for new users (registered within 7 days)"
      });
    }

    if (bonus.applicableTo === 'existing' && daysSinceRegistration <= 7) {
      return res.status(400).json({
        success: false,
        message: "This bonus is only for existing users (registered more than 7 days ago)"
      });
    }

    // Check if minimum deposit requirement is met
    if (depositAmount > 0 && depositAmount < bonus.minDeposit) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit required: ${bonus.minDeposit} BDT`
      });
    }

    // Check if user has already claimed this bonus
    const alreadyClaimed = user.bonusActivityLogs?.some(log => 
      log.bonusCode === bonus.bonusCode && log.status === 'active'
    );

    if (alreadyClaimed) {
      return res.status(400).json({
        success: false,
        message: "You have already claimed this bonus"
      });
    }

    // Calculate bonus amount
    let bonusAmount = bonus.amount;
    if (bonus.percentage > 0 && depositAmount > 0) {
      bonusAmount = (depositAmount * bonus.percentage) / 100;
      if (bonus.maxBonus && bonusAmount > bonus.maxBonus) {
        bonusAmount = bonus.maxBonus;
      }
    }

    // Add bonus to user's balance
    user.bonusBalance = (user.bonusBalance || 0) + bonusAmount;

    // Add to active bonuses
    user.bonusInfo = user.bonusInfo || {};
    user.bonusInfo.activeBonuses = user.bonusInfo.activeBonuses || [];
    
    user.bonusInfo.activeBonuses.push({
      bonusType: bonus.bonusType,
      bonusId: bonus._id,
      bonusCode: bonus.bonusCode,
      amount: bonusAmount,
      originalAmount: bonusAmount,
      wageringRequirement: bonus.wageringRequirement,
      wageringCompleted: 0,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + bonus.validityDays * 24 * 60 * 60 * 1000)
    });

    // Log the bonus activity
    user.bonusActivityLogs = user.bonusActivityLogs || [];
    user.bonusActivityLogs.push({
      bonusType: bonus.bonusType,
      bonusId: bonus._id,
      bonusCode: bonus.bonusCode,
      bonusAmount: bonusAmount,
      depositAmount: depositAmount,
      activatedAt: new Date(),
      status: "active",
      source: "manual_claim"
    });

    // Add transaction history
    user.transactionHistory = user.transactionHistory || [];
    user.transactionHistory.push({
      type: "bonus",
      amount: bonusAmount,
      balanceBefore: user.bonusBalance - bonusAmount,
      balanceAfter: user.bonusBalance,
      description: `Bonus claimed: ${bonus.name} (${bonus.bonusCode})`,
      referenceId: `BONUS-${Date.now()}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "Bonus claimed successfully!",
      data: {
        bonusAmount: bonusAmount,
        newBonusBalance: user.bonusBalance,
        wageringRequirement: bonus.wageringRequirement,
        validityDays: bonus.validityDays,
        expiresAt: new Date(Date.now() + bonus.validityDays * 24 * 60 * 60 * 1000)
      }
    });

  } catch (error) {
    console.error("Error claiming bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim bonus"
    });
  }
});

// GET user's bonus wagering status
Userrouter.get("/bonuses/wagering-status", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    const activeBonuses = user.bonusInfo?.activeBonuses || [];
    
    // Calculate total wagering stats
    const totalWageringRequired = activeBonuses.reduce((sum, bonus) => 
      sum + (bonus.originalAmount * bonus.wageringRequirement), 0);
    
    const totalWageringCompleted = activeBonuses.reduce((sum, bonus) => 
      sum + (bonus.wageringCompleted || 0), 0);
    
    const totalWageringRemaining = totalWageringRequired - totalWageringCompleted;
    
    // Calculate percentage completed
    const percentageCompleted = totalWageringRequired > 0 
      ? Math.min(100, (totalWageringCompleted / totalWageringRequired) * 100)
      : 0;

    // Get active bonuses with detailed wagering info
    const bonusWageringDetails = activeBonuses.map(bonus => {
      const remainingWagering = Math.max(0, 
        (bonus.originalAmount * bonus.wageringRequirement) - (bonus.wageringCompleted || 0)
      );
      
      const bonusPercentageCompleted = bonus.wageringRequirement > 0
        ? Math.min(100, ((bonus.wageringCompleted || 0) / (bonus.originalAmount * bonus.wageringRequirement)) * 100)
        : 0;

      return {
        bonusId: bonus.bonusId,
        bonusCode: bonus.bonusCode,
        bonusType: bonus.bonusType,
        bonusAmount: bonus.amount,
        originalAmount: bonus.originalAmount,
        wageringRequirement: bonus.wageringRequirement,
        wageringCompleted: bonus.wageringCompleted || 0,
        remainingWagering: remainingWagering,
        percentageCompleted: bonusPercentageCompleted,
        expiresAt: bonus.expiresAt
      };
    });

    res.json({
      success: true,
      data: {
        bonusBalance: user.bonusBalance || 0,
        totalWageringRequired: totalWageringRequired,
        totalWageringCompleted: totalWageringCompleted,
        totalWageringRemaining: totalWageringRemaining,
        percentageCompleted: percentageCompleted,
        activeBonusesCount: activeBonuses.length,
        bonusWageringDetails: bonusWageringDetails,
        canWithdrawBonusFunds: totalWageringRemaining === 0 && user.bonusBalance > 0
      }
    });
  } catch (error) {
    console.error("Error fetching wagering status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wagering status"
    });
  }
});

// POST convert bonus to real money (after wagering completed)
Userrouter.post("/bonuses/convert", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user has any bonus balance
    if (!user.bonusBalance || user.bonusBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "No bonus balance available"
      });
    }

    // Check wagering requirements for all active bonuses
    const activeBonuses = user.bonusInfo?.activeBonuses || [];
    const incompleteWagering = activeBonuses.filter(bonus => {
      const requiredWagering = bonus.originalAmount * bonus.wageringRequirement;
      return (bonus.wageringCompleted || 0) < requiredWagering;
    });

    if (incompleteWagering.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Wagering requirements not met for all bonuses",
        incompleteBonuses: incompleteWagering.map(b => ({
          bonusCode: b.bonusCode,
          wageringCompleted: b.wageringCompleted || 0,
          wageringRequired: b.originalAmount * b.wageringRequirement,
          remaining: (b.originalAmount * b.wageringRequirement) - (b.wageringCompleted || 0)
        }))
      });
    }

    // Convert bonus to real money
    const bonusAmount = user.bonusBalance;
    const newRealBalance = (user.balance || 0) + bonusAmount;

    // Update balances
    user.balance = newRealBalance;
    user.bonusBalance = 0;

    // Mark active bonuses as converted
    activeBonuses.forEach(bonus => {
      bonus.status = 'converted';
      bonus.convertedAt = new Date();
    });

    // Log transaction
    user.transactionHistory.push({
      type: "bonus_conversion",
      amount: bonusAmount,
      balanceBefore: user.balance - bonusAmount,
      balanceAfter: user.balance,
      description: "Bonus converted to real money",
      referenceId: `CONV-${Date.now()}`,
      createdAt: new Date()
    });

    // Log bonus activity
    user.bonusActivityLogs.push({
      action: "converted_to_real_money",
      amount: bonusAmount,
      timestamp: new Date(),
      details: {
        previousBonusBalance: bonusAmount,
        newRealBalance: newRealBalance
      }
    });

    await user.save();

    res.json({
      success: true,
      message: "Bonus successfully converted to real money",
      data: {
        convertedAmount: bonusAmount,
        newBalance: user.balance,
        newBonusBalance: user.bonusBalance
      }
    });

  } catch (error) {
    console.error("Error converting bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to convert bonus"
    });
  }
});

// GET bonus types available
Userrouter.get("/bonuses/types", authenticateToken, async (req, res) => {
  try {
    // Get distinct bonus types from active bonuses
    const bonusTypes = await Bonus.distinct('bonusType', {
      status: 'active',
      endDate: { $gte: new Date() },
      startDate: { $lte: new Date() }
    });

    const typeDescriptions = {
      welcome: "Welcome bonuses for new players",
      deposit: "Bonus on your deposits",
      reload: "Bonus on subsequent deposits",
      cashback: "Get back a percentage of your losses",
      free_spin: "Free spins on slot games",
      special: "Special promotional bonuses",
      manual: "Manually assigned bonuses"
    };

    const formattedTypes = bonusTypes.map(type => ({
      type: type,
      name: type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: typeDescriptions[type] || "Bonus offer",
      icon: getBonusTypeIcon(type)
    }));

    res.json({
      success: true,
      data: formattedTypes
    });
  } catch (error) {
    console.error("Error fetching bonus types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus types"
    });
  }
});

// Helper function for bonus type icons
function getBonusTypeIcon(type) {
  switch(type) {
    case 'welcome': return '🎉';
    case 'deposit': return '💰';
    case 'reload': return '🔄';
    case 'cashback': return '💸';
    case 'free_spin': return '🎰';
    case 'special': return '⭐';
    case 'manual': return '✏️';
    default: return '🎁';
  }
}



// ==================== USER TURNOVER ROUTES ====================

// GET user's turnover and wagering status
Userrouter.get("/turnover/status", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Calculate deposit turnover
    const totalDeposit = user.total_deposit || 0;
    const totalBet = user.total_bet || 0;
    const requiredDepositTurnover = totalDeposit * 3;
    const depositTurnoverCompleted = totalBet >= requiredDepositTurnover;
    const depositTurnoverRemaining = Math.max(0, requiredDepositTurnover - totalBet);
    const depositTurnoverProgress = requiredDepositTurnover > 0 
      ? Math.min(100, (totalBet / requiredDepositTurnover) * 100)
      : 0;

    // Calculate bonus turnover for each active bonus
    const activeBonuses = user.bonusInfo?.activeBonuses || [];
    const bonusTurnoverDetails = activeBonuses.map(bonus => {
      const bonusAmount = bonus.amount || bonus.originalAmount || 0;
      const wageringRequirement = bonus.wageringRequirement || 30;
      const amountWagered = bonus.amountWagered || 0;
      const requiredWagering = bonusAmount * wageringRequirement;
      const remainingWagering = Math.max(0, requiredWagering - amountWagered);
      const progress = requiredWagering > 0 
        ? Math.min(100, (amountWagered / requiredWagering) * 100)
        : 0;
      
      const remainingDays = bonus.expiresAt 
        ? Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        bonusId: bonus._id || bonus.id,
        bonusType: bonus.bonusType,
        bonusCode: bonus.bonusCode || '',
        bonusAmount: bonusAmount,
        wageringRequirement: wageringRequirement,
        amountWagered: amountWagered,
        requiredWagering: requiredWagering,
        remainingWagering: remainingWagering,
        progress: progress,
        expiresAt: bonus.expiresAt,
        remainingDays: remainingDays,
        status: progress >= 100 ? 'completed' : 'active',
        createdAt: bonus.createdAt
      };
    });

    // Calculate totals for all bonuses
    const totalBonusAmount = bonusTurnoverDetails.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
    const totalRequiredWagering = bonusTurnoverDetails.reduce((sum, bonus) => sum + bonus.requiredWagering, 0);
    const totalAmountWagered = bonusTurnoverDetails.reduce((sum, bonus) => sum + bonus.amountWagered, 0);
    const totalRemainingWagering = bonusTurnoverDetails.reduce((sum, bonus) => sum + bonus.remainingWagering, 0);
    const overallBonusProgress = totalRequiredWagering > 0 
      ? Math.min(100, (totalAmountWagered / totalRequiredWagering) * 100)
      : 0;

    // Get completed bonuses from activity logs
    const completedBonuses = user.bonusActivityLogs?.filter(log => 
      log.status === 'completed' || log.status === 'expired'
    ) || [];

    // Calculate overall withdrawal eligibility
    const canWithdraw = depositTurnoverCompleted && 
                       user.bonusBalance === 0 &&
                       bonusTurnoverDetails.every(bonus => bonus.progress >= 100);

    const response = {
      success: true,
      data: {
        // User info
        userId: user._id,
        username: user.username,
        currency: user.currency,
        
        // Deposit turnover
        depositTurnover: {
          totalDeposit: totalDeposit,
          totalBet: totalBet,
          requiredTurnover: requiredDepositTurnover,
          remainingTurnover: depositTurnoverRemaining,
          progress: depositTurnoverProgress,
          isCompleted: depositTurnoverCompleted,
          canWithdraw: depositTurnoverCompleted,
          commissionRate: depositTurnoverCompleted ? 0 : 0.2 // 20% commission if not completed
        },
        
        // Bonus turnover
        bonusTurnover: {
          activeBonuses: bonusTurnoverDetails.filter(b => b.status === 'active'),
          completedBonuses: bonusTurnoverDetails.filter(b => b.status === 'completed'),
          totalBonusAmount: totalBonusAmount,
          totalRequiredWagering: totalRequiredWagering,
          totalAmountWagered: totalAmountWagered,
          totalRemainingWagering: totalRemainingWagering,
          overallProgress: overallBonusProgress,
          bonusBalance: user.bonusBalance || 0,
          canWithdrawBonus: overallBonusProgress >= 100 && user.bonusBalance > 0
        },
        
        // Overall status
        overallStatus: {
          canWithdraw: canWithdraw,
          withdrawalCommission: canWithdraw ? 0 : 0.2,
          pendingRequirements: [
            ...(!depositTurnoverCompleted ? [`Deposit turnover (${depositTurnoverRemaining} BDT remaining)`] : []),
            ...bonusTurnoverDetails
              .filter(b => b.status === 'active')
              .map(b => `${b.bonusType} bonus (${b.remainingWagering} BDT remaining)`),
            ...(user.bonusBalance > 0 ? ['Active bonus balance must be cleared'] : [])
          ],
          nextSteps: canWithdraw 
            ? ['You can now withdraw your funds without commission']
            : ['Continue betting to complete turnover requirements']
        },
        
        // Stats summary
        stats: {
          totalActiveBonuses: bonusTurnoverDetails.filter(b => b.status === 'active').length,
          totalCompletedBonuses: bonusTurnoverDetails.filter(b => b.status === 'completed').length,
          totalExpiringSoon: bonusTurnoverDetails.filter(b => 
            b.remainingDays !== null && b.remainingDays < 3 && b.status === 'active'
          ).length,
          totalProgress: Math.min(100, 
            ((totalBet + totalAmountWagered) / (requiredDepositTurnover + totalRequiredWagering)) * 100
          )
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching turnover status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch turnover status"
    });
  }
});

// GET detailed bonus wagering progress
Userrouter.get("/turnover/bonus/:bonusId", authenticateToken, async (req, res) => {
  try {
    const { bonusId } = req.params;
    const user = req.user;

    // Find the specific bonus
    const bonus = user.bonusInfo?.activeBonuses?.find(b => 
      b._id.toString() === bonusId || b.id === bonusId
    );

    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus not found"
      });
    }

    const bonusAmount = bonus.amount || bonus.originalAmount || 0;
    const wageringRequirement = bonus.wageringRequirement || 30;
    const amountWagered = bonus.amountWagered || 0;
    const requiredWagering = bonusAmount * wageringRequirement;
    const remainingWagering = Math.max(0, requiredWagering - amountWagered);
    const progress = requiredWagering > 0 
      ? Math.min(100, (amountWagered / requiredWagering) * 100)
      : 0;
    
    const remainingDays = bonus.expiresAt 
      ? Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    // Find related betting history for this bonus
    const bettingHistory = await BettingHistory.find({
      user_id: user._id,
      status: { $in: ['won', 'lost'] }
    })
    .sort({ createdAt: -1 })
    .limit(20);

    // Calculate which bets contributed to wagering
    const contributingBets = bettingHistory.filter(bet => {
      // Check if bet was placed during bonus active period
      const betTime = new Date(bet.transaction_time || bet.createdAt);
      const bonusCreated = new Date(bonus.createdAt);
      const bonusExpires = new Date(bonus.expiresAt);
      return betTime >= bonusCreated && betTime <= bonusExpires;
    });

    const response = {
      success: true,
      data: {
        bonusDetails: {
          bonusId: bonus._id || bonus.id,
          bonusType: bonus.bonusType,
          bonusCode: bonus.bonusCode || '',
          bonusAmount: bonusAmount,
          originalAmount: bonus.originalAmount,
          wageringRequirement: wageringRequirement,
          amountWagered: amountWagered,
          requiredWagering: requiredWagering,
          remainingWagering: remainingWagering,
          progress: progress,
          status: progress >= 100 ? 'completed' : 'active',
          createdAt: bonus.createdAt,
          expiresAt: bonus.expiresAt,
          remainingDays: remainingDays
        },
        wageringDetails: {
          perBetRequirements: {
            minBet: 10, // Minimum bet amount
            maxBet: bonusAmount * 0.5, // Maximum 50% of bonus per bet
            eligibleGames: ['casino', 'slots', 'sports', 'live_casino'],
            ineligibleBets: ['free_spin', 'bonus_round']
          },
          progressBreakdown: {
            last7Days: Math.min(100, (amountWagered / requiredWagering) * 100), // Simplified
            last30Days: Math.min(100, (amountWagered / requiredWagering) * 100) // Simplified
          }
        },
        recentContributingBets: contributingBets.slice(0, 10).map(bet => ({
          betId: bet._id,
          betAmount: bet.bet_amount,
          winAmount: bet.win_amount || 0,
          netAmount: bet.net_amount || 0,
          game: bet.game_type || bet.provider_code,
          timestamp: bet.transaction_time || bet.createdAt,
          contributedToWagering: Math.min(bet.bet_amount, remainingWagering)
        })),
        remainingRequirements: {
          dailyTarget: remainingDays > 0 ? remainingWagering / remainingDays : 0,
          estimatedCompletion: remainingDays > 0 && amountWagered > 0 
            ? `Approximately ${Math.ceil(remainingWagering / (amountWagered / 30))} days` 
            : 'Not enough data',
          urgency: remainingDays < 7 ? 'high' : remainingDays < 14 ? 'medium' : 'low'
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching bonus turnover details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus turnover details"
    });
  }
});

// GET user's turnover timeline (recent activity)
Userrouter.get("/turnover/timeline", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const { limit = 20 } = req.query;

    // Get betting history
    const bettingHistory = await BettingHistory.find({ user_id: user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Get deposit history
    const depositHistory = user.depositHistory?.slice(0, 10) || [];

    // Combine and sort all activities
    const allActivities = [
      ...bettingHistory.map(bet => ({
        type: 'bet',
        amount: bet.bet_amount,
        netAmount: bet.net_amount || 0,
        description: `Bet on ${bet.game_type || bet.provider_code}`,
        timestamp: bet.transaction_time || bet.createdAt,
        status: bet.status,
        referenceId: bet.serial_number,
        contributesToWagering: true,
        wageringAmount: bet.bet_amount // Full bet amount contributes
      })),
      
      ...depositHistory.map(deposit => ({
        type: 'deposit',
        amount: deposit.amount,
        description: `Deposit via ${deposit.method}`,
        timestamp: deposit.createdAt,
        status: deposit.status,
        referenceId: deposit.transactionId || deposit._id,
        contributesToWagering: false,
        bonusApplied: deposit.bonusApplied,
        bonusAmount: deposit.bonusAmount || 0
      })),
      
      // Add bonus activation events
      ...(user.bonusActivityLogs || []).map(log => ({
        type: 'bonus_activation',
        amount: log.bonusAmount || 0,
        description: `${log.bonusType} bonus activated`,
        timestamp: log.activatedAt || log.createdAt,
        status: log.status,
        referenceId: log._id,
        contributesToWagering: false,
        bonusCode: log.bonusCode,
        wageringRequirement: log.wageringRequirement
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Calculate cumulative wagering progress
    let cumulativeWagering = 0;
    const timelineWithProgress = allActivities.map(activity => {
      if (activity.contributesToWagering) {
        cumulativeWagering += activity.wageringAmount || 0;
      }
      
      return {
        ...activity,
        cumulativeWagering: activity.contributesToWagering ? cumulativeWagering : undefined
      };
    });

    const response = {
      success: true,
      data: {
        timeline: timelineWithProgress,
        stats: {
          totalActivities: timelineWithProgress.length,
          totalBets: timelineWithProgress.filter(a => a.type === 'bet').length,
          totalDeposits: timelineWithProgress.filter(a => a.type === 'deposit').length,
          totalBonuses: timelineWithProgress.filter(a => a.type === 'bonus_activation').length,
          totalWagered: cumulativeWagering,
          lastUpdated: new Date()
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching turnover timeline:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch turnover timeline"
    });
  }
});

// POST cancel active bonus (user initiated)
Userrouter.post("/turnover/bonus/cancel", authenticateToken, async (req, res) => {
  try {
    const { bonusId, reason } = req.body;
    const user = req.user;

    if (!bonusId) {
      return res.status(400).json({
        success: false,
        message: "Bonus ID is required"
      });
    }

    // Find the bonus in active bonuses
    const bonusIndex = user.bonusInfo?.activeBonuses?.findIndex(b => 
      b._id.toString() === bonusId || b.id === bonusId
    );

    if (bonusIndex === -1 || bonusIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: "Active bonus not found"
      });
    }

    const bonus = user.bonusInfo.activeBonuses[bonusIndex];
    const bonusAmount = bonus.amount || bonus.originalAmount || 0;

    // Check if bonus has any wagering completed
    const amountWagered = bonus.amountWagered || 0;
    const requiredWagering = bonusAmount * (bonus.wageringRequirement || 30);

    // Apply penalty if wagering has started
    let penaltyAmount = 0;
    let message = "Bonus cancelled successfully";

    if (amountWagered > 0) {
      // Penalty: 50% of remaining bonus amount + 20% penalty
      const remainingBonus = Math.max(0, bonusAmount - (amountWagered / (bonus.wageringRequirement || 30)));
      penaltyAmount = remainingBonus * 1.2; // 120% penalty
      
      // Check if user has enough balance to pay penalty
      if (user.balance < penaltyAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance to pay cancellation penalty. Required: ${penaltyAmount} ${user.currency}`
        });
      }

      // Deduct penalty from balance
      user.balance -= penaltyAmount;
      message = `Bonus cancelled with ${penaltyAmount} ${user.currency} penalty applied`;
    }

    // Remove bonus amount from bonus balance
    user.bonusBalance = Math.max(0, (user.bonusBalance || 0) - bonusAmount);

    // Move bonus to cancelled bonuses
    user.bonusInfo.cancelledBonuses = user.bonusInfo.cancelledBonuses || [];
    user.bonusInfo.cancelledBonuses.push({
      bonusType: bonus.bonusType,
      amount: bonusAmount,
      penaltyApplied: penaltyAmount,
      cancelledAt: new Date(),
      cancellationReason: reason || 'User requested cancellation',
      amountWagered: amountWagered,
      wageringRequirement: bonus.wageringRequirement
    });

    // Remove from active bonuses
    user.bonusInfo.activeBonuses.splice(bonusIndex, 1);

    // Update bonus activity log
    const bonusLog = user.bonusActivityLogs?.find(log => 
      log.bonusCode === bonus.bonusCode && log.status === 'active'
    );

    if (bonusLog) {
      bonusLog.status = 'cancelled';
      bonusLog.cancelledAt = new Date();
      bonusLog.cancellationReason = reason || 'User requested cancellation';
    }

    // Add transaction record
    user.transactionHistory.push({
      type: "bonus_cancellation",
      amount: -penaltyAmount,
      balanceBefore: user.balance + penaltyAmount,
      balanceAfter: user.balance,
      description: `${bonus.bonusType} bonus cancellation${penaltyAmount > 0 ? ` with penalty` : ''}`,
      referenceId: `BONUS-CANCEL-${Date.now()}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: message,
      data: {
        cancelledBonus: {
          type: bonus.bonusType,
          amount: bonusAmount,
          penaltyApplied: penaltyAmount,
          newBalance: user.balance,
          newBonusBalance: user.bonusBalance,
          cancellationReason: reason || 'User requested cancellation'
        }
      }
    });

  } catch (error) {
    console.error("Error cancelling bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel bonus"
    });
  }
});

// GET turnover requirements summary
Userrouter.get("/turnover/requirements", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Deposit turnover requirement
    const depositRequirement = {
      type: 'deposit_turnover',
      name: 'Deposit Turnover',
      description: 'You must bet 3x your total deposit amount before withdrawal',
      currentAmount: user.total_bet || 0,
      requiredAmount: (user.total_deposit || 0) * 3,
      progress: (user.total_deposit || 0) > 0 
        ? Math.min(100, ((user.total_bet || 0) / ((user.total_deposit || 0) * 3)) * 100)
        : 0,
      isCompleted: (user.total_bet || 0) >= ((user.total_deposit || 0) * 3),
      penaltyIfNotMet: '20% withdrawal commission',
      priority: 'high'
    };

    // Bonus turnover requirements
    const bonusRequirements = (user.bonusInfo?.activeBonuses || []).map(bonus => {
      const bonusAmount = bonus.amount || bonus.originalAmount || 0;
      const wageringRequirement = bonus.wageringRequirement || 30;
      const requiredWagering = bonusAmount * wageringRequirement;
      const currentWagering = bonus.amountWagered || 0;
      const progress = requiredWagering > 0 
        ? Math.min(100, (currentWagering / requiredWagering) * 100)
        : 0;

      const remainingDays = bonus.expiresAt 
        ? Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        type: 'bonus_wagering',
        bonusId: bonus._id || bonus.id,
        name: `${bonus.bonusType} Bonus Wagering`,
        description: `${bonusAmount} ${user.currency} bonus with ${wageringRequirement}x wagering`,
        currentAmount: currentWagering,
        requiredAmount: requiredWagering,
        progress: progress,
        isCompleted: currentWagering >= requiredWagering,
        expiresIn: remainingDays,
        penaltyIfNotMet: 'Bonus will be forfeited on withdrawal attempt',
        priority: remainingDays && remainingDays < 7 ? 'high' : 'medium'
      };
    });

    // Bonus balance requirement
    const bonusBalanceRequirement = {
      type: 'bonus_balance',
      name: 'Bonus Balance Clearance',
      description: 'All bonus balance must be used or forfeited before withdrawal',
      currentAmount: user.bonusBalance || 0,
      requiredAmount: 0,
      progress: user.bonusBalance > 0 ? 0 : 100,
      isCompleted: (user.bonusBalance || 0) === 0,
      penaltyIfNotMet: 'Withdrawal blocked',
      priority: 'critical'
    };

    const allRequirements = [
      depositRequirement,
      ...bonusRequirements,
      bonusBalanceRequirement
    ];

    // Calculate overall completion status
    const completedRequirements = allRequirements.filter(req => req.isCompleted).length;
    const totalRequirements = allRequirements.length;
    const overallProgress = totalRequirements > 0 
      ? (completedRequirements / totalRequirements) * 100 
      : 100;

    const response = {
      success: true,
      data: {
        requirements: allRequirements,
        summary: {
          totalRequirements: totalRequirements,
          completedRequirements: completedRequirements,
          pendingRequirements: totalRequirements - completedRequirements,
          overallProgress: overallProgress,
          canWithdraw: allRequirements.every(req => req.isCompleted),
          withdrawalConditions: allRequirements.every(req => req.isCompleted) 
            ? 'No restrictions'
            : allRequirements
                .filter(req => !req.isCompleted)
                .map(req => `${req.name}: ${req.description}`)
        },
        actions: {
          canCancelBonuses: bonusRequirements.some(b => b.type === 'bonus_wagering' && !b.isCompleted),
          canConvertBonus: user.bonusBalance > 0 && 
                          bonusRequirements.every(b => b.isCompleted) &&
                          bonusBalanceRequirement.progress < 100
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching turnover requirements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch turnover requirements"
    });
  }
});

// POST apply bet to turnover (for manual adjustment if needed)
Userrouter.post("/turnover/apply-bet", authenticateToken, async (req, res) => {
  try {
    const { betAmount, gameType, description } = req.body;
    const user = req.user;

    if (!betAmount || betAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid bet amount is required"
      });
    }

    // Apply bet to wagering
    await user.applyBetToWagering(parseFloat(betAmount));

    // Add transaction record
    user.transactionHistory.push({
      type: "manual_bet",
      amount: parseFloat(betAmount),
      balanceBefore: user.balance,
      balanceAfter: user.balance, // Balance doesn't change for manual turnover
      description: description || `Manual turnover adjustment for ${gameType || 'game'}`,
      referenceId: `MANUAL-${Date.now()}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "Bet applied to turnover successfully",
      data: {
        betAmount: parseFloat(betAmount),
        newTotalBet: user.total_bet,
        newTotalWagered: user.totalWagered,
        bonusProgress: user.bonusInfo?.activeBonuses?.map(bonus => ({
          bonusType: bonus.bonusType,
          amountWagered: bonus.amountWagered || 0,
          requiredWagering: (bonus.originalAmount || bonus.amount) * (bonus.wageringRequirement || 30),
          progress: ((bonus.amountWagered || 0) / ((bonus.originalAmount || bonus.amount) * (bonus.wageringRequirement || 30))) * 100
        }))
      }
    });
  } catch (error) {
    console.error("Error applying bet to turnover:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply bet to turnover"
    });
  }
});

// ==================== KYC USER ROUTES ====================

const KYC = require("../models/KYC");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for KYC file uploads
const kycStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "./public/uploads/kyc/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "kyc-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const kycFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false);
  }
};

const uploadKYC = multer({
  storage: kycStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: kycFileFilter,
});

// Submit KYC application (User)
Userrouter.post("/kyc/submit", authenticateToken, uploadKYC.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 }
]), async (req, res) => {
  try {
    const { fullName, documentType } = req.body;
    const userId = req.user._id;

    const existingKYC = await KYC.findOne({ 
      userId: userId, 
      status: { $in: ['pending', 'assigned'] } 
    });

    if (existingKYC) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending KYC application'
      });
    }

    if (req.user.kycStatus === 'verified') {
      return res.status(400).json({
        success: false,
        message: 'Your KYC is already verified'
      });
    }

    if (!req.files['documentFront']) {
      return res.status(400).json({
        success: false,
        message: 'Document front image is required'
      });
    }

    const validDocumentTypes = ['nid', 'passport', 'driving_license', 'birth_certificate'];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    const kyc = new KYC({
      userId: userId,
      fullName: fullName || req.user.fullName || req.user.username,
      documentType: documentType,
      documentFront: req.files['documentFront'][0].filename,
      documentBack: req.files['documentBack'] ? req.files['documentBack'][0].filename : null,
      status: 'pending',
      submittedAt: new Date(),
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        location: req.headers['cf-ipcountry'] || 'Unknown'
      }
    });

    await kyc.save();

    await User.findByIdAndUpdate(userId, {
      kycStatus: 'processing',
      kycSubmissionId: kyc._id
    });

    res.status(201).json({
      success: true,
      message: 'KYC application submitted successfully',
      data: {
        kycId: kyc._id,
        status: kyc.status,
        submittedAt: kyc.submittedAt
      }
    });

  } catch (error) {
    console.error('KYC submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC application'
    });
  }
});

// Get user's KYC status
Userrouter.get("/kyc/my-status", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const kyc = await KYC.findOne({ userId: userId })
      .sort({ createdAt: -1 })
      .select('-documentFront -documentBack');

    if (!kyc) {
      return res.json({
        success: true,
        data: {
          status: 'not_submitted',
          message: 'No KYC application found'
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: kyc._id,
        status: kyc.status,
        fullName: kyc.fullName,
        documentType: kyc.documentType,
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
        rejectionReason: kyc.rejectionReason,
        canResubmit: kyc.status === 'rejected'
      }
    });
  } catch (error) {
    console.error('Get KYC status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC status'
    });
  }
});

// Get user's KYC details
Userrouter.get("/kyc/my-details", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const kyc = await KYC.findOne({ userId: userId }).sort({ createdAt: -1 });

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: 'KYC application not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: kyc._id,
        fullName: kyc.fullName,
        documentType: kyc.documentType,
        status: kyc.status,
        submittedAt: kyc.submittedAt,
        reviewedAt: kyc.reviewedAt,
        rejectionReason: kyc.rejectionReason,
        adminNotes: kyc.adminNotes,
        documents: {
          front: kyc.documentFront,
          back: kyc.documentBack
        }
      }
    });
  } catch (error) {
    console.error('Get KYC details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get KYC details'
    });
  }
});

// Resubmit rejected KYC (User)
Userrouter.post("/kyc/resubmit", authenticateToken, uploadKYC.fields([
  { name: 'documentFront', maxCount: 1 },
  { name: 'documentBack', maxCount: 1 }
]), async (req, res) => {
  try {
    const { fullName, documentType } = req.body;
    const userId = req.user._id;

    const oldKyc = await KYC.findOne({ 
      userId: userId, 
      status: 'rejected' 
    }).sort({ createdAt: -1 });

    if (!oldKyc) {
      return res.status(404).json({
        success: false,
        message: 'No rejected KYC application found to resubmit'
      });
    }

    if (!req.files['documentFront']) {
      return res.status(400).json({
        success: false,
        message: 'Document front image is required'
      });
    }

    const validDocumentTypes = ['nid', 'passport', 'driving_license', 'birth_certificate'];
    if (!validDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    const newKyc = new KYC({
      userId: userId,
      fullName: fullName || req.user.fullName || req.user.username,
      documentType: documentType,
      documentFront: req.files['documentFront'][0].filename,
      documentBack: req.files['documentBack'] ? req.files['documentBack'][0].filename : null,
      status: 'pending',
      submittedAt: new Date(),
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        location: req.headers['cf-ipcountry'] || 'Unknown',
        previousKycId: oldKyc._id,
        resubmitted: true
      }
    });

    await newKyc.save();

    await User.findByIdAndUpdate(userId, {
      kycStatus: 'processing',
      kycSubmissionId: newKyc._id,
      kycRejectedAt: null,
      kycRejectionReason: null
    });

    res.status(201).json({
      success: true,
      message: 'KYC resubmitted successfully',
      data: {
        kycId: newKyc._id,
        status: newKyc.status,
        submittedAt: newKyc.submittedAt
      }
    });
  } catch (error) {
    console.error('KYC resubmit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resubmit KYC application'
    });
  }
});



// ==================== CASH BONUS ROUTES (USER SIDE) ====================

// GET all available cash bonuses for the logged-in user
Userrouter.get("/cash-bonus/available", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Find all active bonuses that include this user and are not claimed yet
    const bonuses = await CashBonus.find({
      status: "active",
      "users.userId": userId,
      "users.status": "unclaimed",
      $or: [
        { noExpiry: true },
        { expiresAt: { $gt: now } }
      ]
    }).populate("users.userId", "username email");

    // Format bonuses for user display
    const availableBonuses = bonuses.map(bonus => {
      const userBonus = bonus.users.find(u => u.userId._id.toString() === userId.toString());
      
      return {
        id: bonus._id,
        title: bonus.title,
        description: bonus.description,
        amount: bonus.amount,
        bonusType: bonus.bonusType,
        occasion: bonus.occasion,
        expiresAt: bonus.expiresAt,
        noExpiry: bonus.noExpiry,
        status: userBonus?.status || "unclaimed",
        createdAt: bonus.createdAt
      };
    });

    // Get stats
    const stats = {
      totalAvailable: availableBonuses.length,
      totalBonusAmount: availableBonuses.reduce((sum, bonus) => sum + bonus.amount, 0),
      expiringSoon: availableBonuses.filter(bonus => {
        if (bonus.noExpiry) return false;
        const daysLeft = Math.ceil((new Date(bonus.expiresAt) - now) / (1000 * 60 * 60 * 24));
        return daysLeft <= 7 && daysLeft > 0;
      }).length
    };

    res.json({
      success: true,
      data: {
        bonuses: availableBonuses,
        stats: stats
      }
    });
  } catch (error) {
    console.error("Error fetching available cash bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available bonuses"
    });
  }
});

// GET cash bonus details by ID
Userrouter.get("/cash-bonus/:bonusId", authenticateToken, async (req, res) => {
  try {
    const { bonusId } = req.params;
    const userId = req.user._id;

    const bonus = await CashBonus.findById(bonusId)
      .populate("users.userId", "username email");

    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus not found"
      });
    }

    // Check if user is assigned to this bonus
    const userBonus = bonus.users.find(u => u.userId._id.toString() === userId.toString());
    if (!userBonus) {
      return res.status(403).json({
        success: false,
        message: "You are not eligible for this bonus"
      });
    }

    // Check if bonus is expired
    const isExpired = !bonus.noExpiry && bonus.expiresAt && new Date() > bonus.expiresAt;
    const status = isExpired ? "expired" : bonus.status;

    res.json({
      success: true,
      data: {
        id: bonus._id,
        title: bonus.title,
        description: bonus.description,
        amount: bonus.amount,
        bonusType: bonus.bonusType,
        occasion: bonus.occasion,
        expiresAt: bonus.expiresAt,
        noExpiry: bonus.noExpiry,
        status: status,
        userStatus: userBonus.status,
        claimedAt: userBonus.claimedAt,
        createdAt: bonus.createdAt,
        isClaimable: status === "active" && userBonus.status === "unclaimed" && !isExpired
      }
    });
  } catch (error) {
    console.error("Error fetching cash bonus details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus details"
    });
  }
});

// POST claim a cash bonus
Userrouter.post("/cash-bonus/claim/:bonusId", authenticateToken, async (req, res) => {
  try {
    const { bonusId } = req.params;
    const userId = req.user._id;

    // Find bonus
    const bonus = await CashBonus.findById(bonusId);
    if (!bonus) {
      return res.status(404).json({
        success: false,
        message: "Bonus not found"
      });
    }

    // Check if bonus is active
    if (bonus.status !== "active") {
      return res.status(400).json({
        success: false,
        message: `Bonus is ${bonus.status} and cannot be claimed`
      });
    }

    // Check expiry (only if noExpiry is false)
    if (!bonus.noExpiry && bonus.expiresAt && new Date() > bonus.expiresAt) {
      bonus.status = "expired";
      await bonus.save();
      return res.status(400).json({
        success: false,
        message: "Bonus has expired"
      });
    }

    // Find user in bonus
    const userBonus = bonus.users.find(u => u.userId.toString() === userId.toString());
    if (!userBonus) {
      return res.status(404).json({
        success: false,
        message: "You are not eligible for this bonus"
      });
    }

    // Check if already claimed
    if (userBonus.status !== "unclaimed") {
      return res.status(400).json({
        success: false,
        message: `Bonus already ${userBonus.status}`
      });
    }

    // Get user
    const user = req.user;

    // Store balance before
    const balanceBefore = user.balance;

    // Add bonus to user balance
    user.balance += bonus.amount;

    // Update user bonus status
    userBonus.status = "claimed";
    userBonus.claimedAt = new Date();
    await bonus.save();

    // Add to user's bonus history
    if (!user.bonusHistory) {
      user.bonusHistory = [];
    }
    user.bonusHistory.push({
      type: "cash_bonus",
      amount: bonus.amount,
      description: bonus.title,
      bonusId: bonus._id,
      claimedAt: new Date(),
      status: "claimed"
    });

    // Add transaction history
    user.transactionHistory.push({
      type: "bonus",
      amount: bonus.amount,
      balanceBefore: balanceBefore,
      balanceAfter: user.balance,
      description: `Claimed cash bonus: ${bonus.title}`,
      referenceId: `CASH-BONUS-${bonus._id}`,
      createdAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "Bonus claimed successfully!",
      data: {
        bonusId: bonus._id,
        bonusTitle: bonus.title,
        amount: bonus.amount,
        balanceBefore: balanceBefore,
        balanceAfter: user.balance,
        claimedAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error claiming cash bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim bonus",
      error: error.message
    });
  }
});

// GET user's claimed cash bonuses history
Userrouter.get("/cash-bonus/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    // Build query
    let query = {
      "users.userId": userId
    };

    if (status && status !== "all") {
      query["users.status"] = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bonuses where user is included
    const bonuses = await CashBonus.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Format user-specific data
    const userBonuses = bonuses.map(bonus => {
      const userBonus = bonus.users.find(u => u.userId.toString() === userId.toString());
      const isExpired = !bonus.noExpiry && bonus.expiresAt && new Date() > bonus.expiresAt;
      
      return {
        id: bonus._id,
        title: bonus.title,
        description: bonus.description,
        amount: bonus.amount,
        bonusType: bonus.bonusType,
        occasion: bonus.occasion,
        expiresAt: bonus.expiresAt,
        noExpiry: bonus.noExpiry,
        bonusStatus: isExpired ? "expired" : bonus.status,
        userStatus: userBonus?.status,
        claimedAt: userBonus?.claimedAt,
        createdAt: bonus.createdAt
      };
    });

    const total = await CashBonus.countDocuments(query);

    // Get statistics
    const claimedBonuses = userBonuses.filter(b => b.userStatus === "claimed");
    const unclaimedBonuses = userBonuses.filter(b => b.userStatus === "unclaimed");
    const totalClaimedAmount = claimedBonuses.reduce((sum, b) => sum + b.amount, 0);

    res.json({
      success: true,
      data: {
        bonuses: userBonuses,
        stats: {
          total: total,
          claimed: claimedBonuses.length,
          unclaimed: unclaimedBonuses.length,
          totalClaimedAmount: totalClaimedAmount
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Error fetching cash bonus history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus history"
    });
  }
});

// GET cash bonus stats for user dashboard
Userrouter.get("/cash-bonus/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Get all bonuses for this user
    const bonuses = await CashBonus.find({
      "users.userId": userId
    });

    let totalClaimed = 0;
    let totalUnclaimed = 0;
    let totalClaimedAmount = 0;
    let totalAvailableAmount = 0;
    let expiringSoonCount = 0;

    bonuses.forEach(bonus => {
      const userBonus = bonus.users.find(u => u.userId.toString() === userId.toString());
      const isExpired = !bonus.noExpiry && bonus.expiresAt && new Date(bonus.expiresAt) < now;
      
      if (userBonus?.status === "claimed") {
        totalClaimed++;
        totalClaimedAmount += bonus.amount;
      } else if (userBonus?.status === "unclaimed" && bonus.status === "active" && !isExpired) {
        totalUnclaimed++;
        totalAvailableAmount += bonus.amount;
        
        // Check if expiring soon (within 7 days)
        if (!bonus.noExpiry && bonus.expiresAt) {
          const daysLeft = Math.ceil((new Date(bonus.expiresAt) - now) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 7 && daysLeft > 0) {
            expiringSoonCount++;
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalClaimed: totalClaimed,
        totalUnclaimed: totalUnclaimed,
        totalClaimedAmount: totalClaimedAmount,
        totalAvailableAmount: totalAvailableAmount,
        expiringSoonCount: expiringSoonCount,
        hasAvailableBonuses: totalUnclaimed > 0
      }
    });
  } catch (error) {
    console.error("Error fetching cash bonus stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus statistics"
    });
  }
});

// GET expiring soon bonuses (within 7 days)
Userrouter.get("/cash-bonus/expiring-soon", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const bonuses = await CashBonus.find({
      "users.userId": userId,
      "users.status": "unclaimed",
      status: "active",
      noExpiry: false,
      expiresAt: { $gt: now, $lte: sevenDaysFromNow }
    }).sort({ expiresAt: 1 });

    const expiringBonuses = bonuses.map(bonus => {
      const daysLeft = Math.ceil((new Date(bonus.expiresAt) - now) / (1000 * 60 * 60 * 24));
      
      return {
        id: bonus._id,
        title: bonus.title,
        description: bonus.description,
        amount: bonus.amount,
        expiresAt: bonus.expiresAt,
        daysLeft: daysLeft,
        urgency: daysLeft <= 3 ? "high" : daysLeft <= 5 ? "medium" : "low"
      };
    });

    res.json({
      success: true,
      data: {
        bonuses: expiringBonuses,
        count: expiringBonuses.length,
        totalAmount: expiringBonuses.reduce((sum, b) => sum + b.amount, 0)
      }
    });
  } catch (error) {
    console.error("Error fetching expiring bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expiring bonuses"
    });
  }
});

// ==================== BETTING BONUS ROUTES (USER SIDE) ====================

// Import BettingBonus model at the top with other imports
const BettingBonus = require("../models/BettingBonus");

// Helper function to get month name
function getMonthName(month) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[month - 1];
}

// GET user's unclaimed betting bonuses (weekly & monthly) - ONLY SHOW BONUSES FROM LAST 3 DAYS
Userrouter.get("/betting-bonus/unclaimed", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Calculate date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    // Find all unclaimed bonuses for this user that are within last 3 days
    const unclaimedBonuses = await BettingBonus.find({
      userId: userId,
      status: "unclaimed",
      distributionDate: { $gte: threeDaysAgo } // Only bonuses from last 3 days
    }).sort({ distributionDate: -1 });

    // Check for expired bonuses (older than 30 days from distribution)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUnclaimed = [];
    const expiredBonuses = [];
    const hiddenBonuses = []; // Bonuses older than 3 days

    for (const bonus of unclaimedBonuses) {
      // Check if bonus is expired (30 days from distribution date)
      const expiryDate = new Date(bonus.distributionDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      if (expiryDate < now) {
        // Mark as expired if not already
        if (bonus.status !== 'expired') {
          bonus.status = 'expired';
          bonus.cancelledAt = now;
          bonus.cancellationReason = 'Auto-expired after 30 days';
          await bonus.save();
        }
        expiredBonuses.push(bonus);
      } else {
        activeUnclaimed.push({
          id: bonus._id,
          bonusType: bonus.bonusType,
          amount: bonus.amount,
          betAmount: bonus.betAmount,
          bonusRate: bonus.bonusType === 'weekly' ? '0.8%' : '0.5%',
          distributionDate: bonus.distributionDate,
          weekNumber: bonus.weekNumber,
          year: bonus.year,
          month: bonus.month,
          monthName: bonus.month ? getMonthName(bonus.month) : null,
          daysLeft: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)),
          expiryDate: expiryDate,
          daysSinceDistribution: Math.floor((now - new Date(bonus.distributionDate)) / (1000 * 60 * 60 * 24))
        });
      }
    }

    // Find bonuses older than 3 days (hidden from user)
    const olderBonuses = await BettingBonus.find({
      userId: userId,
      status: "unclaimed",
      distributionDate: { $lt: threeDaysAgo }
    }).countDocuments();

    // Calculate totals
    const totalBonusAmount = activeUnclaimed.reduce((sum, bonus) => sum + bonus.amount, 0);
    const totalBetAmount = activeUnclaimed.reduce((sum, bonus) => sum + bonus.betAmount, 0);

    res.json({
      success: true,
      data: {
        bonuses: activeUnclaimed,
        expiredBonuses: expiredBonuses.map(b => ({
          id: b._id,
          bonusType: b.bonusType,
          amount: b.amount,
          betAmount: b.betAmount,
          distributionDate: b.distributionDate,
          expiredAt: b.cancelledAt
        })),
        stats: {
          totalUnclaimed: activeUnclaimed.length,
          totalBonusAmount: totalBonusAmount,
          totalBetAmount: totalBetAmount,
          totalExpired: expiredBonuses.length,
          totalHidden: olderBonuses // Bonuses older than 3 days that are hidden
        },
        message: activeUnclaimed.length === 0 ? "No unclaimed bonuses available. Bonuses are only available for 3 days after distribution." : null
      }
    });
  } catch (error) {
    console.error("Error fetching unclaimed betting bonuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unclaimed bonuses",
      error: error.message
    });
  }
});

// POST claim a betting bonus (weekly/monthly) - WITH 3 DAY VALIDITY CHECK
Userrouter.post("/betting-bonus/claim/:bonusId", authenticateToken, async (req, res) => {
  try {
    const { bonusId } = req.params;
    const userId = req.user._id;
    const now = new Date();
    
    // Calculate date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    // Find the bonus - must be unclaimed AND within last 3 days
    const bonus = await BettingBonus.findOne({
      _id: bonusId,
      userId: userId,
      status: "unclaimed",
      distributionDate: { $gte: threeDaysAgo } // Only allow claiming if within 3 days
    });

    if (!bonus) {
      // Check if bonus exists but is older than 3 days
      const oldBonus = await BettingBonus.findOne({
        _id: bonusId,
        userId: userId,
        status: "unclaimed",
        distributionDate: { $lt: threeDaysAgo }
      });

      if (oldBonus) {
        return res.status(400).json({
          success: false,
          message: "This bonus has expired. Bonuses must be claimed within 3 days of distribution."
        });
      }

      return res.status(404).json({
        success: false,
        message: "Bonus not found or already claimed"
      });
    }

    // Check if bonus is expired (30 days from distribution date - additional safety)
    const expiryDate = new Date(bonus.distributionDate);
    expiryDate.setDate(expiryDate.getDate() + 30);

    if (expiryDate < now) {
      bonus.status = 'expired';
      bonus.cancelledAt = now;
      bonus.cancellationReason = 'Auto-expired after 30 days';
      await bonus.save();
      
      return res.status(400).json({
        success: false,
        message: "Bonus has expired and cannot be claimed"
      });
    }

    // Get user
    const user = req.user;
    const balanceBefore = user.balance;

    // Add bonus amount to user's balance
    user.balance += bonus.amount;

    // Add to bonus history in user model
    if (!user.bonusHistory) {
      user.bonusHistory = [];
    }

    user.bonusHistory.push({
      type: bonus.bonusType,
      amount: bonus.amount,
      totalBet: bonus.betAmount,
      bonusRate: bonus.bonusType === 'weekly' ? '0.8%' : '0.5%',
      bonusPercentage: bonus.bonusType === 'weekly' ? '0.8%' : '0.5%',
      status: 'claimed',
      createdAt: bonus.distributionDate,
      claimedAt: new Date(),
      processedBy: 'user'
    });

    // Add transaction history
    user.transactionHistory.push({
      type: 'bonus_claimed',
      amount: bonus.amount,
      balanceBefore: balanceBefore,
      balanceAfter: user.balance,
      description: `${bonus.bonusType.charAt(0).toUpperCase() + bonus.bonusType.slice(1)} bonus claimed (${bonus.betAmount} bet amount)`,
      referenceId: `BONUS-${bonus._id}`,
      createdAt: new Date()
    });

    await user.save();

    // Update bonus status
    bonus.status = 'claimed';
    bonus.claimedAt = new Date();
    bonus.claimedBy = 'user';
    await bonus.save();

    // Reset the user's weekly/monthly bet amount after claiming (optional - based on your business logic)
    // Uncomment if you want to reset after claim
    // if (bonus.bonusType === 'weekly') {
    //   user.weeklybetamount = 0;
    // } else if (bonus.bonusType === 'monthly') {
    //   user.monthlybetamount = 0;
    // }
    // await user.save();

    res.status(200).json({
      success: true,
      message: `${bonus.bonusType} bonus of ৳${bonus.amount.toFixed(2)} claimed successfully!`,
      data: {
        bonusId: bonus._id,
        bonusType: bonus.bonusType,
        bonusAmount: bonus.amount,
        betAmount: bonus.betAmount,
        balanceBefore: balanceBefore,
        balanceAfter: user.balance,
        claimedAt: bonus.claimedAt,
        daysSinceDistribution: Math.floor((now - new Date(bonus.distributionDate)) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    console.error("Error claiming betting bonus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim bonus",
      error: error.message
    });
  }
});

// GET user's claimed betting bonuses history
Userrouter.get("/betting-bonus/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, bonusType } = req.query;

    const query = {
      userId: userId,
      status: "claimed"
    };

    if (bonusType && bonusType !== 'all') {
      query.bonusType = bonusType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const claimedBonuses = await BettingBonus.find(query)
      .sort({ claimedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BettingBonus.countDocuments(query);

    // Calculate statistics
    const totalClaimedAmount = claimedBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
    const weeklyTotal = claimedBonuses.filter(b => b.bonusType === 'weekly').reduce((sum, b) => sum + b.amount, 0);
    const monthlyTotal = claimedBonuses.filter(b => b.bonusType === 'monthly').reduce((sum, b) => sum + b.amount, 0);

    const formattedBonuses = claimedBonuses.map(bonus => ({
      id: bonus._id,
      bonusType: bonus.bonusType,
      amount: bonus.amount,
      betAmount: bonus.betAmount,
      bonusRate: bonus.bonusType === 'weekly' ? '0.8%' : '0.5%',
      distributionDate: bonus.distributionDate,
      claimedAt: bonus.claimedAt,
      weekNumber: bonus.weekNumber,
      year: bonus.year,
      month: bonus.month,
      monthName: bonus.month ? getMonthName(bonus.month) : null
    }));

    res.json({
      success: true,
      data: {
        bonuses: formattedBonuses,
        stats: {
          totalClaimed: total,
          totalClaimedAmount: totalClaimedAmount,
          weeklyTotal: weeklyTotal,
          monthlyTotal: monthlyTotal
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Error fetching claimed bonuses history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch claimed bonuses history",
      error: error.message
    });
  }
});

// GET betting bonus summary for dashboard
Userrouter.get("/betting-bonus/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    
    // Calculate date 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    // Get unclaimed bonuses within last 3 days
    const unclaimedBonuses = await BettingBonus.find({
      userId: userId,
      status: "unclaimed",
      distributionDate: { $gte: threeDaysAgo }
    });

    // Get claimed bonuses count
    const claimedCount = await BettingBonus.countDocuments({
      userId: userId,
      status: "claimed"
    });

    // Get total claimed amount
    const claimedTotal = await BettingBonus.aggregate([
      {
        $match: {
          userId: userId,
          status: "claimed"
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" }
        }
      }
    ]);

    const unclaimedTotal = unclaimedBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
    const weeklyUnclaimed = unclaimedBonuses.filter(b => b.bonusType === 'weekly').length;
    const monthlyUnclaimed = unclaimedBonuses.filter(b => b.bonusType === 'monthly').length;

    // Check for bonuses expiring soon (within 1 day)
    const expiringSoon = unclaimedBonuses.filter(bonus => {
      const expiryDate = new Date(bonus.distributionDate);
      expiryDate.setDate(expiryDate.getDate() + 3); // 3 days validity
      const hoursLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60));
      return hoursLeft <= 24 && hoursLeft > 0;
    });

    res.json({
      success: true,
      data: {
        unclaimed: {
          count: unclaimedBonuses.length,
          totalAmount: unclaimedTotal,
          weekly: weeklyUnclaimed,
          monthly: monthlyUnclaimed
        },
        claimed: {
          count: claimedCount,
          totalAmount: claimedTotal[0]?.total || 0
        },
        expiringSoon: {
          count: expiringSoon.length,
          bonuses: expiringSoon.map(b => ({
            id: b._id,
            type: b.bonusType,
            amount: b.amount,
            hoursLeft: Math.ceil((new Date(b.distributionDate).setDate(new Date(b.distributionDate).getDate() + 3) - now) / (1000 * 60 * 60))
          }))
        },
        validityPeriod: "3 days"
      }
    });
  } catch (error) {
    console.error("Error fetching betting bonus summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bonus summary",
      error: error.message
    });
  }
});


// ==================== COIN SYSTEM ROUTES ====================

// Claim coins
Userrouter.post("/claim-coins", authenticateToken, async (req, res) => {
  try {
    const { amount = 50 } = req.body;
    const user = req.user;
    
    // Add coins to user's balance
    user.coinBalance = (user.coinBalance || 0) + amount;
    
    // Add to coin history
    if (!user.coinHistory) {
      user.coinHistory = [];
    }
    
    user.coinHistory.push({
      amount: amount,
      reason: "claimed",
      date: new Date()
    });
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Successfully claimed ${amount} coins!`,
      data: {
        coinsAdded: amount,
        newBalance: user.coinBalance
      }
    });
    
  } catch (error) {
    console.error("Error claiming coins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim coins"
    });
  }
});

// Convert coins to balance (100 coins = 1 BDT)
Userrouter.post("/convert-coins-to-balance", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const CONVERSION_RATE = 100;
    const currentCoinBalance = user.coinBalance || 0;
    
    // Check if user has enough coins (minimum 100)
    if (currentCoinBalance < CONVERSION_RATE) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${CONVERSION_RATE} coins required for conversion`,
        data: {
          currentCoinBalance: currentCoinBalance,
          needed: CONVERSION_RATE - currentCoinBalance
        }
      });
    }
    
    // Calculate conversion (only full 100 coin increments)
    const coinsToConvert = Math.floor(currentCoinBalance / CONVERSION_RATE) * CONVERSION_RATE;
    const balanceToAdd = coinsToConvert / CONVERSION_RATE;
    
    // Update balances
    user.coinBalance = currentCoinBalance - coinsToConvert;
    user.balance = (user.balance || 0) + balanceToAdd;
    
    // Add to coin history
    if (!user.coinHistory) {
      user.coinHistory = [];
    }
    
    user.coinHistory.push({
      amount: -coinsToConvert,
      reason: `converted_to_balance_${balanceToAdd}_BDT`,
      date: new Date()
    });
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Successfully converted ${coinsToConvert} coins to ${balanceToAdd} BDT!`,
      data: {
        coinsConverted: coinsToConvert,
        amountAdded: balanceToAdd,
        newCoinBalance: user.coinBalance,
        newRealBalance: user.balance
      }
    });
    
  } catch (error) {
    console.error("Error converting coins:", error);
    res.status(500).json({
      success: false,
      message: "Failed to convert coins"
    });
  }
});

// ==================== LEVEL COMPLETION COIN REWARD SYSTEM ====================

// Level definitions based on lifetime_bet (in BDT)
const LEVELS = [
  { id: 0, name: "Bronze", nameBn: "ব্রোঞ্জ", minBet: 0, maxBet: 9999, coinReward: 1000 },
  { id: 1, name: "Silver", nameBn: "সিলভার", minBet: 10000, maxBet: 49999, coinReward: 2000 },
  { id: 2, name: "Gold", nameBn: "গোল্ড", minBet: 50000, maxBet: 199999, coinReward: 5000 },
  { id: 3, name: "Platinum", nameBn: "প্লাটিনাম", minBet: 200000, maxBet: 499999, coinReward: 10000 },
  { id: 4, name: "Diamond", nameBn: "ডায়মন্ড", minBet: 500000, maxBet: 999999, coinReward: 20000 },
  { id: 5, name: "Royal", nameBn: "রয়্যাল", minBet: 1000000, maxBet: 4999999, coinReward: 50000 },
  { id: 6, name: "Legend", nameBn: "লিজেন্ড", minBet: 5000000, maxBet: Infinity, coinReward: 100000 }
];

// Helper function to get level by lifetime bet
function getCurrentLevel(lifetimeBet) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (lifetimeBet >= LEVELS[i].minBet) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// Helper function to get all claimable levels
function getClaimableLevels(lifetimeBet, claimedLevels) {
  const claimable = [];
  for (const level of LEVELS) {
    // Skip Bronze (level 0) as it's the starting level with no reward
    if (level.id === 0) continue;
    
    // Check if user has reached this level and not claimed yet
    if (lifetimeBet >= level.minBet && !claimedLevels.includes(level.id)) {
      claimable.push(level);
    }
  }
  return claimable;
}

// GET user's level information (current level, next level, progress, claimable levels)
Userrouter.get("/level/info", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const lifetimeBet = user.lifetime_bet || 0;
    const claimedLevels = user.claimedLevels || [];
    
    // Get current level
    const currentLevel = getCurrentLevel(lifetimeBet);
    
    // Get next level
    const currentLevelIndex = LEVELS.findIndex(l => l.id === currentLevel.id);
    const nextLevel = LEVELS[currentLevelIndex + 1] || null;
    
    // Calculate progress to next level
    let progress = 100;
    let amountToNext = 0;
    
    if (nextLevel && nextLevel.minBet !== Infinity) {
      const range = nextLevel.minBet - currentLevel.minBet;
      const achieved = lifetimeBet - currentLevel.minBet;
      progress = Math.min(100, Math.max(0, (achieved / range) * 100));
      amountToNext = nextLevel.minBet - lifetimeBet;
    } else {
      progress = 100;
      amountToNext = 0;
    }
    
    // Get claimable levels
    const claimableLevels = getClaimableLevels(lifetimeBet, claimedLevels);
    
    // Get claimed levels with details
    const claimedLevelsWithDetails = claimedLevels.map(levelId => {
      const level = LEVELS.find(l => l.id === levelId);
      return level ? {
        id: level.id,
        name: level.name,
        nameBn: level.nameBn,
        coinReward: level.coinReward,
        claimedAt: user.claimedLevelsAt?.[levelId] || null
      } : null;
    }).filter(l => l !== null);
    
    res.json({
      success: true,
      data: {
        currentLevel: {
          id: currentLevel.id,
          name: currentLevel.name,
          nameBn: currentLevel.nameBn,
          minBet: currentLevel.minBet,
          maxBet: currentLevel.maxBet,
          coinReward: currentLevel.coinReward,
          icon: getLevelIcon(currentLevel.id)
        },
        nextLevel: nextLevel ? {
          id: nextLevel.id,
          name: nextLevel.name,
          nameBn: nextLevel.nameBn,
          minBet: nextLevel.minBet,
          coinReward: nextLevel.coinReward,
          amountNeeded: amountToNext,
          icon: getLevelIcon(nextLevel.id)
        } : null,
        progress: {
          percentage: Math.floor(progress),
          currentAmount: lifetimeBet,
          nextLevelMin: nextLevel ? nextLevel.minBet : lifetimeBet,
          amountToNext: amountToNext
        },
        claimableLevels: claimableLevels.map(level => ({
          id: level.id,
          name: level.name,
          nameBn: level.nameBn,
          coinReward: level.coinReward,
          minBet: level.minBet,
          icon: getLevelIcon(level.id)
        })),
        claimedLevels: claimedLevelsWithDetails,
        lifetimeBet: lifetimeBet,
        totalClaimedCoins: claimedLevels.reduce((sum, levelId) => {
          const level = LEVELS.find(l => l.id === levelId);
          return sum + (level?.coinReward || 0);
        }, 0)
      }
    });
  } catch (error) {
    console.error("Error fetching level info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch level information",
      error: error.message
    });
  }
});

// Helper function to get level icon
function getLevelIcon(levelId) {
  const icons = {
    0: "🥉",
    1: "🥈", 
    2: "🥇",
    3: "💎",
    4: "🔹",
    5: "👑",
    6: "🏆"
  };
  return icons[levelId] || "⭐";
}

// POST claim level completion coin reward
Userrouter.post("/claim-level-reward", authenticateToken, async (req, res) => {
  try {
    const { levelId } = req.body;
    const user = req.user;
    
    // Validate levelId
    if (levelId === undefined || levelId === null) {
      return res.status(400).json({
        success: false,
        message: "Level ID is required"
      });
    }
    
    // Find the level
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) {
      return res.status(400).json({
        success: false,
        message: "Invalid level ID"
      });
    }
    
    // Skip Bronze (level 0) as it's the starting level
    if (level.id === 0) {
      return res.status(400).json({
        success: false,
        message: "Bronze level has no reward to claim"
      });
    }
    
    // Check if user has reached this level
    const lifetimeBet = user.lifetime_bet || 0;
    if (lifetimeBet < level.minBet) {
      return res.status(400).json({
        success: false,
        message: `You haven't reached ${level.name} level yet. Need ৳${level.minBet.toLocaleString()} lifetime bet.`,
        data: {
          currentLifetimeBet: lifetimeBet,
          required: level.minBet,
          shortfall: level.minBet - lifetimeBet
        }
      });
    }
    
    // Check if already claimed
    const claimedLevels = user.claimedLevels || [];
    if (claimedLevels.includes(levelId)) {
      return res.status(400).json({
        success: false,
        message: `You have already claimed the ${level.name} level reward`
      });
    }
    
    // Add coin reward to user's balance
    const coinReward = level.coinReward;
    const oldCoinBalance = user.coinBalance || 0;
    user.coinBalance = oldCoinBalance + coinReward;
    
    // Track claimed levels
    if (!user.claimedLevels) {
      user.claimedLevels = [];
    }
    user.claimedLevels.push(levelId);
    
    // Track when each level was claimed
    if (!user.claimedLevelsAt) {
      user.claimedLevelsAt = {};
    }
    user.claimedLevelsAt[levelId] = new Date();
    
    // Add to coin history
    if (!user.coinHistory) {
      user.coinHistory = [];
    }
    user.coinHistory.push({
      amount: coinReward,
      reason: `level_${level.id}_reward_${level.name.toLowerCase()}`,
      date: new Date(),
      metadata: {
        levelId: level.id,
        levelName: level.name,
        lifetimeBetAtClaim: lifetimeBet
      }
    });
    
    // Add to transaction history
    if (!user.transactionHistory) {
      user.transactionHistory = [];
    }
    user.transactionHistory.push({
      type: "level_reward",
      amount: coinReward,
      balanceBefore: oldCoinBalance,
      balanceAfter: user.coinBalance,
      description: `Level ${level.name} completion reward: ${coinReward.toLocaleString()} coins`,
      referenceId: `LEVEL-${level.id}-${Date.now()}`,
      createdAt: new Date(),
      metadata: {
        levelId: level.id,
        levelName: level.name,
        rewardType: "coin"
      }
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: `🎉 Congratulations! You've claimed ${coinReward.toLocaleString()} coins for reaching ${level.name} level!`,
      data: {
        levelId: level.id,
        levelName: level.name,
        levelNameBn: level.nameBn,
        coinReward: coinReward,
        oldCoinBalance: oldCoinBalance,
        newCoinBalance: user.coinBalance,
        claimedAt: new Date(),
        nextLevel: getNextClaimableLevel(lifetimeBet, user.claimedLevels)
      }
    });
    
  } catch (error) {
    console.error("Error claiming level reward:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim level reward",
      error: error.message
    });
  }
});

// Helper function to get next claimable level
function getNextClaimableLevel(lifetimeBet, claimedLevels) {
  for (const level of LEVELS) {
    if (level.id === 0) continue;
    if (lifetimeBet >= level.minBet && !claimedLevels.includes(level.id)) {
      return {
        id: level.id,
        name: level.name,
        nameBn: level.nameBn,
        coinReward: level.coinReward,
        minBet: level.minBet
      };
    }
  }
  return null;
}

// GET all level rewards status (for displaying all levels with claim status)
Userrouter.get("/level/all-rewards", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const lifetimeBet = user.lifetime_bet || 0;
    const claimedLevels = user.claimedLevels || [];
    
    const allLevels = LEVELS.map(level => {
      const isReached = lifetimeBet >= level.minBet;
      const isClaimed = claimedLevels.includes(level.id);
      const isClaimable = isReached && !isClaimed && level.id !== 0;
      
      return {
        id: level.id,
        name: level.name,
        nameBn: level.nameBn,
        minBet: level.minBet,
        maxBet: level.maxBet === Infinity ? "∞" : level.maxBet,
        coinReward: level.coinReward,
        icon: getLevelIcon(level.id),
        status: {
          isReached: isReached,
          isClaimed: isClaimed,
          isClaimable: isClaimable,
          canClaim: isClaimable
        },
        progressToReach: level.id === 0 ? 100 : Math.min(100, Math.max(0, (lifetimeBet / level.minBet) * 100))
      };
    });
    
    // Calculate total available rewards
    const totalAvailableRewards = allLevels
      .filter(l => l.status.isClaimable)
      .reduce((sum, l) => sum + l.coinReward, 0);
    
    const totalClaimedRewards = allLevels
      .filter(l => l.status.isClaimed)
      .reduce((sum, l) => sum + l.coinReward, 0);
    
    res.json({
      success: true,
      data: {
        levels: allLevels,
        summary: {
          totalLevels: LEVELS.length,
          reachedLevels: allLevels.filter(l => l.status.isReached).length,
          claimedLevels: allLevels.filter(l => l.status.isClaimed).length,
          claimableLevels: allLevels.filter(l => l.status.isClaimable).length,
          totalClaimableRewards: totalAvailableRewards,
          totalClaimedRewards: totalClaimedRewards,
          currentLifetimeBet: lifetimeBet
        }
      }
    });
  } catch (error) {
    console.error("Error fetching all level rewards:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch level rewards",
      error: error.message
    });
  }
});

// POST claim all available level rewards at once
Userrouter.post("/claim-all-level-rewards", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const lifetimeBet = user.lifetime_bet || 0;
    const claimedLevels = user.claimedLevels || [];
    
    // Find all claimable levels
    const claimableLevels = [];
    for (const level of LEVELS) {
      if (level.id === 0) continue;
      if (lifetimeBet >= level.minBet && !claimedLevels.includes(level.id)) {
        claimableLevels.push(level);
      }
    }
    
    if (claimableLevels.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No claimable level rewards available"
      });
    }
    
    // Calculate total reward
    const totalReward = claimableLevels.reduce((sum, level) => sum + level.coinReward, 0);
    const oldCoinBalance = user.coinBalance || 0;
    
    // Add all rewards
    user.coinBalance = oldCoinBalance + totalReward;
    
    // Mark all as claimed
    if (!user.claimedLevels) {
      user.claimedLevels = [];
    }
    if (!user.claimedLevelsAt) {
      user.claimedLevelsAt = {};
    }
    
    claimableLevels.forEach(level => {
      if (!user.claimedLevels.includes(level.id)) {
        user.claimedLevels.push(level.id);
        user.claimedLevelsAt[level.id] = new Date();
      }
    });
    
    // Add to coin history
    if (!user.coinHistory) {
      user.coinHistory = [];
    }
    user.coinHistory.push({
      amount: totalReward,
      reason: "all_level_rewards_bulk_claim",
      date: new Date(),
      metadata: {
        levelsClaimed: claimableLevels.map(l => ({ id: l.id, name: l.name, reward: l.coinReward })),
        totalReward: totalReward
      }
    });
    
    // Add to transaction history
    user.transactionHistory.push({
      type: "level_rewards_bulk",
      amount: totalReward,
      balanceBefore: oldCoinBalance,
      balanceAfter: user.coinBalance,
      description: `Bulk claim of ${claimableLevels.length} level rewards: ${claimableLevels.map(l => l.name).join(", ")}`,
      referenceId: `BULK-LEVEL-${Date.now()}`,
      createdAt: new Date()
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: `🎉 Successfully claimed ${totalReward.toLocaleString()} coins from ${claimableLevels.length} levels!`,
      data: {
        levelsClaimed: claimableLevels.map(level => ({
          id: level.id,
          name: level.name,
          nameBn: level.nameBn,
          coinReward: level.coinReward
        })),
        totalReward: totalReward,
        oldCoinBalance: oldCoinBalance,
        newCoinBalance: user.coinBalance,
        claimedCount: claimableLevels.length
      }
    });
    
  } catch (error) {
    console.error("Error claiming all level rewards:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim level rewards",
      error: error.message
    });
  }
});

// GET level progress tracking (for dashboard widget)
Userrouter.get("/level/progress", authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const lifetimeBet = user.lifetime_bet || 0;
    const claimedLevels = user.claimedLevels || [];
    
    const currentLevel = getCurrentLevel(lifetimeBet);
    const currentLevelIndex = LEVELS.findIndex(l => l.id === currentLevel.id);
    const nextLevel = LEVELS[currentLevelIndex + 1] || null;
    
    // Calculate progress to next level
    let progress = 100;
    let amountToNext = 0;
    let nextLevelReward = 0;
    
    if (nextLevel) {
      const range = nextLevel.minBet - currentLevel.minBet;
      const achieved = lifetimeBet - currentLevel.minBet;
      progress = Math.min(100, Math.max(0, (achieved / range) * 100));
      amountToNext = nextLevel.minBet - lifetimeBet;
      nextLevelReward = nextLevel.coinReward;
    }
    
    // Check if next level reward is claimable
    const isNextLevelClaimable = nextLevel && 
      lifetimeBet >= nextLevel.minBet && 
      !claimedLevels.includes(nextLevel.id);
    
    res.json({
      success: true,
      data: {
        currentLevel: {
          id: currentLevel.id,
          name: currentLevel.name,
          nameBn: currentLevel.nameBn,
          icon: getLevelIcon(currentLevel.id),
          minBet: currentLevel.minBet,
          coinReward: currentLevel.coinReward,
          isClaimed: claimedLevels.includes(currentLevel.id)
        },
        nextLevel: nextLevel ? {
          id: nextLevel.id,
          name: nextLevel.name,
          nameBn: nextLevel.nameBn,
          icon: getLevelIcon(nextLevel.id),
          minBet: nextLevel.minBet,
          coinReward: nextLevel.coinReward,
          amountNeeded: amountToNext,
          isClaimable: isNextLevelClaimable
        } : null,
        progress: {
          percentage: Math.floor(progress),
          currentAmount: lifetimeBet,
          targetAmount: nextLevel ? nextLevel.minBet : lifetimeBet,
          remainingAmount: amountToNext
        },
        stats: {
          totalLifetimeBet: lifetimeBet,
          totalClaimedCoins: claimedLevels.reduce((sum, levelId) => {
            const level = LEVELS.find(l => l.id === levelId);
            return sum + (level?.coinReward || 0);
          }, 0),
          levelsClaimed: claimedLevels.length,
          levelsAvailable: LEVELS.length - 1
        }
      }
    });
  } catch (error) {
    console.error("Error fetching level progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch level progress",
      error: error.message
    });
  }
});

// ==================== END OF LEVEL COMPLETION COIN REWARD SYSTEM ====================
// ==================== FAVORITES ROUTES ====================

const Favorite = require("../models/Favorite");

// GET user's favorite games
Userrouter.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      limit = 50, 
      page = 1, 
      sortBy = "customOrder",
      sortOrder = "asc"
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    let sortField = {};
    switch (sortBy) {
      case "customOrder":
        sortField = { customOrder: sortOrder === "asc" ? 1 : -1 };
        break;
      case "createdAt":
        sortField = { createdAt: sortOrder === "asc" ? 1 : -1 };
        break;
      case "playCount":
        sortField = { playCount: sortOrder === "asc" ? 1 : -1 };
        break;
      case "lastPlayedAt":
        sortField = { lastPlayedAt: sortOrder === "asc" ? 1 : -1 };
        break;
      default:
        sortField = { customOrder: 1 };
    }

    // Get favorites with populated game data
    const favorites = await Favorite.find({ userId })
      .sort(sortField)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("gameId");

    const total = await Favorite.countDocuments({ userId });

    // Format response with current game data (prioritize live game data over snapshot)
    const formattedFavorites = favorites.map(fav => {
      const game = fav.gameId;
      return {
        id: fav._id,
        gameId: fav.gameId._id,
        name: game?.name || fav.gameSnapshot.name,
        gameApiID: game?.gameApiID || fav.gameSnapshot.gameApiID,
        provider: game?.provider || fav.gameSnapshot.provider,
        portraitImage: game?.portraitImage || fav.gameSnapshot.portraitImage,
        landscapeImage: game?.landscapeImage || fav.gameSnapshot.landscapeImage,
        defaultImage: game?.defaultImage || fav.gameSnapshot.defaultImage,
        category: game?.category || fav.gameSnapshot.category,
        status: game?.status !== undefined ? game.status : true,
        featured: game?.featured || false,
        fullScreen: game?.fullScreen || false,
        notes: fav.notes,
        createdAt: fav.createdAt,
        lastPlayedAt: fav.lastPlayedAt,
        playCount: fav.playCount,
        customOrder: fav.customOrder
      };
    });

    res.json({
      success: true,
      data: {
        favorites: formattedFavorites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
      error: error.message
    });
  }
});

// GET check if a specific game is favorited
Userrouter.get("/favorites/check/:gameId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;

    const isFavorited = await Favorite.isFavorited(userId, gameId);
    const favoriteCount = await Favorite.getFavoriteCount(gameId);

    res.json({
      success: true,
      data: {
        isFavorited,
        favoriteCount
      }
    });
  } catch (error) {
    console.error("Error checking favorite status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check favorite status",
      error: error.message
    });
  }
});

// POST add game to favorites
Userrouter.post("/favorites/:gameId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;
    const { notes } = req.body;

    // Check if game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found"
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ userId, gameId });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: "Game already in favorites"
      });
    }

    // Get the highest custom order for this user
    const lastFavorite = await Favorite.findOne({ userId }).sort({ customOrder: -1 });
    const nextOrder = (lastFavorite?.customOrder || 0) + 1;

    // Create favorite with game snapshot
    const favorite = new Favorite({
      userId,
      gameId,
      gameSnapshot: {
        name: game.name,
        gameApiID: game.gameApiID,
        provider: game.provider,
        portraitImage: game.portraitImage,
        landscapeImage: game.landscapeImage,
        defaultImage: game.defaultImage,
        category: game.category,
      },
      notes: notes || "",
      customOrder: nextOrder
    });

    await favorite.save();

    res.status(201).json({
      success: true,
      message: "Game added to favorites",
      data: {
        id: favorite._id,
        gameId: favorite.gameId,
        customOrder: favorite.customOrder,
        createdAt: favorite.createdAt
      }
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add game to favorites",
      error: error.message
    });
  }
});

// DELETE remove game from favorites
Userrouter.delete("/favorites/:gameId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;

    const result = await Favorite.findOneAndDelete({ userId, gameId });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found"
      });
    }

    res.json({
      success: true,
      message: "Game removed from favorites"
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove game from favorites",
      error: error.message
    });
  }
});

// PUT update favorite notes
Userrouter.put("/favorites/:favoriteId/notes", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { favoriteId } = req.params;
    const { notes } = req.body;

    const favorite = await Favorite.findOne({ _id: favoriteId, userId });
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found"
      });
    }

    favorite.notes = notes || "";
    await favorite.save();

    res.json({
      success: true,
      message: "Favorite notes updated",
      data: { notes: favorite.notes }
    });
  } catch (error) {
    console.error("Error updating favorite notes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update favorite notes",
      error: error.message
    });
  }
});

// PUT reorder favorites (update customOrder)
Userrouter.put("/favorites/reorder", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { order } = req.body; // order should be array of { id: favoriteId, order: number }

    if (!order || !Array.isArray(order)) {
      return res.status(400).json({
        success: false,
        message: "Order array is required"
      });
    }

    // Update each favorite's customOrder
    const updates = order.map(async (item) => {
      return Favorite.findOneAndUpdate(
        { _id: item.id, userId },
        { customOrder: item.order },
        { new: true }
      );
    });

    await Promise.all(updates);

    res.json({
      success: true,
      message: "Favorites reordered successfully"
    });
  } catch (error) {
    console.error("Error reordering favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder favorites",
      error: error.message
    });
  }
});

// POST record that user played a favorite game
Userrouter.post("/favorites/:gameId/play", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameId } = req.params;

    const favorite = await Favorite.findOne({ userId, gameId });
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: "Favorite not found"
      });
    }

    await favorite.recordPlay();

    res.json({
      success: true,
      message: "Play recorded",
      data: {
        playCount: favorite.playCount,
        lastPlayedAt: favorite.lastPlayedAt
      }
    });
  } catch (error) {
    console.error("Error recording play:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record play",
      error: error.message
    });
  }
});

// GET favorite statistics for user
Userrouter.get("/favorites/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const totalFavorites = await Favorite.countDocuments({ userId });
    const mostPlayed = await Favorite.findOne({ userId })
      .sort({ playCount: -1 })
      .populate("gameId");

    const recentlyAdded = await Favorite.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("gameId");

    const recentlyPlayed = await Favorite.findOne({ userId })
      .sort({ lastPlayedAt: -1 })
      .populate("gameId");

    // Get favorite count by provider
    const favoritesByProvider = await Favorite.aggregate([
      { $match: { userId: userId } },
      {
        $lookup: {
          from: "games",
          localField: "gameId",
          foreignField: "_id",
          as: "gameInfo"
        }
      },
      { $unwind: "$gameInfo" },
      {
        $group: {
          _id: "$gameInfo.provider",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalFavorites,
        mostPlayedGame: mostPlayed ? {
          name: mostPlayed.gameId?.name || mostPlayed.gameSnapshot.name,
          playCount: mostPlayed.playCount
        } : null,
        recentlyAddedGame: recentlyAdded ? {
          name: recentlyAdded.gameId?.name || recentlyAdded.gameSnapshot.name,
          addedAt: recentlyAdded.createdAt
        } : null,
        recentlyPlayedGame: recentlyPlayed && recentlyPlayed.lastPlayedAt ? {
          name: recentlyPlayed.gameId?.name || recentlyPlayed.gameSnapshot.name,
          lastPlayedAt: recentlyPlayed.lastPlayedAt
        } : null,
        favoritesByProvider: favoritesByProvider.map(item => ({
          provider: item._id,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching favorite stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorite statistics",
      error: error.message
    });
  }
});

// DELETE remove multiple favorites at once
Userrouter.delete("/favorites/bulk/remove", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { gameIds } = req.body;

    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Array of game IDs is required"
      });
    }

    const result = await Favorite.deleteMany({
      userId,
      gameId: { $in: gameIds }
    });

    res.json({
      success: true,
      message: `${result.deletedCount} favorites removed successfully`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error("Error removing multiple favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove favorites",
      error: error.message
    });
  }
});

// GET favorite games with pagination and filtering
Userrouter.get("/favorites/search", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      search, 
      provider, 
      category,
      limit = 20, 
      page = 1,
      sortBy = "customOrder"
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // First get user's favorites
    let favoritesQuery = Favorite.find({ userId });

    // Build sort
    let sortField = {};
    switch (sortBy) {
      case "customOrder": sortField = { customOrder: 1 }; break;
      case "playCount": sortField = { playCount: -1 }; break;
      case "lastPlayedAt": sortField = { lastPlayedAt: -1 }; break;
      case "createdAt": sortField = { createdAt: -1 }; break;
      default: sortField = { customOrder: 1 };
    }
    favoritesQuery = favoritesQuery.sort(sortField);

    const favorites = await favoritesQuery.populate("gameId");

    // Filter favorites based on game data
    let filteredFavorites = favorites;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredFavorites = filteredFavorites.filter(fav => 
        (fav.gameId?.name || fav.gameSnapshot.name).toLowerCase().includes(searchLower) ||
        (fav.gameId?.provider || fav.gameSnapshot.provider).toLowerCase().includes(searchLower)
      );
    }

    if (provider) {
      filteredFavorites = filteredFavorites.filter(fav => 
        (fav.gameId?.provider || fav.gameSnapshot.provider) === provider
      );
    }

    if (category) {
      filteredFavorites = filteredFavorites.filter(fav => {
        const categories = fav.gameId?.category || fav.gameSnapshot.category;
        return categories && categories.includes(category);
      });
    }

    const total = filteredFavorites.length;
    const paginatedFavorites = filteredFavorites.slice(skip, skip + parseInt(limit));

    const formattedFavorites = paginatedFavorites.map(fav => {
      const game = fav.gameId;
      return {
        id: fav._id,
        gameId: fav.gameId?._id,
        name: game?.name || fav.gameSnapshot.name,
        gameApiID: game?.gameApiID || fav.gameSnapshot.gameApiID,
        provider: game?.provider || fav.gameSnapshot.provider,
        portraitImage: game?.portraitImage || fav.gameSnapshot.portraitImage,
        landscapeImage: game?.landscapeImage || fav.gameSnapshot.landscapeImage,
        defaultImage: game?.defaultImage || fav.gameSnapshot.defaultImage,
        category: game?.category || fav.gameSnapshot.category,
        playCount: fav.playCount,
        lastPlayedAt: fav.lastPlayedAt,
        customOrder: fav.customOrder,
        createdAt: fav.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        favorites: formattedFavorites,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error("Error searching favorites:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search favorites",
      error: error.message
    });
  }
});
module.exports = Userrouter;
