import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaChartLine, 
  FaUsers, 
  FaWallet, 
  FaArrowUp, 
  FaArrowDown,
  FaLink,
  FaChartBar,
  FaUser,
  FaPercent,
  FaCalendarAlt,
  FaExchangeAlt,
  FaDollarSign
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaShield } from "react-icons/fa6";
import { FaBangladeshiTakaSign } from "react-icons/fa6";

const Dashboard = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
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
    cpaRate: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    referralCount: 0,
    paymentMethod: 'bkash',
    formattedPaymentDetails: {},
    isVerified: false,
    lastLogin: '',
    minimumPayout: 0,
    status: 'active',
    totalPayout: 0,
    pendingPayout: 0
  });

  // Dashboard stats - initialize with zeros
  const [dashboardStats, setDashboardStats] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    referralCount: 0,
    commissionRate: 0,
    cpaRate: 0,
    minimumPayout: 0,
    availableForPayout: 0,
    daysUntilPayout: 0,
    activeReferrals: 0,
    conversionRate: 0,
    clickCount: 0,
    earningsThisMonth: 0,
    totalBalance: 0,
    totalPeriodChange: 0,
    totalPeriodExpenses: 0,
    totalPeriodIncome: 0,
    balanceChange: 0,
    periodChange: 0,
    expensesChange: 0,
    incomeChange: 0,
    lastMonthBalance: 0,
    lastMonthPeriodChange: 0,
    lastMonthExpenses: 0,
    lastMonthIncome: 0,
    totalPayout: 0,
    pendingPayout: 0,
    clicks: 0,
    registrations: 0,
    depositCount: 0,
    totalDeposits: 0
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load affiliate data from localStorage and dashboard stats
  useEffect(() => {
    const affiliateData = localStorage.getItem('affiliate');
    if (affiliateData) {
      try {
        const parsedData = JSON.parse(affiliateData);
        setProfile({
          ...parsedData,
          cpaRate: parsedData.cpaRate,
          totalPayout: parsedData.totalPayout || 0,
          pendingPayout: parsedData.pendingPayout || 0
        });
      } catch (error) {
        console.error('Error parsing affiliate data:', error);
      }
    }
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('affiliatetoken');
      if (!token) {
        console.warn('No affiliate token found');
        return;
      }

      const response = await axios.get(`${base_url}/api/affiliate/dashboard`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (response.data.success) {
        const stats = response.data.stats;
        setDashboardStats(prevStats => ({
          ...prevStats,
          ...stats,
          totalBalance: stats.totalEarnings || 0,
          totalPeriodChange: stats.pendingEarnings || 0,
          totalPeriodExpenses: stats.paidEarnings || 0,
          totalPeriodIncome: stats.earningsThisMonth || 0,
          balanceChange: stats.balanceChange || 0,
          periodChange: stats.periodChange || 0,
          expensesChange: stats.expensesChange || 0,
          incomeChange: stats.incomeChange || 0,
          lastMonthBalance: stats.lastMonthBalance || 0,
          lastMonthPeriodChange: stats.lastMonthPeriodChange || 0,
          lastMonthExpenses: stats.lastMonthExpenses || 0,
          lastMonthIncome: stats.lastMonthIncome || 0,
          cpaRate: stats.cpaRate,
          totalPayout: stats.totalPayout || 0,
          pendingPayout: stats.pendingPayout || 0,
          clicks: stats.clicks || 0,
          registrations: stats.registrations || 0,
          depositCount: stats.depositCount || 0,
          totalDeposits: stats.totalDeposits || 0
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load dashboard statistics');
      }
    }
  };

  const handlePayoutRequest = async () => {
    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.post(`${base_url}/api/affiliate/payout/request`, 
        { amount: dashboardStats.pendingEarnings },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Payout request submitted successfully!');
        loadDashboardStats();
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error(error.response?.data?.message || 'Failed to request payout');
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const isEligibleForPayout = dashboardStats.pendingEarnings >= dashboardStats.minimumPayout;

  // Get user's first name for welcome message
  const getUserFirstName = () => {
    if (profile.firstName) return profile.firstName;
    const affiliateData = localStorage.getItem('affiliate');
    if (affiliateData) {
      try {
        const parsedData = JSON.parse(affiliateData);
        return parsedData.firstName || 'Affiliate';
      } catch (error) {
        return 'Affiliate';
      }
    }
    return 'Affiliate';
  };

  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-[#000514] text-white font-sans selection:bg-cyan-500 selection:text-black">
      <Header toggleSidebar={toggleSidebar} />

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

      <div className="flex pt-[10vh] relative z-10">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-500 flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          {/* Welcome Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight mb-2">
                  <span className="text-gray-400">{getCurrentTimeGreeting()},</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    {getUserFirstName()}
                  </span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                  Monitor your affiliate performance and earnings in real-time
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-tl-md rounded-br-md text-xs md:text-sm font-bold uppercase tracking-widest ${
                  profile.status === 'active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {profile.status}
                </span>
              </div>
            </div>
            <div className="h-1.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 mt-4 rounded-full"></div>
          </div>

          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Total Balance Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all group backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform">
                  <FaWallet className="text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold flex items-center justify-end ${dashboardStats.balanceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardStats.balanceChange >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {Math.abs(dashboardStats.balanceChange)}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">vs last month</p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Balance</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(dashboardStats.totalBalance)}</p>
              <p className="text-xs text-gray-500">Last month: {formatCurrency(dashboardStats.lastMonthBalance)}</p>
            </div>

            {/* Pending Earnings Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all group backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform">
                  <FaMoneyBillWave className="text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-400">Min: {formatCurrency(dashboardStats.minimumPayout)}</span>
                  <p className={`text-xs mt-1 ${isEligibleForPayout ? 'text-green-400' : 'text-amber-400'}`}>
                    {isEligibleForPayout ? 'Eligible' : 'Not eligible'}
                  </p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Pending Earnings</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(dashboardStats.pendingEarnings)}</p>
              <p className="text-xs text-gray-500">Available for withdrawal</p>
            </div>

            {/* Total Earnings Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all group backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform">
                  <FaChartLine className="text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold flex items-center justify-end ${dashboardStats.incomeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardStats.incomeChange >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {Math.abs(dashboardStats.incomeChange)}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">this month</p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Earnings</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(dashboardStats.totalEarnings)}</p>
              <p className="text-xs text-gray-500">Lifetime earnings</p>
            </div>

            {/* Active Referrals Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all group backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform">
                  <FaUsers className="text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold flex items-center justify-end ${dashboardStats.periodChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dashboardStats.periodChange >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {Math.abs(dashboardStats.periodChange)}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">growth</p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Active Referrals</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatNumber(dashboardStats.activeReferrals)}</p>
              <p className="text-xs text-gray-500">Total: {formatNumber(dashboardStats.referralCount)} referrals</p>
            </div>
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Commission Rate Card */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <FaPercent className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Commission Rate</h3>
                  <p className="text-2xl font-bold">{dashboardStats.commissionRate}%</p>
                  <p className="text-xs text-gray-500">Revenue share</p>
                </div>
              </div>
            </div>

            {/* CPA Rate Card */}
            <div className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 border border-blue-500/20 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <FaBangladeshiTakaSign className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">CPA Rate</h3>
                  <p className="text-2xl font-bold">{dashboardStats.cpaRate}</p>
                  <p className="text-xs text-gray-500">Per registration</p>
                </div>
              </div>
            </div>
            {/* Monthly Earnings Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <FaCalendarAlt className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">This Month</h3>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardStats.earningsThisMonth)}</p>
                  <p className="text-xs text-gray-500">Current month earnings</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics & Payout Section */}
          <div className="grid grid-cols-1  gap-6 md:gap-8 mb-6 md:mb-8">
            {/* Performance Metrics */}
            {/* <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-widest">Performance Metrics</h2>
                <FaChartBar className="text-cyan-400 text-xl" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border border-white/10 rounded-lg hover:border-cyan-500/30 transition-colors">
                  <div className="text-2xl md:text-3xl font-bold text-cyan-400 mb-2">{formatNumber(dashboardStats.clicks)}</div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Total Clicks</p>
                </div>
                
                <div className="text-center p-4 border border-white/10 rounded-lg hover:border-cyan-500/30 transition-colors">
                  <div className="text-2xl md:text-3xl font-bold text-cyan-400 mb-2">{formatNumber(dashboardStats.registrations)}</div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Registrations</p>
                </div>
                
                <div className="text-center p-4 border border-white/10 rounded-lg hover:border-cyan-500/30 transition-colors">
                  <div className="text-2xl md:text-3xl font-bold text-cyan-400 mb-2">{formatNumber(dashboardStats.depositCount)}</div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Deposits</p>
                </div>
                
                <div className="text-center p-4 border border-white/10 rounded-lg hover:border-cyan-500/30 transition-colors">
                  <div className="text-2xl md:text-3xl font-bold text-cyan-400 mb-2">{formatCurrency(dashboardStats.totalDeposits)}</div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Deposit Value</p>
                </div>
              </div>
            </div> */}

            {/* Payout Section */}
            {/* <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-widest">Payout</h2>
                <FaShield className="text-cyan-400 text-xl" />
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-gray-400">Total Payout:</span>
                  <span className="font-bold">{formatCurrency(dashboardStats.totalPayout)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-gray-400">Pending Payout:</span>
                  <span className="font-bold text-amber-400">{formatCurrency(dashboardStats.pendingPayout)}</span>
                </div>
                
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <span className="text-gray-400">Paid Earnings:</span>
                  <span className="font-bold text-green-400">{formatCurrency(dashboardStats.paidEarnings)}</span>
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={handlePayoutRequest}
                    disabled={!isEligibleForPayout}
                    className={`w-full py-3 px-4 rounded-tl-md rounded-br-md font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                      isEligibleForPayout 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:brightness-110 hover:scale-[1.02] cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isEligibleForPayout ? 'Request Payout Now' : 'Minimum Not Reached'}
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-3">
                    Minimum payout: {formatCurrency(dashboardStats.minimumPayout)}
                  </p>
                </div>
              </div>
            </div> */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;