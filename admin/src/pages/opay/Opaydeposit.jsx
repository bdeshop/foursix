import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FaFilter, FaSearch, FaCalendarAlt, FaChevronDown, 
  FaUser, FaFileAlt, FaMoneyCheckAlt, FaCheckCircle, 
  FaTimesCircle, FaSync, FaDollarSign, FaMobileAlt,
  FaClock, FaTrash, FaDownload, FaEye, FaChevronLeft,
  FaChevronRight, FaExclamationTriangle, FaListAlt,
  FaChartLine
} from 'react-icons/fa';
import { FiRefreshCw, FiSmartphone, FiUser, FiHash } from 'react-icons/fi';
import { MdPayment, MdHistory, MdDevices, MdOutlineAccountBalance } from 'react-icons/md';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaSpinner } from 'react-icons/fa';
const Opaydeposit = () => {
const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    username: '',
    method: '',
    applied: '',
    trxid: '',
    from: '',
    dateFrom: '',
    dateTo: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  // Selected deposit for details
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Method labels
  const METHOD_LABELS = {
    bkash: 'Bkash',
    nagad: 'Nagad',
    rocket: 'Rocket',
    upay: 'Upay',
    card: 'Credit Card',
    bank: 'Bank Transfer',
    wallet: 'Mobile Wallet'
  };

  // Status colors
  const STATUS_COLORS = {
    true: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <FaCheckCircle className="text-green-500" />,
      label: 'ক্রেডিট হয়েছে'
    },
    false: {
      bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <FaExclamationTriangle className="text-yellow-500" />,
      label: 'পেন্ডিং'
    }
  };

  // Fetch deposits from API
  const fetchDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Add filters
      if (filters.username) params.append('username', filters.username);
      if (filters.method) params.append('method', filters.method);
      if (filters.applied !== '') params.append('applied', filters.applied);
      if (filters.trxid) params.append('trxid', filters.trxid);
      if (filters.from) params.append('from', filters.from);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      // Add pagination
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await axios.get(`${base_url}/api/opay/deposits?${params.toString()}`);
      
      if (response.data.success) {
        setDeposits(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: Math.ceil((response.data.total || 0) / pagination.limit)
        }));
        
        // Calculate stats
        calculateStats(response.data.data || []);
      } else {
        toast.error(response.data.message || 'Failed to load deposits');
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast.error(error.response?.data?.message || 'Failed to load deposits');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [base_url, filters, pagination.page, pagination.limit]);

  // Calculate statistics
  const calculateStats = (depositList) => {
    const newStats = {
      total: depositList.length,
      applied: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0
    };

    depositList.forEach(deposit => {
      if (deposit.applied) {
        newStats.applied++;
        newStats.totalAmount += parseFloat(deposit.amount || 0);
      } else {
        newStats.pending++;
      }
    });

    setStats(newStats);
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      username: '',
      method: '',
      applied: '',
      trxid: '',
      from: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeposits();
    toast.success('Refreshing deposits...');
  };

  // Handle pagination
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: pageNumber }));
    }
  };

  // Export data
  const handleExport = () => {
    const dataStr = JSON.stringify(deposits, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `opay_deposits_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Data exported successfully!', { icon: '💾' });
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

  // Format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // View deposit details
  const viewDepositDetails = (deposit) => {
    setSelectedDeposit(deposit);
    setShowDetails(true);
  };

  // Initial load
  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  // Memoized filtered deposits (for client-side filtering if needed)
  const filteredDeposits = useMemo(() => {
    return deposits; // API does the filtering, but we can add client-side filtering here if needed
  }, [deposits]);

  return (
    <section className="font-nunito min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-4 md:p-6 overflow-y-auto min-h-[calc(100vh-64px)] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Opay Deposit Management</h1>
                  <p className="text-gray-600 mt-2">Monitor and manage all Opay deposit transactions in real-time</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <MdPayment className="text-blue-600" />
                      <span className="font-medium text-blue-800">API Connected</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <FiRefreshCw className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Deposits</p>
                    <h3 className="text-2xl font-bold text-gray-800">{stats.total}</h3>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FaListAlt className="text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">All transactions</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Applied</p>
                    <h3 className="text-2xl font-bold text-green-600">{stats.applied}</h3>
                  </div>
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FaCheckCircle className="text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Successfully credited</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
                  </div>
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <FaExclamationTriangle className="text-yellow-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Awaiting processing</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Failed</p>
                    <h3 className="text-2xl font-bold text-red-600">{stats.failed}</h3>
                  </div>
                  <div className="bg-red-100 p-2 rounded-lg">
                    <FaTimesCircle className="text-red-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Failed transactions</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <h3 className="text-2xl font-bold text-purple-600">৳{stats.totalAmount.toLocaleString()}</h3>
                  </div>
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <FaDollarSign className="text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Total deposited</p>
              </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FaFilter className="mr-2 text-blue-500" />
                  Filters
                </h2>
                <div className="flex items-center space-x-3 mt-2 md:mt-0">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={fetchDeposits}
                    className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center"
                  >
                    <FaSearch className="mr-2" />
                    Apply Filters
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Username Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiUser className="mr-1" /> Username
                  </label>
                  <input
                    type="text"
                    value={filters.username}
                    onChange={(e) => handleFilterChange('username', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter username"
                  />
                </div>

                {/* Transaction ID Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FiHash className="mr-1" /> Transaction ID
                  </label>
                  <input
                    type="text"
                    value={filters.trxid}
                    onChange={(e) => handleFilterChange('trxid', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter transaction ID"
                  />
                </div>

                {/* From Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Number
                  </label>
                  <input
                    type="text"
                    value={filters.from}
                    onChange={(e) => handleFilterChange('from', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Method Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <MdPayment className="mr-1" /> Payment Method
                  </label>
                  <select
                    value={filters.method}
                    onChange={(e) => handleFilterChange('method', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Methods</option>
                    <option value="bkash">Bkash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="upay">Upay</option>
                    <option value="card">Credit Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Status
                  </label>
                  <select
                    value={filters.applied}
                    onChange={(e) => handleFilterChange('applied', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="true">Applied</option>
                    <option value="false">Pending</option>
                  </select>
                </div>

                {/* Date Range Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaCalendarAlt className="mr-1" /> From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <FaCalendarAlt className="mr-1" /> To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">Deposit Transactions</h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Showing {filteredDeposits.length} of {pagination.total} transactions
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleExport}
                      disabled={deposits.length === 0}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <FaDownload />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="p-12 text-center">
                      <div className="flex items-center justify-center h-full">
                                   <div className="flex justify-center items-center py-8">
                                                               <FaSpinner className="animate-spin text-orange-500 text-2xl" />
                                                             </div>
                              </div>
                </div>
              ) : deposits.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400 text-4xl mb-4">
                    💸
                  </div>
                  <p className="text-gray-600 font-medium">No deposits found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    {Object.values(filters).some(v => v) 
                      ? 'Try adjusting your filters' 
                      : 'Deposits will appear here when they are made'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden p-4">
                    <div className="space-y-4">
                      {filteredDeposits.map((deposit) => (
                        <div 
                          key={deposit._id || deposit.id} 
                          className={`p-4 rounded-xl border ${STATUS_COLORS[deposit.applied]?.border} ${STATUS_COLORS[deposit.applied]?.bg} cursor-pointer hover:shadow-md transition-shadow`}
                          onClick={() => viewDepositDetails(deposit)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-xl font-bold text-gray-800">
                                ৳{parseFloat(deposit.amount || 0).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                {METHOD_LABELS[deposit.method] || deposit.method}
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${STATUS_COLORS[deposit.applied]?.text}`}>
                              {STATUS_COLORS[deposit.applied]?.icon}
                              <span className="ml-1">{STATUS_COLORS[deposit.applied]?.label}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">User</span>
                              <span className="font-medium">{deposit.userInfo?.username || deposit.username || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">TrxID</span>
                              <span className="font-mono text-xs truncate max-w-[120px]">
                                {deposit.trxid || '-'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Time</span>
                              <span className="flex items-center text-xs text-gray-400">
                                <FaClock className="mr-1" />
                                {formatTimeAgo(deposit.receivedAt)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200 text-center text-blue-600 text-xs font-medium">
                            Tap for details →
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            TrxID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            From
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDeposits.map((deposit) => (
                          <tr key={deposit._id || deposit.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-900">
                                <FaClock className="mr-2 text-gray-400" />
                                {formatTimeAgo(deposit.receivedAt)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(deposit.receivedAt)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {deposit.userInfo?.username || deposit.username || 'N/A'}
                              </div>
                              {deposit.userInfo?.balance != null && (
                                <div className="text-xs text-gray-500">
                                  Balance: ৳{deposit.userInfo.balance}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900">
                                ৳{parseFloat(deposit.amount || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="p-1.5 rounded bg-gray-100 mr-2">
                                  <MdPayment className="text-gray-600" />
                                </div>
                                <span className="text-sm text-gray-900">
                                  {METHOD_LABELS[deposit.method] || deposit.method}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {deposit.trxid || '-'}
                              </code>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {deposit.from || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[deposit.applied]?.text} ${STATUS_COLORS[deposit.applied]?.bg} border ${STATUS_COLORS[deposit.applied]?.border}`}>
                                {STATUS_COLORS[deposit.applied]?.icon}
                                <span className="ml-1.5">{STATUS_COLORS[deposit.applied]?.label}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => viewDepositDetails(deposit)}
                                  className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View details"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  className="text-gray-600 hover:text-gray-800 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
                                  title="More actions"
                                >
                                  <FaChevronDown />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Table Footer */}
              <div className="px-4 md:px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {filteredDeposits.length} of {pagination.total} deposits
                  </div>
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaChevronLeft />
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                pagination.page === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Information Section */}
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-800 mb-2">আপনার ডিপোজিট ইনফরমেশন</h3>
                <p className="text-gray-600">
                  এই সেকশনে সমস্ত ডিপোজিট লেনদেনের তথ্য দেখানো হয়েছে। আপনি ফিল্টার ব্যবহার করে নির্দিষ্ট লেনদেন খুঁজে পেতে পারেন।
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ট্রান্সাকশন আইডি (TrxID) ব্যবহার করে যেকোনো লেনদেনের বিস্তারিত তথ্য দেখতে পারেন।
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Deposit Details Modal */}
      {showDetails && selectedDeposit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Deposit Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Amount and Status */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div>
                    <div className="text-3xl font-bold text-blue-800">
                      ৳{parseFloat(selectedDeposit.amount || 0).toLocaleString()}
                    </div>
                    <div className="text-blue-600 font-medium">
                      {METHOD_LABELS[selectedDeposit.method] || selectedDeposit.method}
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-medium flex items-center ${STATUS_COLORS[selectedDeposit.applied]?.text} ${STATUS_COLORS[selectedDeposit.applied]?.bg} border ${STATUS_COLORS[selectedDeposit.applied]?.border}`}>
                    {STATUS_COLORS[selectedDeposit.applied]?.icon}
                    <span className="ml-2">{STATUS_COLORS[selectedDeposit.applied]?.label}</span>
                  </div>
                </div>

                {/* Grid Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-medium text-gray-800">
                      {selectedDeposit.userInfo?.username || selectedDeposit.username || 'N/A'}
                    </p>
                    {selectedDeposit.userInfo?.balance != null && (
                      <p className="text-sm text-gray-600 mt-1">
                        Current Balance: ৳{selectedDeposit.userInfo.balance}
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <code className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded text-sm">
                      {selectedDeposit.trxid || 'N/A'}
                    </code>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">From Number</p>
                    <p className="font-medium text-gray-800">{selectedDeposit.from || 'N/A'}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Method</p>
                    <p className="font-medium text-gray-800">
                      {METHOD_LABELS[selectedDeposit.method] || selectedDeposit.method}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Received At</p>
                    <p className="font-medium text-gray-800">{formatDate(selectedDeposit.receivedAt)}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Applied At</p>
                    <p className="font-medium text-gray-800">
                      {selectedDeposit.appliedAt ? formatDate(selectedDeposit.appliedAt) : 'Not Applied'}
                    </p>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Additional Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Status</span>
                        <span className={`font-medium ${selectedDeposit.success ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedDeposit.success ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Device</span>
                        <span className="font-medium">{selectedDeposit.deviceName || 'N/A'}</span>
                      </div>
                      {selectedDeposit.token && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Token</span>
                          <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {selectedDeposit.token.slice(0, 20)}...
                          </code>
                        </div>
                      )}
                      {selectedDeposit.bdTimeZone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">BD Time</span>
                          <span className="font-medium">{selectedDeposit.bdTimeZone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors">
                      Take Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Opaydeposit;