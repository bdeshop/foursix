import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FiBell, FiUser, FiLock, FiCheckCircle, FiFileText, FiTrendingUp, FiUsers, FiLogOut, FiRefreshCw, FiAlertCircle, FiArrowUp, FiArrowDown } from "react-icons/fi";
import { FaCoins, FaGift, FaExchangeAlt } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MdSportsSoccer } from "react-icons/md";
import logo from "../../assets/logo.png";
import toast, { Toaster } from 'react-hot-toast';
import { LanguageContext } from "../../context/LanguageContext";

const menuItems = [
  { id: "notifications", label: "notifications", desc: "notificationsDesc", icon: <FiBell />, path: "/member/inbox/notification", color: "from-purple-900/30 to-purple-950/30", borderColor: "border-purple-700/50", iconColor: "text-purple-400" },
  { id: "personal-info", label: "personalInfo", desc: "personalInfoDesc", icon: <FiUser />, path: "/member/profile/info", color: "from-blue-900/30 to-blue-950/30", borderColor: "border-blue-700/50", iconColor: "text-blue-400" },
  { id: "login-security", label: "loginSecurity", desc: "loginSecurityDesc", icon: <FiLock />, path: "/member/profile/account", color: "from-green-900/30 to-green-950/30", borderColor: "border-green-700/50", iconColor: "text-green-400" },
  { id: "verification", label: "verification", desc: "verificationDesc", icon: <FiCheckCircle />, path: "/member/profile/verify", color: "from-yellow-900/30 to-yellow-950/30", borderColor: "border-yellow-700/50", iconColor: "text-yellow-400" },
  { id: "transactions", label: "transactions", desc: "transactionsDesc", icon: <FiFileText />, path: "/member/transaction-records", color: "from-indigo-900/30 to-indigo-950/30", borderColor: "border-indigo-700/50", iconColor: "text-indigo-400" },
  { id: "betting-records", label: "bettingRecords", desc: "bettingRecordsDesc", icon: <MdSportsSoccer />, path: "/member/betting-records/settled", color: "from-red-900/30 to-red-950/30", borderColor: "border-red-700/50", iconColor: "text-red-400" },
  { id: "turnover", label: "turnover", desc: "turnoverDesc", icon: <FiTrendingUp />, path: "/member/turnover/uncomplete", color: "from-pink-900/30 to-pink-950/30", borderColor: "border-pink-700/50", iconColor: "text-pink-400" },
  { id: "referral", label: "myReferral", desc: "myReferralDesc", icon: <FiUsers />, path: "/referral-program/details", color: "from-teal-900/30 to-teal-950/30", borderColor: "border-teal-700/50", iconColor: "text-teal-400" },
  { id: "bonuses", label: "bonuses", desc: "bonusesDesc", icon: <FaGift />, path: "/member/bonuses", color: "from-orange-900/30 to-orange-950/30", borderColor: "border-orange-700/50", iconColor: "text-orange-400" },
];

