import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaSave, FaUser, FaPhone, FaEnvelope, FaMoneyBill, FaIdCard, FaBell, FaPalette, FaUsers, FaChartLine, FaHistory, FaCreditCard, FaGift, FaCog, FaStar, FaPlus, FaMinus, FaKey, FaEye, FaEyeSlash, FaCalendar, FaSearch, FaFilter, FaGamepad, FaExchangeAlt, FaWallet, FaFileInvoiceDollar } from 'react-icons/fa';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const Viewdetails = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
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
  
  // New states for history tables
  const [activeTab, setActiveTab] = useState('profile');
  const [betHistory, setBetHistory] = useState([]);
  const [depositHistory, setDepositHistory] = useState([]);
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [selectedBet, setSelectedBet] = useState(null);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [betSearch, setBetSearch] = useState('');
  const [depositSearch, setDepositSearch] = useState('');
  const [withdrawSearch, setWithdrawSearch] = useState('');
  
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
    }
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch user data with all history
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        
        const response = await axios.get(`${base_url}/api/admin/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const userData = response.data;
        setUser(userData);
        
        // Set history data
        setBetHistory(userData.betHistory || []);
        setDepositHistory(userData.depositHistory || []);
        setWithdrawHistory(userData.withdrawHistory || []);
        setTransactionHistory(userData.transactionHistory || []);
        
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to fetch user data');
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id, base_url]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('notification.')) {
      const field = name.split('.')[1];
      setUser(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [field]: checked
        }
      }));
    } else if (type === 'checkbox') {
      setUser(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setUser(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setUser(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('adminToken');
      
      const response = await axios.put(`${base_url}/api/admin/users/${id}`, user, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('User updated successfully!');
      setUser(response.data.user);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  // Handle balance adjustment
  const handleBalanceAdjustment = async () => {
    if (!balanceAmount || parseFloat(balanceAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setProcessingBalance(true);
      setError('');
      
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

      setUser(prev => ({
        ...prev,
        balance: response.data.newBalance
      }));

      setSuccess(`Balance ${balanceAction === 'add' ? 'added' : 'subtracted'} successfully!`);
      setShowBalanceModal(false);
      setBalanceAmount('');
      setBalanceReason('');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || `Failed to ${balanceAction} balance`);
    } finally {
      setProcessingBalance(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setProcessingPassword(true);
      setError('');
      
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.put(`${base_url}/api/admin/users/${id}/password`, {
        password: newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Password updated successfully!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update password');
    } finally {
      setProcessingPassword(false);
    }
  };

  // Open balance modal
  const openBalanceModal = (action) => {
    setBalanceAction(action);
    setBalanceAmount('');
    setBalanceReason('');
    setShowBalanceModal(true);
  };

  // Open password modal
  const openPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  // Filter bet history
  const filteredBetHistory = betHistory.filter(bet => {
    const searchTerm = betSearch.toLowerCase();
    return (
      bet.transaction_id?.toLowerCase().includes(searchTerm) ||
      bet.game_id?.toLowerCase().includes(searchTerm) ||
      bet.betResult?.toLowerCase().includes(searchTerm) ||
      bet.status?.toLowerCase().includes(searchTerm)
    );
  });

  // Filter deposit history
  const filteredDepositHistory = depositHistory.filter(deposit => {
    const searchTerm = depositSearch.toLowerCase();
    return (
      deposit.method?.toLowerCase().includes(searchTerm) ||
      deposit.status?.toLowerCase().includes(searchTerm)
    );
  });

  // Filter withdraw history
  const filteredWithdrawHistory = withdrawHistory.filter(withdraw => {
    const searchTerm = withdrawSearch.toLowerCase();
    return (
      withdraw.method?.toLowerCase().includes(searchTerm) ||
      withdraw.status?.toLowerCase().includes(searchTerm)
    );
  });

  // Function to get user initials for avatar
  const getUserInitials = (username) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  // Function to get random background color based on username
  const getAvatarColor = (username) => {
    const colors = [
      'from-purple-500 to-pink-500', 
      'from-blue-500 to-cyan-500', 
      'from-green-500 to-emerald-500', 
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-600',
      'from-teal-500 to-blue-600'
    ];
    if (!username) return colors[0];
    const charCode = username.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Format currency
  const formatCurrency = (amount, currency = 'BDT') => {
    if (amount === undefined || amount === null) return '0.00';
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Format date
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

  // Status badge colors with gradients
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: 'bg-gradient-to-r from-green-500 to-emerald-600',
      inactive: 'bg-gradient-to-r from-yellow-500 to-amber-600',
      suspended: 'bg-gradient-to-r from-red-500 to-rose-600',
      banned: 'bg-gradient-to-r from-gray-500 to-gray-700',
      pending: 'bg-gradient-to-r from-blue-500 to-cyan-600'
    };
    return statusConfig[status] || 'bg-gradient-to-r from-gray-500 to-gray-700';
  };

  // KYC status badge colors
  const getKycBadge = (status) => {
    const kycConfig = {
      verified: 'bg-gradient-to-r from-green-500 to-emerald-600',
      pending: 'bg-gradient-to-r from-yellow-500 to-amber-600',
      unverified: 'bg-gradient-to-r from-red-500 to-rose-600',
      rejected: 'bg-gradient-to-r from-gray-500 to-gray-700'
    };
    return kycConfig[status] || 'bg-gradient-to-r from-gray-500 to-gray-700';
  };

  // Bet result badge colors
  const getBetResultBadge = (result) => {
    const resultConfig = {
      win: 'bg-gradient-to-r from-green-500 to-emerald-600',
      loss: 'bg-gradient-to-r from-red-500 to-rose-600',
      pending: 'bg-gradient-to-r from-yellow-500 to-amber-600',
      cancelled: 'bg-gradient-to-r from-gray-500 to-gray-700'
    };
    return resultConfig[result] || 'bg-gradient-to-r from-gray-500 to-gray-700';
  };

  // Payment status badge colors
  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      completed: 'bg-gradient-to-r from-green-500 to-emerald-600',
      pending: 'bg-gradient-to-r from-yellow-500 to-amber-600',
      failed: 'bg-gradient-to-r from-red-500 to-rose-600',
      cancelled: 'bg-gradient-to-r from-gray-500 to-gray-700'
    };
    return statusConfig[status] || 'bg-gradient-to-r from-gray-500 to-gray-700';
  };

  if (loading) {
    return (
      <section className="font-nunito h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-[90vh]">
              <div className="relative flex justify-center items-center flex-col">
                <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 font-semibold">Loading user data...</p>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (error && !user.username) {
    return (
      <section className="font-nunito h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-2xl mb-4">Error</div>
                <p className="text-gray-600">{error}</p>
                <button 
                  onClick={() => navigate('/admin/users')} 
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg border border-orange-600"
                >
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
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 font-poppins flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          <div className="w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">User Details</h1>
                  <p className="text-sm text-gray-600 mt-1">Manage user account details and view transaction history</p>
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium flex items-center">
                  <FaStar className="mr-2" />
                  {success}
                </p>
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium flex items-center">
                  {error}
                </p>
              </div>
            )}

            {/* Tabs Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaUser className="inline mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('betHistory')}
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'betHistory'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaGamepad className="inline mr-2" />
                  Bet History ({betHistory.length})
                </button>
                <button
                  onClick={() => setActiveTab('depositHistory')}
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'depositHistory'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaWallet className="inline mr-2" />
                  Deposit History ({depositHistory.length})
                </button>
                <button
                  onClick={() => setActiveTab('withdrawHistory')}
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'withdrawHistory'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaFileInvoiceDollar className="inline mr-2" />
                  Withdraw History ({withdrawHistory.length})
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'transactions'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaExchangeAlt className="inline mr-2" />
                  All Transactions ({transactionHistory.length})
                </button>
              </nav>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - User Info & Financial Boxes */}
                <div className="lg:col-span-2 space-y-6">
                  {/* User Profile Card */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center space-x-6 mb-6">
                      <div className={`h-20 w-20 rounded-xl flex items-center justify-center text-white font-bold text-3xl bg-gradient-to-br ${getAvatarColor(user.username)}`}>
                        {getUserInitials(user.username)}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-800">{user.username}</h2>
                        <p className="text-sm text-gray-600 mt-1">Player ID: {user.player_id}</p>
                        <div className="flex space-x-3 mt-3">
                          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadge(user.status)} text-white`}>
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getKycBadge(user.kycStatus)} text-white`}>
                            KYC: {user.kycStatus.charAt(0).toUpperCase() + user.kycStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <FaUser className="inline mr-3 text-blue-500" />
                          Username
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={user.username}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <FaEnvelope className="inline mr-3 text-purple-500" />
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={user.email || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                          <FaPhone className="inline mr-3 text-green-500" />
                          Phone
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={user.phone || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Status
                        </label>
                        <select
                          name="status"
                          value={user.status}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                          <option value="pending">Pending</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview Boxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Balance Box */}
                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-xl p-5 text-white border border-blue-600 relative">
                      <div className="flex items-center justify-between mb-4">
                        <FaMoneyBill className="text-2xl opacity-90" />
                        <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Main Balance</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-2xl font-bold">
                          {formatCurrency(user.balance)}
                        </p>
                        <p className="text-blue-100 text-sm mt-1 font-medium">{user.currency}</p>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => openBalanceModal('add')}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-semibold"
                        >
                          <FaPlus className="mr-1" /> Add
                        </button>
                        <button
                          onClick={() => openBalanceModal('subtract')}
                          className="flex-1 flex items-center justify-center px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-semibold"
                        >
                          <FaMinus className="mr-1" /> Subtract
                        </button>
                      </div>
                    </div>

                    {/* Bonus Balance Box */}
                    <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 rounded-xl p-5 text-white border border-emerald-600">
                      <div className="flex items-center justify-between mb-4">
                        <FaGift className="text-2xl opacity-90" />
                        <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Bonus Balance</span>
                      </div>
                      <div className="mt-2">
                        <input
                          type="number"
                          name="bonusBalance"
                          value={user.bonusBalance}
                          onChange={handleInputChange}
                          className="w-full bg-transparent border-none text-2xl font-bold text-white focus:outline-none focus:ring-0 placeholder-white/80"
                          step="0.01"
                          placeholder="0.00"
                        />
                        <p className="text-green-100 text-sm mt-1 font-medium">{user.currency}</p>
                      </div>
                    </div>

                    {/* Referral Earnings Box */}
                    <div className="bg-gradient-to-br from-purple-500 via-pink-600 to-rose-700 rounded-xl p-5 text-white border border-purple-600">
                      <div className="flex items-center justify-between mb-4">
                        <FaUsers className="text-2xl opacity-90" />
                        <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded">Referral Earnings</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-2xl font-bold">
                          {formatCurrency(user.referralEarnings || 0)}
                        </p>
                        <p className="text-purple-100 text-sm mt-1 font-medium">{user.currency}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Financial Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <FaChartLine className="mr-3 text-blue-500" />
                        Financial Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Total Deposit:</span>
                          <span className="text-sm font-bold text-blue-600">{formatCurrency(user.total_deposit)} {user.currency}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Total Withdraw:</span>
                          <span className="text-sm font-bold text-green-600">{formatCurrency(user.total_withdraw)} {user.currency}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Total Bet:</span>
                          <span className="text-sm font-bold text-purple-600">{formatCurrency(user.total_bet)} {user.currency}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Net Profit:</span>
                          <span className={`text-sm font-bold ${(user.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(user.net_profit)} {user.currency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <FaHistory className="mr-3 text-green-500" />
                        Account Activity
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Login Count:</span>
                          <span className="text-sm font-bold text-gray-800">{user.login_count || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Referral Count:</span>
                          <span className="text-sm font-bold text-gray-800">{user.referralCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Last Login:</span>
                          <span className="text-sm font-bold text-gray-800">
                            {user.last_login ? formatDate(user.last_login) : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-600">Registered:</span>
                          <span className="text-sm font-bold text-gray-800">
                            {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Settings & Preferences */}
                <div className="space-y-6">
                  {/* Account Settings */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                      <FaCog className="mr-3 text-orange-500" />
                      Account Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Email Verified</span>
                          <p className="text-xs text-gray-500">User email verification status</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="isEmailVerified"
                            checked={user.isEmailVerified}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Phone Verified</span>
                          <p className="text-xs text-gray-500">User phone verification status</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="isPhoneVerified"
                            checked={user.isPhoneVerified}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          name="currency"
                          value={user.currency}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                        >
                          <option value="BDT">BDT</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="INR">INR</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notification Preferences */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                      <FaBell className="mr-3 text-purple-500" />
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Email Notifications</span>
                          <p className="text-xs text-gray-500">Receive updates via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notification.email"
                            checked={user.notificationPreferences?.email || false}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <span className="text-sm font-semibold text-gray-700">SMS Notifications</span>
                          <p className="text-xs text-gray-500">Receive updates via SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notification.sms"
                            checked={user.notificationPreferences?.sms || false}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <span className="text-sm font-semibold text-gray-700">Push Notifications</span>
                          <p className="text-xs text-gray-500">Receive push notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notification.push"
                            checked={user.notificationPreferences?.push || false}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bet History Tab */}
            {activeTab === 'betHistory' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <FaGamepad className="mr-3 text-orange-500" />
                      Bet History ({filteredBetHistory.length} records)
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search bets..."
                          value={betSearch}
                          onChange={(e) => setBetSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Transaction ID</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Game ID</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Result</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBetHistory.length > 0 ? (
                        filteredBetHistory.map((bet) => (
                          <tr key={bet._id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-800 font-medium">
                              <span className="font-mono">{bet.transaction_id}</span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{bet.game_id}</td>
                            <td className="py-3 px-4 text-sm font-bold text-gray-800">
                              {formatCurrency(bet.betAmount)} {user.currency}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getBetResultBadge(bet.betResult)} text-white`}>
                                {bet.betResult?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                bet.status === 'completed' ? 'bg-green-100 text-green-800' :
                                bet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {bet.status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(bet.bet_time)}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => setSelectedBet(bet)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-8 text-center text-gray-500">
                            No bet history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Bet Details Modal */}
                {selectedBet && (
                  <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[100000] p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-800">Bet Details</h3>
                          <button
                            onClick={() => setSelectedBet(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Transaction ID</label>
                              <p className="text-gray-800 font-medium font-mono bg-gray-50 p-3 rounded-lg">{selectedBet.transaction_id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Game ID</label>
                              <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg">{selectedBet.game_id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Bet Amount</label>
                              <p className="text-2xl font-bold text-blue-600 bg-gray-50 p-3 rounded-lg">
                                {formatCurrency(selectedBet.betAmount)} {user.currency}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Result</label>
                              <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-full ${getBetResultBadge(selectedBet.betResult)} text-white`}>
                                {selectedBet.betResult?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
                              <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-full ${
                                selectedBet.status === 'completed' ? 'bg-green-100 text-green-800' :
                                selectedBet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {selectedBet.status?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Bet Time</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{formatDate(selectedBet.bet_time)}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Created At</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{formatDate(selectedBet.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="text-lg font-bold text-gray-800 mb-4">Associated Transaction</h4>
                          {transactionHistory.find(t => t.referenceId === selectedBet.transaction_id) ? (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-600 mb-1">Type</label>
                                  <p className="text-gray-800 font-medium">{transactionHistory.find(t => t.referenceId === selectedBet.transaction_id)?.type}</p>
                                </div>
                                <div>
                                  <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
                                  <p className="text-gray-800">{transactionHistory.find(t => t.referenceId === selectedBet.transaction_id)?.description}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500">No associated transaction found</p>
                          )}
                        </div>
                      </div>
                      <div className="p-6 border-t border-gray-200">
                        <button
                          onClick={() => setSelectedBet(null)}
                          className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deposit History Tab */}
            {activeTab === 'depositHistory' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <FaWallet className="mr-3 text-green-500" />
                      Deposit History ({filteredDepositHistory.length} records)
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search deposits..."
                          value={depositSearch}
                          onChange={(e) => setDepositSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Method</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Bonus Applied</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredDepositHistory.length > 0 ? (
                        filteredDepositHistory.map((deposit) => (
                          <tr key={deposit._id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                {deposit.method}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-green-600">
                              {formatCurrency(deposit.amount)} {user.currency}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(deposit.status)} text-white`}>
                                {deposit.status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                deposit.bonusApplied ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {deposit.bonusApplied ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(deposit.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => setSelectedDeposit(deposit)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-500">
                            No deposit history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Deposit Details Modal */}
                {selectedDeposit && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-800">Deposit Details</h3>
                          <button
                            onClick={() => setSelectedDeposit(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Deposit ID</label>
                              <p className="text-gray-800 font-medium font-mono bg-gray-50 p-3 rounded-lg">{selectedDeposit._id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Payment Method</label>
                              <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg">{selectedDeposit.method}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Amount</label>
                              <p className="text-2xl font-bold text-green-600 bg-gray-50 p-3 rounded-lg">
                                {formatCurrency(selectedDeposit.amount)} {user.currency}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
                              <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-full ${getPaymentStatusBadge(selectedDeposit.status)} text-white`}>
                                {selectedDeposit.status?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Bonus Applied</label>
                              <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-full ${
                                selectedDeposit.bonusApplied ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {selectedDeposit.bonusApplied ? 'YES' : 'NO'}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Bonus Type</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedDeposit.bonusType || 'None'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Bonus Amount</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{formatCurrency(selectedDeposit.bonusAmount)} {user.currency}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Created At</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{formatDate(selectedDeposit.createdAt)}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Transaction ID</label>
                              <p className="text-gray-800 font-mono bg-gray-50 p-3 rounded-lg">{selectedDeposit.transactionId || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-6 border-t border-gray-200">
                        <button
                          onClick={() => setSelectedDeposit(null)}
                          className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Withdraw History Tab */}
            {activeTab === 'withdrawHistory' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <FaFileInvoiceDollar className="mr-3 text-red-500" />
                      Withdraw History ({filteredWithdrawHistory.length} records)
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search withdrawals..."
                          value={withdrawSearch}
                          onChange={(e) => setWithdrawSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Method</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Transaction ID</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredWithdrawHistory.length > 0 ? (
                        filteredWithdrawHistory.map((withdraw) => (
                          <tr key={withdraw._id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                                {withdraw.method || 'N/A'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-bold text-red-600">
                              {formatCurrency(withdraw.amount)} {user.currency}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(withdraw.status)} text-white`}>
                                {withdraw.status?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                              {withdraw.transaction_id?.substring(0, 10) || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(withdraw.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => setSelectedWithdraw(withdraw)}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-500">
                            No withdrawal history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Withdraw Details Modal */}
                {selectedWithdraw && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-gray-800">Withdrawal Details</h3>
                          <button
                            onClick={() => setSelectedWithdraw(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Withdrawal ID</label>
                              <p className="text-gray-800 font-medium font-mono bg-gray-50 p-3 rounded-lg">{selectedWithdraw._id}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Payment Method</label>
                              <p className="text-gray-800 font-medium bg-gray-50 p-3 rounded-lg">{selectedWithdraw.method || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Amount</label>
                              <p className="text-2xl font-bold text-red-600 bg-gray-50 p-3 rounded-lg">
                                {formatCurrency(selectedWithdraw.amount)} {user.currency}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Status</label>
                              <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-full ${getPaymentStatusBadge(selectedWithdraw.status)} text-white`}>
                                {selectedWithdraw.status?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Transaction ID</label>
                              <p className="text-gray-800 font-mono bg-gray-50 p-3 rounded-lg">{selectedWithdraw.transaction_id || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Account Details</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedWithdraw.account_details || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Created At</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{formatDate(selectedWithdraw.createdAt)}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Processed At</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{formatDate(selectedWithdraw.processedAt) || 'Pending'}</p>
                            </div>
                          </div>
                          {selectedWithdraw.notes && (
                            <div className="mt-6">
                              <label className="block text-sm font-semibold text-gray-600 mb-1">Admin Notes</label>
                              <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{selectedWithdraw.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-6 border-t border-gray-200">
                        <button
                          onClick={() => setSelectedWithdraw(null)}
                          className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <FaExchangeAlt className="mr-3 text-blue-500" />
                    All Transactions ({transactionHistory.length} records)
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Balance Before</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Balance After</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transactionHistory.length > 0 ? (
                        transactionHistory.map((transaction) => (
                          <tr key={transaction._id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                transaction.type === 'win' ? 'bg-green-100 text-green-800' :
                                transaction.type === 'bet' ? 'bg-red-100 text-red-800' :
                                transaction.type === 'deposit' ? 'bg-blue-100 text-blue-800' :
                                transaction.type === 'withdraw' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.type?.toUpperCase()}
                              </span>
                            </td>
                            <td className={`py-3 px-4 text-sm font-bold ${
                              transaction.type === 'win' || transaction.type === 'deposit' ? 'text-green-600' :
                              transaction.type === 'bet' || transaction.type === 'withdraw' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {formatCurrency(transaction.amount)} {user.currency}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatCurrency(transaction.balanceBefore)} {user.currency}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatCurrency(transaction.balanceAfter)} {user.currency}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {transaction.description}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(transaction.createdAt)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-gray-500">
                            No transaction history found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Balance Adjustment Modal */}
          {showBalanceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  {balanceAction === 'add' ? (
                    <><FaPlus className="mr-2 text-green-500" /> Add Balance</>
                  ) : (
                    <><FaMinus className="mr-2 text-red-500" /> Subtract Balance</>
                  )}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount ({user.currency})
                    </label>
                    <input
                      type="number"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={balanceReason}
                      onChange={(e) => setBalanceReason(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter reason for adjustment"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      Current Balance: <span className="font-bold text-gray-800">{formatCurrency(user.balance)} {user.currency}</span>
                    </p>
                    {balanceAmount && (
                      <p className="text-sm text-gray-600 mt-1">
                        New Balance: <span className="font-bold text-gray-800">
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

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowBalanceModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBalanceAdjustment}
                    disabled={processingBalance || !balanceAmount}
                    className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {processingBalance ? 'Processing...' : (balanceAction === 'add' ? 'Add Balance' : 'Subtract Balance')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Password Update Modal */}
          {showPasswordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaKey className="mr-2 text-blue-500" />
                  Update Password
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        placeholder="Enter new password"
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                        placeholder="Confirm new password"
                        minLength="6"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={processingPassword || !newPassword || !confirmPassword}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {processingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default Viewdetails;