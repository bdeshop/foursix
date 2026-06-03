import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaCoins, FaRunning, FaTrophy } from "react-icons/fa";
import { GiCash } from "react-icons/gi";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LanguageContext } from "../../context/LanguageContext";

const Turnover = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [wageringInfo, setWageringInfo] = useState({
    required: 0,
    completed: 0,
    remaining: 0,
    isCompleted: true,
    progress: 0
  });
  
  // Get language context
  const { language, t } = useContext(LanguageContext);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('usertoken');
  const navigate = useNavigate();

  // Calculate wagering requirements
  const calculateWageringRequirements = (userData) => {
    if (!userData) return { 
      required: 0, 
      completed: 0, 
      remaining: 0, 
      isCompleted: true,
      progress: 0
    };
    
    const depositAmount = parseFloat(userData.depositamount) || 0;
    const wageringNeed = parseFloat(userData.waigeringneed) || 0;
    const totalBet = parseFloat(userData.total_bet) || 0;
    
    const requiredWager = depositAmount * wageringNeed;
    const remainingWager = Math.max(0, requiredWager - totalBet);
    const isCompleted = remainingWager <= 0;
    const progress = requiredWager > 0 ? (totalBet / requiredWager) * 100 : 100;
    
    return {
      required: requiredWager,
      completed: totalBet,
      remaining: remainingWager,
      isCompleted: isCompleted,
      progress: Math.min(progress, 100)
    };
  };

  // Fetch user data
  const fetchUserData = async () => {
    if (!token) {
      setError(t?.pleaseLoginToViewProfile || "Please login to view your profile");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      
      // Fetch user information
      const response = await axios.get(
        `${base_url}/api/user/all-information/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const userData = response.data.data;
        setUserData(userData);
        
        // Calculate wagering requirements
        const wageringReq = calculateWageringRequirements(userData);
        setWageringInfo(wageringReq);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(t?.failedToFetchUserData || "Failed to fetch user data");
      console.error("Error fetching data:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchUserData();
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language.code === 'bn' ? 'bn-BD' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Check if wagering requirement exists
  const hasWageringRequirement = userData?.depositamount && userData?.waigeringneed;

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#1a1a1a] text-white">
      {/* Header */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} />

        {/* Main Area */}
        <div className="w-full pb-[50px]">
          <div className="mx-auto h-[calc(100vh-56px)] no-scrollbar overflow-y-auto w-full max-w-screen-xl md:px-4 py-4">
            {/* Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">{t?.turnoverRequirement || "Turnover Requirement"}</h2>
                <p className="text-gray-400 text-sm">
                  {t?.turnoverDescription || "Complete wagering requirements to enable withdrawals"}
                </p>
              </div>
              
              <button
                onClick={handleRefresh}
                className="flex-shrink-0 px-4 py-2 bg-[#2a5c45] hover:bg-[#3a6c55] rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 mt-4 md:mt-0"
              >
                <FaRunning className="text-xs" />
                <span>{t?.refresh || "Refresh"}</span>
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-6">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-bounce"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    {t?.loadingTurnoverData || "Loading turnover data"}
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 max-w-md">
                  <p className="text-red-400">{error}</p>
                  <button
                    onClick={fetchUserData}
                    className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
                  >
                    {t?.tryAgain || "Try Again"}
                  </button>
                </div>
              </div>
            ) : !hasWageringRequirement ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8 max-w-md">
                  <FaCheckCircle className="text-5xl text-green-500 mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold text-white mb-2">{t?.noTurnoverRequirement || "No Turnover Requirement"}</h3>
                  <p className="text-gray-400 mb-4">
                    {t?.noTurnoverRequirementDesc || "You don't have any wagering requirements at the moment."}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {t?.freeWithdrawalMessage || "You can withdraw freely as there are no turnover restrictions."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main Turnover Card */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className={`p-3 rounded-lg ${wageringInfo.isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}>
                        <GiCash className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{t?.wageringRequirement || "Wagering Requirement"}</h3>
                        <p className="text-gray-400 text-sm">
                          {t?.betDepositMultiplier || `Bet ${userData.waigeringneed}x your deposit amount`}
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                      wageringInfo.isCompleted 
                        ? 'bg-green-900/30 text-green-400 border border-green-700' 
                        : 'bg-blue-900/30 text-blue-400 border border-blue-700'
                    }`}>
                      {wageringInfo.isCompleted ? (t?.completed || 'Completed') : (t?.inProgress || 'In Progress')}
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">{t?.progress || "Progress"}</span>
                      <span className="text-white font-medium text-lg">
                        {wageringInfo.progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 mb-1">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          wageringInfo.isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-green-400'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        }`}
                        style={{ width: `${wageringInfo.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span>{t?.currencySymbol || "৳"}{formatCurrency(wageringInfo.required)}</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <FaCoins className="text-green-400" />
                        <span className="text-gray-400 text-sm">{t?.depositAmount || "Deposit Amount"}</span>
                      </div>
                      <p className="text-white font-semibold text-lg">
                        {t?.currencySymbol || "৳"}{formatCurrency(userData.depositamount)}
                      </p>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <FaTrophy className="text-blue-400" />
                        <span className="text-gray-400 text-sm">{t?.requiredTurnover || "Required Turnover"}</span>
                      </div>
                      <p className="text-white font-semibold text-lg">
                        {t?.currencySymbol || "৳"}{formatCurrency(wageringInfo.required)}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        ({userData.waigeringneed}x {t?.deposit || "deposit"})
                      </p>
                    </div>

                    <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <FaRunning className="text-cyan-400" />
                        <span className="text-gray-400 text-sm">{t?.completedWagering || "Completed Wagering"}</span>
                      </div>
                      <p className="text-white font-semibold text-lg">
                        {t?.currencySymbol || "৳"}{formatCurrency(wageringInfo.completed)}
                      </p>
                    </div>

                    <div className={`rounded-lg p-4 text-center ${
                      wageringInfo.isCompleted 
                        ? 'bg-green-900/20 border border-green-700' 
                        : 'bg-blue-900/20 border border-blue-700'
                    }`}>
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {wageringInfo.isCompleted ? (
                          <FaCheckCircle className="text-green-400" />
                        ) : (
                          <FaExclamationCircle className="text-blue-400" />
                        )}
                        <span className="text-gray-400 text-sm">{t?.remaining || "Remaining"}</span>
                      </div>
                      <p className={`font-semibold text-lg ${
                        wageringInfo.isCompleted ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        {t?.currencySymbol || "৳"}{formatCurrency(wageringInfo.remaining)}
                      </p>
                    </div>
                  </div>

                  {/* Status Message */}
                  {wageringInfo.isCompleted ? (
                    <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-center space-x-4">
                      <FaCheckCircle className="text-green-400 text-2xl flex-shrink-0" />
                      <div>
                        <p className="text-green-400 font-medium text-lg">{t?.wageringCompleted || "Wagering Requirement Completed!"}</p>
                        <p className="text-green-300 text-sm">
                          {t?.wageringCompletedDesc || "You have successfully completed the wagering requirement. You can now make withdrawals."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                          <FaExclamationCircle className="text-blue-400 text-xl flex-shrink-0" />
                          <div>
                            <p className="text-blue-400 font-medium">{t?.wageringPending || "Wagering Requirement Pending"}</p>
                            <p className="text-blue-300 text-sm">
                              {t?.wageringPendingDesc || `You need to bet ৳${formatCurrency(wageringInfo.remaining)} more to complete the requirement.`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">{t?.currentProgress || "Current Progress"}</p>
                          <p className="text-white font-semibold text-xl">{wageringInfo.progress.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Information Section */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <FaInfoCircle className="text-blue-400" />
                    <span>{t?.howTurnoverWorks || "How Turnover Works"}</span>
                  </h4>
                  <div className="text-gray-400 text-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-500 rounded-lg mt-1">
                          <GiCash className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white mb-1">{t?.depositTurnover || "Deposit Turnover"}</p>
                          <p>{t?.depositTurnoverDesc || `You need to bet ${userData.waigeringneed} times your deposit amount (${t?.currencySymbol || "৳"}${formatCurrency(userData.depositamount)}) before making withdrawals.`}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-green-500 rounded-lg mt-1">
                          <FaRunning className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-white mb-1">{t?.wageringProgress || "Wagering Progress"}</p>
                          <p>{t?.wageringProgressDesc || `Your current betting amount is ${t?.currencySymbol || "৳"}${formatCurrency(wageringInfo.completed)} out of required ${t?.currencySymbol || "৳"}${formatCurrency(wageringInfo.required)}.`}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                      <h5 className="font-medium text-white mb-2 flex items-center space-x-2">
                        <FaExclamationCircle className="text-yellow-400" />
                        <span>{t?.importantNotes || "Important Notes"}</span>
                      </h5>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          <span>{t?.importantNote1 || "You must complete wagering requirements before making withdrawals"}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          <span>{t?.importantNote2 || "Only settled bets count towards wagering requirements"}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          <span>{t?.importantNote3 || `Required turnover: ${userData.waigeringneed} × ${t?.currencySymbol || "৳"}${formatCurrency(userData.depositamount)} = ${t?.currencySymbol || "৳"}${formatCurrency(wageringInfo.required)}`}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-400 mr-2">•</span>
                          <span>{t?.importantNote4 || "Withdrawals are restricted until wagering is completed"}</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs">{t?.currentBalance || "Current Balance"}</p>
                        <p className="text-white font-semibold">{t?.currencySymbol || "৳"}{formatCurrency(userData.balance)}</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs">{t?.totalDeposit || "Total Deposit"}</p>
                        <p className="text-white font-semibold">{t?.currencySymbol || "৳"}{formatCurrency(userData.total_deposit)}</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs">{t?.totalBet || "Total Bet"}</p>
                        <p className="text-white font-semibold">{t?.currencySymbol || "৳"}{formatCurrency(userData.total_bet)}</p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs">{t?.turnoverStatus || "Turnover Status"}</p>
                        <p className={`font-semibold ${
                          wageringInfo.isCompleted ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {wageringInfo.isCompleted ? (t?.complete || 'Complete') : (t?.pending || 'Pending')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Turnover;