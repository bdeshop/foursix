import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import videoBackgroundUrl from "../../assets/mainvideo.mp4";
import { NavLink, useSearchParams } from 'react-router-dom';
import logo from "../../assets/logo.png";
import { LanguageContext } from "../../context/LanguageContext"; // ← import context

export default function Register() {
  // ── Translation hook ──────────────────────────────────────────────────────
  const { t } = useContext(LanguageContext);
  // ─────────────────────────────────────────────────────────────────────────

  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  
  // Login specific state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // OTP state with 6 separate digits
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
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
  
  const [phoneError, setPhoneError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [referralError, setReferralError] = useState("");
  
  const [isSignUpActive, setIsSignUpActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);
  const [referralValid, setReferralValid] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [searchParams] = useSearchParams();
  const [dynamicLogo, setDynamicLogo] = useState(logo);

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  // Fetch branding data on component mount
  useEffect(() => {
    fetchBrandingData();
  }, []);

  // Check for referral codes in URL parameters on component mount
  useEffect(() => {
    const userReferralCode = searchParams.get('ref');
    const affiliateCodeFromUrl = searchParams.get('aff');
    
    console.log('URL Params:', { userReferralCode, affiliateCodeFromUrl });

    if (affiliateCodeFromUrl) {
      setAffiliateCode(affiliateCodeFromUrl.toUpperCase());
      trackAffiliateClick(affiliateCodeFromUrl);
    }

    if (userReferralCode) {
      setReferralCode(userReferralCode.toUpperCase());
    }
  }, [searchParams]);

  // OTP Timer
  useEffect(() => {
    let timer;
    if (otpExpiry && otpSent && !otpVerified) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(otpExpiry).getTime();
        const diff = Math.max(0, Math.floor((expiry - now) / 1000));
        
        setTimeLeft(diff);
        
        if (diff <= 0) {
          setOtpSent(false);
          setOtpExpiry(null);
          setCanResend(true);
          setOtpDigits(["", "", "", "", "", ""]);
        }
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpExpiry, otpSent, otpVerified]);

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

  // Track affiliate click separately
  const trackAffiliateClick = async (affiliateCode) => {
    const source = searchParams.get('source');
    const campaign = searchParams.get('campaign');
    const medium = searchParams.get('medium');

    try {
      await axios.post(`${API_BASE_URL}/api/auth/track-click`, {
        affiliateCode,
        source: source || 'direct',
        campaign: campaign || 'general',
        medium: medium || 'referral',
        landingPage: window.location.pathname
      });
      console.log('Affiliate click tracked successfully for:', affiliateCode);
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
  };

  // Check if referral code is valid
  const checkReferralCode = async () => {
    if (!referralCode) {
      setReferralError("Please enter a referral code");
      return;
    }

    setIsCheckingReferral(true);
    setReferralError("");

    try {
      const userResponse = await axios.get(`${API_BASE_URL}/api/auth/check-referral/${referralCode}`);
      
      if (userResponse.data.success) {
        setReferralValid(true);
        setReferrerInfo(userResponse.data.referrer);
        toast.success(t.toastReferralValid, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (userError) {
      console.error('Referral check error:', userError);
      const errorMessage = userError.response?.data?.message || 'Invalid referral code';
      setReferralError(errorMessage);
      setReferralValid(false);
      setReferrerInfo(null);
    } finally {
      setIsCheckingReferral(false);
    }
  };

  // Handle OTP digit change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // If pasted value, handle it specially
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
        // If current field is empty and backspace pressed, focus previous field
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        otpRefs[index - 1].current?.focus();
      } else if (otpDigits[index] !== "") {
        // If current field has value, clear it
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
      
      // Focus the next empty field or last field
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

  // Request OTP for signup
  const requestOTP = async () => {
    // Validate phone first
    if (!phone) {
      setPhoneError("Phone number is required.");
      return false;
    }

    if (!/^1[0-9]{9}$/.test(phone)) {
      setPhoneError("Please enter a valid Bangladeshi phone number, starting with 1.");
      return false;
    }

    // Validate username and password before sending OTP
    if (!username) {
      setSignupError("Username is required.");
      return false;
    }
    
    if (!/^[a-z0-9_]+$/.test(username)) {
      setSignupError("Username can only contain lowercase letters, numbers, and underscores.");
      return false;
    }
    
    if (username.length < 3) {
      setSignupError("Username must be at least 3 characters long.");
      return false;
    }

    if (!password) {
      setSignupError("Password is required.");
      return false;
    }
    
    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return false;
    }
    
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match.");
      return false;
    }

    // If referral code is provided but not validated
    if (referralCode && !referralValid) {
      setReferralError("Please validate your referral code first");
      return false;
    }

    setIsLoading(true);
    setPhoneError("");
    setOtpError("");
    setSignupError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/request-signup-otp`, {
        phone
      });

      if (response.data.success) {
        setOtpSent(true);
        setOtpExpiry(response.data.data.expiresAt);
        setCanResend(false);
        setResendCooldown(60); // 60 seconds cooldown
        setOtpDigits(["", "", "", "", "", ""]);
        
        // Focus first OTP input
        setTimeout(() => {
          otpRefs[0].current?.focus();
        }, 100);
        
        toast.success(t.toastOtpSent, {
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
        
        return true;
      } else {
        toast.error(response.data.message || 'Failed to send OTP');
        return false;
      }
    } catch (error) {
      console.error('OTP request error:', error);
      const errorMessage = error.response?.data?.message || t.toastFailedSendOtp;
      setOtpError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setOtpError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/resend-signup-otp`, {
        phone
      });

      if (response.data.success) {
        setOtpExpiry(response.data.data.expiresAt);
        setCanResend(false);
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        
        toast.success(t.toastOtpResent, {
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

  // Verify OTP and complete signup
  const verifyOTPAndSignup = async (e) => {
    e.preventDefault();
    
    const fullOtp = getFullOtp();
    
    if (fullOtp.length !== 6) {
      setOtpError(t.pleaseEnterAllDigits);
      return;
    }

    setIsLoading(true);
    setOtpError("");
    setSignupError("");

    try {
      // Prepare user data
      const userData = {
        username,
        password,
        confirmPassword,
        fullName: username,
        email: email || undefined,
        referralCode: referralValid ? referralCode : undefined,
        affiliateCode: affiliateCode || undefined
      };

      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-signup-otp`, {
        phone,
        otp: fullOtp,
        userData
      });

      if (response.data.success) {
        setOtpVerified(true);
        
        toast.success(t.toastAccountCreated, {
          position: "top-right",
          autoClose: 3000,
        });

        // Show appropriate referral success message
        if (response.data.user.isAffiliateReferred) {
          toast.success(t.toastAffiliateWelcome, {
            position: "top-right",
            autoClose: 3000,
          });
        } else if (response.data.user.isUserReferred) {
          toast.success(t.toastUserReferralWelcome, {
            position: "top-right",
            autoClose: 3000,
          });
        }
        
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usertoken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Reset form
        setPhone("");
        setEmail("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setReferralCode("");
        setAffiliateCode("");
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpSent(false);
        setOtpVerified(false);
        setReferralValid(false);
        setReferrerInfo(null);

        // Redirect to dashboard or home page after successful signup
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(response.data.message || 'Signup failed');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = error.response?.data?.message || 'OTP verification failed. Please try again.';
      setOtpError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============ NEW LOGIN FUNCTION WITH USERNAME/PASSWORD ============
  const handleUsernamePasswordLogin = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!loginUsername) {
      setLoginError("Username is required.");
      return;
    }
    
    if (!loginPassword) {
      setLoginError("Password is required.");
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: loginUsername,
        password: loginPassword
      });

      if (response.data.success) {
        toast.success(t.toastLoginSuccess, {
          position: "top-right",
          autoClose: 3000,
        });

        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usertoken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(response.data.error || response.data.message || 'Login failed');
        setLoginError(response.data.error || response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Login failed. Please check your credentials.';
      setLoginError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  // ============ END OF NEW LOGIN FUNCTION ============

  // Request OTP for login (keeping for backward compatibility or if you want both options)
  const requestLoginOTP = async () => {
    if (!phone) {
      setLoginError("Phone number is required.");
      return false;
    }

    if (!/^1[0-9]{9}$/.test(phone)) {
      setLoginError("Please enter a valid Bangladeshi phone number, starting with 1.");
      return false;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/request-login-otp`, {
        phone
      });

      if (response.data.success) {
        setOtpSent(true);
        setOtpExpiry(response.data.data.expiresAt);
        setCanResend(false);
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        
        // Focus first OTP input
        setTimeout(() => {
          otpRefs[0].current?.focus();
        }, 100);
        
        toast.success(t.toastOtpSent, {
          position: "top-right",
          autoClose: 3000,
        });

        if (response.data.data.otp) {
          toast.success(`Development OTP: ${response.data.data.otp}`, {
            position: "top-right",
            autoClose: 10000,
          });
        }
        
        return true;
      } else {
        toast.success('If this number is registered, OTP will be sent');
        return false;
      }
    } catch (error) {
      console.error('Login OTP request error:', error);
      toast.error('Failed to send OTP. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and login (keeping for backward compatibility)
  const verifyLoginOTP = async (e) => {
    e.preventDefault();

    const fullOtp = getFullOtp();

    if (!phone) {
      setLoginError("Phone number is required.");
      return;
    }

    if (!/^1[0-9]{9}$/.test(phone)) {
      setLoginError("Please enter a valid Bangladeshi phone number, starting with 1.");
      return;
    }

    if (fullOtp.length !== 6) {
      setLoginError(t.pleaseEnterAllDigits);
      return;
    }

    setIsLoading(true);
    setLoginError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-login-otp`, {
        phone,
        otp: fullOtp
      });

      if (response.data.success) {
        toast.success(t.toastLoginSuccess, {
          position: "top-right",
          autoClose: 3000,
        });

        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usertoken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login verification error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setLoginError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handles the form submission logic for Sign Up
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    
    if (!otpSent) {
      // First step: request OTP
      await requestOTP();
    } else {
      // Second step: verify OTP
      await verifyOTPAndSignup(e);
    }
  };

  // Handle login form submission - UPDATED to use username/password
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    await handleUsernamePasswordLogin(e);
  };

  // Cancel OTP verification and go back
  const cancelOTPVerification = () => {
    setOtpSent(false);
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpExpiry(null);
    setOtpError("");
  };

  // Format time left
  const formatTimeLeft = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900 font-poppins text-white">
      {/* Toast Container */}
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
        
        {/* Home Icon */}
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
          {/* Registration Box with Background */}
          <div className="overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex bg-opacity-80 border-b-[1px] border-[#222424]">
              <button 
                onClick={() => {
                  setIsSignUpActive(false);
                  setOtpSent(false);
                  setOtpDigits(["", "", "", "", "", ""]);
                  setOtpError("");
                  setLoginError("");
                  setLoginUsername("");
                  setLoginPassword("");
                }} 
                className={`flex-1 py-3 md:py-4 text-center text-sm md:text-base font-medium cursor-pointer transition-colors duration-300 ${!isSignUpActive ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-200 hover:text-gray-300'}`}
              >
                {t.tabLogin}
              </button>
              <button 
                onClick={() => {
                  setIsSignUpActive(true);
                  setOtpSent(false);
                  setOtpDigits(["", "", "", "", "", ""]);
                  setOtpError("");
                  setSignupError("");
                }} 
                className={`flex-1 py-3 md:py-4 text-center text-sm md:text-base font-medium cursor-pointer transition-colors duration-300 ${isSignUpActive ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-200 hover:text-gray-300'}`}
              >
                {t.tabSignup}
              </button>
            </div>

            <div className="pt-[20px]">
              {/* Sign Up Form */}
              {isSignUpActive ? (
                <form onSubmit={handleSignUpSubmit}>
                  {/* Phone Number Input - Always visible */}
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm md:text-sm text-gray-200 mb-2 font-[300]">{t.phoneNumber}</label>
                    <div className="flex items-stretch bg-[#222424] overflow-hidden hover:border-gray-600 transition-colors">
                      {/* Country Code with Flag */}
                      <div className="flex items-center px-2 md:px-3 rounded-l border-r border-gray-700">
                        <img src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/flag-type/BD.png?v=1754999737902&source=drccdnsrc" alt="Bangladesh Flag" className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full" />
                        <span className="text-white text-sm md:text-base font-[300]">+880</span>
                      </div>
                      
                      {/* Phone Number Input Field */}
                      <div className="flex items-center flex-grow pl-2 md:pl-3">
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full py-2 md:py-3.5 bg-transparent font-[400] text-white font-[300] focus:outline-none placeholder-gray-500 text-sm md:text-base"
                          placeholder={t.enterPhoneNumber}
                          disabled={isLoading || otpSent}
                        />
                      </div>
                    </div>
                    {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                  </div>

                  {/* Show other fields only when OTP is NOT sent */}
                  {!otpSent && (
                    <>
                      {/* Username Input */}
                      <div className="mb-4">
                        <label htmlFor="username" className="block text-sm md:text-sm text-gray-200 mb-2">{t.usernameLabel}</label>
                        <input
                          type="text"
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                          className="w-full p-2 md:p-4 text-sm bg-[#222424] font-[300] text-white focus:outline-none focus:border-[#0C4D38] hover:border-gray-600 transition-colors"
                          placeholder={t.enterUsername}
                          disabled={isLoading}
                        />
                      </div>

                      {/* Password Input */}
                      <div className="mb-4">
                        <label htmlFor="password" className="block text-sm md:text-sm text-gray-200 mb-2">{t.passwordLabel}</label>
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-2 md:p-4 text-sm font-[300] bg-[#222424] text-white focus:outline-none focus:border-[#0C4D38] hover:border-gray-600 transition-colors"
                          placeholder={t.createPassword}
                          disabled={isLoading}
                        />
                      </div>

                      {/* Confirm Password Input */}
                      <div className="mb-4">
                        <label htmlFor="confirmPassword" className="block text-sm md:text-sm text-gray-200 mb-2">{t.confirmPasswordLabel}</label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-2 md:p-4 text-sm font-[300] bg-[#222424] text-white focus:outline-none focus:border-[#0C4D38] hover:border-gray-600 transition-colors"
                          placeholder={t.confirmPasswordPlaceholder}
                          disabled={isLoading}
                        />
                      </div>

                      {/* Referral Code Input */}
                      <div className="mb-4">
                        <label htmlFor="referralCode" className="block text-sm md:text-sm font-[300] text-gray-200 mb-2">
                          {t.referralCodeLabel}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="referralCode"
                            value={referralCode}
                            onChange={(e) => {
                              setReferralCode(e.target.value.toUpperCase());
                              setReferralValid(false);
                              setReferrerInfo(null);
                            }}
                            className="flex-1 p-2 md:p-4 text-sm bg-[#222424] font-[300] text-white focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors"
                            placeholder={t.enterReferralCode}
                            disabled={referralValid || isLoading}
                          />
                          {!referralValid && (
                            <button
                              type="button"
                              onClick={checkReferralCode}
                              disabled={isCheckingReferral || !referralCode || isLoading}
                              className="px-3 md:px-4 bg-[#0C4D38] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                            >
                              {isCheckingReferral ? t.checkingBtn : t.verifyBtn}
                            </button>
                          )}
                          {referralValid && (
                            <button
                              type="button"
                              onClick={() => {
                                setReferralCode("");
                                setReferralValid(false);
                                setReferrerInfo(null);
                              }}
                              className="px-3 md:px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-[500] hover:from-red-700 hover:to-red-800 transition-all shadow-md"
                              disabled={isLoading}
                            >
                              {t.changeBtn}
                            </button>
                          )}
                        </div>
                        {referralError && <p className="text-red-400 text-xs mt-1">{referralError}</p>}
                        {referralValid && referrerInfo && (
                          <p className="text-green-400 text-xs mt-1">
                            {t.validReferralCode} {referrerInfo.username}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {/* OTP Section - Show only when OTP is sent */}
                  {otpSent && !otpVerified && (
                    <div className="mb-6 p-5 bg-[#1a1c1d] rounded-lg border border-gray-700">
                      <label className="block text-sm md:text-sm text-gray-200 mb-4 font-[300] text-center">
                        {t.otpSentTo} +880{phone}
                      </label>
                      
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
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                          {timeLeft > 0 ? (
                            <span>{t.otpExpiresIn} <span className="text-yellow-400 font-mono">{formatTimeLeft(timeLeft)}</span></span>
                          ) : (
                            <span className="text-red-400">{t.otpExpired}</span>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={cancelOTPVerification}
                            className="text-sm text-gray-400 hover:text-white px-3 py-1 border border-gray-600 rounded hover:border-gray-500 transition-colors"
                          >
                            {t.backBtn}
                          </button>
                          
                          <button
                            type="button"
                            onClick={resendOTP}
                            disabled={!canResend || isLoading}
                            className={`text-sm px-3 py-1 rounded transition-colors ${
                              canResend 
                                ? 'text-green-400 hover:text-green-300 border border-green-800 hover:border-green-600' 
                                : 'text-gray-600 border border-gray-700 cursor-not-allowed'
                            }`}
                          >
                            {resendCooldown > 0 ? `${t.resendIn} ${resendCooldown}s` : t.resendOtp}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sign Up Button */}
                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-[#0C4D38] cursor-pointer text-white text-sm font-[500] mt-2 shadow-lg transition-all transform hover:scale-[1.02] hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || (otpSent && getFullOtp().length !== 6)}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {otpSent ? t.verifyingOtpBtn : t.sendingOtpBtn}
                      </span>
                    ) : otpSent ? t.verifyOtpBtn : t.sendOtpBtn}
                  </button>

                  {signupError && !otpSent && <p className="text-red-400 text-xs mt-3 text-center">{signupError}</p>}
                </form>
              ) : (
                /* Login Form - UPDATED with Username/Password */
                <form onSubmit={handleLoginSubmit}>
                  {/* Username Input for Login */}
                  <div className="mb-4">
                    <label htmlFor="loginUsername" className="block text-sm md:text-sm text-gray-200 mb-2 font-[300]">{t.usernameLabel}</label>
                    <div className="flex items-stretch bg-[#222424] overflow-hidden hover:border-gray-600 transition-colors">
                      <div className="flex items-center px-3 rounded-l border-r border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex items-center flex-grow pl-2 md:pl-3">
                        <input
                          type="text"
                          id="loginUsername"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="w-full py-2 md:py-3.5 bg-transparent font-[400] text-white font-[300] focus:outline-none placeholder-gray-500 text-sm md:text-base"
                          placeholder={t.enterYourUsername}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Input for Login */}
                  <div className="mb-4">
                    <label htmlFor="loginPassword" className="block text-sm md:text-sm text-gray-200 mb-2 font-[300]">{t.passwordLabel}</label>
                    <div className="flex items-stretch bg-[#222424] overflow-hidden hover:border-gray-600 transition-colors">
                      <div className="flex items-center px-3 rounded-l border-r border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="flex items-center flex-grow pl-2 md:pl-3">
                        <input
                          type="password"
                          id="loginPassword"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full py-2 md:py-3.5 bg-transparent font-[400] text-white font-[300] focus:outline-none placeholder-gray-500 text-sm md:text-base"
                          placeholder={t.enterYourPassword}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Error Message */}
                  {loginError && (
                    <p className="text-red-400 text-xs mb-3 text-center">{loginError}</p>
                  )}

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-[#0C4D38] cursor-pointer text-white text-sm font-[500] mt-2 shadow-lg transition-all transform hover:scale-[1.02] hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.loggingInBtn}
                      </span>
                    ) : t.loginBtn}
                  </button>

                  {/* Forgot Password Link */}
                  <div className="mt-4 text-right">
                    <NavLink to="/forgot-password" className="text-xs md:text-sm text-green-400 hover:text-green-300 hover:underline transition-colors">
                      {t.forgotPassword}
                    </NavLink>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-gray-400 text-xs">
                      {t.noAccount}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUpActive(true);
                          setOtpSent(false);
                          setOtpDigits(["", "", "", "", "", ""]);
                          setLoginUsername("");
                          setLoginPassword("");
                          setLoginError("");
                        }}
                        className="text-green-400 hover:text-green-300 font-medium hover:underline transition-colors"
                      >
                        {t.signUpHere}
                      </button>
                    </p>
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