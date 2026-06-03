import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FaFilter, FaSearch, FaCalendarAlt, FaChevronDown, 
  FaUser, FaFileAlt, FaMoneyCheckAlt, FaCheckCircle, 
  FaTimesCircle, FaSync, FaDollarSign, FaMobileAlt,
  FaClock, FaTrash, FaDownload, FaEye, FaChevronLeft,
  FaChevronRight, FaExclamationTriangle, FaListAlt,
  FaChartLine, FaSort, FaSortUp, FaSortDown, FaGift
} from 'react-icons/fa';
import { FiRefreshCw, FiSmartphone, FiUser, FiHash, FiTrendingUp } from 'react-icons/fi';
import { MdPayment, MdHistory, MdDevices, MdOutlineAccountBalance } from 'react-icons/md';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaSpinner } from 'react-icons/fa';

const Opaydeposit = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'receivedAt', direction: 'descending' });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    username: '',
    method: '',
    status: '',
    trxid: '',
    from: '',
    dateFrom: '',
    dateTo: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
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

  // Status colors for dark theme
  const getStatusInfo = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400', label: 'Completed' };
      case 'PENDING':
        return { badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', dot: 'bg-amber-400', label: 'Pending' };
      case 'FAILED':
        return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', dot: 'bg-rose-400', label: 'Failed' };
      default:
        return { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', dot: 'bg-gray-400', label: status || 'Unknown' };
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
      if (filters.status) params.append('status', filters.status);
      if (filters.trxid) params.append('trxid', filters.trxid);
      if (filters.from) params.append('from', filters.from);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      // Add pagination
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      
      // Add sorting
      params.append('sortBy', sortConfig.key);
      params.append('sortOrder', sortConfig.direction === 'descending' ? 'desc' : 'asc');

      const response = await axios.get(`${base_url}/api/opay/oraclepay-deposits?${params.toString()}`);
      
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
  }, [base_url, filters, pagination.page, pagination.limit, sortConfig]);

  // Calculate statistics
  const calculateStats = (depositList) => {
    const newStats = {
      total: depositList.length,
      completed: 0,
      pending: 0,
      failed: 0,
      totalAmount: 0
    };

    depositList.forEach(deposit => {
      const status = deposit.status?.toUpperCase();
      if (status === 'COMPLETED') {
        newStats.completed++;
        newStats.totalAmount += parseFloat(deposit.amount || 0);
      } else if (status === 'PENDING') {
        newStats.pending++;
      } else if (status === 'FAILED') {
        newStats.failed++;
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
      status: '',
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

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending';
    setSortConfig({ key, direction });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
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
    return date.toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
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

  // Get pagination pages
  const getPaginationPages = () => {
    if (pagination.totalPages <= 7) return Array.from({ length: pagination.totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (pagination.page > 3) pages.push('...');
    for (let i = Math.max(2, pagination.page - 1); i <= Math.min(pagination.totalPages - 1, pagination.page + 1); i++) pages.push(i);
    if (pagination.page < pagination.totalPages - 2) pages.push('...');
    pages.push(pagination.totalPages);
    return pages;
  };

  // Initial load
  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';

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
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Opay Deposit Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <MdPayment className="text-amber-500" /> Monitor and manage all Opay deposit transactions in real-time
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">API Connected</span>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400 disabled:opacity-50"
              >
                <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL DEPOSITS', value: stats.total, color: 'border-indigo-500', icon: <FaListAlt className="text-indigo-400" />, valueClass: 'text-white' },
              { label: 'COMPLETED', value: stats.completed, color: 'border-emerald-500', icon: <FaCheckCircle className="text-emerald-400" />, valueClass: 'text-emerald-400' },
              { label: 'PENDING', value: stats.pending, color: 'border-amber-500', icon: <FaExclamationTriangle className="text-amber-400" />, valueClass: 'text-amber-400' },
              { label: 'TOTAL AMOUNT', value: `৳${stats.totalAmount.toLocaleString()}`, color: 'border-amber-500', icon: <FaDollarSign className="text-amber-400" />, valueClass: 'text-amber-400' },
            ].map((card, i) => (
              <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                  {card.icon}
                </div>
                <h2 className={`text-xl font-bold mt-1 leading-none ${card.valueClass}`}>{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Filter Section */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500"></div> Filters & Search
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={resetFilters}
                  className="text-[9px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider"
                >
                  Reset Filters
                </button>
                <button
                  onClick={fetchDeposits}
                  className="bg-amber-500/10 hover:bg-amber-600/30 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded font-bold text-[9px] transition-all flex items-center gap-2"
                >
                  <FaSearch /> Apply Filters
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Username Filter */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                  <FiUser /> Username
                </label>
                <input
                  type="text"
                  value={filters.username}
                  onChange={(e) => handleFilterChange('username', e.target.value)}
                  className={inputClass}
                  placeholder="Enter username"
                />
              </div>

              {/* Transaction ID Filter */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                  <FiHash /> Transaction ID
                </label>
                <input
                  type="text"
                  value={filters.trxid}
                  onChange={(e) => handleFilterChange('trxid', e.target.value)}
                  className={inputClass}
                  placeholder="Enter transaction ID"
                />
              </div>

              {/* From Number Filter */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  From Number
                </label>
                <input
                  type="text"
                  value={filters.from}
                  onChange={(e) => handleFilterChange('from', e.target.value)}
                  className={inputClass}
                  placeholder="Enter phone number"
                />
              </div>

              {/* Method Filter */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                  <MdPayment /> Payment Method
                </label>
                <select
                  value={filters.method}
                  onChange={(e) => handleFilterChange('method', e.target.value)}
                  className={selectClass}
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
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className={selectClass}
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              {/* Date Range Filters */}
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                  <FaCalendarAlt /> From Date
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                  <FaCalendarAlt /> To Date
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {deposits.length} of {pagination.total} deposits
            </p>
            <button
              onClick={handleExport}
              disabled={deposits.length === 0}
              className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
            >
              <FaDownload /> Export
            </button>
          </div>

          {/* Main Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
              Deposit Transactions
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('receivedAt')}>
                      Time {getSortIcon('receivedAt')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('username')}>
                      User {getSortIcon('username')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('amount')}>
                      Amount {getSortIcon('amount')}
                    </th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">TrxID</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                      Status {getSortIcon('status')}
                    </th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading deposits...</p>
                        </div>
                      </td>
                    </tr>
                  ) : deposits.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaGift className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No deposits found</p>
                          <p className="text-[10px] mt-1 text-gray-600">
                            {Object.values(filters).some(v => v) 
                              ? 'Try adjusting your filters' 
                              : 'Deposits will appear here when they are made'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    deposits.map((deposit) => {
                      const statusInfo = getStatusInfo(deposit.status);
                      return (
                        <tr key={deposit._id || deposit.id} className="hover:bg-[#1F2937] transition-colors group">
                          {/* Time */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <FaClock className="text-[9px] text-gray-600" />
                              {formatTimeAgo(deposit.receivedAt)}
                            </div>
                            <div className="text-[9px] text-gray-600 mt-0.5">
                              {formatDate(deposit.receivedAt)}
                            </div>
                          </td>
                          
                          {/* User */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-white">
                              {deposit.userInfo?.username || deposit.username || 'N/A'}
                            </div>
                            {deposit.userInfo?.balance != null && (
                              <div className="text-[9px] text-gray-500">
                                Balance: ৳{deposit.userInfo.balance}
                              </div>
                            )}
                          </td>
                          
                          {/* Amount */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-black text-amber-400">
                              ৳{parseFloat(deposit.amount || 0).toLocaleString()}
                            </div>
                          </td>
                          
                          {/* Method */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded bg-[#0F111A] border border-gray-700">
                                <MdPayment className="text-gray-400 text-[10px]" />
                              </div>
                              <span className="text-xs font-medium text-gray-300">
                                {deposit.checkout_items?.method || METHOD_LABELS[deposit.method] || deposit.method || 'N/A'}
                              </span>
                            </div>
                          </td>
                          
                          {/* TrxID */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <code className="text-[9px] bg-[#0F111A] px-2 py-1 rounded font-mono text-gray-400 border border-gray-800">
                              {deposit.transaction_id || deposit.trxid || '-'}
                            </code>
                          </td>
                          
                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${statusInfo.badge}`}>
                              {statusInfo.label}
                            </span>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              onClick={() => viewDepositDetails(deposit)}
                              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-800 bg-[#1C2128]">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">
                    Page {pagination.page} of {pagination.totalPages} &nbsp;·&nbsp; {pagination.total} total
                  </p>
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${pagination.page <= 1 ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >← Prev</button>
                    {getPaginationPages().map((page, idx) =>
                      page === '...' ? (
                        <span key={`e-${idx}`} className="px-2 py-1.5 text-[9px] text-gray-600 font-bold select-none">···</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${pagination.page === page ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                        >{page}</button>
                      )
                    )}
                    <button
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${pagination.page >= pagination.totalPages ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >Next →</button>
                  </nav>
                </div>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Deposit Details Modal */}
      {showDetails && selectedDeposit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128] sticky top-0 z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <MdPayment /> Deposit Details
              </h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              {/* Amount and Status */}
              <div className="flex items-center justify-between p-4 bg-[#0F111A] rounded-lg border border-gray-800 mb-6">
                <div>
                  <div className="text-2xl font-bold text-amber-400">
                    ৳{parseFloat(selectedDeposit.amount || 0).toLocaleString()}
                  </div>
                  <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                    {selectedDeposit.checkout_items?.method || METHOD_LABELS[selectedDeposit.method] || selectedDeposit.method}
                  </div>
                </div>
                <div>
                  {(() => {
                    const statusInfo = getStatusInfo(selectedDeposit.status);
                    return (
                      <span className={`text-[9px] px-3 py-1.5 rounded font-bold uppercase ${statusInfo.badge}`}>
                        {statusInfo.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Grid Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Username</p>
                  <p className="text-xs font-medium text-gray-300 mt-1">
                    {selectedDeposit.userInfo?.username || selectedDeposit.username || 'N/A'}
                  </p>
                  {selectedDeposit.userInfo?.balance != null && (
                    <p className="text-[9px] text-gray-500 mt-1">
                      Balance: ৳{selectedDeposit.userInfo.balance}
                    </p>
                  )}
                </div>
                
                <div className="bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Transaction ID</p>
                  <code className="text-[9px] font-mono text-gray-400 bg-[#1C2128] px-2 py-1 rounded inline-block mt-1">
                    {selectedDeposit.transaction_id || selectedDeposit.trxid || 'N/A'}
                  </code>
                </div>
                
                <div className="bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Method</p>
                  <p className="text-xs font-medium text-gray-300 mt-1">
                    {selectedDeposit.checkout_items?.method || METHOD_LABELS[selectedDeposit.method] || selectedDeposit.method || 'N/A'}
                  </p>
                </div>
                
                <div className="bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Received At</p>
                  <p className="text-xs font-medium text-gray-300 mt-1">{formatDate(selectedDeposit.receivedAt)}</p>
                </div>
                
                <div className="bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">From Number</p>
                  <p className="text-xs font-medium text-gray-300 mt-1">{selectedDeposit.from || 'N/A'}</p>
                </div>
                
                <div className="bg-[#0F111A] p-3 rounded-lg border border-gray-800">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Device</p>
                  <p className="text-xs font-medium text-gray-300 mt-1">{selectedDeposit.deviceName || 'N/A'}</p>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-[#0F111A] rounded-lg border border-gray-800 p-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Additional Information</h4>
                <div className="space-y-2">
                  {selectedDeposit.bdTimeZone && (
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-[9px] text-gray-500">BD Time</span>
                      <span className="text-[9px] font-medium text-gray-300">{selectedDeposit.bdTimeZone}</span>
                    </div>
                  )}
                  {selectedDeposit.token && (
                    <div className="flex justify-between py-1 border-b border-gray-800">
                      <span className="text-[9px] text-gray-500">Token</span>
                      <code className="text-[8px] font-mono text-gray-400">
                        {selectedDeposit.token.slice(0, 30)}...
                      </code>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-[9px] text-gray-500">Applied At</span>
                    <span className="text-[9px] font-medium text-gray-300">
                      {selectedDeposit.appliedAt ? formatDate(selectedDeposit.appliedAt) : 'Not Applied'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-gray-800">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                  >
                    Close
                  </button>
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