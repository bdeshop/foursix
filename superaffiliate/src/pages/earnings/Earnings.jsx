import React, { useState, useEffect } from 'react';
import {
  FaFilter,
  FaDownload,
  FaSearch,
  FaMoneyBillWave,
  FaChartLine,
  FaCalendarAlt,
  FaEye,
  FaRegClock,
  FaCheckCircle,
  FaTimesCircle,
  FaFileExport,
  FaSync,
  FaUserPlus,
  FaUsers,
  FaMousePointer,
  FaArrowUp,
  FaArrowDown,
  FaPercent,
  FaChevronLeft,
  FaChevronRight,
  FaStepBackward,
  FaStepForward,
} from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

const Earnings = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(10); // Number of transactions per page
  const [payoutHistory, setPayoutHistory] = useState({
    total: 0,
    page: 1,
    limit: 10,
    payouts: []
  });

  // Earnings data state
  const [earningsData, setEarningsData] = useState({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    availableForPayout: 0,
    commissionRate: 0,
    monthlyGrowth: 0,
    referralCount: 0,
    activeReferrals: 0,
    conversionRate: 0,
    clickCount: 0,
    transactions: [],
    canRequestPayout: false,
    minimumPayout: 50,
    earningsHistory: [],
    earningsSummary: {
      total: 0,
      pending: 0,
      paid: 0,
      byType: {}
    },
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

  // Load earnings data
  useEffect(() => {
    loadEarningsData();
    loadPayoutHistory();
  }, [timeRange, currentPage]);

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('affiliatetoken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${base_url}/api/affiliate/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Align with backend response structure
        const { stats, affiliate } = response.data;
        console.log('API Response:', response.data); // Debug log

        const earningsHistory = stats.recentTransactions || [];
        console.log('Earnings History:', earningsHistory); // Debug log

        // Calculate earnings summary
        const earningsSummary = calculateEarningsSummary(earningsHistory);

        // Calculate monthly growth
        const monthlyGrowth = stats.monthlyGrowth || calculateMonthlyGrowth(earningsHistory);

        // Transform earnings history to transactions format
        const transactions = transformEarningsToTransactions(earningsHistory);

        setEarningsData(prev => ({
          ...prev,
          totalEarnings: stats.totalEarnings || 0,
          pendingEarnings: stats.pendingEarnings || 0,
          paidEarnings: stats.paidEarnings || 0,
          commissionRate: stats.commissionRate || 0,
          referralCount: stats.referralCount || 0,
          activeReferrals: stats.activeReferrals || 0,
          conversionRate: stats.conversionRate || 0,
          clickCount: stats.clickCount || 0,
          minimumPayout: stats.minimumPayout || 50,
          canRequestPayout: (stats.pendingEarnings || 0) >= (stats.minimumPayout || 50),
          monthlyGrowth,
          transactions,
          earningsHistory,
          earningsSummary,
          totalBalance: stats.totalEarnings || 0,
          balanceChange: stats.balanceChange || 0,
          periodChange: stats.periodChange || 0,
          expensesChange: stats.expensesChange || 0,
          incomeChange: stats.incomeChange || 0,
          lastMonthBalance: stats.lastMonthBalance || 0,
          lastMonthPeriodChange: stats.lastMonthPeriodChange || 0,
          lastMonthExpenses: stats.lastMonthExpenses || 0,
          lastMonthIncome: stats.lastMonthIncome || 0
        }));
      } else {
        throw new Error(response.data.message || 'Failed to fetch earnings data');
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
      toast.error(error.message || 'Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPayoutHistory = async () => {
    try {
      const token = localStorage.getItem('affiliatetoken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${base_url}/api/affiliate/payout/history`, {
        params: { page: currentPage, limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPayoutHistory(response.data.history);
      } else {
        throw new Error(response.data.message || 'Failed to fetch payout history');
      }
    } catch (error) {
      console.error('Error loading payout history:', error);
      toast.error(error.message || 'Failed to load payout history');
    }
  };

  // Calculate earnings summary from earnings history
  const calculateEarningsSummary = (earningsHistory) => {
    const summary = {
      total: 0,
      pending: 0,
      paid: 0,
      byType: {}
    };

    earningsHistory.forEach(earning => {
      summary.total += earning.amount;

      if (earning.status === 'pending') {
        summary.pending += earning.amount;
      } else if (earning.status === 'paid') {
        summary.paid += earning.amount;
      }

      const type = earning.type;
      if (!summary.byType[type]) {
        summary.byType[type] = {
          total: 0,
          count: 0,
          label: getEarningTypeLabel(type)
        };
      }

      summary.byType[type].total += earning.amount;
      summary.byType[type].count += 1;
    });

    return summary;
  };

  // Calculate monthly growth percentage
  const calculateMonthlyGrowth = (earningsHistory) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthEarnings = earningsHistory
      .filter(earning => {
        const earningDate = new Date(earning.date || earning.earnedAt);
        return earningDate.getMonth() === currentMonth && earningDate.getFullYear() === currentYear;
      })
      .reduce((total, earning) => total + earning.amount, 0);

    const lastMonthEarnings = earningsHistory
      .filter(earning => {
        const earningDate = new Date(earning.date || earning.earnedAt);
        return earningDate.getMonth() === lastMonth && earningDate.getFullYear() === lastMonthYear;
      })
      .reduce((total, earning) => total + earning.amount, 0);

    if (lastMonthEarnings === 0) {
      return currentMonthEarnings > 0 ? 100 : 0;
    }

    return ((currentMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100;
  };

  // Transform earnings history to transactions format for display
  const transformEarningsToTransactions = (earningsHistory) => {
    return earningsHistory
      .sort((a, b) => new Date(b.date || b.earnedAt) - new Date(a.date || a.earnedAt))
      .map(earning => ({
        id: earning.id || earning._id || `TRX${earning.sourceId}`,
        referralName: getReferralName(earning),
        referralEmail: getReferralEmail(earning),
        date: earning.date || earning.earnedAt,
        daysAgo: Math.floor((new Date() - new Date(earning.date || earning.earnedAt)) / (1000 * 60 * 60 * 24)),
        amount: earning.amount,
        commissionRate: (earning.commissionRate || 0), // Convert to percentage
        status: earning.status,
        type: earning.type,
        description: earning.description,
        sourceType: earning.sourceType,
        calculatedAmount: earning.calculatedAmount,
        sourceAmount: earning.sourceAmount,
        metadata: earning.metadata
      }));
  };

  const getReferralName = (earning) => {
    return `User ${earning.referredUser?.toString().slice(-6) || 'Unknown'}`;
  };

  const getReferralEmail = (earning) => {
    return `user${earning.referredUser?.toString().slice(-6) || 'unknown'}@example.com`;
  };

  const getEarningTypeLabel = (type) => {
    const typeLabels = {
      deposit_commission: 'Deposit Commission',
      bet_commission: 'Bet Commission',
      withdrawal_commission: 'Withdrawal Commission',
      registration_bonus: 'Registration Bonus',
      cpa: 'CPA',
      other: 'Other'
    };
    return typeLabels[type] || type;
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      second: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', icon: FaRegClock },
      paid: { color: 'bg-green-500/20 text-green-400 border border-green-500/30', icon: FaCheckCircle },
      failed: { color: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: FaTimesCircle },
      processing: { color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', icon: FaRegClock },
      completed: { color: 'bg-green-500/20 text-green-400 border border-green-500/30', icon: FaCheckCircle },
      cancelled: { color: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: FaTimesCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      deposit_commission: { color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', label: 'Deposit' },
      bet_commission: { color: 'bg-purple-500/20 text-purple-400 border border-purple-500/30', label: 'Bet' },
      withdrawal_commission: { color: 'bg-orange-500/20 text-orange-400 border border-orange-500/30', label: 'Withdrawal' },
      registration_bonus: { color: 'bg-green-500/20 text-green-400 border border-green-500/30', label: 'Bonus' },
      cpa: { color: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30', label: 'CPA' },
      other: { color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30', label: 'Other' }
    };

    const config = typeConfig[type] || typeConfig.other;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const exportToCSV = () => {
    toast.success('Export feature coming soon!');
  };

  const handlePayoutRequest = async () => {
    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.post(`${base_url}/api/affiliate/payout/request`, {
        amount: earningsData.pendingEarnings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Payout request submitted successfully!');
        loadEarningsData();
        loadPayoutHistory();
      }
    } catch (error) {
      console.error('Payout request error:', error);
      toast.error(error.response?.data?.message || 'Failed to request payout');
    }
  };

  const refreshData = () => {
    loadEarningsData();
    loadPayoutHistory();
    toast.success('Data refreshed!');
  };

  // Filter transactions based on search and status
  const filteredTransactions = earningsData.transactions.filter(transaction => {
    const matchesSearch =
      (transaction.referralName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic for transactions
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  // Change page
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

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
                  <span className="text-gray-400">Earnings</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Overview</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base mt-2">
                  Track your commissions and referral earnings
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <button
                  onClick={refreshData}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-tl-md rounded-br-md hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
                >
                  <FaSync className="text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Refresh</span>
                </button>
              </div>
            </div>
            <div className="h-1.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 mt-4 rounded-full"></div>
          </div>

          {/* Time Range Filter */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'quarter', label: 'This Quarter' },
                { value: 'year', label: 'This Year' },
                { value: 'all', label: 'All Time' }
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-tl-md rounded-br-md cursor-pointer font-bold uppercase tracking-widest text-xs transition-all duration-300 ${
                    timeRange === range.value
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Total Earnings Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaMoneyBillWave className="text-xl md:text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold flex items-center justify-end ${earningsData.balanceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {earningsData.balanceChange >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {Math.abs(earningsData.balanceChange)}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">vs last month</p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Earnings</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(earningsData.totalEarnings)}</p>
              <p className="text-xs text-gray-500">Lifetime earnings</p>
            </div>

            {/* Pending Earnings Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaRegClock className="text-xl md:text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-cyan-400">Min: {formatCurrency(earningsData.minimumPayout)}</span>
                  <p className={`text-xs mt-1 ${earningsData.canRequestPayout ? 'text-green-400' : 'text-amber-400'}`}>
                    {earningsData.canRequestPayout ? 'Eligible' : 'Not eligible'}
                  </p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Pending Earnings</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(earningsData.pendingEarnings)}</p>
              <p className="text-xs text-gray-500">Available for withdrawal</p>
            </div>

            {/* Paid Earnings Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaCheckCircle className="text-xl md:text-2xl text-cyan-400" />
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold flex items-center justify-end ${earningsData.incomeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {earningsData.incomeChange >= 0 ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                    {Math.abs(earningsData.incomeChange)}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">this month</p>
                </div>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Paid Earnings</h3>
              <p className="text-2xl md:text-3xl font-bold mb-2">{formatCurrency(earningsData.paidEarnings)}</p>
              <p className="text-xs text-gray-500">Successfully paid out</p>
            </div>

            {/* Commission Rate Card */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <FaPercent className="text-xl text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Commission Rate</h3>
                  <p className="text-2xl font-bold">{(earningsData.commissionRate).toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">Per successful referral</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Total Referrals Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Referrals</h3>
                  <p className="text-2xl md:text-3xl font-bold mb-2">{earningsData.activeReferrals}</p>
                  <p className="text-xs text-gray-500">Active referrals</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-lg">
                  <FaUsers className="text-xl md:text-2xl text-indigo-400" />
                </div>
              </div>
            </div>

            {/* Total Clicks Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Clicks</h3>
                  <p className="text-2xl md:text-3xl font-bold mb-2">{earningsData.clickCount}</p>
                  <p className="text-xs text-gray-500">Affiliate link clicks</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-pink-500/20 to-rose-600/20 rounded-lg">
                  <FaMousePointer className="text-xl md:text-2xl text-pink-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Payout Eligibility Card */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-5 md:p-6 mb-6 md:mb-8 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-xl">
                  <FaBangladeshiTakaSign className="text-2xl text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-widest">Available for Payout</h3>
                  <p className="text-gray-400 text-lg mt-1">
                    {formatCurrency(earningsData.pendingEarnings)} ready to withdraw
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum payout: {formatCurrency(earningsData.minimumPayout)}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-4 lg:mt-0">
                {earningsData.canRequestPayout ? (
                  <button
                    onClick={handlePayoutRequest}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                  >
                    Request Payout
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">
                      Need {formatCurrency(earningsData.minimumPayout - earningsData.pendingEarnings)} more
                    </p>
                    <button
                      disabled
                      className="px-6 py-3 bg-gray-600 text-gray-400 font-bold rounded-tl-md rounded-br-md cursor-not-allowed"
                    >
                      Request Payout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm mb-6 md:mb-8">
            <div className="p-4 md:p-6 border-b border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-xl font-bold uppercase tracking-widest mb-4 lg:mb-0">Earnings History</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search earnings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                  >
                    <option value="all" className="bg-[#000514]">All Status</option>
                    <option value="pending" className="bg-[#000514]">Pending</option>
                    <option value="paid" className="bg-[#000514]">Paid</option>
                    <option value="cancelled" className="bg-[#000514]">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  {/* Simple 3-part circle spinner */}
                  <div className="relative inline-flex items-center justify-center">
                    {/* Outer ring - part 1 */}
                    <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin"></div>
                    
                    {/* Middle ring - part 2 */}
                    <div className="absolute w-8 h-8 rounded-full border-2 border-transparent border-r-blue-500 animate-spin" 
                         style={{animationDuration: '1.5s'}}></div>
                    
                    {/* Inner ring - part 3 */}
                    <div className="absolute w-4 h-4 rounded-full border-2 border-transparent border-b-purple-500 animate-spin" 
                         style={{animationDuration: '2s'}}></div>
                    
                    {/* Center dot */}
                    <div className="absolute w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  
                  <p className="text-gray-400 mt-4">Loading earnings history...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">No earnings history found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Your earnings will appear here'}
                  </p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                          Date
                        </th>
                        <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                          Type & Description
                        </th>
                        <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                          Amount
                        </th>
                        <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {currentTransactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium">
                                {formatDate(transaction.date)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {transaction.daysAgo === 0 ? 'Today' : `${transaction.daysAgo}d ago`}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="text-sm font-medium">
                                  {getEarningTypeLabel(transaction.type)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-cyan-400">
                              {formatCurrency(transaction.amount)}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-green-500 whitespace-nowrap">
                            Completed
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="p-4 md:p-6 border-t border-white/10">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-400">
                          Showing <span className="font-semibold text-white">{indexOfFirstTransaction + 1}</span> to{' '}
                          <span className="font-semibold text-white">
                            {Math.min(indexOfLastTransaction, filteredTransactions.length)}
                          </span>{' '}
                          of <span className="font-semibold text-white">{filteredTransactions.length}</span> transactions
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {/* First Page Button */}
                          <button
                            onClick={() => paginate(1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-md ${
                              currentPage === 1
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-white/10 text-cyan-400 hover:bg-cyan-500/20'
                            }`}
                          >
                            <FaStepBackward className="w-3 h-3" />
                          </button>

                          {/* Previous Page Button */}
                          <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`p-2 rounded-md ${
                              currentPage === 1
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-white/10 text-cyan-400 hover:bg-cyan-500/20'
                            }`}
                          >
                            <FaChevronLeft className="w-3 h-3" />
                          </button>

                          {/* Page Numbers */}
                          {getPageNumbers().map((number) => (
                            <button
                              key={number}
                              onClick={() => paginate(number)}
                              className={`px-3 py-1 rounded-md ${
                                currentPage === number
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold'
                                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
                              }`}
                            >
                              {number}
                            </button>
                          ))}

                          {/* Next Page Button */}
                          <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-md ${
                              currentPage === totalPages
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-white/10 text-cyan-400 hover:bg-cyan-500/20'
                            }`}
                          >
                            <FaChevronRight className="w-3 h-3" />
                          </button>

                          {/* Last Page Button */}
                          <button
                            onClick={() => paginate(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-md ${
                              currentPage === totalPages
                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-white/10 text-cyan-400 hover:bg-cyan-500/20'
                            }`}
                          >
                            <FaStepForward className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-sm text-gray-400">
                          Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
                          <span className="font-semibold text-white">{totalPages}</span>
                        </div>
                      </div>

                      {/* Items Per Page Selector */}
                      <div className="flex items-center justify-center mt-4 gap-2">
                        <span className="text-sm text-gray-400">Show:</span>
                        <select
                          value={transactionsPerPage}
                          onChange={(e) => {
                            setCurrentPage(1);
                            // You could update transactionsPerPage state if you want dynamic selection
                          }}
                          className="px-3 py-1 bg-white/10 border border-white/20 rounded-md text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        >
                          <option value={5} className="bg-[#000514]">5 per page</option>
                          <option value={10} className="bg-[#000514]">10 per page</option>
                          <option value={25} className="bg-[#000514]">25 per page</option>
                          <option value={50} className="bg-[#000514]">50 per page</option>
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Earnings Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold uppercase tracking-widest mb-4">Earnings Breakdown</h3>
              <div className="space-y-4">
                {Object.entries(earningsData.earningsSummary.byType).map(([type, data]) => (
                  <div key={type} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          type === 'bet_commission'
                            ? 'bg-purple-500'
                            : type === 'deposit_commission'
                            ? 'bg-blue-500'
                            : type === 'withdrawal_commission'
                            ? 'bg-orange-500'
                            : type === 'registration_bonus'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`}
                      ></div>
                      <span className="text-gray-300">{data.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-cyan-400">{formatCurrency(data.total)}</span>
                      <div className="text-xs text-gray-500">{data.count} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <h3 className="text-lg font-bold uppercase tracking-widest mb-4">Commission Structure</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Bet Commission</span>
                  <span className="font-bold text-cyan-400">
                    {(earningsData.commissionRate).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Deposit Commission</span>
                  <span className="font-bold text-cyan-400">0%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">CPA Rate</span>
                  <span className="font-bold text-cyan-400">{earningsData.cpaRate}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Earnings;