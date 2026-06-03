import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { NavLink, useNavigate } from 'react-router-dom';
import videoBackgroundUrl from "../../assets/mainvideo.mp4";
import logo from "../../assets/logo.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // Step management
  const [step, setStep] = useState(1); // 1: Phone input, 2: OTP verification, 3: New password
  
  // Form data
  const [phone, setPhone] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetToken, setResetToken] = useState("");
  
  // OTP timer state
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Refs for OTP input fields
  const otpRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];
  
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  // Fetch branding data on component mount
  useEffect(() => {
    fetchBrandingData();
  }, []);

  // OTP Timer
  useEffect(() => {
    let timer;
    if (otpExpiry && step === 2) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(otpExpiry).getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        
        setTimeLeft(diff);
        
        if (diff <= 0) {
          setOtpExpiry(null);
          setCanResend(true);
          setOtpError("OTP has expired. Please request a new one.");
        }
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpExpiry, step]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

  const fetchBrandingData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/branding`);
      if (response.data.success && response.data.data && response.data.data.logo) {
        const logoUrl = response.data.data.logo.startsWith('http') 
          ? response.data.data.logo 
          : `${API_BASE_URL}${response.data.data.logo.startsWith('/') ? '' : '/'}${response.data.data.logo}`;
        setDynamicLogo(logoUrl);
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
      setDynamicLogo(logo);
    }
  };

  // Handle OTP digit change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // If pasted value
      const pastedValue = value.slice(0, 6);
      const newDigits = [...otpDigits];
      
      for (let i = 0; i < pastedValue.length; i++) {
        if (i < 6) {
          newDigits[i] = pastedValue[i];
        }
      }
      
      setOtpDigits(newDigits);
      
      // Focus the next empty field or last field
      const nextEmptyIndex = newDigits.findIndex(d => d === "");
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
        otpRefs[nextEmptyIndex].current?.focus();
      } else {
        otpRefs[5].current?.focus();
      }
    } else if (/^\d*$/.test(value)) {
      // Handle single digit
      const newDigits = [...otpDigits];
      newDigits[index] = value;
      setOtpDigits(newDigits);
      
      // Auto-focus next input
      if (value !== "" && index < 5) {
        otpRefs[index + 1].current?.focus();
      }
    }
  };

  // Handle OTP key down (for backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otpDigits[index] === "" && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        otpRefs[index - 1].current?.focus();
      } else if (otpDigits[index] !== "") {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
      }
    }
  };

  // Handle paste for OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const pastedNumbers = pastedData.replace(/\D/g, "").slice(0, 6);
    
    if (pastedNumbers.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedNumbers.length; i++) {
        if (i < 6) {
          newDigits[i] = pastedNumbers[i];
        }
      }
      setOtpDigits(newDigits);
      
      const nextEmptyIndex = newDigits.findIndex(d => d === "");
      if (nextEmptyIndex !== -1 && nextEmptyIndex < 6) {
        otpRefs[nextEmptyIndex].current?.focus();
      } else {
        otpRefs[5].current?.focus();
      }
    }
  };

  // Get full OTP string
  const getFullOtp = () => {
    return otpDigits.join("");
  };

  // Format time left
  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    // Validate phone
    if (!phone) {
      setPhoneError("Phone number is required.");
      return;
    }

    if (!/^1[0-9]{9}$/.test(phone)) {
      setPhoneError("Please enter a valid Bangladeshi phone number, starting with 1.");
      return;
    }

    setIsLoading(true);
    setPhoneError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password/request-otp`, {
        phone
      });

      if (response.data.success) {
        setStep(2);
        setOtpExpiry(response.data.data.expiresAt);
        setCanResend(false);
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        
        // Focus first OTP input
        setTimeout(() => {
          otpRefs[0].current?.focus();
        }, 100);
        
        toast.success('OTP sent to your phone!', {
          position: "top-right",
          autoClose: 3000,
        });

        // In development mode, show OTP in toast
        if (response.data.data.otp) {
          toast.success(`Development OTP: ${response.data.data.otp}`, {
            position: "top-right",
            autoClose: 10000,
            duration: 10000,
          });
        }
      } else {
        toast.success('If this number is registered, OTP will be sent');
      }
    } catch (error) {
      console.error('OTP request error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      setPhoneError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    const fullOtp = getFullOtp();
    
    if (fullOtp.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);
    setOtpError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password/verify-otp`, {
        phone,
        otp: fullOtp
      });

      if (response.data.success) {
        setResetToken(response.data.data.resetToken);
        setStep(3);
        toast.success('OTP verified successfully! Please set your new password.', {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(response.data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = error.response?.data?.message || 'OTP verification failed. Please try again.';
      setOtpError(errorMessage);
      
      // If too many attempts, go back to step 1
      if (errorMessage.includes('Too many failed attempts')) {
        setTimeout(() => {
          setStep(1);
          setOtpDigits(["", "", "", "", "", ""]);
        }, 2000);
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setOtpError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password/resend-otp`, {
        phone
      });

      if (response.data.success) {
        setOtpExpiry(response.data.data.expiresAt);
        setCanResend(false);
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        
        toast.success('OTP resent successfully!', {
          position: "top-right",
          autoClose: 3000,
        });

        if (response.data.data.otp) {
          toast.success(`Development OTP: ${response.data.data.otp}`, {
            position: "top-right",
            autoClose: 10000,
          });
        }

        // Focus first OTP input
        setTimeout(() => {
          otpRefs[0].current?.focus();
        }, 100);
      } else {
        toast.error(response.data.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('OTP resend error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (!newPassword) {
      setPasswordError("New password is required.");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setPasswordError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
        resetToken,
        newPassword,
        confirmPassword
      });

      if (response.data.success) {
        toast.success('Password reset successfully! Redirecting to login...', {
          position: "top-right",
          autoClose: 3000,
        });
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate('/register');
        }, 2000);
      } else {
        toast.error(response.data.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      const errorMessage = error.response?.data?.message || 'Password reset failed. Please try again.';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpError("");
    } else if (step === 3) {
      setStep(2);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    }
  };

  // Cancel and go to login
  const cancel = () => {
    navigate('/register');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900 font-poppins text-white">
      <Toaster />
      
      {/* Background Video */}
      <video className="md:flex hidden absolute top-0 left-0 w-full h-full object-cover" autoPlay loop muted>
        <source src={videoBackgroundUrl} type="video/mp4" />
      </video>

      {/* Header Section */}
      <header className="relative z-20 bg-[#141515] border-b-[1px] border-gray-700 bg-opacity-70 flex justify-between items-center px-4 py-3 md:px-8">
        <NavLink to="/">
          <img 
            src={dynamicLogo} 
            alt="Logo" 
            className="w-[100px] md:w-[150px] cursor-pointer" 
          />
        </NavLink>
        
        <div className="flex items-center">
          <NavLink to="/">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </NavLink>
        </div>
      </header>
      
      <video className="md:hidden" autoPlay loop muted>
        <source src={videoBackgroundUrl} type="video/mp4" />
      </video>

      {/* Main Content */}
      <div className="relative flex justify-center md:justify-end items-center h-full md:min-h-[calc(100vh-76px)] md:p-6 lg:p-8 xl:p-[100px]">
        <div className="w-full px-[10px] md:px-0 md:max-w-lg overflow-hidden">
          {/* Password Reset Box */}
          <div className="overflow-hidden bg-opacity-90 bg-[#141515] rounded-lg shadow-2xl">
            {/* Header with step indicator */}
            <div className=" p-4 text-center">
              <h2 className="text-xl md:text-2xl font-medium text-white">Reset Password</h2>
              <p className="text-sm text-gray-200 mt-1">
                Step {step} of 3: {
                  step === 1 ? 'Enter Phone Number' : 
                  step === 2 ? 'Verify OTP' : 
                  'Set New Password'
                }
              </p>
            </div>

            <div className="p-6 md:p-8">
              {/* Step 1: Phone Input */}
              {step === 1 && (
                <form onSubmit={handleRequestOTP}>
                  <div className="mb-6">
                    <label htmlFor="phone" className="block text-sm md:text-sm text-gray-200 mb-2 font-[300]">Phone Number</label>
                    <div className="flex items-stretch bg-[#222424] overflow-hidden hover:border-gray-600 transition-colors rounded">
                      <div className="flex items-center px-2 md:px-3 rounded-l border-r border-gray-700">
                        <img src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/flag-type/BD.png?v=1754999737902&source=drccdnsrc" alt="Bangladesh Flag" className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full" />
                        <span className="text-white text-sm md:text-base font-[300]">+880</span>
                      </div>
                      
                      <div className="flex items-center flex-grow pl-2 md:pl-3">
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full py-2 md:py-3.5 bg-transparent font-[400] text-white font-[300] focus:outline-none placeholder-gray-500 text-sm md:text-base"
                          placeholder="Enter your phone number"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-[#0C4D38] cursor-pointer text-white text-sm font-[500] rounded shadow-lg transition-all transform hover:scale-[1.02] hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending OTP...
                      </span>
                    ) : 'Send OTP'}
                  </button>

                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={cancel}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel and go back to login
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: OTP Verification */}
              {step === 2 && (
                <form onSubmit={handleVerifyOTP}>
                  <div className="mb-6">
                    <p className="text-sm text-gray-300 mb-4 text-center">
                      Enter the 6-digit OTP sent to <span className="font-bold text-green-400">+880{phone}</span>
                    </p>
                    
                    {/* 6-digit OTP Input Fields */}
                    <div className="flex justify-between gap-2 mb-4" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={otpRefs[index]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-12 h-12 md:w-14 md:h-14 bg-[#222424] text-white text-center text-xl font-bold rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                    
                    {otpError && <p className="text-red-400 text-xs mb-3 text-center">{otpError}</p>}
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-400">
                        {timeLeft > 0 ? (
                          <span>Expires in: <span className="text-yellow-400 font-mono">{formatTimeLeft(timeLeft)}</span></span>
                        ) : (
                          <span className="text-red-400">OTP expired</span>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={!canResend || isLoading}
                        className={`text-sm px-3 py-1 rounded transition-colors ${
                          canResend 
                            ? 'text-green-400 hover:text-green-300 border border-green-800 hover:border-green-600' 
                            : 'text-gray-600 border border-gray-700 cursor-not-allowed'
                        }`}
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-[#0C4D38] cursor-pointer text-white text-sm font-[500] rounded shadow-lg transition-all transform hover:scale-[1.02] hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || getFullOtp().length !== 6}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : 'Verify OTP'}
                  </button>

                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={goBack}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      ← Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={cancel}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <form onSubmit={handleResetPassword}>
                  <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm md:text-sm text-gray-200 mb-2">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 md:p-4 text-sm bg-[#222424] font-[300] text-white focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors rounded"
                      placeholder="Enter new password (min. 6 characters)"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-sm md:text-sm text-gray-200 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 md:p-4 text-sm bg-[#222424] font-[300] text-white focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors rounded"
                      placeholder="Confirm your new password"
                      disabled={isLoading}
                    />
                  </div>

                  {passwordError && <p className="text-red-400 text-xs mb-3">{passwordError}</p>}

                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-[#0C4D38] cursor-pointer text-white text-sm font-[500] rounded shadow-lg transition-all transform hover:scale-[1.02] hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting Password...
                      </span>
                    ) : 'Reset Password'}
                  </button>

                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={goBack}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      ← Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={cancel}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}