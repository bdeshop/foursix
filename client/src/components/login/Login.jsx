import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import videoBackgroundUrl from "../../assets/mainvideo.mp4";
import { NavLink, useSearchParams } from 'react-router-dom';
import logo from "../../assets/logo.png";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [referralError, setReferralError] = useState("");
  const [isSignUpActive, setIsSignUpActive] = useState(false); // Changed to false for login as default
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingReferral, setIsCheckingReferral] = useState(false);
  const [referralValid, setReferralValid] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [searchParams] = useSearchParams();
  const [dynamicLogo, setDynamicLogo] = useState(logo);

  // API base URL
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  useEffect(() => {
    fetchBrandingData();
  }, []);

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
      setDynamicLogo(logo);
    }
  };

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
        toast.success("Referral code is valid!", {
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

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setPhoneError("");
    setSignupError("");
    setReferralError("");

    // Validation
    if (!phone) {
      setPhoneError("Phone number is required.");
      return;
    }

    if (!/^1[0-9]{9}$/.test(phone)) {
      setPhoneError("Please enter a valid Bangladeshi phone number, starting with 1.");
      return;
    }

    if (!username) {
      setSignupError("Username is required.");
      return;
    }
    
    if (!/^[a-z0-9_]+$/.test(username)) {
      setSignupError("Username can only contain lowercase letters, numbers, and underscores.");
      return;
    }
    
    if (username.length < 3) {
      setSignupError("Username must be at least 3 characters long.");
      return;
    }

    if (!password) {
      setSignupError("Password is required.");
      return;
    }
    
    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters long.");
      return;
    }
    
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match.");
      return;
    }

    // If referral code is provided but not validated
    if (referralCode && !referralValid) {
      setReferralError("Please validate your referral code first");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        phone,
        username,
        password,
        confirmPassword,
        email,
        referralCode: referralValid ? referralCode : undefined,
        affiliateCode: affiliateCode || undefined
      });
      
      if (response.data.success) {
        toast.success('Account created successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        if (response.data.user.isAffiliateReferred) {
          toast.success('Welcome! You were referred by an affiliate.', {
            position: "top-right",
            autoClose: 3000,
          });
        } else if (response.data.user.isUserReferred) {
          toast.success('Welcome! Your referral has been recorded.', {
            position: "top-right",
            autoClose: 3000,
          });
        }
        
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
        setReferralValid(false);
        setReferrerInfo(null);

        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(`${response.data.message}`);
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.error || 'Signup failed. Please try again.';
      setSignupError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);

    if (!username) {
      setLoginError("Username is required.");
      setIsLoading(false);
      return;
    }
    if (!password) {
      setLoginError("Password is required.");
      setIsLoading(false);
      return;
    }
    if (username.length < 3) {
      setLoginError("Username must be at least 3 characters long.");
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      setLoginError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password
      });
      
      if (response.data.success) {
        toast.success('Login successful!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        localStorage.setItem('token', response.data.token);
        localStorage.setItem('usertoken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        toast.error(`${response.data.message}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      setLoginError(errorMessage);
      
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-900 font-poppins text-white">
      {/* Toast Container */}
      <Toaster/>
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
            className="h-8 md:h-10 cursor-pointer" 
            onError={(e) => {
              e.target.src = logo;
            }}
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
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm bg-opacity-90">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-800 bg-gray-900 bg-opacity-80">
              <button 
                onClick={() => {setIsSignUpActive(false);}} 
                className={`flex-1 py-3 md:py-4 text-center text-sm md:text-base font-medium cursor-pointer transition-colors duration-300 ${!isSignUpActive ? 'border-b-2 border-green-500 text-green-500 bg-gray-900 bg-opacity-50' : 'text-gray-200 hover:text-gray-300'}`}
              >
                Log in
              </button>
              <button 
                onClick={() => {setIsSignUpActive(true);}} 
                className={`flex-1 py-3 md:py-4 text-center text-sm md:text-base font-medium cursor-pointer transition-colors duration-300 ${isSignUpActive ? 'border-b-2 border-green-500 text-green-500 bg-gray-900 bg-opacity-50' : 'text-gray-200 hover:text-gray-300'}`}
              >
                Sign up
              </button>
            </div>

            <div className="p-4 md:p-6 lg:p-8">
              {/* Login Form (Now shown first by default) */}
              {!isSignUpActive ? (
                <form onSubmit={handleLoginSubmit}>
                  {/* Username Input */}
                  <div className="mb-4">
                    <label htmlFor="loginUsername" className="block text-xs md:text-sm text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      id="loginUsername"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-2 md:p-3 text-sm font-[300] bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors"
                      placeholder="Enter your username"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="mb-4 md:mb-6">
                    <label htmlFor="loginPassword" className="block text-xs md:text-sm text-gray-300 mb-2">Password</label>
                    <input
                      type="password"
                      id="loginPassword"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 md:p-3 text-sm font-[300] bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors"
                      placeholder="Enter your password"
                      disabled={isLoading}
                    />
                    {loginError && <p className="text-red-400 text-xs mt-1">{loginError}</p>}
                  </div>

                  {/* Remember me and Forgot password */}
                  <div className="flex justify-between items-center mb-6">
                    <label className="flex items-center text-xs md:text-sm text-gray-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-green-500 bg-gray-800 border-gray-600 rounded focus:ring-green-500 focus:ring-offset-gray-900" 
                        disabled={isLoading}
                      />
                      <span className="ml-2">Remember me</span>
                    </label>
                    <NavLink to="/forgot-password" className="text-xs md:text-sm text-green-400 hover:text-green-300 hover:underline transition-colors">
                      Forgot password?
                    </NavLink>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-gradient-to-r from-green-600 to-emerald-600 cursor-pointer text-white text-sm font-[500] rounded-lg shadow-lg transition-all transform hover:scale-[1.02] hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                      </span>
                    ) : 'Log in'}
                  </button>

                  {/* Additional Links */}
                  <div className="mt-4 text-center">
                    <p className="text-gray-400 text-xs">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignUpActive(true)}
                        className="text-green-400 hover:text-green-300 font-medium hover:underline transition-colors"
                      >
                        Sign up here
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* Sign Up Form (Now shown when tab is clicked) */
                <form onSubmit={handleSignUpSubmit}>
                  {/* Phone Number Input */}
                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-xs md:text-sm text-gray-300 mb-2 font-[300]">Phone number</label>
                    <div className="flex items-stretch bg-[#1a1a1a] border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
                      {/* Country Code with Flag */}
                      <div className="flex items-center px-2 md:px-3 bg-gray-800 rounded-l border-r border-gray-700">
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
                          className="w-full py-2 md:py-2.5 bg-transparent font-[400] text-white font-[300] focus:outline-none placeholder-gray-500 text-sm md:text-base"
                          placeholder="Enter phone number"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    {phoneError && <p className="text-red-400 text-xs mt-1">{phoneError}</p>}
                  </div>

                  {/* Username Input */}
                  <div className="mb-4">
                    <label htmlFor="username" className="block text-xs md:text-sm text-gray-300 mb-2">Username</label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full p-2 md:p-2.5 text-sm bg-[#1a1a1a] font-[300] border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors"
                      placeholder="Enter your username"
                      disabled={isLoading}
                    />
                  </div>
                  {/* Password Input */}
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-xs md:text-sm text-gray-300 mb-2">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 md:p-2.5 text-sm font-[300] bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors"
                      placeholder="Create a password"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Confirm Password Input */}
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-xs md:text-sm text-gray-300 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2 md:p-2.5 text-sm font-[300] bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors"
                      placeholder="Confirm your password"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Referral Code Input */}
                  <div className="mb-6">
                    <label htmlFor="referralCode" className="block text-xs md:text-sm font-[300] text-gray-300 mb-2">
                     Referral Code (Optional)
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
                        className="flex-1 p-2 md:p-3.5 text-sm bg-[#1a1a1a] font-[300] border border-gray-700 text-white rounded-lg focus:outline-none focus:border-green-500 hover:border-gray-600 transition-colors"
                        placeholder="Enter referral code"
                        disabled={referralValid || isLoading}
                      />
                      {!referralValid && (
                        <button
                          type="button"
                          onClick={checkReferralCode}
                          disabled={isCheckingReferral || !referralCode || isLoading}
                          className="px-3 md:px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md"
                        >
                          {isCheckingReferral ? 'Checking...' : 'Verify'}
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
                          Change
                        </button>
                      )}
                    </div>
                    {referralError && <p className="text-red-400 text-xs mt-1">{referralError}</p>}
                    {referralValid && referrerInfo && (
                      <p className="text-green-400 text-xs mt-1">
                        ✅ Valid referral code from {referrerInfo.username}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-1 italic">
                      Enter your friend's referral code to get bonus credits
                    </p>
                  </div>

                  {/* Sign Up Button */}
                  <button
                    type="submit"
                    className="w-full py-3 md:py-4 bg-gradient-to-r from-green-600 to-emerald-600 cursor-pointer text-white text-sm font-[500] mt-2 rounded-lg shadow-lg transition-all transform hover:scale-[1.02] hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </span>
                    ) : 'Create Account'}
                  </button>

                  {signupError && <p className="text-red-400 text-xs mt-3 text-center">{signupError}</p>}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}