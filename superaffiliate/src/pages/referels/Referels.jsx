import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaUserPlus, 
  FaChartLine, 
  FaMoneyBillWave,
  FaCalendarAlt,
  FaEye,
  FaDownload,
  FaUserCheck,
  FaUserClock,
  FaUserTimes,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes,
  FaArrowUp,
  FaArrowDown,
  FaUsers
} from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Referrals = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Referrals data state
  const [referralsData, setReferralsData] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    pendingReferrals: 0,
    totalEarnings: 0,
    referrals: [],
    stats: {
      today: { signups: 0, earnings: 0 },
      week: { signups: 0, earnings: 0 },
      month: { signups: 0, earnings: 0 }
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load referrals data
  useEffect(() => {
    loadReferralsData();
  }, []);

  const loadReferralsData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('affiliatetoken');
      
      // Load profile for basic stats
      const profileResponse = await axios.get(`${base_url}/api/affiliate/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        const profile = profileResponse.data.affiliate;
        
        // Extract referred users from profile
        const referredUsers = profile.referredUsers || [];
        
        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Process referred users data
        const processedReferrals = referredUsers.map((ref, index) => {
          // Handle nested date objects properly
          const joinedAt = ref.joinedAt?.$date ? new Date(ref.joinedAt.$date) : 
                          ref.createdAt?.$date ? new Date(ref.createdAt.$date) : new Date();
          
          const lastActivity = ref.lastActivity?.$date ? new Date(ref.lastActivity.$date) : joinedAt;
          
          return {
            id: ref._id?.$oid || `ref-${index}`,
            name: ref.user?.firstName && ref.user?.lastName ? 
                  `${ref.user.firstName} ${ref.user.lastName}`.trim() : 
                  'Unknown User',
            email: ref.user?.email || 'No email',
            phone: ref.user?.phone || 'No phone',
            country: ref.user?.address?.country || 'Unknown',
            status: ref.userStatus || 'pending',
            joinedAt: joinedAt,
            lastActivity: lastActivity,
            totalEarned: ref.earnedAmount || 0,
            totalDeposits: 0, // You might need to fetch this from another endpoint
            totalBets: 0, // You might need to fetch this from another endpoint
            conversionValue: ref.earnedAmount || 0,
            source: 'Direct'
          };
        });

        // Calculate time-based stats
        const todaySignups = processedReferrals.filter(user => 
          user.joinedAt.toDateString() === today.toDateString()
        ).length;

        const weekSignups = processedReferrals.filter(user => 
          user.joinedAt >= weekAgo
        ).length;

        const todayEarnings = processedReferrals
          .filter(user => user.joinedAt.toDateString() === today.toDateString())
          .reduce((sum, user) => sum + (user.totalEarned || 0), 0);

        const weekEarnings = processedReferrals
          .filter(user => user.joinedAt >= weekAgo)
          .reduce((sum, user) => sum + (user.totalEarned || 0), 0);

        const monthEarnings = processedReferrals
          .filter(user => user.joinedAt >= monthAgo)
          .reduce((sum, user) => sum + (user.totalEarned || 0), 0);

        setReferralsData({
          totalReferrals: profile.referralCount || 0,
          activeReferrals: profile.activeReferrals || 0,
          pendingReferrals: processedReferrals.filter(user => user.status === 'pending').length,
          totalEarnings: profile.totalEarnings || 0,
          referrals: processedReferrals,
          stats: {
            today: {
              signups: todaySignups,
              earnings: todayEarnings
            },
            week: {
              signups: weekSignups,
              earnings: weekEarnings
            },
            month: {
              signups: profile.referralCount || 0,
              earnings: monthEarnings
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading referrals data:', error);
      toast.error('Failed to load referrals data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-500/20 text-green-400 border border-green-500/30', icon: FaUserCheck },
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30', icon: FaUserClock },
      inactive: { color: 'bg-gray-500/20 text-gray-400 border border-gray-500/30', icon: FaUserTimes }
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="text-gray-500" />;
    return sortDirection === 'asc' ? <FaSortUp className="text-cyan-400" /> : <FaSortDown className="text-cyan-400" />;
  };

  const filteredAndSortedReferrals = referralsData.referrals
    .filter(referral => {
      const matchesSearch = referral.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           referral.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           referral.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || referral.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = new Date();
        const referralDate = new Date(referral.joinedAt);
        
        switch (dateFilter) {
          case 'today':
            matchesDate = referralDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = referralDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = referralDate >= monthAgo;
            break;
          default:
            matchesDate = true;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField === 'joinedAt' || sortField === 'lastActivity') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Country', 'Status', 'Joined At', 'Last Activity', 'Total Earned', 'Total Bets', 'Total Deposits', 'Conversion Value', 'Source'];
    const data = filteredAndSortedReferrals.map(referral => [
      referral.name,
      referral.email,
      referral.phone,
      referral.country,
      referral.status,
      formatDate(referral.joinedAt),
      formatDate(referral.lastActivity),
      formatCurrency(referral.totalEarned),
      referral.totalBets,
      formatCurrency(referral.totalDeposits),
      formatCurrency(referral.conversionValue),
      referral.source
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'referrals_export.csv';
    link.click();
    toast.success('Referrals exported successfully!');
  };

  const viewReferralDetails = (referral) => {
    setSelectedReferral(referral);
    setShowDetailsModal(true);
  };

  const getActivityLevel = (lastActivity) => {
    if (!lastActivity) return { level: 'Unknown', color: 'text-gray-500' };
    
    const daysSinceActivity = Math.floor((new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActivity <= 1) return { level: 'High', color: 'text-green-400' };
    if (daysSinceActivity <= 7) return { level: 'Medium', color: 'text-yellow-400' };
    return { level: 'Low', color: 'text-red-400' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000514]">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`flex-1 p-6 ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white/5 rounded-lg p-6">
                    <div className="h-6 bg-white/10 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                  <span className="text-gray-400">Referral</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Network</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base mt-2">
                  Manage and track your referred users
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-tl-md rounded-br-md hover:bg-white/10 transition-all duration-300 flex items-center gap-2"
                >
                  <FaDownload className="text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Export CSV</span>
                </button>
              </div>
            </div>
            <div className="h-1.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 mt-4 rounded-full"></div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Referrals</h3>
                  <p className="text-2xl md:text-3xl font-bold">
                    {referralsData.totalReferrals}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    All time referrals
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaUserPlus className="text-cyan-400 text-xl md:text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Active Referrals</h3>
                  <p className="text-2xl md:text-3xl font-bold">
                    {referralsData.activeReferrals}
                  </p>
                  <p className="text-xs text-green-400 mt-2 flex items-center">
                    <FaChartLine className="mr-1" />
                    {referralsData.totalReferrals > 0 
                      ? ((referralsData.activeReferrals / referralsData.totalReferrals) * 100).toFixed(1) 
                      : 0}% active rate
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-lg">
                  <FaUserCheck className="text-green-400 text-xl md:text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Earnings</h3>
                  <p className="text-2xl md:text-3xl font-bold text-cyan-400">
                    {formatCurrency(referralsData.totalEarnings)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    From referrals
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-lg">
                  <FaMoneyBillWave className="text-purple-400 text-xl md:text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Pending</h3>
                  <p className="text-2xl md:text-3xl font-bold">
                    {referralsData.pendingReferrals}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Awaiting verification
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-amber-600/20 rounded-lg">
                  <FaUserClock className="text-yellow-400 text-xl md:text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-2">Today</h3>
                  <p className="text-2xl md:text-3xl font-bold">{referralsData.stats.today.signups} Signups</p>
                  <p className="text-sm text-cyan-300 mt-2">{formatCurrency(referralsData.stats.today.earnings)} Earned</p>
                </div>
                <FaCalendarAlt className="text-2xl text-cyan-400" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2">This Week</h3>
                  <p className="text-2xl md:text-3xl font-bold">{referralsData.stats.week.signups} Signups</p>
                  <p className="text-sm text-green-300 mt-2">{formatCurrency(referralsData.stats.week.earnings)} Earned</p>
                </div>
                <FaChartLine className="text-2xl text-green-400" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-5 md:p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">This Month</h3>
                  <p className="text-2xl md:text-3xl font-bold">{referralsData.stats.month.signups} Signups</p>
                  <p className="text-sm text-purple-300 mt-2">{formatCurrency(referralsData.stats.month.earnings)} Earned</p>
                </div>
                <FaUsers className="text-2xl text-purple-400" />
              </div>
            </div>
          </div>

          {/* Referrals Table */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="p-4 md:p-6 border-b border-white/10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-4 lg:mb-0">
                  Referral Details ({filteredAndSortedReferrals.length})
                </h2>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search referrals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm w-full sm:w-64 text-white placeholder-gray-500"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm text-white"
                  >
                    <option value="all" className="bg-[#000514]">All Status</option>
                    <option value="active" className="bg-[#000514]">Active</option>
                    <option value="pending" className="bg-[#000514]">Pending</option>
                    <option value="inactive" className="bg-[#000514]">Inactive</option>
                  </select>

                  {/* Date Filter */}
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm text-white"
                  >
                    <option value="all" className="bg-[#000514]">All Time</option>
                    <option value="today" className="bg-[#000514]">Today</option>
                    <option value="week" className="bg-[#000514]">This Week</option>
                    <option value="month" className="bg-[#000514]">This Month</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th 
                      className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer"
                      onClick={() => handleSort('joinedAt')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Joined</span>
                        {getSortIcon('joinedAt')}
                      </div>
                    </th>
                    <th 
                      className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer"
                      onClick={() => handleSort('totalEarned')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Earned</span>
                        {getSortIcon('totalEarned')}
                      </div>
                    </th>
                    <th 
                      className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer"
                      onClick={() => handleSort('lastActivity')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Last Activity</span>
                        {getSortIcon('lastActivity')}
                      </div>
                    </th>
                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredAndSortedReferrals.map((referral) => {
                    const activityLevel = getActivityLevel(referral.lastActivity);
                    
                    return (
                      <tr key={referral.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {formatDate(referral.joinedAt)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Source: {referral.source}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(referral.status)}
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-cyan-400">
                            {formatCurrency(referral.totalEarned)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {referral.totalBets} bets
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">
                            {formatDate(referral.lastActivity)}
                          </div>
                          <div className={`text-xs font-bold ${activityLevel.color}`}>
                            {activityLevel.level} activity
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => viewReferralDetails(referral)}
                            className="px-3 py-1 bg-white/5 border border-white/10 rounded-md hover:bg-white/10 transition-all duration-300 flex items-center gap-2 text-xs"
                          >
                            <FaEye className="text-cyan-400" />
                            <span className="font-bold uppercase tracking-widest">View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredAndSortedReferrals.length === 0 && (
                <div className="p-8 text-center">
                  <div className="text-gray-500 mb-2">
                    <FaUsers className="text-3xl mx-auto" />
                  </div>
                  <p className="text-gray-400">No referrals found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Your referrals will appear here'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredAndSortedReferrals.length > 0 && (
              <div className="px-4 md:px-6 py-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing <span className="font-bold text-cyan-400">1</span> to{' '}
                    <span className="font-bold text-cyan-400">{filteredAndSortedReferrals.length}</span> of{' '}
                    <span className="font-bold text-cyan-400">{filteredAndSortedReferrals.length}</span> results
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-sm font-bold uppercase tracking-widest text-gray-400 hover:bg-white/10 transition-all">
                      Previous
                    </button>
                    <button className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-sm font-bold uppercase tracking-widest text-gray-400 hover:bg-white/10 transition-all">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Referral Details Modal */}
      {showDetailsModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#000514] border border-cyan-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold uppercase tracking-widest">Referral Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-bold uppercase tracking-widest text-gray-400 mb-4">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">Name</label>
                      <p className="mt-1 text-sm text-gray-300">{selectedReferral.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">Email</label>
                      <p className="mt-1 text-sm text-gray-300 flex items-center">
                        <FaEnvelope className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedReferral.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">Phone</label>
                      <p className="mt-1 text-sm text-gray-300 flex items-center">
                        <FaPhone className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedReferral.phone}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">Country</label>
                      <p className="mt-1 text-sm text-gray-300 flex items-center">
                        <FaMapMarkerAlt className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedReferral.country}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold uppercase tracking-widest text-gray-400 mb-4">Activity & Earnings</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedReferral.status)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">Joined Date</label>
                      <p className="mt-1 text-sm text-gray-300">
                        {formatDateTime(selectedReferral.joinedAt)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">Last Activity</label>
                      <p className="mt-1 text-sm text-gray-300">
                        {formatDateTime(selectedReferral.lastActivity)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-500">Total Earned</label>
                      <p className="mt-1 text-lg font-bold text-cyan-400">
                        {formatCurrency(selectedReferral.totalEarned)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-lg font-bold uppercase tracking-widest text-gray-400 mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-400">{selectedReferral.totalBets}</p>
                    <p className="text-sm text-gray-500">Total Bets</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-400">{formatCurrency(selectedReferral.totalDeposits)}</p>
                    <p className="text-sm text-gray-500">Total Deposits</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-400">{formatCurrency(selectedReferral.conversionValue)}</p>
                    <p className="text-sm text-gray-500">Conversion Value</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-400">{selectedReferral.source}</p>
                    <p className="text-sm text-gray-500">Source</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-white/5 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-white/10 text-white font-bold rounded-tl-md rounded-br-md hover:bg-white/20 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referrals;