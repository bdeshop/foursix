import React, { useState, useEffect } from "react";
import { Header } from "../../components/header/Header";
import Sidebar from "../../components/sidebar/Sidebar";
import Footer from "../../components/footer/Footer";
import axios from "axios";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const Deposit = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const EXTERNAL_API_URL = "https://api.oraclepay.org/api/external";
  const API_KEY = "sk_sub_b91d321aaed628d707bebc001b5e09a4de01973ebf0a19a56bf825010ae1a515";
  
  const [activeMethod, setActiveMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [depositMethods, setDepositMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [externalPaymentData, setExternalPaymentData] = useState(null);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [availableBonuses, setAvailableBonuses] = useState([]);
  const [bonusLoading, setBonusLoading] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState(null);
  const navigate = useNavigate();

  const quickAmounts = [300, 500, 1000, 2000, 5000];

  // Fetch deposit methods
  useEffect(() => {
    const fetchDepositMethods = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/deposit-methods`);
        if (response.data.success && response.data.method) {
          setDepositMethods(response.data.method);
          if (response.data.method.length > 0) {
            setActiveMethod(response.data.method[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching deposit methods:", err);
        setError("Failed to load deposit methods");
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchDepositMethods();
  }, [API_BASE_URL]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const response = await axios.get(
          `${API_BASE_URL}/api/user/all-information/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("usertoken")}`,
            },
          }
        );

        if (response.data.success) {
          setUserData(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError("Failed to fetch user data");
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [API_BASE_URL]);

  // Fetch available bonuses and filter out already used ones
  useEffect(() => {
    const fetchAvailableBonuses = async () => {
      try {
        setBonusLoading(true);
        const token = localStorage.getItem("usertoken");
        const response = await axios.get(
          `${API_BASE_URL}/api/user/bonuses/available`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success && response.data.data) {
          // Filter out bonuses that user has already used
          const user = JSON.parse(localStorage.getItem("user"));
          const userResponse = await axios.get(
            `${API_BASE_URL}/api/user/all-information/${user.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (userResponse.data.success) {
            const userData = userResponse.data.data;
            
            // Get all bonus codes that user has already used (active or completed)
            const usedBonusCodes = [];
            
            // Check bonusActivityLogs for used bonuses
            if (userData.bonusActivityLogs && Array.isArray(userData.bonusActivityLogs)) {
              userData.bonusActivityLogs.forEach(log => {
                if (log.bonusCode && (log.status === 'active' || log.status === 'completed')) {
                  usedBonusCodes.push(log.bonusCode);
                }
              });
            }
            
            // Check activeBonuses for used bonuses
            if (userData.bonusInfo && userData.bonusInfo.activeBonuses && Array.isArray(userData.bonusInfo.activeBonuses)) {
              userData.bonusInfo.activeBonuses.forEach(bonus => {
                if (bonus.bonusCode) {
                  usedBonusCodes.push(bonus.bonusCode);
                }
              });
            }
            
            // Filter out bonuses that user has already used
            const filteredBonuses = response.data.data.filter(bonus => {
              // If bonus has no code, show it (generic bonuses)
              if (!bonus.bonusCode) return true;
              
              // Check if this bonus code has been used
              const isUsed = usedBonusCodes.includes(bonus.bonusCode);
              
              // Special case: first deposit bonus
              if (bonus.bonusType === 'first_deposit' && userData.bonusInfo?.firstDepositBonusClaimed) {
                return false;
              }
              
              return !isUsed;
            });
            
            setAvailableBonuses(filteredBonuses);
          }
        }
      } catch (err) {
        console.error("Error fetching bonuses:", err);
      } finally {
        setBonusLoading(false);
      }
    };

    fetchAvailableBonuses();
  }, [API_BASE_URL]);

  // Map internal method names to external API method names
  const getExternalMethodName = (methodName) => {
    const methodMap = {
      'bKash': 'bkash',
      'Nagad': 'nagad',
      'Rocket': 'rocket',
      'Upay': 'upay'
    };
    
    return methodMap[methodName] || methodName.toLowerCase();
  };

  // Handle external payment submission