const Mprofile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [isRefreshingCoinBalance, setIsRefreshingCoinBalance] = useState(false);
  
  // Coin conversion states
  const [convertingCoins, setConvertingCoins] = useState(false);
  
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  
  // Get language context
  const { language, t } = useContext(LanguageContext);

  // Minimum coins required for conversion
  const MIN_COINS_FOR_CONVERSION = 1000;

  // Get user and token from localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("usertoken");

  // Fetch user data
  const checkAuthAndFetchData = async () => {
    if (!token) {
      setError(t.pleaseLoginToViewProfile || "Please login to view your profile");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch user data
      const userResponse = await axios.get(`${base_url}/api/user/my-information`);
      if (userResponse.data.success) {
        setUserData(userResponse.data.data);
      } else {
        throw new Error(t.failedToFetchUserData || "Failed to fetch user data");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || (t.failedToFetchUserData || "Failed to fetch data");
      setError(errorMessage);
      console.error("Error:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh regular balance
  const refreshBalance = async () => {
    if (!token) return;

    try {
      setIsRefreshingBalance(true);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get(`${base_url}/api/user/my-information`);
      if (response.data.success) {
        setUserData(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
        toast.success(t.balanceUpdatedSuccessfully || "Balance updated successfully!");
      }
    } catch (error) {
      console.error("Error refreshing balance:", error);
      toast.error(t.failedRefreshBalance || "Failed to refresh balance");
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  // Refresh coin balance
  const refreshCoinBalance = async () => {
    if (!token) return;
    
    try {
      setIsRefreshingCoinBalance(true);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get(`${base_url}/api/user/my-information`);
      if (response.data.success) {
        setUserData(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
        toast.success(t.coinBalanceRefreshed || "Coin balance refreshed!");
      }
    } catch (error) {
      console.error("Error refreshing coin balance:", error);
      toast.error(t.failedRefreshCoinBalance || "Failed to refresh coin balance");
    } finally {
      setIsRefreshingCoinBalance(false);
    }
  };

  // Convert coins to balance
  const convertCoinsToBalance = async () => {
    const coinBalance = userData?.coinBalance || 0;
    
    if (coinBalance < MIN_COINS_FOR_CONVERSION) {
      toast.error(`${t.minCoinsRequired || "Minimum"} ${MIN_COINS_FOR_CONVERSION} ${t.coinsRequired || "coins required"}`);
      return;
    }
    
    setConvertingCoins(true);
    try {
      const response = await axios.post(
        `${base_url}/api/user/convert-coins-to-balance`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setUserData(prev => ({
          ...prev,
          coinBalance: response.data.data.newCoinBalance,
          balance: response.data.data.newRealBalance
        }));
        
        // Update user in localStorage
        const updatedUser = { ...user, balance: response.data.data.newRealBalance, coinBalance: response.data.data.newCoinBalance };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        toast.error(response.data.message || (t.conversionFailed || "Conversion failed"));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || (t.conversionFailed || "Conversion failed");
      toast.error(errorMessage);
      console.error("Error converting coins:", err);
    } finally {
      setConvertingCoins(false);
    }
  };

  // Check if user can convert coins (minimum 1000)
  const canConvertCoins = (userData?.coinBalance || 0) >= MIN_COINS_FOR_CONVERSION;
  
  // Calculate conversion details
  const getConversionDetails = () => {
    const coinBalance = userData?.coinBalance || 0;
    if (!canConvertCoins) {
      return {
        coinsToConvert: 0,
        amountToGet: 0,
        remainingCoins: coinBalance,
        needed: MIN_COINS_FOR_CONVERSION - coinBalance
      };
    }
    const coinsToConvert = Math.floor(coinBalance / 100) * 100;
    const amountToGet = coinsToConvert / 100;
    const remainingCoins = coinBalance - coinsToConvert;
    return { coinsToConvert, amountToGet, remainingCoins, needed: 0 };
  };

  const conversionDetails = getConversionDetails();

  // Load data on component mount
  useEffect(() => {
    checkAuthAndFetchData();
  }, [token, user.id]);

  // Handle menu item click
  const handleMenuClick = (path) => {
    navigate(path);
  };

  // Handle deposit
  const handleDeposit = () => {
    navigate("/member/deposit");
  };

  // Handle withdraw
  const handleWithdraw = () => {
    navigate("/member/withdraw");
  };

  // Handle logout
  const handleLogout = () => {
    setShowLogoutPopup(true);
  };

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    
    // Clear localStorage data
    localStorage.removeItem("usertoken");
    localStorage.removeItem("user");
    
    // Clear axios default headers
    delete axios.defaults.headers.common["Authorization"];
    
    // Set a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLoggingOut(false);
    setShowLogoutPopup(false);
    
    // Navigate to home page
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutPopup(false);
  };

  if (loading) {
    return (
      <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
        <div className="flex h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)]">
          <div className='w-full p-[20px] flex justify-center items-center z-[1000000] '>
            <div className="relative w-24 h-24 flex justify-center items-center">
              <div className="absolute w-full h-full rounded-full border-4 border-transparent border-t-green-500 border-r-green-500 animate-spin"></div>
              <div className="w-20 h-20 rounded-full flex justify-center items-center font-bold text-lg">
                <img className='w-16' src={logo} alt="Loading..." />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get translated menu item labels
  const getTranslatedMenuItem = (item) => ({
    ...item,
    label: t[item.label] || item.label,
    desc: t[item.desc] || item.desc
  });

  return (
    <div className="h-screen overflow-hidden w-full font-poppins bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid #2a2a2a',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/50 w-full max-w-md overflow-hidden">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-900/30 to-red-950/30 border border-red-700/30">
                <FiLogOut className="text-xl text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {t.logoutConfirmation || "Logout Confirmation"}
              </h3>
              <p className="text-gray-300 text-center text-sm mb-6">
                {t.logoutConfirmationMessage || "Are you sure you want to logout? You will need to sign in again to access your account."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-br from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 border border-gray-700/50 rounded-lg transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  onClick={confirmLogout}
                  disabled={isLoggingOut}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-lg transition-all duration-300 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {t.loggingOut || "Logging out..."}
                    </>
                  ) : (
                    t.yesLogout || "Yes, Logout"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)] w-full">
        <Sidebar sidebarOpen={sidebarOpen} menuItems={menuItems.map(getTranslatedMenuItem)} />
        <div className="flex-1 overflow-auto w-full transition-all duration-300">
          <div className="mx-auto w-full pb-[100px] sm:max-w-[95%] lg:max-w-screen-lg px-3 sm:px-4 py-3 sm:py-4">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#2a2a2a] rounded-xl shadow-2xl shadow-black/50 p-4 sm:p-5 mb-4 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/5 to-transparent opacity-20"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 blur-sm opacity-60"></div>
                    <img
                      src="https://thumbs.dreamstime.com/b/man-profile-cartoon-smiling-round-icon-vector-illustration-graphic-design-135443422.jpg"
                      alt="Profile"
                      className="w-[80px] h-[80px] rounded-full border-2 border-green-500 relative z-10"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {userData?.username || t.user || "User"}
                    </h2>
                    
                    {/* Balance and Coin Balance in One Line - Single Box with Separate Borders */}
                    <div className="mt-2 flex items-center gap-2">
                      {/* Balance Box */}
                      <div className="rounded-[2px] border border-gray-700/50 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                          <img
                            src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/currency-type/bdt.png"
                            className="w-3.5 h-3.5"
                            alt="BDT"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-white text-sm font-medium">
                              {parseFloat(userData?.balance || 0).toFixed(2)}
                            </span>
                            <button
                              className="p-0.5 hover:bg-[#444] cursor-pointer text-gray-400 transition-colors duration-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={refreshBalance}
                              disabled={isRefreshingBalance}
                              aria-label={t.refreshBalance || "Refresh balance"}
                            >
                              <FiRefreshCw
                                className={`w-2.5 h-2.5 ${isRefreshingBalance ? 'animate-spin' : ''}`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Separator Line */}
                      <div className="w-px h-6 bg-gray-700"></div>
                      
                      {/* Coin Balance Box */}
                      <div className="bg-[#1f1f1f] rounded-[2px] border border-gray-700/50 overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                          <FaCoins className="w-3.5 h-3.5 text-yellow-400" />
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-sm font-medium">
                              {userData?.coinBalance?.toLocaleString() || 0}
                            </span>
                            <button
                              className="p-0.5 hover:bg-[#444] cursor-pointer text-yellow-400/70 transition-colors duration-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={refreshCoinBalance}
                              disabled={isRefreshingCoinBalance}
                              aria-label={t.refreshCoinBalance || "Refresh coin balance"}
                            >
                              <FiRefreshCw
                                className={`w-2.5 h-2.5 ${isRefreshingCoinBalance ? 'animate-spin' : ''}`}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deposit & Withdraw Buttons */}
                <div className="mt-4 flex flex-row gap-3">
                  <button
                    onClick={handleDeposit}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-[5px] transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 text-sm font-medium group"
                  >
                    <FiArrowDown className="text-white group-hover:scale-110 transition-transform" />
                    <span>{t.deposit || "Deposit"}</span>
                  </button>
                  <button
                    onClick={handleWithdraw}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-[5px] transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/30 text-sm font-medium group"
                  >
                    <FiArrowUp className="text-white group-hover:scale-110 transition-transform" />
                    <span>{t.withdrawal || "Withdraw"}</span>
                  </button>
                </div>

                {/* Professional Coin Redeem Box - Clean & Minimal */}
                <div className={`mt-4 rounded-lg transition-all duration-300 overflow-hidden ${
                  canConvertCoins 
                    ? "bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/30" 
                    : "bg-[#1a1a1a] border border-[#2a2a2a]"
                }`}>
                  {/* Compact Header */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        canConvertCoins ? "bg-amber-500/20" : "bg-gray-500/20"
                      }`}>
                        <FaCoins className={canConvertCoins ? "text-amber-400 text-sm" : "text-gray-500 text-sm"} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{t.coinRedeem || "Coin Redeem"}</span>
                          <span className="text-[10px] text-gray-400">{t.hundredCoinsEquals || "100 Coins = 1 BDT"}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px] text-gray-500">{t.available || "Available"}:</span>
                          <span className="text-xs font-medium text-amber-400">{userData?.coinBalance?.toLocaleString() || 0}</span>
                          <span className="text-[10px] text-gray-500">{t.coins || "coins"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {canConvertCoins ? (
                      <button
                        onClick={convertCoinsToBalance}
                        disabled={convertingCoins}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg text-xs font-medium transition-all duration-300 shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {convertingCoins ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FaExchangeAlt className="text-[10px]" />
                        )}
                        <span>{t.redeem || "Redeem"}</span>
                      </button>
                    ) : (
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500">{t.minimumRequired || "Minimum required"}</div>
                        <div className="text-xs font-medium text-amber-400/70">{MIN_COINS_FOR_CONVERSION} {t.coins || "coins"}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Redeem Details - Only shown when eligible */}
                  {canConvertCoins && (
                    <div className="px-3 pb-3 pt-1 border-t border-amber-500/20">
                      <div className="flex items-center justify-between gap-3 text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">{t.convert || "Convert"}:</span>
                          <span className="text-amber-400 font-medium">{conversionDetails.coinsToConvert.toLocaleString()}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-700"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">{t.receive || "Receive"}:</span>
                          <span className="text-green-400 font-medium">৳{conversionDetails.amountToGet}</span>
                        </div>
                        <div className="w-px h-3 bg-gray-700"></div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">{t.remaining || "Remaining"}:</span>
                          <span className="text-gray-400">{conversionDetails.remainingCoins.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Progress Bar - Only shown when not eligible but have some coins */}
                  {!canConvertCoins && userData?.coinBalance > 0 && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="flex items-center justify-between gap-2 text-[10px] mb-1">
                        <span className="text-gray-500">{t.progressToRedeem || "Progress to redeem"}</span>
                        <span className="text-amber-400/80 text-[9px]">{((userData?.coinBalance || 0) / MIN_COINS_FOR_CONVERSION * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(((userData?.coinBalance || 0) / MIN_COINS_FOR_CONVERSION) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-[9px] text-gray-600 mt-1.5 text-center">
                        {t.needMoreCoins || "Need"} {conversionDetails.needed} {t.moreCoins || "more coins"}
                      </div>
                    </div>
                  )}
                  
                  {/* No coins message - Minimal */}
                  {userData?.coinBalance === 0 && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="text-[10px] text-gray-500 text-center py-1">
                        {t.completeLevelsToEarnCoins || "Complete levels to earn coins"}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Menu Items Boxes - Smaller and Compact */}
                <div className="mt-5 gflex flex-col">
                  {menuItems.map((item) => {
                    const translatedItem = getTranslatedMenuItem(item);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleMenuClick(item.path)}
                        className={`
                          bg-gradient-to-br ${item.color} 
                          ${item.borderColor} 
                          border 
                          rounded-lg 
                          p-2.5 
                          flex flex-col items-start gap-1.5 
                          hover:scale-[1.02] 
                          hover:shadow-lg 
                          hover:shadow-black/30 
                          cursor-pointer 
                          transition-all duration-300 
                          hover:border-opacity-70
                          group
                          relative overflow-hidden 
                          mb-[10px]
                        `}
                      >
                        {/* Background glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        <div className="relative z-10 flex items-center gap-2 w-full">
                          <div className={`
                            text-lg 
                            ${item.iconColor} 
                            group-hover:scale-110 
                            transition-transform duration-300
                            p-1.5 rounded-lg bg-black/20
                          `}>
                            {item.icon}
                          </div>
                          <span className="text-xs font-semibold text-gray-100 group-hover:text-white transition-colors">
                            {translatedItem.label}
                          </span>
                        </div>
                        <p className="relative z-10 text-[9px] text-gray-400 group-hover:text-gray-300 transition-colors leading-tight">
                          {translatedItem.desc}
                        </p>
                        
                        {/* Arrow indicator */}
                        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Logout Button Section */}
                  {token && (
                    <div className="col-span-2 sm:col-span-3 lg:col-span-4 mt-2">
                      <button
                        onClick={handleLogout}
                        className="relative inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-900/30 to-red-950/30 hover:from-red-800/30 hover:to-red-900/30 border border-red-700/50 hover:border-red-600/50 rounded-lg transition-all duration-300 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 group"
                      >
                        {/* Background glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <FiLogOut className="text-base text-red-400 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                        <span className="text-xs font-medium text-red-300 group-hover:text-red-200 transition-colors relative z-10">
                          {t.logout || "Logout from Account"}
                        </span>
                        
                        {/* Arrow indicator */}
                        <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 relative z-10">
                          <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7"></path>
                          </svg>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-red-900/30 to-red-950/30 border border-red-700/50 rounded-lg p-3 mb-4 text-center backdrop-blur-sm">
                <div className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              </div>
            )}

            {!token && (
              <div className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 text-center max-w-sm mx-auto shadow-2xl shadow-black/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-transparent opacity-30"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-900/30 to-blue-950/30 border border-blue-700/30 mb-2">
                    <FiBell className="text-lg text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold mb-1 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {t.authenticationRequired || "Authentication Required"}
                  </h3>
                  <p className="text-gray-400 mb-3 text-xs">{t.pleaseLoginToViewProfile || "Please log in to view your profile"}</p>
                  <a
                    href="/login"
                    className="relative inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 text-xs font-medium group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg blur-sm opacity-0 group-hover:opacity-50 transition-opacity"></div>
                    <span className="relative">{t.signIn || "Sign In Now"}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mprofile;