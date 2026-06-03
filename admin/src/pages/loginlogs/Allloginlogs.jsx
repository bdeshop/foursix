import React, { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaPaperPlane, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaUser, 
  FaUsers, 
  FaEye, 
  FaChevronLeft, 
  FaChevronRight, 
  FaSignInAlt, 
  FaDesktop, 
  FaMobile, 
  FaTablet,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaGlobe,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiWifi } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

const AllLoginLogs = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginLogs, setLoginLogs] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'descending' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    username: '',
    ipAddress: '',
    startDate: '',
    endDate: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch login logs on component mount
  useEffect(() => {
    fetchLoginLogs();
  }, [pagination.page, sortConfig]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchLoginLogs = async (page = pagination.page, filtersObj = filters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction === 'descending' ? 'desc' : 'asc',
        ...filtersObj
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await axios.get(`${base_url}/api/admin/login-logs`, { params });
      setLoginLogs(response.data.loginLogs);
      setPagination({
        ...pagination,
        page,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching login logs:', error);
      toast.error('Failed to fetch login logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLoginLogs(1, filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      status: 'all',
      username: '',
      ipAddress: '',
      startDate: '',
      endDate: ''
    };
    setFilters(defaultFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLoginLogs(1, defaultFilters);
  };

  const handleRefresh = () => {
    fetchLoginLogs(pagination.page, filters);
    toast.success('Login logs refreshed');
  };

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

  const showLogDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'desktop':
        return <FaDesktop className="text-blue-400" />;
      case 'mobile':
        return <FaMobile className="text-emerald-400" />;
      case 'tablet':
        return <FaTablet className="text-purple-400" />;
      default:
        return <FaDesktop className="text-gray-500" />;
    }
  };

  const getStatusInfo = (status) => {
    if (status === 'success') {
      return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: <FaCheckCircle className="text-emerald-400 text-[10px]" />, label: 'Success' };
    }
    return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', icon: <FaTimesCircle className="text-rose-400 text-[10px]" />, label: 'Failed' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getPaginationPages = () => {
    if (pagination.totalPages <= 7) return Array.from({ length: pagination.totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (pagination.page > 3) pages.push('...');
    for (let i = Math.max(2, pagination.page - 1); i <= Math.min(pagination.totalPages - 1, pagination.page + 1); i++) pages.push(i);
    if (pagination.page < pagination.totalPages - 2) pages.push('...');
    pages.push(pagination.totalPages);
    return pages;
  };

  const stats = {
    total: pagination.total,
    success: loginLogs.filter(l => l.status === 'success').length,
    failed: loginLogs.filter(l => l.status === 'failed').length,
    uniqueUsers: [...new Set(loginLogs.map(l => l.username))].length
  };

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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Login Logs</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaSignInAlt className="text-amber-500" /> Monitor and track user login activities
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL ATTEMPTS', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'SUCCESSFUL', value: stats.success, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'FAILED', value: stats.failed, color: 'border-rose-500', valueClass: 'text-rose-400' },
              { label: 'UNIQUE USERS', value: stats.uniqueUsers, color: 'border-amber-500', valueClass: 'text-amber-400' },
            ].map((card, i) => (
              <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                  <FiTrendingUp className="text-gray-700" />
                </div>
                <h2 className={`text-xl font-bold mt-1 leading-none ${card.valueClass}`}>{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Filters Section */}
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
                  Reset All
                </button>
                <button
                  onClick={applyFilters}
                  className="bg-amber-500/10 hover:bg-amber-600/30 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded font-bold text-[9px] transition-all flex items-center gap-2"
                >
                  <FaFilter /> Apply Filters
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  name="username"
                  placeholder="Search by username..."
                  className={`${inputClass} pl-8`}
                  value={filters.username}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="relative">
                <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  name="ipAddress"
                  placeholder="Search by IP address..."
                  className={`${inputClass} pl-8`}
                  value={filters.ipAddress}
                  onChange={handleFilterChange}
                />
              </div>
              
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className={selectClass}
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-800">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                  <FaCalendarAlt className="text-[9px]" /> Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  className={inputClass}
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                  <FaCalendarAlt className="text-[9px]" /> End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  className={inputClass}
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {loginLogs.length} of {pagination.total} login attempts
            </p>
          </div>

          {/* Login Logs Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <FaSignInAlt /> Login Activity Logs
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('username')}>
                      User {getSortIcon('username')}
                    </th>
                    <th className="px-5 py-3">Device</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('ipAddress')}>
                      IP Address {getSortIcon('ipAddress')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                      Status {getSortIcon('status')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('timestamp')}>
                      Timestamp {getSortIcon('timestamp')}
                    </th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading login logs...</p>
                        </div>
                      </td>
                    </tr>
                  ) : loginLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaSignInAlt className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No login logs found</p>
                          <p className="text-[10px] mt-1 text-gray-600">Login attempts will appear here as users log in</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    loginLogs.map((log) => {
                      const statusInfo = getStatusInfo(log.status);
                      return (
                        <tr key={log._id} className="hover:bg-[#1F2937] transition-colors group">
                          {/* User */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <FaUser className="text-indigo-400 text-[10px]" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{log.username}</div>
                                {log.userId && log.userId.player_id && (
                                  <div className="text-[9px] text-gray-500">ID: {log.userId.player_id}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          
                          {/* Device */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(log.deviceType)}
                              <div>
                                <div className="text-xs font-medium text-gray-300 capitalize">{log.deviceType || 'Unknown'}</div>
                                <div className="text-[9px] text-gray-500">{log.browser || 'Unknown'}</div>
                              </div>
                            </div>
                          </td>
                          
                          {/* IP Address */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs font-mono text-gray-400">{log.ipAddress}</div>
                            {log.location && log.location.country && (
                              <div className="text-[9px] text-gray-600 flex items-center gap-1 mt-0.5">
                                <FaMapMarkerAlt className="text-[8px]" /> {log.location.country}
                              </div>
                            )}
                          </td>
                          
                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1 ${statusInfo.badge}`}>
                                {statusInfo.icon} {statusInfo.label}
                              </span>
                            </div>
                            {log.failureReason && (
                              <div className="text-[8px] text-rose-400/70 mt-1">{log.failureReason}</div>
                            )}
                          </td>
                          
                          {/* Timestamp */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <FaClock className="text-[9px] text-gray-600" />
                              {formatTimeAgo(log.timestamp)}
                            </div>
                            <div className="text-[9px] text-gray-600 mt-0.5">
                              {formatDate(log.timestamp)}
                            </div>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                              onClick={() => showLogDetails(log)}
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
                      onClick={() => fetchLoginLogs(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${pagination.page <= 1 ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >← Prev</button>
                    {getPaginationPages().map((page, idx) =>
                      page === '...' ? (
                        <span key={`e-${idx}`} className="px-2 py-1.5 text-[9px] text-gray-600 font-bold select-none">···</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => fetchLoginLogs(page)}
                          className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${pagination.page === page ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                        >{page}</button>
                      )
                    )}
                    <button
                      onClick={() => fetchLoginLogs(pagination.page + 1)}
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

      {/* Login Log Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128] sticky top-0 z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaSignInAlt /> Login Details
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              {/* User and Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="bg-[#0F111A] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">User Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-500">Username:</span>
                      <span className="text-xs font-medium text-gray-300">{selectedLog.username}</span>
                    </div>
                    {selectedLog.userId && (
                      <div className="flex justify-between">
                        <span className="text-[9px] text-gray-500">User ID:</span>
                        <span className="text-xs font-medium text-gray-300">{selectedLog.userId.username || selectedLog.userId._id}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#0F111A] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Login Status</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-500">Status:</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${selectedLog.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {selectedLog.status}
                      </span>
                    </div>
                    {selectedLog.failureReason && (
                      <div className="flex justify-between">
                        <span className="text-[9px] text-gray-500">Failure Reason:</span>
                        <span className="text-[9px] text-rose-400">{selectedLog.failureReason}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-500">Timestamp:</span>
                      <span className="text-[9px] text-gray-400">{formatDate(selectedLog.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Device and Network Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="bg-[#0F111A] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Device Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-500">Device Type:</span>
                      <span className="text-xs font-medium text-gray-300 capitalize">{selectedLog.deviceType || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-500">Browser:</span>
                      <span className="text-xs font-medium text-gray-300">{selectedLog.browser || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-500">OS:</span>
                      <span className="text-xs font-medium text-gray-300">{selectedLog.os || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#0F111A] p-4 rounded-lg border border-gray-800">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Network Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[9px] text-gray-500">IP Address:</span>
                      <span className="text-xs font-mono text-gray-300">{selectedLog.ipAddress}</span>
                    </div>
                    {selectedLog.location && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[9px] text-gray-500">Country:</span>
                          <span className="text-xs font-medium text-gray-300">{selectedLog.location.country || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[9px] text-gray-500">Region:</span>
                          <span className="text-xs font-medium text-gray-300">{selectedLog.location.region || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[9px] text-gray-500">City:</span>
                          <span className="text-xs font-medium text-gray-300">{selectedLog.location.city || 'Unknown'}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* User Agent */}
              {selectedLog.userAgent && (
                <div className="mb-6">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">User Agent</h4>
                  <div className="bg-[#0F111A] p-3 rounded-lg border border-gray-800 overflow-x-auto">
                    <code className="text-[9px] text-gray-400 break-all">{selectedLog.userAgent}</code>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AllLoginLogs;