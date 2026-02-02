import React, { useState, useEffect } from 'react';
import { 
  FaEdit, 
  FaSave, 
  FaLock, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaUser, 
  FaEye, 
  FaEyeSlash, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaCopy,
  FaCreditCard,
  FaShieldAlt,
  FaArrowUp,
  FaArrowDown,
  FaPercent,
  FaCalendarAlt
} from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile states
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    affiliateCode: '',
    commissionRate: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    referralCount: 0,
    paymentMethod: 'bkash',
    formattedPaymentDetails: {},
    isVerified: false,
    lastLogin: '',
    minimumPayout: 1000,
    joinDate: '',
    status: 'active'
  });

  // Payment details state
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: 'bkash',
    bkash: { phoneNumber: '', accountType: 'personal' },
    nagad: { phoneNumber: '', accountType: 'personal' },
    rocket: { phoneNumber: '', accountType: 'personal' },
    binance: { email: '', walletAddress: '', binanceId: '' }
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    referralCount: 0,
    commissionRate: 0,
    minimumPayout: 1000,
    availableForPayout: 0,
    daysUntilPayout: 0,
    conversionRate: 0,
    monthlyEarnings: 0,
    totalBalance: 0,
    balanceChange: 0,
    periodChange: 0,
    expensesChange: 0,
    incomeChange: 0,
    lastMonthBalance: 0,
    lastMonthPeriodChange: 0,
    lastMonthExpenses: 0,
    lastMonthIncome: 0
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load affiliate data from localStorage
  useEffect(() => {
    const affiliateData = localStorage.getItem('affiliate');
    if (affiliateData) {
      const parsedData = JSON.parse(affiliateData);
      setProfile({ ...parsedData, minimumPayout: 1000 });
      
      if (parsedData.formattedPaymentDetails) {
        setPaymentDetails(prev => ({
          ...prev,
          paymentMethod: parsedData.paymentMethod,
          [parsedData.paymentMethod]: {
            ...prev[parsedData.paymentMethod],
            ...parsedData.formattedPaymentDetails
          }
        }));
      }
    }
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.get(`${base_url}/api/affiliate/dashboard`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (response.data.success) {
        setDashboardStats({ 
          ...dashboardStats,
          ...response.data.stats, 
          minimumPayout: 1000 
        });
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.put(`${base_url}/api/affiliate/profile`, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        company: profile.company,
        website: profile.website
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedAffiliate = { ...profile, ...response.data.affiliate, minimumPayout: 1000 };
        localStorage.setItem('affiliate', JSON.stringify(updatedAffiliate));
        setProfile(updatedAffiliate);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePaymentUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('affiliatetoken');
      const currentMethod = paymentDetails.paymentMethod;
      
      const response = await axios.put(`${base_url}/api/affiliate/profile/payment`, {
        paymentMethod: currentMethod,
        paymentDetails: paymentDetails[currentMethod]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const updatedProfile = {
          ...profile,
          paymentMethod: response.data.paymentMethod,
          formattedPaymentDetails: response.data.formattedPaymentDetails,
          minimumPayout: 1000
        };
        localStorage.setItem('affiliate', JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
        toast.success('Payment details updated successfully!');
      }
    } catch (error) {
      console.error('Error updating payment details:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment details');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.put(`${base_url}/api/affiliate/profile/change-password`, 
        passwordData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password changed successfully!');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const isEligibleForPayout = dashboardStats.pendingEarnings >= dashboardStats.minimumPayout;

  return (
    <div className="min-h-screen bg-[#000514] text-white font-sans selection:bg-cyan-500 selection:text-black">
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000514; }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #22d3ee 0%, #2563eb 100%);
          border-radius: 20px;
        }
        ::-webkit-scrollbar-thumb:hover { background: #22d3ee; }
      `}</style>

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex pt-[10vh] relative z-10">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'} p-4 md:p-6 lg:p-8 overflow-y-auto h-[90vh]`}>
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
                  <span className="text-gray-400">Affiliate</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Profile</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base mt-2">
                  Manage your account and track your earnings
                </p>
              </div>
              <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Status</p>
                      <p className={`font-bold uppercase text-sm ${profile.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                        {profile.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="h-1.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 mt-4 rounded-full"></div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Pending Earnings Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaMoneyBillWave className="text-xl md:text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-cyan-400">Min: {formatCurrency(dashboardStats.minimumPayout)}</span>
                  <p className={`text-xs mt-1 ${isEligibleForPayout ? 'text-green-400' : 'text-amber-400'}`}>
                    {isEligibleForPayout ? 'Eligible' : 'Not eligible'}
                  </p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Pending Earnings</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(dashboardStats.pendingEarnings)}</p>
              <p className="text-xs text-gray-500">Available for withdrawal</p>
            </div>

            {/* Total Earnings Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaChartLine className="text-xl md:text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold flex items-center justify-end ${dashboardStats.balanceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardStats.balanceChange >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {Math.abs(dashboardStats.balanceChange)}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">vs last month</p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Earnings</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(dashboardStats.totalEarnings)}</p>
              <p className="text-xs text-gray-500">Lifetime earnings</p>
            </div>

            {/* Referrals Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaUser className="text-xl md:text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold flex items-center justify-end ${dashboardStats.periodChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardStats.periodChange >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {Math.abs(dashboardStats.periodChange)}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">growth</p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Referrals</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{dashboardStats.referralCount}</p>
              <p className="text-xs text-gray-500">Active referrals</p>
            </div>

            {/* Commission Rate Card */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <FaPercent className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Commission Rate</h3>
                  <p className="text-2xl font-bold">{(dashboardStats.commissionRate).toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Revenue share</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Status */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-5 md:p-6 mb-8 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  {isEligibleForPayout ? <FaCheckCircle className="text-2xl text-green-400" /> : <FaExclamationTriangle className="text-2xl text-amber-400" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-widest">Payout Status</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {isEligibleForPayout 
                      ? `You're eligible to request a payout of ${formatCurrency(dashboardStats.pendingEarnings)}`
                      : `You need ${formatCurrency(dashboardStats.minimumPayout - dashboardStats.pendingEarnings)} more to be eligible for payout`
                    }
                  </p>
                </div>
              </div>
              {isEligibleForPayout && (
                <button className="mt-4 lg:mt-0 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                  Request Payout
                </button>
              )}
            </div>
          </div>

          {/* Main Content Tabs */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
            {/* Tab Headers */}
            <div className="border-b border-white/10">
              <nav className="flex overflow-x-auto">
                {[
                  { id: 'profile', label: 'Profile Information', icon: FaUser },
                  { id: 'payment', label: 'Payment Details', icon: FaCreditCard },
                  { id: 'security', label: 'Security', icon: FaShieldAlt }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center cursor-pointer space-x-2 px-6 py-4 border-b-4 transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-cyan-500 text-cyan-400 font-bold'
                        : 'border-transparent text-gray-400 hover:text-cyan-300 hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className={`text-lg ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-500'}`} />
                    <span className="font-bold uppercase tracking-widest text-sm">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4 md:p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6 md:space-y-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest">Personal Information</h2>
                      <p className="text-gray-400 text-xs md:text-sm mt-1">Manage your personal and business details</p>
                    </div>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className={`mt-4 lg:mt-0 px-4 md:px-6 py-3 rounded-tl-md rounded-br-md font-bold uppercase tracking-widest text-sm transition-all duration-300 flex items-center space-x-2 ${
                        isEditing
                          ? 'bg-gray-600 text-white hover:bg-gray-700'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:brightness-110'
                      }`}
                    >
                      <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                      {/* Personal Information */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400 border-b border-white/10 pb-2">Personal Details</h3>
                        
                        <div>
                          <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profile.firstName}
                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:bg-white/10 disabled:text-gray-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profile.lastName}
                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:bg-white/10 disabled:text-gray-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                          <input
                            type="email"
                            value={profile.email}
                            disabled
                            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-md text-gray-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:bg-white/10 disabled:text-gray-500"
                          />
                        </div>
                      </div>

                      {/* Business Information */}
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400 border-b border-white/10 pb-2">Business Information</h3>
                        
                        <div>
                          <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Company</label>
                          <input
                            type="text"
                            value={profile.company || ''}
                            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:bg-white/10 disabled:text-gray-500"
                            placeholder="Your company name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Website</label>
                          <input
                            type="url"
                            value={profile.website || ''}
                            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 disabled:bg-white/10 disabled:text-gray-500"
                            placeholder="https://example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Affiliate Code</label>
                          <div className="flex space-x-3">
                            <input
                              type="text"
                              value={profile.affiliateCode}
                              disabled
                              className="flex-1 px-4 py-3 bg-white/10 border border-white/10 rounded-md text-gray-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(profile.affiliateCode)}
                              className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300 flex items-center space-x-2"
                            >
                              <FaCopy />
                              <span className="uppercase tracking-widest text-xs">Copy</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Last Login</label>
                          <input
                            type="text"
                            value={formatDate(profile.lastLogin)}
                            disabled
                            className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-md text-gray-500"
                          />
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end pt-6 border-t border-white/10">
                        <button
                          type="submit"
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300 flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                        >
                          <span className="uppercase tracking-widest text-sm">Save Changes</span>
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Payment Tab */}
              {activeTab === 'payment' && (
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest">Payment Settings</h2>
                    <p className="text-gray-400 text-xs md:text-sm mt-1">Configure how you receive your affiliate earnings</p>
                  </div>

                  <form onSubmit={handlePaymentUpdate} className="space-y-6 md:space-y-8">
                    <div className="grid grid-cols-1 gap-6 md:gap-8">
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Payment Method</label>
                        <select
                          value={paymentDetails.paymentMethod}
                          onChange={(e) => setPaymentDetails({
                            ...paymentDetails,
                            paymentMethod: e.target.value
                          })}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                        >
                          <option value="bkash">bKash</option>
                          <option value="nagad">Nagad</option>
                          <option value="rocket">Rocket</option>
                          <option value="binance">Binance</option>
                        </select>
                      </div>

                      {(paymentDetails.paymentMethod === 'bkash' || 
                        paymentDetails.paymentMethod === 'nagad' || 
                        paymentDetails.paymentMethod === 'rocket') && (
                        <>
                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                              {paymentDetails.paymentMethod.charAt(0).toUpperCase() + paymentDetails.paymentMethod.slice(1)} Phone Number
                            </label>
                            <input
                              type="tel"
                              value={paymentDetails[paymentDetails.paymentMethod]?.phoneNumber || ''}
                              onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                [paymentDetails.paymentMethod]: {
                                  ...paymentDetails[paymentDetails.paymentMethod],
                                  phoneNumber: e.target.value
                                }
                              })}
                              placeholder="--- --- ---"
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Account Type</label>
                            <select
                              value={paymentDetails[paymentDetails.paymentMethod]?.accountType || 'personal'}
                              onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                [paymentDetails.paymentMethod]: {
                                  ...paymentDetails[paymentDetails.paymentMethod],
                                  accountType: e.target.value
                                }
                              })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                            >
                              <option value="personal">Personal</option>
                              <option value="merchant">Merchant</option>
                            </select>
                          </div>
                        </>
                      )}

                      {paymentDetails.paymentMethod === 'binance' && (
                        <>
                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Binance Email</label>
                            <input
                              type="email"
                              value={paymentDetails.binance?.email || ''}
                              onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                binance: {
                                  ...paymentDetails.binance,
                                  email: e.target.value
                                }
                              })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Wallet Address</label>
                            <input
                              type="text"
                              value={paymentDetails.binance?.walletAddress || ''}
                              onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                binance: {
                                  ...paymentDetails.binance,
                                  walletAddress: e.target.value
                                }
                              })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Binance ID (Optional)</label>
                            <input
                              type="text"
                              value={paymentDetails.binance?.binanceId || ''}
                              onChange={(e) => setPaymentDetails({
                                ...paymentDetails,
                                binance: {
                                  ...paymentDetails.binance,
                                  binanceId: e.target.value
                                }
                              })}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-white/10">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300 flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                      >
                        <span className="uppercase tracking-widest text-sm">Update Payment Details</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6 md:space-y-8">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest">Security Settings</h2>
                    <p className="text-gray-400 text-xs md:text-sm mt-1">Manage your account security and password</p>
                  </div>

                  <form onSubmit={handlePasswordChange} className="w-full space-y-6">
                    <h3 className="text-lg font-bold uppercase tracking-widest text-gray-400">Change Password</h3>
                    
                    <div className="grid grid-cols-1 gap-6 w-full">
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value
                            })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors p-2"
                          >
                            {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value
                            })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors p-2"
                          >
                            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value
                            })}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors p-2"
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300 flex items-center space-x-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                      >
                        <span className="uppercase tracking-widest text-sm">Update Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        className="px-6 py-3 bg-gray-600 text-white font-bold rounded-tl-md rounded-br-md hover:bg-gray-700 transition-all duration-300"
                      >
                        <span className="uppercase tracking-widest text-sm">Clear</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;