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
  FaSpinner,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Edituserdetails = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('adminToken');

        const response = await axios.get(`${base_url}/api/admin/users/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setUser(response.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');

      const response = await axios.put(`${base_url}/api/admin/users/${id}`, user, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('User updated successfully!');
      setUser(response.data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

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

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-gray-600';
  const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';

  const CloseIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

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
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Edit User</h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                  <FaUser className="text-amber-500" /> Manage user account details and settings
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={openPasswordModal}
                  className="bg-[#1F2937] hover:bg-blue-600/20 border border-gray-700 hover:border-blue-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-blue-400"
                >
                  CHANGE PASSWORD
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - User Info & Financial Boxes */}
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
                        <div className="flex space-x-3 mt-3">
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
                        <input
                          type="text"
                          name="username"
                          value={user.username}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={user.email || ''}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Phone</label>
                        <input
                          type="text"
                          name="phone"
                          value={user.phone || ''}
                          onChange={handleInputChange}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Status</label>
                        <select
                          name="status"
                          value={user.status}
                          onChange={handleInputChange}
                          className={selectClass}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Balance Box */}
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

                    {/* Bonus Balance Box */}
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg p-5 border border-emerald-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <FaGift className="text-2xl opacity-90" />
                        <span className="text-[8px] font-black uppercase tracking-wider bg-white/20 px-2 py-1 rounded">Bonus Balance</span>
                      </div>
                      <input
                        type="number"
                        name="bonusBalance"
                        value={user.bonusBalance}
                        onChange={handleInputChange}
                        className="w-full bg-transparent border-none text-2xl font-bold text-white focus:outline-none focus:ring-0 placeholder-white/80 p-0"
                        step="0.01"
                      />
                      <p className="text-emerald-200 text-[10px] mt-1">{user.currency}</p>
                    </div>

                    {/* Referral Earnings Box */}
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
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                          <span className="text-[10px] text-gray-500">Registered:</span>
                          <span className="text-xs font-bold text-gray-400">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Settings & Preferences */}
                <div className="space-y-6">
                  {/* Account Settings */}
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
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="isEmailVerified"
                            checked={user.isEmailVerified}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                        <div>
                          <span className="text-xs font-semibold text-gray-300">Phone Verified</span>
                          <p className="text-[9px] text-gray-500">User phone verification status</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="isPhoneVerified"
                            checked={user.isPhoneVerified}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                      <div>
                        <label className={labelClass}>Currency</label>
                        <select
                          name="currency"
                          value={user.currency}
                          onChange={handleInputChange}
                          className={selectClass}
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
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notification.email"
                            checked={user.notificationPreferences?.email || false}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                        <div>
                          <span className="text-xs font-semibold text-gray-300">SMS Notifications</span>
                          <p className="text-[9px] text-gray-500">Receive updates via SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notification.sms"
                            checked={user.notificationPreferences?.sms || false}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0F111A] rounded-lg border border-gray-800">
                        <div>
                          <span className="text-xs font-semibold text-gray-300">Push Notifications</span>
                          <p className="text-[9px] text-gray-500">Receive push notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notification.push"
                            checked={user.notificationPreferences?.push || false}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Referral Information */}
                  <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                      <FaUsers className="mr-2" /> Referral Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Referral Code</label>
                        <input
                          type="text"
                          value={user.referralCode || 'N/A'}
                          readOnly
                          className="w-full bg-[#0F111A] border border-gray-700 text-gray-400 text-sm rounded-lg px-4 py-2.5 font-mono cursor-not-allowed"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Referral Count</label>
                          <input
                            type="text"
                            value={user.referralCount || 0}
                            readOnly
                            className="w-full bg-[#0F111A] border border-gray-700 text-gray-400 text-sm rounded-lg px-4 py-2.5 text-center font-bold cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Referral Earnings</label>
                          <input
                            type="text"
                            value={formatCurrency(user.referralEarnings || 0)}
                            readOnly
                            className="w-full bg-[#0F111A] border border-gray-700 text-gray-400 text-sm rounded-lg px-4 py-2.5 text-center font-bold cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
    </section>
  );
};

export default Edituserdetails;