const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("Payment submitted");

  // Reset previous status
  setTransactionStatus(null);
  setExternalPaymentData(null);
  
  // Validate form
  const errors = {};
  if (!activeMethod) {
    errors.method = "Please select a payment method";
  }
  if (!amount) {
    errors.amount = "Amount is required";
  } else if (parseFloat(amount) <= 0) {
    errors.amount = "Amount must be greater than 0";
  } else if (!/^\d+$/.test(amount)) {
    errors.amount = "Amount must be a whole number";
  } else if (parseFloat(amount) < parseFloat(activeMethod?.minAmount || 100)) {
    errors.amount = `Minimum deposit amount is ৳${activeMethod?.minAmount || 100}`;
  } else if (parseFloat(amount) > parseFloat(activeMethod?.maxAmount || 30000)) {
    errors.amount = `Maximum deposit amount is ৳${activeMethod?.maxAmount || 30000}`;
  }

  setFormErrors(errors);
  if (Object.keys(errors).length > 0) {
    return;
  }

  setIsGeneratingPayment(true);

  try {
    // Get external method name
    const externalMethod = getExternalMethodName(activeMethod.gatewayName);
    
    // Create unique user identifier
    const user = JSON.parse(localStorage.getItem("user"));
    const userIdentifyAddress = `order-${user.id}-${Date.now()}`;
    
    // Payment ID is same as userIdentifyAddress
    const paymentId = userIdentifyAddress;
    console.log(userIdentifyAddress)
    // Call external API
    const response = await axios.get(
      `${EXTERNAL_API_URL}/generate`,
      {
        params: {
          methods: externalMethod,
          amount: parseFloat(amount),
          userIdentifyAddress: userIdentifyAddress
        },
        headers: {
          'X-API-Key': API_KEY
        }
      }
    );

    console.log("External API Response:", response.data);

    if (response.data.success) {
      setExternalPaymentData(response.data);
      
      // Save deposit record with pending status
      try {
        const token = localStorage.getItem("usertoken");
        const user = JSON.parse(localStorage.getItem("user"));

        // Prepare deposit record according to your backend route
        const depositRecord = {
          method: activeMethod.gatewayName,
          amount: parseFloat(amount),
          transactionId: `EXT_${Date.now()}`,
          phoneNumber: userData?.phone || "",
          playerbalance:userData.balance,
          // Bonus related fields
          bonusType: selectedBonus?.bonusType || 'none',
          bonusAmount: selectedBonus?.calculatedAmount || 0,
          wageringRequirement: selectedBonus?.wageringRequirement || 0,
          bonusCode: selectedBonus?.bonusCode || '',
          
          // External payment fields
          paymentId: paymentId,
          externalPaymentId: response.data.payment_page_url.split('/').pop() || `ext_${Date.now()}`,
          userIdentifyAddress: userIdentifyAddress,
          paymentUrl: response.data.payment_page_url,
          expiresAt: response.data.expiresAt,
          externalMethods: response.data.methods,
          
          // Optional fields with default values
          currency: 'BDT',
          rate: 1,
          charge: {
            fixed: activeMethod?.fixedCharge || 0,
            percent: activeMethod?.percentCharge || 0
          }
        };

        // Save to your backend
        const saveResponse = await axios.post(
          `${API_BASE_URL}/api/user/deposit`,
          depositRecord,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Deposit record saved:", saveResponse.data);
        
        // Update local state with the saved transaction
        if (saveResponse.data.success) {
          // Update user data with the new pending transaction
          setUserData(prev => ({
            ...prev,
            depositHistory: [
              {
                method: depositRecord.method,
                amount: depositRecord.amount,
                status: "pending",
                transactionId: depositRecord.transactionId,
                bonusApplied: depositRecord.bonusAmount > 0,
                bonusType: depositRecord.bonusType,
                bonusAmount: depositRecord.bonusAmount,
                wageringRequirement: depositRecord.wageringRequirement,
                bonusCode: depositRecord.bonusCode,
                paymentId: depositRecord.paymentId,
                externalPaymentId: depositRecord.externalPaymentId,
                userIdentifyAddress: depositRecord.userIdentifyAddress,
                paymentUrl: depositRecord.paymentUrl,
                currency: depositRecord.currency,
                rate: depositRecord.rate,
                charge: depositRecord.charge,
                createdAt: new Date()
              },
              ...(prev?.depositHistory || [])
            ].slice(0, 10) // Keep only recent 10 transactions
          }));
        }
        
      } catch (err) {
        console.error("Error saving deposit record:", err.response?.data || err.message);
        // Show error but continue with payment
        setTransactionStatus({
          success: false,
          message: "Payment created but failed to save record. Contact support with payment details."
        });
      }

      // Show success message
      setTransactionStatus({
        success: true,
        message: "Payment page generated successfully! Redirecting..."
      });

      // Redirect to payment page after a short delay
      setTimeout(() => {
        window.location.href = response.data.payment_page_url;
      }, 2000);

      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to generate payment");
    }
  } catch (err) {
    console.error("External payment generation error:", err);
    
    let errorMessage = "Payment generation failed. Please try again.";
    
    if (err.response?.status === 400) {
      errorMessage = err.response.data?.message || "Bad request. Please check your input.";
    } else if (err.response?.status === 401) {
      errorMessage = "Invalid API key. Please contact support.";
    } else if (err.response?.status === 403) {
      errorMessage = "API key inactive or subscription expired.";
    } else if (err.message) {
      errorMessage = err.message;
    }

    setTransactionStatus({
      success: false,
      message: errorMessage,
    });
    
    return null;
  } finally {
    setIsGeneratingPayment(false);
  }
};
  // Calculate bonus amount for a specific bonus
  const calculateBonusAmount = (bonus) => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    
    const amountNum = parseFloat(amount);
    let calculatedBonus = 0;
    
    if (bonus.percentage > 0) {
      calculatedBonus = (amountNum * bonus.percentage) / 100;
      if (bonus.maxBonus && calculatedBonus > bonus.maxBonus) {
        calculatedBonus = bonus.maxBonus;
      }
    } else if (bonus.amount > 0) {
      calculatedBonus = bonus.amount;
    }
    
    return calculatedBonus;
  };

  const handleRefreshBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("usertoken");

      if (!token) {
        setError("Authentication token not found");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/user/all-information/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUserData(response.data.data);
      }
    } catch (err) {
      console.error("Error refreshing balance:", err);
      setError("Failed to refresh balance");
    }
  };

  // Render payment method buttons dynamically
  const renderPaymentMethodButton = (method) => (
    <button
      type="button"
      key={method._id}
      className={`px-3 py-3 md:px-4 md:py-4 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
        activeMethod?._id === method._id
          ? "bg-[#1a2a2a] border-2 border-[#3a8a6f]"
          : "bg-[#1a1f1f] hover:bg-[#1f2525] border-2 border-transparent"
      }`}
      onClick={() => {
        setActiveMethod(method);
        setFormErrors({});
        setTransactionStatus(null);
        setExternalPaymentData(null);
      }}
    >
      <img
        src={`${API_BASE_URL}/images/${method.image}`}
        alt={method.gatewayName}
        className="w-8 h-8 md:w-10 md:h-10 mb-1 md:mb-2 object-contain"
      />
      <span className="text-xs font-medium">{method.gatewayName}</span>
    </button>
  );

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Calculate total with selected bonus
  const totalWithBonus = selectedBonus 
    ? parseFloat(amount || 0) + calculateBonusAmount(selectedBonus)
    : parseFloat(amount || 0);

  if (error && !userData) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0f0f]">
        <div className="bg-[#1a1f1f] text-[#ff6b6b] p-6 rounded-lg max-w-md text-center border border-[#2a2f2f]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#2a5c45] hover:bg-[#3a6c55] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0a0f0f] text-white font-rubik">
      {/* Header */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} />

        <div
          className={`flex-1 overflow-auto transition-all duration-300  ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <div className="max-w-6xl mx-auto py-4 md:py-8 p-3 md:p-6">
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-white">
                Deposit Funds
              </h1>
              <p className="text-sm md:text-base text-[#8a9ba8]">
                Add money to your account using secure payment gateway
              </p>
            </div>

            {/* User Info Card */}
            {userData && (
              <div className="bg-[#1a1f1f] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 border border-[#2a2f2f] shadow-lg">
                <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white">
                  Account Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  <div>
                    <p className="text-xs md:text-sm text-[#8a9ba8]">Player ID</p>
                    <p className="text-sm md:text-base font-medium text-white">
                      {userData.player_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-[#8a9ba8]">Username</p>
                    <p className="text-sm md:text-base font-medium text-white">
                      {userData.username}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-[#8a9ba8]">Phone</p>
                    <p className="text-sm md:text-base font-medium text-white">
                      {userData.phone}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-[#1a2525] to-[#2a3535] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 shadow-lg border border-[#2a2f2f]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
                <div>
                  <p className="text-xs md:text-sm text-[#a8b9c6]">
                    Current Balance
                  </p>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                    ৳ {userData ? userData.balance?.toLocaleString() : "0.00"}
                  </h2>
                  {userData?.bonusBalance > 0 && (
                    <p className="text-sm text-[#3a8a6f] mt-1">
                      Bonus Balance: ৳{userData.bonusBalance?.toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleRefreshBalance}
                  className="bg-[#2a5c45] px-4 py-2 cursor-pointer md:px-6 md:py-3 rounded-[5px] text-xs md:text-sm font-medium transition-colors flex items-center hover:bg-[#3a6c55]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Balance
                </button>
              </div>
            </div>

            {/* Loading State for Deposit Methods */}
            {loadingMethods ? (
              <div className="bg-[#1a1f1f] rounded-lg p-8 text-center border border-[#2a2f2f]">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#2a2f2f] rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent rounded-full border-t-[#3a8a6f] animate-spin"></div>
                  </div>
                  <div>
                    <p className="text-[#8a9ba8] font-medium">Loading Deposit methods</p>
                  </div>
                </div>
              </div>
            ) : depositMethods.length === 0 ? (
              <div className="bg-[#1a1f1f] rounded-[2px] p-8 text-center border border-[#2a2f2f]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-[#8a9ba8] mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-[#8a9ba8]">No deposit methods available at the moment.</p>
              </div>
            ) : (
              /* Payment Methods and Form */
              <div className="bg-[#1a1f1f] rounded-[2px] overflow-hidden mb-6 md:mb-8 border border-[#2a2f2f]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 md:p-4 border-b border-[#2a2f2f]">
                  {depositMethods.map((method) => renderPaymentMethodButton(method))}
                </div>

                {activeMethod && (
                  <>
                    {/* Payment Form */}
                    <div className="p-4 md:p-6">
                      <form onSubmit={handleSubmit} noValidate>
                        {/* Amount Field */}
                        <div className="mb-4 md:mb-6">
                          <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                            Amount (৳)
                            <span className="text-[#ff6b6b] ml-1">*</span>
                          </label>
                          <input
                            type="number"
                            className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                              formErrors.amount
                                ? "border-[#ff6b6b]"
                                : "border-[#2a2f2f]"
                            }`}
                            placeholder="Enter deposit amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                          />
                          {formErrors.amount && (
                            <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">
                              {formErrors.amount}
                            </p>
                          )}

                          {/* Quick Amounts */}
                          <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                            {quickAmounts.map((quickAmount) => (
                              <button
                                type="button"
                                key={quickAmount}
                                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors cursor-pointer ${
                                  amount === quickAmount.toString()
                                    ? "bg-[#2a5c45] text-white"
                                    : "bg-[#1f2525] text-[#8a9ba8] hover:bg-[#252b2b]"
                                }`}
                                onClick={() => setAmount(quickAmount.toString())}
                              >
                                ৳ {quickAmount.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Dynamic Bonus Selection */}
                        <div className="mb-4 md:mb-6">
                          <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                            Select Bonus (Optional)
                          </label>
                          
                          {bonusLoading ? (
                            <div className="text-center py-4">
                              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-[#3a8a6f] border-r-transparent"></div>
                              <p className="text-xs text-[#8a9ba8] mt-2">Loading bonuses...</p>
                            </div>
                          ) : availableBonuses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {/* No Bonus Option */}
                              <button
                                type="button"
                                className={`p-3 rounded-[5px] flex flex-col cursor-pointer items-center justify-center transition-all ${
                                  !selectedBonus
                                    ? "bg-[#1a2a2a] border-2 border-[#3a8a6f]"
                                    : "bg-[#1f2525] hover:bg-[#252b2b] border-2 border-transparent"
                                }`}
                                onClick={() => setSelectedBonus(null)}
                              >
                                <span className="text-sm md:text-base font-medium">
                                  No Bonus
                                </span>
                                <span className="text-xs text-[#8a9ba8]">
                                  Proceed without bonus
                                </span>
                              </button>

                              {/* Available Bonuses */}
                              {availableBonuses.map((bonus) => {
                                const calculatedAmount = calculateBonusAmount(bonus);
                                return (
                                  <button
                                    type="button"
                                    key={bonus.id}
                                    className={`p-3 rounded-[5px] flex flex-col cursor-pointer items-center justify-center transition-all ${
                                      selectedBonus?.id === bonus.id
                                        ? "bg-[#1a2a2a] border-2 border-[#3a8a6f]"
                                        : "bg-[#1f2525] hover:bg-[#252b2b] border-2 border-transparent"
                                    }`}
                                    onClick={() => setSelectedBonus({
                                      ...bonus,
                                      calculatedAmount
                                    })}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span className="text-sm md:text-base font-medium text-left">
                                        {bonus.name}
                                      </span>
                                      {amount && !isNaN(parseFloat(amount)) && calculatedAmount > 0 && (
                                        <span className="text-xs bg-[#2a5c45] text-white px-2 py-1 rounded">
                                          +৳{calculatedAmount.toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-[#8a9ba8] text-left w-full mt-1">
                                      Code: {bonus.bonusCode}
                                    </span>
                                    <span className="text-xs text-[#3a8a6f] text-left w-full">
                                      {bonus.description}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-4 border border-[#2a2f2f] rounded-lg">
                              <p className="text-sm text-[#8a9ba8]">No bonuses available at the moment.</p>
                            </div>
                          )}
                        </div>

                        {/* Summary Section */}
                        <div className="mb-4 md:mb-6 p-4 bg-[#1a2a2a] rounded-lg border border-[#2a3535]">
                          <h4 className="text-sm font-medium mb-3 text-white">Transaction Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#8a9ba8]">Deposit Amount:</span>
                              <span className="text-white">৳{parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            
                            {selectedBonus && amount && !isNaN(parseFloat(amount)) && (
                              <div className="flex justify-between">
                                <span className="text-[#8a9ba8]">Bonus ({selectedBonus.name}):</span>
                                <span className="text-[#3a8a6f]">
                                  +৳{calculateBonusAmount(selectedBonus).toFixed(2)}
                                </span>
                              </div>
                            )}
                            
                            <div className="pt-2 border-t border-[#2a3535]">
                              <div className="flex justify-between font-medium">
                                <span className="text-white">Total Credit:</span>
                                <span className="text-[#3a8a6f]">
                                  ৳{totalWithBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <div className="mb-4">
                          <button
                            className="w-full bg-gradient-to-r from-[#2a5c45] to-[#3a6c55] hover:from-[#3a6c55] hover:to-[#4a7c65] py-3 md:py-4 rounded-lg text-sm md:text-base text-white font-medium flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                            type="submit"
                            disabled={isGeneratingPayment}
                          >
                            {isGeneratingPayment ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Generating Payment Link...
                              </>
                            ) : (
                              `Proceed to ${activeMethod.gatewayName} Payment`
                            )}
                          </button>
                        </div>

                        {/* Additional form validation errors */}
                        {formErrors.method && (
                          <div className="mb-4 p-3 bg-[#2a1f1f] border border-[#3a2f2f] rounded-lg">
                            <p className="text-[#ff6b6b] text-sm">
                              {formErrors.method}
                            </p>
                          </div>
                        )}
                      </form>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Transaction Status Message */}
            {transactionStatus && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  transactionStatus.success
                    ? "bg-[#1a2525] border border-[#2a3535]"
                    : "bg-[#2a1f1f] border border-[#3a2f2f]"
                }`}
              >
                <div className="flex items-center">
                  {transactionStatus.success ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 text-[#4ecdc4]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-3 text-[#ff6b6b]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <p className={`text-sm ${transactionStatus.success ? 'text-[#4ecdc4]' : 'text-[#ff6b6b]'}`}>
                    {transactionStatus.message}
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {activeMethod && (
              <div className="bg-[#1a1f1f] rounded-[2px] p-4 md:p-6 border border-[#2a2f2f] mb-6 md:mb-8">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#3a8a6f]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 01118 0z"
                    />
                  </svg>
                  How to deposit with External Payment Gateway
                </h3>
                <ol className="text-xs md:text-sm text-[#8a9ba8] space-y-2 md:space-y-3 list-decimal list-inside">
                  <li>Select your preferred payment method</li>
                  <li>Enter the amount you want to deposit</li>
                  <li>Select a bonus option if available (optional)</li>
                  <li>Click "Proceed to [Payment Method] Payment"</li>
                  <li>You will be redirected to a secure payment page</li>
                  <li>Complete the payment on the external payment page</li>
                  <li>After successful payment, you will be redirected back</li>
                  <li>Your balance will be updated automatically</li>
                </ol>
              </div>
            )}

            {/* Enhanced Transaction History */}
            <div className="bg-[#1a1f1f] rounded-[2px] overflow-hidden border border-[#2a2f2f]">
              <div className="p-4 md:p-6 border-b border-[#2a2f2f] flex justify-between items-center">
                <h3 className="text-base md:text-lg font-semibold text-white">
                  Recent Transactions
                </h3>
                <button 
                  onClick={() => navigate("/transactions")}
                  className="text-[#3a8a6f] text-xs md:text-sm hover:text-[#4a9a7f] transition-colors cursor-pointer"
                >
                  View All
                </button>
              </div>
              <div className="p-3 md:p-4">
                {userData &&
                userData.depositHistory &&
                userData.depositHistory.length > 0 ? (
                  <div className="space-y-4">
                    {userData.depositHistory.map((transaction, index) => (
                      <div
                        key={index}
                        className="bg-[#1f2525] rounded-lg border-[1px] border-gray-500 hover:bg-[#252b2b] transition-colors overflow-hidden"
                      >
                        <div className="p-4 border-b border-[#2a2f2f]">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-2 rounded-full ${
                                  transaction.status === "completed"
                                    ? "bg-[#1a2525] text-[#4ecdc4]"
                                    : transaction.status === "pending"
                                    ? "bg-[#2a2a1f] text-[#e6db74]"
                                    : "bg-[#2a1f1f] text-[#ff6b6b]"
                                }`}
                              >
                                {transaction.status === "completed" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : transaction.status === "pending" ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-white capitalize">
                                    {transaction.method}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    transaction.status === "completed"
                                      ? "bg-green-900/30 text-green-400"
                                      : transaction.status === "pending"
                                      ? "bg-yellow-900/30 text-yellow-400"
                                      : "bg-red-900/30 text-red-400"
                                  }`}>
                                    {transaction.status}
                                  </span>
                                </div>
                                <p className="text-xs text-[#8a9ba8] mt-1">
                                  {formatDate(transaction.createdAt)} • {timeAgo(transaction.createdAt)}
                                </p>
                                {transaction.transactionId && (
                                  <p className="text-xs text-[#5a6b78] mt-1">
                                    ID: {transaction.transactionId}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg md:text-xl font-bold text-white">
                                ৳ {transaction.amount?.toLocaleString()}
                              </div>
                              {transaction.bonusAmount > 0 && (
                                <div className="text-sm text-[#3a8a6f] font-medium mt-1">
                                  +৳{transaction.bonusAmount?.toLocaleString()} Bonus
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bonus Details Section */}
                        {(transaction.bonusApplied || transaction.bonusType !== 'none') && (
                          <div className="p-4 bg-[#1a2a2a] border-b border-[#2a3535]">
                            <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-2 text-[#3a8a6f]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Bonus Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                              <div className="bg-[#1f2525] p-3 rounded">
                                <p className="text-xs text-[#8a9ba8]">Bonus Type</p>
                                <p className="text-sm font-medium text-white capitalize">
                                  {transaction.bonusType || 'Standard Bonus'}
                                </p>
                              </div>
                              <div className="bg-[#1f2525] p-3 rounded">
                                <p className="text-xs text-[#8a9ba8]">Bonus Amount</p>
                                <p className="text-sm font-medium text-[#3a8a6f]">
                                  ৳{transaction.bonusAmount?.toLocaleString() || '0'}
                                </p>
                              </div>
                              {transaction.wageringRequirement > 0 && (
                                <div className="bg-[#1f2525] p-3 rounded">
                                  <p className="text-xs text-[#8a9ba8]">Wagering Requirement</p>
                                  <p className="text-sm font-medium text-[#e6db74]">
                                    {transaction.wageringRequirement}x
                                  </p>
                                </div>
                              )}
                            </div>
                            {transaction.bonusCode && (
                              <div className="mt-2 bg-[#1f2525] p-3 rounded">
                                <p className="text-xs text-[#8a9ba8]">Bonus Code</p>
                                <p className="text-sm font-medium text-white">
                                  {transaction.bonusCode}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Total Credit Section */}
                        <div className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-[#8a9ba8]">Total Credit</p>
                              <p className="text-lg font-bold text-[#3a8a6f]">
                                ৳{(transaction.amount + (transaction.bonusAmount || 0)).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-[#8a9ba8]">Before Balance</p>
                              <p className="text-sm font-medium text-white">
                                ৳{transaction.playerbalance?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                          </div>
                          {transaction.completedAt && (
                            <div className="mt-3 pt-3 border-t border-[#2a2f2f]">
                              <p className="text-xs text-[#8a9ba8]">
                                Completed: {formatDate(transaction.completedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center flex justify-center items-center flex-col py-8 md:py-12 text-[#8a9ba8]">
                    <div className="w-16 h-16 flex justify-center items-center border-2 border-[#2a2f2f] mb-4 rounded-full">
                      <FaBangladeshiTakaSign className="text-2xl text-[#5a6b78]" />
                    </div>
                    <p className="text-base md:text-lg font-medium mb-2">
                      No Recent Transactions
                    </p>
                    <p className="text-sm text-[#5a6b78] max-w-md">
                      Your deposit history will appear here once you make your first deposit.
                    </p>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="mt-4 bg-[#2a5c45] hover:bg-[#3a6c55] px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Make Your First Deposit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Deposit;