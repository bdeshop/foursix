import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { 
  FaUsers, 
  FaMoneyCheckAlt, 
  FaClock, 
  FaChartLine,
  FaHourglassHalf,
  FaUserTie,
  FaCalendarAlt
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { FiRefreshCw, FiTrendingUp, FiTrendingDown, FiChevronDown } from "react-icons/fi";
import { MdAccountBalanceWallet, MdTrendingUp } from "react-icons/md";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(), // Today by default
    endDate: new Date()    // Today by default
  });
  const [filterType, setFilterType] = useState('today'); // Changed to 'today' as default
  const [showFilters, setShowFilters] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Get Bangladesh time
  const getBangladeshTime = () => {
    const now = new Date();
    // Bangladesh is UTC+6
    const bangladeshTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
    return bangladeshTime;
  };

  // Format date to Bangladesh time string
  const formatBangladeshDate = (date) => {
    return date.toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  // Format date for API (YYYY-MM-DD) in Bangladesh time
  const formatDateForAPI = (date) => {
    const bangladeshDate = new Date(date.getTime() + (6 * 60 * 60 * 1000));
    return bangladeshDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: formatDateForAPI(dateRange.startDate),
        endDate: formatDateForAPI(dateRange.endDate)
      };
      
      console.log('Fetching data with params:', params); // Debug log
      
      const response = await axios.get(`${base_url}/api/admin/dashboard`, { params });
      console.log('Dashboard API Response:', response.data);
      setDashboardData(response.data || {});
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashboardData({});
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    const today = new Date();
    let startDate = new Date(today);
    
    switch(type) {
      case 'today':
        // Set both start and end date to today
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case '30days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case '90days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
      case 'custom':
        setShowFilters(true);
        return;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
    }
    
    console.log('Setting date range:', { startDate, endDate: today }); // Debug log
    
    setDateRange({
      startDate,
      endDate: new Date()
    });
    setShowFilters(false);
  };

  const handleCustomDateApply = () => {
    setFilterType('custom');
    fetchDashboardData();
  };

  // Helper function to safely extract data with defaults
  const getData = (path, defaultValue = 0) => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return defaultValue;
    
    const paths = path.split('.');
    let value = dashboardData;
    
    for (const p of paths) {
      if (value && typeof value === 'object' && p in value) {
        value = value[p];
      } else {
        return defaultValue;
      }
    }
    
    return value !== null && value !== undefined ? value : defaultValue;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Prepare dashboard statistics
  const stats = {
    // User Statistics
    totalUsers: getData('data.users.totalUsers', 0),
    activeUsers: getData('data.users.activeUsers', 0),
    totalUserBalance: getData('data.users.totalBalance', 0),
    totalBonusBalance: getData('data.users.totalBonusBalance', 0),
    
    // Financial Statistics
    totalDeposits: getData('data.financial.totalDeposits', 0),
    totalWithdrawals: getData('data.financial.totalWithdrawals', 0),
    userTotalDeposit: getData('data.financial.userTotalDeposit', 0),
    userTotalWithdraw: getData('data.financial.userTotalWithdraw', 0),
    userTotalBet: getData('data.financial.userTotalBet', 0), // Fixed: Added total bet
    userTotalWins: getData('data.financial.userTotalWins', 0),
    userTotalLoss: getData('data.financial.userTotalLoss', 0),
    userNetProfit: getData('data.financial.userNetProfit', 0),
    lifetimeDeposit: getData('data.financial.lifetimeDeposit', 0),
    lifetimeWithdraw: getData('data.financial.lifetimeWithdraw', 0),
    lifetimeBet: getData('data.financial.lifetimeBet', 0),
    
    // Pending Approvals
    pendingDeposits: getData('data.pendingApprovals.deposits', 0),
    pendingWithdrawals: getData('data.pendingApprovals.withdrawals', 0),
    
    // Gaming Statistics
    totalBetAmount: getData('data.gaming.totalBetAmount', 0),
    totalWinAmount: getData('data.gaming.totalWinAmount', 0),
    totalNetProfit: getData('data.gaming.totalNetProfit', 0),
    bettingTotalBetAmount: getData('data.gaming.bettingTotalBetAmount', 0),
    bettingTotalWinAmount: getData('data.gaming.bettingTotalWinAmount', 0),
    bettingTotalProfitLoss: getData('data.gaming.bettingTotalProfitLoss', 0),
    
    // Affiliate Statistics
    affiliatePendingEarnings: getData('data.affiliate.totalPendingEarnings', 0),
    affiliatePaidEarnings: getData('data.affiliate.totalPaidEarnings', 0),
    affiliateTotalEarnings: getData('data.affiliate.totalEarnings', 0),
    
    // Bonus Statistics
    totalBonusGiven: getData('data.bonus.totalBonusGiven', 0),
    totalBonusWagered: getData('data.bonus.totalBonusWagered', 0),
    
    // Today's Statistics
    todayDeposits: getData('data.today.deposits', 0),
    todayWithdrawals: getData('data.today.withdrawals', 0),
    todayTotalBet: getData('data.today.betting.totalBet', 0), // Fixed: Added today's total bet
    todayTotalWin: getData('data.today.betting.totalWin', 0),
    
    // Monthly Statistics
    monthlyDeposits: getData('data.monthly.deposits', 0),
    monthlyWithdrawals: getData('data.monthly.withdrawals', 0),
    
    // Recent Activities
    recentUsers: getData('recentActivities.users', []),
    recentDeposits: getData('recentActivities.deposits', [])
  };

  // Professional color palette
  const gradientColors = [
    'from-blue-600 to-blue-800',
    'from-green-600 to-green-800',
    'from-orange-600 to-orange-800',
    'from-purple-600 to-purple-800',
    'from-teal-600 to-teal-800',
    'from-red-600 to-red-800',
    'from-indigo-600 to-indigo-800',
    'from-cyan-600 to-cyan-800',
    'from-rose-600 to-rose-800',
    'from-amber-600 to-amber-800'
  ];

  // Status cards data
  const statusCards = [
    {
      title: 'Total Users',
      value: formatCurrency(stats.totalUsers),
      icon: <FaUsers className="text-3xl text-white" />,
      description: `${stats.activeUsers} active users`,
      gradient: gradientColors[0],
      prefix: ''
    },
    {
      title: 'Platform Balance',
      value: `৳${formatCurrency(stats.totalUserBalance)}`,
      icon: <MdAccountBalanceWallet className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.totalBonusBalance)} bonus balance`,
      gradient: gradientColors[1],
      prefix: '৳'
    },
    {
      title: 'Total Deposits',
      value: `৳${formatCurrency(stats.totalDeposits)}`,
      icon: <FaMoneyCheckAlt className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.todayDeposits)} today`,
      gradient: gradientColors[2],
      prefix: '৳'
    },
    {
      title: 'Total Withdrawals',
      value: `৳${formatCurrency(stats.totalWithdrawals)}`,
      icon: <FaBangladeshiTakaSign className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.todayWithdrawals)} today`,
      gradient: gradientColors[3],
      prefix: '৳'
    },
    {
      title: 'Total Bets',
      value: `৳${formatCurrency(stats.totalBetAmount)}`,
      icon: <FaChartLine className="text-3xl text-white" />,
      description: `Net: ৳${formatCurrency(stats.totalNetProfit)}`,
      gradient: gradientColors[4],
      prefix: '৳'
    },
    {
      title: 'Pending Deposits',
      value: `৳${formatCurrency(stats.pendingDeposits)}`,
      icon: <FaHourglassHalf className="text-3xl text-white" />,
      description: 'Requires approval',
      gradient: gradientColors[5],
      prefix: '৳'
    },
    {
      title: 'Pending Withdrawals',
      value: `৳${formatCurrency(stats.pendingWithdrawals)}`,
      icon: <FaClock className="text-3xl text-white" />,
      description: 'Awaiting processing',
      gradient: gradientColors[6],
      prefix: '৳'
    },
    {
      title: 'Affiliate Earnings',
      value: `৳${formatCurrency(stats.affiliateTotalEarnings)}`,
      icon: <FaUserTie className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.affiliatePendingEarnings)} pending`,
      gradient: gradientColors[7],
      prefix: '৳'
    },
    {
      title: 'Total Bonus Given',
      value: `৳${formatCurrency(stats.totalBonusGiven)}`,
      icon: <MdTrendingUp className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.totalBonusWagered)} wagered`,
      gradient: gradientColors[8],
      prefix: '৳'
    },
    {
      title: 'Monthly Deposits',
      value: `৳${formatCurrency(stats.monthlyDeposits)}`,
      icon: <MdTrendingUp className="text-3xl text-white" />,
      description: `৳${formatCurrency(stats.monthlyWithdrawals)} withdrawals`,
      gradient: gradientColors[9],
      prefix: '৳'
    }
  ];

  // Financial overview data for chart
  const financialChartData = [
    { name: 'Deposits', amount: stats.totalDeposits, color: '#3B82F6' },
    { name: 'Withdrawals', amount: stats.totalWithdrawals, color: '#10B981' },
    { name: 'Bets', amount: stats.totalBetAmount, color: '#F59E0B' },
    { name: 'Wins', amount: stats.totalWinAmount, color: '#8B5CF6' },
    { name: 'User Balance', amount: stats.totalUserBalance, color: '#EF4444' },
    { name: 'Bonus Balance', amount: stats.totalBonusBalance, color: '#6EE7B7' }
  ];

  // Daily performance data (Bangladesh time)
  const generateDailyPerformanceData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = getBangladeshTime();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Generate data for last 7 days
    return days.map((day, index) => {
      const dayIndex = (currentDay + 6 - index) % 7; // Get days in reverse order
      return {
        day: days[dayIndex],
        deposits: Math.floor(Math.random() * 50000) + 20000,
        withdrawals: Math.floor(Math.random() * 30000) + 10000,
        bets: Math.floor(Math.random() * 70000) + 30000
      };
    }).reverse(); // Reverse to show chronological order
  };

  const dailyPerformanceData = generateDailyPerformanceData();

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-100">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ৳{formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Financial summary items - INCLUDING TOTAL BET NOW
  const financialSummaryItems = [
    { label: 'Total User Deposits', value: stats.userTotalDeposit },
    { label: 'Total User Withdrawals', value: stats.userTotalWithdraw },
    { label: 'Total User Bets', value: stats.userTotalBet }, // Added: Total bets
  ];

  return (
    <section className="font-nunito min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-2">
                  Bangladesh Time: {formatBangladeshDate(getBangladeshTime())}
                </p>
                <p className="text-gray-600">
                  Data from {dateRange.startDate.toLocaleDateString()} to {dateRange.endDate.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Date Filters - Today is selected by default */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['today', '7days', '30days', '90days', 'custom'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange(type)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    filterType === type
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {type === 'today' && 'Today'}
                  {type === '7days' && 'Last 7 Days'}
                  {type === '30days' && 'Last 30 Days'}
                  {type === '90days' && 'Last 90 Days'}
                  {type === 'custom' && 'Custom Range'}
                </button>
              ))}
            </div>

            {showFilters && (
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <DatePicker
                      selected={dateRange.startDate}
                      onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dateFormat="yyyy-MM-dd"
                      maxDate={dateRange.endDate}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <DatePicker
                      selected={dateRange.endDate}
                      onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dateFormat="yyyy-MM-dd"
                      minDate={dateRange.startDate}
                      maxDate={new Date()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCustomDateApply}
                      disabled={loading}
                      className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all border border-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  Selected range: {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                {/* 3-part circular loader */}
                <div className="relative w-16 h-16 mx-auto">
                  {/* Part 1 */}
                  <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                  
                  {/* Part 2 - Top-right segment */}
                  <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-500 animate-spin"></div>
                  
                  {/* Part 3 - Bottom-left segment */}
                  <div className="absolute inset-0 border-4 border-transparent rounded-full border-b-blue-500 animate-pulse"></div>
                  
                  {/* Part 4 - Right segment (optional 3rd part) */}
                  <div className="absolute inset-0 border-4 border-transparent rounded-full border-r-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                </div>
                <p className="mt-4 text-gray-600">Loading data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-10">
                {statusCards.map((card, index) => (
                  <div
                    key={index}
                    className={`relative bg-gradient-to-r ${card.gradient} rounded-lg p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 min-h-[140px] flex flex-col`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold uppercase tracking-wide opacity-90">{card.title}</p>
                        <h2 className="text-2xl font-bold mt-1 truncate">{card.value}</h2>
                      </div>
                      <div className="p-3 border-[1px] border-gray-200 text-gray-700 bg-opacity-20 rounded-full flex-shrink-0">
                        {card.icon}
                      </div>
                    </div>
                    <div className="flex items-center mt-auto text-sm opacity-90">
                      {card.trend === 'up' ? (
                        <FiTrendingUp className="mr-1 text-green-300" />
                      ) : card.trend === 'down' ? (
                        <FiTrendingDown className="mr-1 text-red-300" />
                      ) : null}
                      <span className="truncate">{card.description}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Overview Chart */}
              <div className="bg-white rounded-xl p-8 border-[1px] border-gray-200 mb-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Financial Overview</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">Period:</span>
                    <span className="text-sm font-medium text-gray-800">
                      {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart 
                        data={financialChartData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <XAxis 
                          dataKey="name" 
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          fontSize={12}
                          tickFormatter={(value) => `৳${formatCurrency(value)}`}
                        />
                        <Tooltip 
                          content={<CustomTooltip />}
                        />
                        <Legend />
                        <Bar 
                          dataKey="amount" 
                          name="Amount (৳)" 
                          radius={[6, 6, 0, 0]}
                        >
                          {financialChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6 border-[1px] border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h4>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {financialSummaryItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600 truncate">{item.label}</span>
                          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap ml-2">
                            ৳{formatCurrency(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Performance & Gaming Stats */}
              <div className="grid grid-cols-1 gap-8 mb-10">
                {/* Daily Performance */}
                <div className="bg-white rounded-xl p-8 border-[1px] border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Daily Performance (Last 7 Days - BD Time)</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart 
                      data={dailyPerformanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
                      <YAxis 
                        stroke="#6B7280"
                        fontSize={12}
                        tickFormatter={(value) => `৳${formatCurrency(value)}`}
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                      />
                      <Legend />
                      <Bar 
                        dataKey="deposits" 
                        name="Deposits" 
                        fill="#3B82F6" 
                        radius={[6, 6, 0, 0]} 
                      />
                      <Bar 
                        dataKey="withdrawals" 
                        name="Withdrawals" 
                        fill="#10B981" 
                        radius={[6, 6, 0, 0]} 
                      />
                      <Bar 
                        dataKey="bets" 
                        name="Bets" 
                        fill="#F59E0B" 
                        radius={[6, 6, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>

              {/* Recent Activities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Recent Users */}
                <div className="bg-white rounded-xl p-8 border-[1px] border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Users</h3>
                  <div className="space-y-4">
                    {stats.recentUsers.length > 0 ? (
                      stats.recentUsers.slice(0, 5).map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <FaUsers className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.username || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{user.player_id || 'N/A'}</p>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {user.createdAt ? formatBangladeshDate(new Date(user.createdAt)) : 'N/A'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No recent user data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Deposits */}
                <div className="bg-white rounded-xl p-8 border-[1px] border-gray-200">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Deposits</h3>
                  <div className="space-y-4">
                    {stats.recentDeposits.length > 0 ? (
                      stats.recentDeposits.slice(0, 5).map((deposit, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div>
                            <p className="font-medium text-gray-900">
                              {deposit.userId?.username || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {deposit.method || 'N/A'} • {deposit.status || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">৳{formatCurrency(deposit.amount || 0)}</p>
                            <p className="text-sm text-gray-500">
                              {deposit.createdAt ? formatBangladeshDate(new Date(deposit.createdAt)) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No recent deposit data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </section>
  );
};

export default Dashboard;