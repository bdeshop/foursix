import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import videoBackgroundUrl from "../../assets/mainvideo.mp4";
import { NavLink, useSearchParams } from 'react-router-dom';
import logo from "../../assets/logo.png";
import { LanguageContext } from "../../context/LanguageContext";

export default function Register() {
  const { t, language } = useContext(LanguageContext);

  // Signup state (no email)
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");

  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // UI state
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);
  const [referralValid, setReferralValid] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState(null);
  
  // Error states
  const [phoneError, setPhoneError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [referralError, setReferralError] = useState("");
  
  const [searchParams] = useSearchParams();
  const [dynamicLogo, setDynamicLogo] = useState(logo);

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL || 'http://localhost:5000';

  // Fetch branding data
  useEffect(() => {
    fetchBrandingData();
  }, []);

  // Check for referral codes in URL parameters
  useEffect(() => {
    const userReferralCode = searchParams.get('ref');
    const affiliateCodeFromUrl = searchParams.get('aff');

    if (affiliateCodeFromUrl) {
      setAffiliateCode(affiliateCodeFromUrl.toUpperCase());
      trackAffiliateClick(affiliateCodeFromUrl);
    }

    if (userReferralCode) {
      setReferralCode(userReferralCode.toUpperCase());
    }
  }, [searchParams]);

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
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
  };

  const checkReferralCode = async () => {
    if (!referralCode) {
      setReferralError(t?.pleaseEnterReferralCode || "Please enter a referral code");
      return;
    }

    setIsCheckingReferral(true);
    setReferralError("");

    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/check-referral/${referralCode}`);

      if (response.data.success) {
        setReferralValid(true);
        setReferrerInfo(response.data.referrer);
        toast.success(t?.referralCodeValid || "Referral code is valid!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || (t?.invalidReferralCode || 'Invalid referral code');
      setReferralError(errorMessage);
      setReferralValid(false);
      setReferrerInfo(null);
      toast.error(errorMessage);
    } finally {
      setIsCheckingReferral(false);
    }
  };

  // Direct signup without OTP
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();

    // Validate phone
    if (!phone) {
      setPhoneError(t?.phoneRequired || "Phone number is required.");
      return;
    }

    if (!/^1[0-9]{9}$/.test(phone)) {
      setPhoneError(t?.validPhoneNumber || "Please enter a valid Bangladeshi phone number, starting with 1.");
      return;
    }

    // Validate username
    if (!username) {
      setSignupError(t?.usernameRequired || "Username is required.");
      return;
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setSignupError(t?.usernameFormat || "Username can only contain lowercase letters, numbers, and underscores.");
      return;
    }

    if (username.length < 3) {
      setSignupError(t?.usernameMinLength || "Username must be at least 3 characters long.");
      return;
    }

    // Validate password
    if (!password) {
      setSignupError(t?.passwordRequired || "Password is required.");
      return;
    }

    if (password.length < 6) {
      setSignupError(t?.passwordMinLength || "Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setSignupError(t?.passwordMismatch || "Passwords do not match.");
      return;
    }

    // Validate referral code if provided
    if (referralCode && !referralValid) {
      setReferralError(t?.validateReferralFirst || "Please validate your referral code first");
      return;
    }

    setIsLoading(true);
    setPhoneError("");
    setSignupError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        phone,
        username,
        password,
        confirmPassword,
        fullName: username,
        referralCode: referralValid ? referralCode : undefined,
        affiliateCode: affiliateCode || undefined
      });

      if (response.data.success) {
        toast.success(t?.accountCreated || "Account created successfully!", {
          position: "top-right",
          autoClose: 3000,
        });

        if (response.data.user.isAffiliateReferred) {
          toast.success(t?.affiliateWelcome || "Welcome! You were referred by an affiliate partner.", {
            position: "top-right",
            autoClose: 3000,
          });
        } else if (response.data.user.isUserReferred) {
          toast.success(t?.userReferralWelcome || "Welcome! You were referred by a friend.", {
            position: "top-right",
            autoClose: 3000,
          });
        }

        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usertoken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('show_welcome_bonus', 'true');

        // Reset form
        setPhone("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setReferralCode("");
        setAffiliateCode("");
        setReferralValid(false);
        setReferrerInfo(null);

        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(response.data.message || (t?.signupFailed || 'Signup failed'));
        setSignupError(response.data.message || (t?.signupFailed || 'Signup failed'));
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.message || (t?.signupError || 'Signup failed. Please try again.');
      setSignupError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginUsername) {
      setLoginError(t?.usernameRequired || "Username is required.");
      return;
    }

    if (!loginPassword) {
      setLoginError(t?.passwordRequired || "Password is required.");
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
        toast.success(t?.loginSuccess || "Login successful!", {
          position: "top-right",
          autoClose: 3000,
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usertoken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(response.data.message || (t?.loginFailed || 'Login failed'));
        setLoginError(response.data.message || (t?.loginFailed || 'Login failed'));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || (t?.loginError || 'Login failed. Please check your credentials.');
      setLoginError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900 font-poppins text-white">
      <Toaster />

      <video className="md:flex hidden absolute top-0 left-0 w-full h-full object-cover" autoPlay loop muted>
        <source src={videoBackgroundUrl} type="video/mp4" />
      </video>

      <header className="relative z-20 bg-[#141515] border-b-[1px] border-gray-700 bg-opacity-70 flex justify-between items-center px-4 py-3 md:px-8">
        <NavLink to="/">
          <img src={dynamicLogo} alt="Logo" className="w-[80px] cursor-pointer" />
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

      <div className="relative flex justify-center md:justify-end items-center h-full md:min-h-[calc(100vh-76px)] md:p-6 lg:p-8 xl:p-[100px]">
        <div className="w-full px-[10px] md:px-0 md:max-w-lg overflow-hidden">
          <div className="overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex bg-opacity-80 border-b-[1px] border-[#222424]">
              <button
                onClick={() => {
                  setIsSignUpActive(false);
                  setLoginError("");
                  setLoginUsername("");
                  setLoginPassword("");
                }}
                className={`flex-1 py-3 md:py-4 text-center text-sm md:text-base font-medium cursor-pointer transition-colors duration-300 ${!isSignUpActive ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-200 hover:text-gray-300'}`}
              >
                {t?.tabLogin || "Login"}
              </button>
              <button
                onClick={() => {
                  setIsSignUpActive(true);
                  setSignupError("");
                }}
                className={`flex-1 py-3 md:py-4 text-center text-sm md:text-base font-medium cursor-pointer transition-colors duration-300 ${isSignUpActive ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-200 hover:text-gray-300'}`}
              >
                {t?.tabSignup || "Sign Up"}
              </button>
            </div>

            <div className="pt-[20px]">
              {/* Sign Up Form */}
              {isSignUpActive ? (
                <form onSubmit={handleSignUpSubmit}>
                  {/* Phone Number Input */}
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm md:text-sm text-gray-200 mb-2 font-[300]">
                      {t?.phoneNumber || "Phone Number"}
                    </label>
                    <div className="flex items-stretch bg-[#222424] overflow-hidden hover:border-gray-600 transition-colors">
                      <div className="flex items-center px-2 md:px-3 rounded-l border-r border-gray-700">
                        <img 
                          src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/flag-type/BD.png?v=1754999737902&source=drccdnsrc" 
                          alt="Bangladesh Flag" 
                          className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 rounded-full" 
                        />
                        <span className="text-white text-sm md:text-base font-[300]">+880</span>
                      </div>
                      <div className="flex items-center flex-grow pl-2 md:pl-3">
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full py-2 md:py-3.5 bg-transparent font-[400] text-white font-[300] focus:outline-none placeholder-gray-500 text-sm md:text-base"
                          placeholder={t?.enterPhoneNumber || "Enter phone number"}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                  </div>

                  {/* Username Input */}
                  <div className="mb-4">
                    <label htmlFor="username" className="block text-sm md:text-sm text-gray-200 mb-2">
                      {t?.usernameLabel || "Username"}
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full p-2 md:p-4 text-sm bg-[#222424] font-[300] text-white focus:outline-none focus:border-[#0C4D38] hover:border-gray-600 transition-colors"
                      placeholder={t?.enterUsername || "Enter username"}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm md:text-sm text-gray-200 mb-2">
                      {t?.passwordLabel || "Password"}
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 md:p-4 text-sm font-[300] bg-[#222424] text-white focus:outline-none focus:border-[#0C4D38] hover:border-gray-600 transition-colors"
                      placeholder={t?.createPassword || "Create password"}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Confirm Password Input */}
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-sm md:text-sm text-gray-200 mb-2">
                      {t?.confirmPasswordLabel || "Confirm Password"}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2 md:p-4 text-sm font-[300] bg-[#222424] text-white focus:outline-none focus:border-[#0C4D38] hover:border-gray-600 transition-colors"
                      placeholder={t?.confirmPasswordPlaceholder || "Confirm password"}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Referral Code Input */}
                  <div className="mb-4">
                    <label htmlFor="referralCode" className="block text-sm md:text-sm font-[300] text-gray-200 mb-2">
                      {t?.referralCodeLabel || "Referral Code (Optional)"}
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
                        placeholder={t?.enterReferralCode || "Enter referral code"}
                        disabled={referralValid || isLoading}
                      />
                      {!referralValid && referralCode && (
                        <button
                          type="button"
                          onClick={checkReferralCode}
                          disabled={isCheckingReferral || !referralCode || isLoading}
                          className="px-3 md:px-4 bg-[#0C4D38] text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-all shadow-md"
                        >
                          {isCheckingReferral ? (t?.checkingBtn || "Checking...") : (t?.verifyBtn || "Verify")}
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
                          className="px-3 md:px-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-[500] transition-all shadow-md"
                          disabled={isLoading}
                        >
                          {t?.changeBtn || "Change"}
                        </button>
                      )}
                    </div>
                    {referralError && <p className="text-red-400 text-xs mt-1">{referralError}</p>}
                    {referralValid && referrerInfo && (
                      <p className="text-green-400 text-xs mt-1">
                        {t?.validReferralCode || "Valid referral code from"} {referrerInfo.username}
                      </p>
                    )}
                  </div>

                  {/* Affiliate Code (hidden input, from URL) */}
                  {affiliateCode && (
                    <input type="hidden" value={affiliateCode} />
                  )}

                  {/* Sign Up Button */}
                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-[#0C4D38] cursor-pointer text-white text-sm font-[500] mt-2 shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t?.creatingAccount || "Creating Account..."}
                      </span>
                    ) : (t?.signupBtn || "Sign Up")}
                  </button>

                  {signupError && <p className="text-red-400 text-xs mt-3 text-center">{signupError}</p>}
                </form>
              ) : (
                /* Login Form */
                <form onSubmit={handleLoginSubmit}>
                  <div className="mb-4">
                    <label htmlFor="loginUsername" className="block text-sm md:text-sm text-gray-200 mb-2 font-[300]">
                      {t?.usernameLabel || "Username"}
                    </label>
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
                          placeholder={t?.enterYourUsername || "Enter your username"}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="loginPassword" className="block text-sm md:text-sm text-gray-200 mb-2 font-[300]">
                      {t?.passwordLabel || "Password"}
                    </label>
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
                          placeholder={t?.enterYourPassword || "Enter your password"}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  {loginError && (
                    <p className="text-red-400 text-xs mb-3 text-center">{loginError}</p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-[#0C4D38] cursor-pointer text-white text-sm font-[500] mt-2 shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t?.loggingIn || "Logging in..."}
                      </span>
                    ) : (t?.loginBtn || "Login")}
                  </button>

                  <div className="mt-4 text-right">
                    <NavLink to="/forgot-password" className="text-xs md:text-sm text-green-400 hover:text-green-300 hover:underline transition-colors">
                      {t?.forgotPassword || "Forgot Password?"}
                    </NavLink>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-gray-400 text-xs">
                      {t?.noAccount || "Don't have an account?"}{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignUpActive(true);
                          setLoginUsername("");
                          setLoginPassword("");
                          setLoginError("");
                        }}
                        className="text-green-400 hover:text-green-300 font-medium hover:underline transition-colors"
                      >
                        {t?.signUpHere || "Sign up here"}
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