import React, { useState, useEffect } from 'react';
import {
  FaArrowLeft,
  FaSave,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMoneyBill,
  FaIdCard,
  FaBell,
  FaPalette,
  FaUsers,
  FaChartLine,
  FaHistory,
  FaCreditCard,
  FaGift,
  FaCog,
  FaStar,
  FaPlus,
  FaMinus,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaCalendar,
  FaSearch,
  FaFilter,
  FaGamepad,
  FaExchangeAlt,
  FaWallet,
  FaFileInvoiceDollar,
  FaSpinner,
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaRunning,
  FaInfoCircle,
  FaCoins,
  FaTrophy,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

import { GiCash } from "react-icons/gi";
import { FaExclamationCircle } from "react-icons/fa";

const Viewdetails = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [balanceAction, setBalanceAction] = useState('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [processingBalance, setProcessingBalance] = useState(false);
  const [processingPassword, setProcessingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [betHistory, setBetHistory] = useState([]);
  const [depositHistory, setDepositHistory] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [selectedBet, setSelectedBet] = useState(null);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  
  // Filter states
  const [betSearch, setBetSearch] = useState('');
  const [betStatusFilter, setBetStatusFilter] = useState('all');
  const [betResultFilter, setBetResultFilter] = useState('all');
  // Bet History Time Filter States
  const [betStartDate, setBetStartDate] = useState('');
  const [betEndDate, setBetEndDate] = useState('');
  const [betTimeFilterType, setBetTimeFilterType] = useState('all'); // 'all', 'today', 'custom'
  
  const [depositSearch, setDepositSearch] = useState('');
  const [depositStatusFilter, setDepositStatusFilter] = useState('all');
  const [withdrawSearch, setWithdrawSearch] = useState('');
  const [withdrawStatusFilter, setWithdrawStatusFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');

  // Wagering info state
  const [wageringInfo, setWageringInfo] = useState({
    required: 0,
    completed: 0,
    remaining: 0,
    isCompleted: true,
    progress: 0,
    wageringNeed: 0,
    depositAmount: 0
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const [user, setUser] = useState({
    username: '',
    email: '',
    phone: '',
    player_id: '',
    role: 'user',
    status: 'active',
    currency: 'BDT',
    balance: 0,
    bonusBalance: 0,
    kycStatus: 'unverified',
    isEmailVerified: false,
    isPhoneVerified: false,
    themePreference: 'dark',
    notificationPreferences: {
      email: true,
      sms: false,
      push: true
    },
    depositamount: 0,
    waigeringneed: 0,
    total_deposit: 0,
    total_withdraw: 0,
    total_bet: 0,
    total_wins: 0,
    total_loss: 0,
    net_profit: 0,
    lifetime_deposit: 0,
    lifetime_withdraw: 0,
    lifetime_bet: 0,
    totalWagered: 0,
    referralEarnings: 0,
    referralCount: 0,
    login_count: 0,
    last_login: null,
    createdAt: null,
    referralCode: ''
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Calculate wagering requirements
  const calculateWageringRequirements = (userData) => {
    if (!userData) return { 
      required: 0, 
      completed: 0, 
      remaining: 0, 
      isCompleted: true,
      progress: 0,
      wageringNeed: 0,
      depositAmount: 0
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
      progress: Math.min(progress, 100),
      wageringNeed: wageringNeed,
      depositAmount: depositAmount
    };
  };

  // Helper function to check if a bet date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const betDate = new Date(dateString);
    const today = new Date();
    return betDate.toDateString() === today.toDateString();
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');

        const response = await axios.get(`${base_url}/api/admin/users/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
       console.log(response)
        const userData = response.data;
        setUser(userData);
        
        // Set history arrays from the user data
        setBetHistory(userData.betHistory || []);
        setDepositHistory(userData.depositHistory || []);
        setWithdrawHistory(userData.withdrawHistory || []);
        setTransactionHistory(userData.transactionHistory || []);
        
        // Calculate wagering requirements
        const wageringReq = calculateWageringRequirements(userData);
        setWageringInfo(wageringReq);
        
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to fetch user data');
        toast.error('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, base_url]);

  const handleBalanceAdjustment = async () => {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setProcessingBalance(true);
      const token = localStorage.getItem('adminToken');
      const endpoint = balanceAction === 'add'
        ? `${base_url}/api/admin/users/${id}/balance/add`
        : `${base_url}/api/admin/users/${id}/balance/subtract`;

      const response = await axios.post(endpoint, {
        amount: parseFloat(balanceAmount),
        reason: balanceReason || 'Admin adjustment'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setUser(prev => ({ ...prev, balance: response.data.newBalance }));
      toast.success(`Balance ${balanceAction === 'add' ? 'added' : 'subtracted'} successfully!`);
      setShowBalanceModal(false);
      setBalanceAmount('');
      setBalanceReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || `Failed to ${balanceAction} balance`);
    } finally {
      setProcessingBalance(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setProcessingPassword(true);
      const token = localStorage.getItem('adminToken');

      await axios.put(`${base_url}/api/admin/users/${id}/password`, {
        password: newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('Password updated successfully!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update password');
    } finally {
      setProcessingPassword(false);
    }
  };

  const openBalanceModal = (action) => {
    setBalanceAction(action);
    setBalanceAmount('');
    setBalanceReason('');
    setShowBalanceModal(true);
  };

  const openPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  // Reset time filter to today
  const setTodayFilter = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    setBetStartDate(todayStr);
    setBetEndDate(todayStr);
    setBetTimeFilterType('today');
  };

  // Reset all time filters
  const resetTimeFilter = () => {
    setBetStartDate('');
    setBetEndDate('');
    setBetTimeFilterType('all');
  };

  // Enhanced filter functions with time filter for bets
  const filteredBetHistory = betHistory.filter(bet => {
    // Search filter
    const searchTerm = betSearch.toLowerCase();
    const matchesSearch = 
      bet.transaction_id?.toLowerCase().includes(searchTerm) ||
      bet.game_id?.toLowerCase().includes(searchTerm);
    
    // Status and Result filters
    const matchesStatus = betStatusFilter === 'all' || bet.status === betStatusFilter;
    const matchesResult = betResultFilter === 'all' || bet.betResult === betResultFilter;
    
    // Time filter
    let matchesTime = true;
    if (betTimeFilterType === 'today') {
      matchesTime = isToday(bet.bet_time);
    } else if (betTimeFilterType === 'custom' && betStartDate && betEndDate) {
      const betDate = new Date(bet.bet_time);
      const startDate = new Date(betStartDate);
      const endDate = new Date(betEndDate);
      endDate.setHours(23, 59, 59, 999);
      matchesTime = betDate >= startDate && betDate <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesResult && matchesTime;
  });

  const filteredDepositHistory = depositHistory.filter(deposit => {
    const searchTerm = depositSearch.toLowerCase();
    const matchesSearch = 
      deposit.method?.toLowerCase().includes(searchTerm) ||
      deposit.orderId?.toLowerCase().includes(searchTerm);
    
    const matchesStatus = depositStatusFilter === 'all' || deposit.status === depositStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredWithdrawHistory = withdrawHistory.filter(withdraw => {
    const searchTerm = withdrawSearch.toLowerCase();
    const matchesSearch = 
      withdraw.method?.toLowerCase().includes(searchTerm) ||
      withdraw.accountNumber?.toLowerCase().includes(searchTerm) ||
      withdraw.transactionId?.toLowerCase().includes(searchTerm);
    
    const matchesStatus = withdrawStatusFilter === 'all' || withdraw.status === withdrawStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredTransactionHistory = transactionHistory.filter(transaction => {
    const matchesType = transactionTypeFilter === 'all' || transaction.type === transactionTypeFilter;
    return matchesType;
  });

  const getUserInitials = (username) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  const getAvatarColor = (username) => {
    const colors = [
      'from-amber-500 to-orange-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-green-600',
      'from-rose-500 to-pink-600',
      'from-purple-500 to-indigo-600',
      'from-teal-500 to-blue-600'
    ];
    if (!username) return colors[0];
    const charCode = username.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  const formatCurrency = (amount, currency = 'BDT') => {
    if (amount === undefined || amount === null) return '0.00';
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      inactive: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      suspended: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      banned: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
      pending: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    };
    return statusConfig[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const getKycBadge = (status) => {
    const kycConfig = {
      verified: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      unverified: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      rejected: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    };
    return kycConfig[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const getBetResultBadge = (result) => {
    const resultConfig = {
      win: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      loss: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      cancelled: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    };
    return resultConfig[result] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      completed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      failed: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      rejected: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      cancelled: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    };
    return statusConfig[status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const getTransactionTypeBadge = (type) => {
    const typeConfig = {
      win: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      loss: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      bet: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      deposit: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      withdraw: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      penalty: 'bg-red-500/10 text-red-400 border border-red-500/20',
      affiliate_commission: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
    };
    return typeConfig[type] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-gray-600';
  const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';

  const CloseIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const hasWageringRequirement = user.depositamount > 0 && user.waigeringneed > 0;

  if (error && !loading) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-[#161B22] border border-gray-800 rounded-lg p-8 max-w-md">
                <div className="text-rose-400 text-4xl mb-4">⚠️</div>
                <p className="text-gray-400 text-sm">{error}</p>
                <button onClick={() => navigate('/admin/users')} className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all">
                  Back to Users
                </button>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full">
            {/* Header */}
            <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">User Details</h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                  <FaUser className="text-amber-500" /> View and manage user account details
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to={`/users/edit-user-details/${id}`}
                  className="bg-[#1F2937] hover:bg-amber-600/20 border border-gray-700 hover:border-amber-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
                >
                  <FaSave /> EDIT USER
                </Link>
                <button
                  onClick={openPasswordModal}
                  className="bg-[#1F2937] hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-blue-400"
                >
                  <FaKey /> CHANGE PASSWORD
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-[#161B22] border border-gray-800 rounded-lg p-12 flex justify-center items-center">
                <div className="flex flex-col items-center gap-3">
                  <FaSpinner className="animate-spin text-amber-400 text-3xl" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading user data...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Tabs Navigation */}
                <div className="mb-6 border-b border-gray-800">
                  <nav className="flex flex-wrap gap-2 md:gap-6">
                    {[
                      { id: 'profile', label: 'Profile', icon: <FaUser className="mr-2" />, count: null },
                      { id: 'wagering', label: 'Wagering', icon: <FaRunning className="mr-2" />, count: null },
                      { id: 'betHistory', label: 'Bet History', icon: <FaGamepad className="mr-2" />, count: betHistory.length },
                      { id: 'depositHistory', label: 'Deposit History', icon: <FaWallet className="mr-2" />, count: depositHistory.length },
                      { id: 'withdrawHistory', label: 'Withdraw History', icon: <FaFileInvoiceDollar className="mr-2" />, count: withdrawHistory.length },
                      { id: 'transactions', label: 'All Transactions', icon: <FaExchangeAlt className="mr-2" />, count: transactionHistory.length },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3 px-1 font-bold text-[10px] uppercase tracking-wider border-b-2 transition-all flex items-center ${
                          activeTab === tab.id
                            ? 'border-amber-500 text-amber-400'
                            : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== null && (
                          <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full ${
                            activeTab === tab.id ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      {/* User Profile Card */}
                      <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6">
                        <div className="flex items-center space-x-6 mb-6">
                          <div className={`h-20 w-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl bg-gradient-to-br ${getAvatarColor(user.username)}`}>
                            {getUserInitials(user.username)}
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-white">{user.username}</h2>
                            <p className="text-[10px] text-gray-500 mt-1 font-mono">Player ID: {user.player_id}</p>
                            <div className="flex flex-wrap gap-3 mt-3">
                              <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase ${getStatusBadge(user.status)}`}>
                                {user.status}
                              </span>
                              <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase ${getKycBadge(user.kycStatus)}`}>
                                KYC: {user.kycStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Username</label>
                            <div className="bg-[#0F111A] border border-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2.5">
                              {user.username}
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Email</label>
                            <div className="bg-[#0F111A] border border-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2.5">
                              {user.email || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Phone</label>
                            <div className="bg-[#0F111A] border border-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2.5">
                              {user.phone || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Status</label>
                            <div className={`text-[9px] px-3 py-2 rounded-lg inline-block ${getStatusBadge(user.status)}`}>
                              {user.status}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Overview Boxes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-5 border border-blue-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <FaMoneyBill className="text-2xl opacity-90" />
                            <span className="text-[8px] font-black uppercase tracking-wider bg-white/20 px-2 py-1 rounded">Main Balance</span>
                          </div>
                          <p className="text-2xl font-bold">{formatCurrency(user.balance)}</p>
                          <p className="text-blue-200 text-[10px] mt-1">{user.currency}</p>
                          <div className="flex space-x-2 mt-4">
                            <button
                              onClick={() => openBalanceModal('add')}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-white/20 hover:bg-white/30 rounded text-[10px] font-bold transition-colors"
                            >
                              <FaPlus className="mr-1 text-[8px]" /> ADD
                            </button>
                            <button
                              onClick={() => openBalanceModal('subtract')}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-white/20 hover:bg-white/30 rounded text-[10px] font-bold transition-colors"
                            >
                              <FaMinus className="mr-1 text-[8px]" /> SUBTRACT
                            </button>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg p-5 border border-emerald-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <FaGift className="text-2xl opacity-90" />
                            <span className="text-[8px] font-black uppercase tracking-wider bg-white/20 px-2 py-1 rounded">Bonus Balance</span>
                          </div>
                          <p className="text-2xl font-bold">{formatCurrency(user.bonusBalance)}</p>
                          <p className="text-emerald-200 text-[10px] mt-1">{user.currency}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-lg p-5 border border-purple-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <FaUsers className="text-2xl opacity-90" />
                            <span className="text-[8px] font-black uppercase tracking-wider bg-white/20 px-2 py-1 rounded">Referral Earnings</span>
                          </div>
                          <p className="text-2xl font-bold">{formatCurrency(user.referralEarnings || 0)}</p>
                          <p className="text-purple-200 text-[10px] mt-1">{user.currency}</p>
                        </div>
                      </div>

                      {/* Additional Financial Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                            <FaChartLine className="mr-2" /> Financial Statistics
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                              <span className="text-[10px] text-gray-500">Total Deposit:</span>
                              <span className="text-xs font-bold text-blue-400">{formatCurrency(user.total_deposit)} {user.currency}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                              <span className="text-[10px] text-gray-500">Total Withdraw:</span>
                              <span className="text-xs font-bold text-emerald-400">{formatCurrency(user.total_withdraw)} {user.currency}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                              <span className="text-[10px] text-gray-500">Total Bet:</span>
                              <span className="text-xs font-bold text-purple-400">{formatCurrency(user.total_bet)} {user.currency}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                              <span className="text-[10px] text-gray-500">Net Profit:</span>
                              <span className={`text-xs font-bold ${(user.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {formatCurrency(user.net_profit)} {user.currency}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                            <FaHistory className="mr-2" /> Account Activity
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                              <span className="text-[10px] text-gray-500">Login Count:</span>
                              <span className="text-xs font-bold text-white">{user.login_count || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                              <span className="text-[10px] text-gray-500">Referral Count:</span>
                              <span className="text-xs font-bold text-white">{user.referralCount || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                              <span className="text-[10px] text-gray-500">Last Login:</span>
                              <span className="text-xs font-bold text-gray-400">
                                {user.last_login ? formatDate(user.last_login) : 'Never'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                              <span className="text-[10px] text-gray-500">Registered:</span>
                              <span className="text-xs font-bold text-gray-400">
                                {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Settings & Preferences */}
                    <div className="space-y-6">
                      <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                          <FaCog className="mr-2" /> Account Settings
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                            <div>
                              <span className="text-xs font-semibold text-gray-300">Email Verified</span>
                              <p className="text-[9px] text-gray-500">User email verification status</p>
                            </div>
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${user.isEmailVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                              {user.isEmailVerified ? 'VERIFIED' : 'UNVERIFIED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                            <div>
                              <span className="text-xs font-semibold text-gray-300">Phone Verified</span>
                              <p className="text-[9px] text-gray-500">User phone verification status</p>
                            </div>
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${user.isPhoneVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                              {user.isPhoneVerified ? 'VERIFIED' : 'UNVERIFIED'}
                            </span>
                          </div>
                          <div>
                            <label className={labelClass}>Currency</label>
                            <div className="bg-[#0F111A] border border-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2.5">
                              {user.currency}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                          <FaBell className="mr-2" /> Notification Preferences
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                            <div>
                              <span className="text-xs font-semibold text-gray-300">Email Notifications</span>
                              <p className="text-[9px] text-gray-500">Receive updates via email</p>
                            </div>
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${user.notificationPreferences?.email ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                              {user.notificationPreferences?.email ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                            <div>
                              <span className="text-xs font-semibold text-gray-300">SMS Notifications</span>
                              <p className="text-[9px] text-gray-500">Receive updates via SMS</p>
                            </div>
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${user.notificationPreferences?.sms ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                              {user.notificationPreferences?.sms ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                            <div>
                              <span className="text-xs font-semibold text-gray-300">Push Notifications</span>
                              <p className="text-[9px] text-gray-500">Receive push notifications</p>
                            </div>
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${user.notificationPreferences?.push ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                              {user.notificationPreferences?.push ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                          <FaPalette className="mr-2" /> Theme Preference
                        </h3>
                        <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-3">
                          <p className="text-xs font-semibold text-gray-300 capitalize">{user.themePreference} Mode</p>
                          <p className="text-[9px] text-gray-500 mt-1">
                            {user.themePreference === 'light' ? 'Clean and bright interface' :
                             user.themePreference === 'dark' ? 'Easy on the eyes' :
                             'Follows system settings'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                          <FaUsers className="mr-2" /> Referral Information
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className={labelClass}>Referral Code</label>
                            <div className="bg-[#0F111A] border border-gray-700 text-gray-400 text-sm rounded-lg px-4 py-2.5 font-mono">
                              {user.referralCode || 'N/A'}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>Referral Count</label>
                              <div className="bg-[#0F111A] border border-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2.5 text-center font-bold">
                                {user.referralCount || 0}
                              </div>
                            </div>
                            <div>
                              <label className={labelClass}>Referral Earnings</label>
                              <div className="bg-[#0F111A] border border-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2.5 text-center font-bold">
                                {formatCurrency(user.referralEarnings || 0)} {user.currency}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wagering Tab */}
                {activeTab === 'wagering' && (
                  <div className="space-y-6">
                    {!hasWageringRequirement ? (
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8 text-center">
                        <FaCheckCircle className="text-5xl text-green-500 mb-4 mx-auto" />
                        <h3 className="text-xl font-semibold text-white mb-2">No Turnover Requirement</h3>
                        <p className="text-gray-400">You don't have any wagering requirements at the moment.</p>
                        <p className="text-gray-500 text-sm mt-2">The user can withdraw freely as there are no turnover restrictions.</p>
                      </div>
                    ) : (
                      <>
                        {/* Main Turnover Card */}
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <div className={`p-3 rounded-lg ${wageringInfo.isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}>
                                <GiCash className="text-white text-2xl" />
                              </div>
                              <div>
                                <h3 className="text-xl font-semibold">Wagering Requirement</h3>
                                <p className="text-gray-400 text-sm">
                                  Bet {wageringInfo.wageringNeed}x the deposit amount
                                </p>
                              </div>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                              wageringInfo.isCompleted 
                                ? 'bg-green-900/30 text-green-400 border border-green-700' 
                                : 'bg-blue-900/30 text-blue-400 border border-blue-700'
                            }`}>
                              {wageringInfo.isCompleted ? 'Completed' : 'In Progress'}
                            </div>
                          </div>

                          {/* Progress Section */}
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-400 text-sm">Progress</span>
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
                              <span>{formatCurrency(wageringInfo.required)}</span>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <FaCoins className="text-green-400" />
                                <span className="text-gray-400 text-sm">Deposit Amount</span>
                              </div>
                              <p className="text-white font-semibold text-lg">
                                {formatCurrency(user.depositamount)}
                              </p>
                            </div>

                            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <FaTrophy className="text-blue-400" />
                                <span className="text-gray-400 text-sm">Required Turnover</span>
                              </div>
                              <p className="text-white font-semibold text-lg">
                                {formatCurrency(wageringInfo.required)}
                              </p>
                              <p className="text-gray-400 text-xs mt-1">
                                ({wageringInfo.wageringNeed}x deposit)
                              </p>
                            </div>

                            <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                              <div className="flex items-center justify-center space-x-2 mb-2">
                                <FaRunning className="text-cyan-400" />
                                <span className="text-gray-400 text-sm">Completed Wagering</span>
                              </div>
                              <p className="text-white font-semibold text-lg">
                                {formatCurrency(wageringInfo.completed)}
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
                                <span className="text-gray-400 text-sm">Remaining</span>
                              </div>
                              <p className={`font-semibold text-lg ${
                                wageringInfo.isCompleted ? 'text-green-400' : 'text-blue-400'
                              }`}>
                                {formatCurrency(wageringInfo.remaining)}
                              </p>
                            </div>
                          </div>

                          {/* Status Message */}
                          {wageringInfo.isCompleted ? (
                            <div className="mt-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-center space-x-4">
                              <FaCheckCircle className="text-green-400 text-2xl flex-shrink-0" />
                              <div>
                                <p className="text-green-400 font-medium text-lg">Wagering Requirement Completed!</p>
                                <p className="text-green-300 text-sm">
                                  The user has successfully completed the wagering requirement. They can now make withdrawals.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center space-x-3">
                                  <FaExclamationCircle className="text-blue-400 text-xl flex-shrink-0" />
                                  <div>
                                    <p className="text-blue-400 font-medium">Wagering Requirement Pending</p>
                                    <p className="text-blue-300 text-sm">
                                      The user needs to bet {formatCurrency(wageringInfo.remaining)} more to complete the requirement.
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-400 text-sm">Current Progress</p>
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
                            <span>How Turnover Works</span>
                          </h4>
                          <div className="text-gray-400 text-sm space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-blue-500 rounded-lg mt-1">
                                  <GiCash className="text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-white mb-1">Deposit Turnover</p>
                                  <p>The user needs to bet {wageringInfo.wageringNeed} times their deposit amount ({formatCurrency(user.depositamount)}) before making withdrawals.</p>
                                </div>
                              </div>
                              <div className="flex items-start space-x-3">
                                <div className="p-2 bg-green-500 rounded-lg mt-1">
                                  <FaRunning className="text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-white mb-1">Wagering Progress</p>
                                  <p>Current betting amount is {formatCurrency(wageringInfo.completed)} out of required {formatCurrency(wageringInfo.required)}.</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                              <h5 className="font-medium text-white mb-2 flex items-center space-x-2">
                                <FaExclamationCircle className="text-yellow-400" />
                                <span>Important Notes</span>
                              </h5>
                              <ul className="space-y-2 text-sm">
                                <li className="flex items-start">
                                  <span className="text-yellow-400 mr-2">•</span>
                                  <span>User must complete wagering requirements before making withdrawals</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-yellow-400 mr-2">•</span>
                                  <span>Only settled bets count towards wagering requirements</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-yellow-400 mr-2">•</span>
                                  <span>Required turnover: {wageringInfo.wageringNeed} × {formatCurrency(user.depositamount)} = {formatCurrency(wageringInfo.required)}</span>
                                </li>
                                <li className="flex items-start">
                                  <span className="text-yellow-400 mr-2">•</span>
                                  <span>Withdrawals are restricted until wagering is completed</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Bet History Tab with Time Filter */}
                {activeTab === 'betHistory' && (
                  <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
                    <div className="p-5 border-b border-gray-800">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center">
                          <FaGamepad className="mr-2" /> Bet History ({filteredBetHistory.length} records)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                            <input
                              type="text"
                              placeholder="Search bets..."
                              value={betSearch}
                              onChange={(e) => setBetSearch(e.target.value)}
                              className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-amber-500 w-48"
                            />
                          </div>
                          <select
                            value={betStatusFilter}
                            onChange={(e) => setBetStatusFilter(e.target.value)}
                            className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <select
                            value={betResultFilter}
                            onChange={(e) => setBetResultFilter(e.target.value)}
                            className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                          >
                            <option value="all">All Results</option>
                            <option value="win">Win</option>
                            <option value="loss">Loss</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Time Filter Section */}
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <FaCalendar className="text-amber-400 text-xs" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Date Filter:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                resetTimeFilter();
                                setBetTimeFilterType('all');
                              }}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                                betTimeFilterType === 'all'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-[#0F111A] text-gray-400 border border-gray-700 hover:border-gray-500'
                              }`}
                            >
                              All Time
                            </button>
                            <button
                              onClick={setTodayFilter}
                              className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all ${
                                betTimeFilterType === 'today'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-[#0F111A] text-gray-400 border border-gray-700 hover:border-gray-500'
                              }`}
                            >
                              Today
                            </button>
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={betStartDate}
                                onChange={(e) => {
                                  setBetStartDate(e.target.value);
                                  if (e.target.value && betEndDate) {
                                    setBetTimeFilterType('custom');
                                  } else if (e.target.value) {
                                    setBetTimeFilterType('custom');
                                  } else if (!e.target.value && !betEndDate) {
                                    setBetTimeFilterType('all');
                                  }
                                }}
                                className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
                                placeholder="Start Date"
                              />
                              <span className="text-gray-600 text-xs">to</span>
                              <input
                                type="date"
                                value={betEndDate}
                                onChange={(e) => {
                                  setBetEndDate(e.target.value);
                                  if (betStartDate && e.target.value) {
                                    setBetTimeFilterType('custom');
                                  } else if (e.target.value) {
                                    setBetTimeFilterType('custom');
                                  } else if (!betStartDate && !e.target.value) {
                                    setBetTimeFilterType('all');
                                  }
                                }}
                                className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
                                placeholder="End Date"
                              />
                            </div>
                            {(betStartDate || betEndDate || betTimeFilterType !== 'all') && (
                              <button
                                onClick={resetTimeFilter}
                                className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold hover:bg-rose-500/20 transition-all flex items-center gap-1"
                              >
                                <FaTimes className="text-[8px]" /> Clear
                              </button>
                            )}
                          </div>
                        </div>
                        {betTimeFilterType === 'custom' && betStartDate && betEndDate && (
                          <p className="text-[9px] text-gray-500 mt-2 flex items-center gap-1">
                            <FaInfoCircle className="text-blue-400" />
                            Showing bets from {new Date(betStartDate).toLocaleDateString()} to {new Date(betEndDate).toLocaleDateString()}
                          </p>
                        )}
                        {betTimeFilterType === 'today' && (
                          <p className="text-[9px] text-gray-500 mt-2 flex items-center gap-1">
                            <FaClock className="text-amber-400" />
                            Showing only today's bets ({new Date().toLocaleDateString()})
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                          <tr>
                            <th className="py-3 px-4 text-left">Transaction ID</th>
                            <th className="py-3 px-4 text-left">Game ID</th>
                            <th className="py-3 px-4 text-left">Amount</th>
                            <th className="py-3 px-4 text-left">Result</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {filteredBetHistory.length > 0 ? (
                            filteredBetHistory.map((bet) => (
                              <tr key={bet._id || bet.transaction_id} className="hover:bg-[#1F2937] transition-colors">
                                <td className="py-3 px-4 text-xs font-mono text-gray-400">{bet.transaction_id?.substring(0, 12)}...</td>
                                <td className="py-3 px-4 text-xs text-gray-300">{bet.game_id}</td>
                                <td className="py-3 px-4 text-xs font-bold text-amber-400">{formatCurrency(bet.betAmount)} {user.currency}</td>
                                <td className="py-3 px-4">
                                  <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${getBetResultBadge(bet.betResult)}`}>
                                    {bet.betResult}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${getPaymentStatusBadge(bet.status)}`}>
                                    {bet.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[10px] text-gray-500">{formatDate(bet.bet_time)}</td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => setSelectedBet(bet)}
                                    className="text-[9px] px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="py-8 text-center text-gray-500 text-xs">
                                No bet history found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Deposit History Tab */}
                {activeTab === 'depositHistory' && (
                  <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
                    <div className="p-5 border-b border-gray-800">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center">
                          <FaWallet className="mr-2" /> Deposit History ({filteredDepositHistory.length} records)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                            <input
                              type="text"
                              placeholder="Search deposits..."
                              value={depositSearch}
                              onChange={(e) => setDepositSearch(e.target.value)}
                              className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-amber-500 w-48"
                            />
                          </div>
                          <select
                            value={depositStatusFilter}
                            onChange={(e) => setDepositStatusFilter(e.target.value)}
                            className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                          <tr>
                            <th className="py-3 px-4 text-left">Method</th>
                            <th className="py-3 px-4 text-left">Amount</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Bonus Applied</th>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {filteredDepositHistory.length > 0 ? (
                            filteredDepositHistory.map((deposit) => (
                              <tr key={deposit._id || deposit.orderId} className="hover:bg-[#1F2937] transition-colors">
                                <td className="py-3 px-4">
                                  <span className="text-[9px] px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-bold uppercase">
                                    {deposit.method}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs font-bold text-emerald-400">{formatCurrency(deposit.amount)} {user.currency}</td>
                                <td className="py-3 px-4">
                                  <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${getPaymentStatusBadge(deposit.status)}`}>
                                    {deposit.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${deposit.bonusApplied ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                    {deposit.bonusApplied ? 'YES' : 'NO'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[10px] text-gray-500">{formatDate(deposit.createdAt)}</td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => setSelectedDeposit(deposit)}
                                    className="text-[9px] px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-8 text-center text-gray-500 text-xs">
                                No deposit history found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Withdraw History Tab */}
                {activeTab === 'withdrawHistory' && (
                  <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
                    <div className="p-5 border-b border-gray-800">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center">
                          <FaFileInvoiceDollar className="mr-2" /> Withdraw History ({filteredWithdrawHistory.length} records)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                            <input
                              type="text"
                              placeholder="Search withdrawals..."
                              value={withdrawSearch}
                              onChange={(e) => setWithdrawSearch(e.target.value)}
                              className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-amber-500 w-48"
                            />
                          </div>
                          <select
                            value={withdrawStatusFilter}
                            onChange={(e) => setWithdrawStatusFilter(e.target.value)}
                            className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                          >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                          <tr>
                            <th className="py-3 px-4 text-left">Method</th>
                            <th className="py-3 px-4 text-left">Amount</th>
                            <th className="py-3 px-4 text-left">Net Amount</th>
                            <th className="py-3 px-4 text-left">Account Number</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-left">Date</th>
                            <th className="py-3 px-4 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {filteredWithdrawHistory.length > 0 ? (
                            filteredWithdrawHistory.map((withdraw) => (
                              <tr key={withdraw._id || withdraw.orderId} className="hover:bg-[#1F2937] transition-colors">
                                <td className="py-3 px-4">
                                  <span className="text-[9px] px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded font-bold uppercase">
                                    {withdraw.method || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-xs font-bold text-rose-400">{formatCurrency(withdraw.amount)} {user.currency}</td>
                                <td className="py-3 px-4 text-xs font-bold text-emerald-400">{formatCurrency(withdraw.netAmount || withdraw.amount)} {user.currency}</td>
                                <td className="py-3 px-4 text-xs font-mono text-gray-400">{withdraw.accountNumber || 'N/A'}</td>
                                <td className="py-3 px-4">
                                  <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${getPaymentStatusBadge(withdraw.status)}`}>
                                    {withdraw.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-[10px] text-gray-500">{formatDate(withdraw.createdAt)}</td>
                                <td className="py-3 px-4">
                                  <button
                                    onClick={() => setSelectedWithdraw(withdraw)}
                                    className="text-[9px] px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" className="py-8 text-center text-gray-500 text-xs">
                                No withdrawal history found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* All Transactions Tab */}
                {activeTab === 'transactions' && (
                  <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
                    <div className="p-5 border-b border-gray-800">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center">
                          <FaExchangeAlt className="mr-2" /> All Transactions ({filteredTransactionHistory.length} records)
                        </h3>
                        <select
                          value={transactionTypeFilter}
                          onChange={(e) => setTransactionTypeFilter(e.target.value)}
                          className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
                        >
                          <option value="all">All Types</option>
                          <option value="deposit">Deposit</option>
                          <option value="withdraw">Withdraw</option>
                          <option value="bet">Bet</option>
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                          <option value="penalty">Penalty</option>
                          <option value="affiliate_commission">Affiliate Commission</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                          <tr>
                            <th className="py-3 px-4 text-left">Type</th>
                            <th className="py-3 px-4 text-left">Amount</th>
                            <th className="py-3 px-4 text-left">Balance Before</th>
                            <th className="py-3 px-4 text-left">Balance After</th>
                            <th className="py-3 px-4 text-left">Description</th>
                            <th className="py-3 px-4 text-left">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {filteredTransactionHistory.length > 0 ? (
                            filteredTransactionHistory.map((transaction) => (
                              <tr key={transaction._id} className="hover:bg-[#1F2937] transition-colors">
                                <td className="py-3 px-4">
                                  <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${getTransactionTypeBadge(transaction.type)}`}>
                                    {transaction.type}
                                  </span>
                                </td>
                                <td className={`py-3 px-4 text-xs font-bold ${
                                  transaction.type === 'win' || transaction.type === 'deposit' ? 'text-emerald-400' :
                                  transaction.type === 'bet' || transaction.type === 'withdraw' || transaction.type === 'penalty' ? 'text-rose-400' :
                                  'text-gray-400'
                                }`}>
                                  {formatCurrency(transaction.amount)} {user.currency}
                                </td>
                                <td className="py-3 px-4 text-xs text-gray-400">{formatCurrency(transaction.balanceBefore)} {user.currency}</td>
                                <td className="py-3 px-4 text-xs text-gray-400">{formatCurrency(transaction.balanceAfter)} {user.currency}</td>
                                <td className="py-3 px-4 text-[10px] text-gray-500">{transaction.description}</td>
                                <td className="py-3 px-4 text-[10px] text-gray-500">{formatDate(transaction.createdAt)}                                  </td>
                               </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="6" className="py-8 text-center text-gray-500 text-xs">
                                No transaction history found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Balance Adjustment Modal */}
          {showBalanceModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
              <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
                <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    {balanceAction === 'add' ? <FaPlus /> : <FaMinus />}
                    {balanceAction === 'add' ? 'Add Balance' : 'Subtract Balance'}
                  </h3>
                  <button onClick={() => setShowBalanceModal(false)} className="text-gray-500 hover:text-gray-300">
                    <CloseIcon />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className={labelClass}>Amount ({user.currency})</label>
                    <input
                      type="number"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      className={inputClass}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Reason (Optional)</label>
                    <input
                      type="text"
                      value={balanceReason}
                      onChange={(e) => setBalanceReason(e.target.value)}
                      className={inputClass}
                      placeholder="Enter reason for adjustment"
                    />
                  </div>

                  <div className="bg-[#0F111A] p-4 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-500">
                      Current Balance: <span className="font-bold text-white">{formatCurrency(user.balance)} {user.currency}</span>
                    </p>
                    {balanceAmount && (
                      <p className="text-xs text-gray-500 mt-1">
                        New Balance: <span className="font-bold text-amber-400">
                          {formatCurrency(
                            balanceAction === 'add'
                              ? user.balance + parseFloat(balanceAmount)
                              : user.balance - parseFloat(balanceAmount)
                          )} {user.currency}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                  <button
                    onClick={() => setShowBalanceModal(false)}
                    className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBalanceAdjustment}
                    disabled={processingBalance || !balanceAmount}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processingBalance ? <FaSpinner className="animate-spin" /> : (balanceAction === 'add' ? <FaPlus /> : <FaMinus />)}
                    {balanceAction === 'add' ? 'Add Balance' : 'Subtract Balance'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Password Update Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
              <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
                <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                    <FaKey /> Update Password
                  </h3>
                  <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-300">
                    <CloseIcon />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className={labelClass}>New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                        placeholder="Enter new password"
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-500 mt-1">Password must be at least 6 characters long</p>
                  </div>

                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                        placeholder="Confirm new password"
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={processingPassword || !newPassword || !confirmPassword}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processingPassword ? <FaSpinner className="animate-spin" /> : <FaKey />}
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bet Details Modal */}
      {selectedBet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center sticky top-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaGamepad /> Bet Details
              </h3>
              <button onClick={() => setSelectedBet(null)} className="text-gray-500 hover:text-gray-300">
                <CloseIcon />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Transaction ID</label>
                    <p className="text-xs text-gray-300 font-mono bg-[#0F111A] p-3 rounded-lg border border-gray-800">{selectedBet.transaction_id}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Game ID</label>
                    <p className="text-xs text-gray-300 bg-[#0F111A] p-3 rounded-lg border border-gray-800">{selectedBet.game_id}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Bet Amount</label>
                    <p className="text-lg font-bold text-amber-400 bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                      {formatCurrency(selectedBet.betAmount)} {user.currency}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Result</label>
                    <span className={`inline-block text-[9px] px-3 py-2 rounded-lg font-bold uppercase ${getBetResultBadge(selectedBet.betResult)}`}>
                      {selectedBet.betResult}
                    </span>
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <span className={`inline-block text-[9px] px-3 py-2 rounded-lg font-bold uppercase ${getPaymentStatusBadge(selectedBet.status)}`}>
                      {selectedBet.status}
                    </span>
                  </div>
                  <div>
                    <label className={labelClass}>Bet Time</label>
                    <p className="text-xs text-gray-400 bg-[#0F111A] p-3 rounded-lg border border-gray-800">{formatDate(selectedBet.bet_time)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800">
              <button onClick={() => setSelectedBet(null)} className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Details Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center sticky top-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaWallet /> Deposit Details
              </h3>
              <button onClick={() => setSelectedDeposit(null)} className="text-gray-500 hover:text-gray-300">
                <CloseIcon />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Deposit ID</label>
                    <p className="text-xs text-gray-300 font-mono bg-[#0F111A] p-3 rounded-lg border border-gray-800">{selectedDeposit._id || selectedDeposit.orderId}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Payment Method</label>
                    <p className="text-xs text-gray-300 bg-[#0F111A] p-3 rounded-lg border border-gray-800">{selectedDeposit.method}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Amount</label>
                    <p className="text-lg font-bold text-emerald-400 bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                      {formatCurrency(selectedDeposit.amount)} {user.currency}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Status</label>
                    <span className={`inline-block text-[9px] px-3 py-2 rounded-lg font-bold uppercase ${getPaymentStatusBadge(selectedDeposit.status)}`}>
                      {selectedDeposit.status}
                    </span>
                  </div>
                  <div>
                    <label className={labelClass}>Bonus Applied</label>
                    <span className={`inline-block text-[9px] px-3 py-2 rounded-lg font-bold uppercase ${selectedDeposit.bonusApplied ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                      {selectedDeposit.bonusApplied ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div>
                    <label className={labelClass}>Created At</label>
                    <p className="text-xs text-gray-400 bg-[#0F111A] p-3 rounded-lg border border-gray-800">{formatDate(selectedDeposit.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800">
              <button onClick={() => setSelectedDeposit(null)} className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Details Modal */}
      {selectedWithdraw && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center sticky top-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaFileInvoiceDollar /> Withdrawal Details
              </h3>
              <button onClick={() => setSelectedWithdraw(null)} className="text-gray-500 hover:text-gray-300">
                <CloseIcon />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Withdrawal ID</label>
                    <p className="text-xs text-gray-300 font-mono bg-[#0F111A] p-3 rounded-lg border border-gray-800">{selectedWithdraw._id || selectedWithdraw.orderId}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Payment Method</label>
                    <p className="text-xs text-gray-300 bg-[#0F111A] p-3 rounded-lg border border-gray-800">{selectedWithdraw.method || 'N/A'}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Account Number</label>
                    <p className="text-xs text-gray-300 font-mono bg-[#0F111A] p-3 rounded-lg border border-gray-800">{selectedWithdraw.accountNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Amount</label>
                    <p className="text-lg font-bold text-rose-400 bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                      {formatCurrency(selectedWithdraw.amount)} {user.currency}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Net Amount</label>
                    <p className="text-lg font-bold text-emerald-400 bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                      {formatCurrency(selectedWithdraw.netAmount || selectedWithdraw.amount)} {user.currency}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <span className={`inline-block text-[9px] px-3 py-2 rounded-lg font-bold uppercase ${getPaymentStatusBadge(selectedWithdraw.status)}`}>
                      {selectedWithdraw.status}
                    </span>
                  </div>
                  <div>
                    <label className={labelClass}>Transaction ID</label>
                    <p className="text-xs text-gray-400 font-mono bg-[#0F111A] p-3 rounded-lg border border-gray-800">{selectedWithdraw.transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className={labelClass}>Created At</label>
                    <p className="text-xs text-gray-400 bg-[#0F111A] p-3 rounded-lg border border-gray-800">{formatDate(selectedWithdraw.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800">
              <button onClick={() => setSelectedWithdraw(null)} className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Viewdetails;