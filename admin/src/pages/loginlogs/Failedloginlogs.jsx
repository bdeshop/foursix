import React, { useState, useEffect } from 'react';
import { FaBell, FaPaperPlane, FaEdit, FaTrash, FaSearch, FaFilter, FaTimes, FaUser, FaUsers, FaEye, FaChevronLeft, FaChevronRight, FaSignInAlt, FaDesktop, FaMobile, FaTablet, FaExclamationTriangle, FaSpinner, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { FaCalendarAlt } from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

const FailedLoginLogs = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failedLogins, setFailedLogins] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    username: '',
    ipAddress: '',
    isLocked: 'all',
    startDate: '',
    endDate: ''
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'lastAttempt', direction: 'descending' });
  const [error, setError] = useState(null);

  // Fetch failed login logs on component mount
  useEffect(() => {
    fetchFailedLogins();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchFailedLogins = async (page = 1, filtersObj = filters) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...filtersObj
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === 'all') {
          delete params[key];
        }
      });

      const response = await axios.get(`${base_url}/api/admin/failed-logins`, { params });
      setFailedLogins(response.data.failedLogins);
      setPagination({
        ...pagination,
        page,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching failed login logs:', error);
      setError('Failed to load failed login attempts. Please try again.');
      toast.error('Failed to fetch failed login logs');
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
    fetchFailedLogins(1, filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      username: '',
      ipAddress: '',
      isLocked: 'all',
      startDate: '',
      endDate: ''
    };
    setFilters(defaultFilters);
    fetchFailedLogins(1, defaultFilters);
  };

  const showLogDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const unlockAccount = async (id) => {
    try {
      await axios.put(`${base_url}/api/admin/failed-logins/${id}/unlock`);
      toast.success('Account unlocked successfully');
      fetchFailedLogins(); // Refresh the list
    } catch (error) {
      console.error('Error unlocking account:', error);
      toast.error('Failed to unlock account');
    }
  };

  const clearFailedLogins = async () => {
    if (!window.confirm('Are you sure you want to clear all failed login attempts?')) {
      return;
    }

    try {
      await axios.delete(`${base_url}/api/admin/failed-logins/clear`);
      toast.success('Failed login attempts cleared successfully');
      fetchFailedLogins(); // Refresh the list
    } catch (error) {
      console.error('Error clearing failed login attempts:', error);
      toast.error('Failed to clear failed login attempts');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    fetchFailedLogins(pagination.page, filters);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-indigo-400 inline ml-1" />;
    return <FaSortDown className="text-indigo-400 inline ml-1" />;
  };

  const getStatusInfo = (isLocked, lockedUntil) => {
    if (isLocked) {
      return {
        icon: <FaExclamationTriangle className="text-rose-400" />,
        badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        text: 'Locked'
      };
    }
    return {
      icon: <FaCheckCircle className="text-emerald-400" />,
      badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      text: 'Active'
    };
  };

  const getPaginationPages = () => {
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500';

  if (loading && failedLogins.length === 0) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="animate-spin text-indigo-400 text-3xl" />
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Failed Login Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Failed Login Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">User Information</p>
                  <dl className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <dt className="text-xs text-gray-500">Username:</dt>
                      <dd className="text-xs font-medium text-gray-200 text-right">{selectedLog.username}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-xs text-gray-500">Attempt Count:</dt>
                      <dd className="text-xs font-medium text-rose-400 text-right">{selectedLog.attemptCount} attempts</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Status Information</p>
                  <dl className="space-y-2">
                    <div className="flex justify-between gap-4">
                      <dt className="text-xs text-gray-500">Status:</dt>
                      <dd>
                        <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1 w-fit ${getStatusInfo(selectedLog.isLocked, selectedLog.lockedUntil).badge}`}>
                          {getStatusInfo(selectedLog.isLocked, selectedLog.lockedUntil).icon}
                          {getStatusInfo(selectedLog.isLocked, selectedLog.lockedUntil).text}
                        </span>
                      </dd>
                    </div>
                    {selectedLog.lockedUntil && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500">Locked Until:</dt>
                        <dd className="text-xs text-gray-400 text-right">{formatDate(selectedLog.lockedUntil)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt className="text-xs text-gray-500">Last Attempt:</dt>
                      <dd className="text-xs text-gray-400 text-right">{formatDate(selectedLog.lastAttempt)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Network Information</p>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-xs text-gray-500">IP Address:</dt>
                    <dd className="text-xs font-mono text-gray-400 text-right">{selectedLog.ipAddress}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              {selectedLog.isLocked && (
                <button
                  onClick={() => {
                    unlockAccount(selectedLog._id);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Unlock Account
                </button>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          {/* Error Banner */}
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300 ml-4 text-lg leading-none">×</button>
            </div>
          )}

          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Failed Login Attempts</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaExclamationTriangle className="text-rose-500" /> Monitor and manage security threats
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => fetchFailedLogins()}
                className="bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
              <button
                onClick={clearFailedLogins}
                className="bg-rose-600 hover:bg-rose-700 border border-rose-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FaTrash className="text-xs" /> CLEAR ALL
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL ATTEMPTS', value: pagination.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'LOCKED ACCOUNTS', value: failedLogins.filter(l => l.isLocked).length, color: 'border-rose-500', valueClass: 'text-rose-400' },
              { label: 'ACTIVE', value: failedLogins.filter(l => !l.isLocked).length, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'UNIQUE IPS', value: new Set(failedLogins.map(l => l.ipAddress)).size, color: 'border-amber-500', valueClass: 'text-amber-400' },
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

          {/* Filters */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500"></div> Filters & Search
              </h2>
              <button
                onClick={resetFilters}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  name="username"
                  value={filters.username}
                  onChange={handleFilterChange}
                  className={`${inputClass} pl-8`}
                  placeholder="Search by username..."
                />
              </div>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  name="ipAddress"
                  value={filters.ipAddress}
                  onChange={handleFilterChange}
                  className={`${inputClass} pl-8`}
                  placeholder="Search by IP address..."
                />
              </div>
              <select
                name="isLocked"
                value={filters.isLocked}
                onChange={handleFilterChange}
                className={selectClass}
              >
                <option value="all">All Status</option>
                <option value="true">Locked</option>
                <option value="false">Active</option>
              </select>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <FaFilter /> APPLY FILTERS
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className={inputClass}
                placeholder="Start Date"
              />
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className={inputClass}
                placeholder="End Date"
              />
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 text-gray-300 rounded font-bold text-xs transition-all"
              >
                Filter by Date
              </button>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {failedLogins.length} of {pagination.total} failed attempts
            </p>
          </div>

          {/* Failed Login Logs Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-rose-400 uppercase tracking-widest flex justify-between items-center">
              <span>Failed Login Attempts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('username')}>
                      Username {getSortIcon('username')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('attemptCount')}>
                      Attempts {getSortIcon('attemptCount')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('ipAddress')}>
                      IP Address {getSortIcon('ipAddress')}
                    </th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('lastAttempt')}>
                      Last Attempt {getSortIcon('lastAttempt')}
                    </th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {failedLogins.length > 0 ? (
                    failedLogins.map((log) => {
                      const statusInfo = getStatusInfo(log.isLocked, log.lockedUntil);
                      return (
                        <tr key={log._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
                                <FaUser className="text-rose-400 text-xs" />
                              </div>
                              <div className="text-sm font-bold text-white">{log.username}</div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                              {log.attemptCount} attempts
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-mono text-gray-400">{log.ipAddress}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1 w-fit ${statusInfo.badge}`}>
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                            {log.lockedUntil && (
                              <div className="text-[9px] text-gray-600 mt-1">Until: {formatShortDate(log.lockedUntil)}</div>
                            )}
                           </td>
                          <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                            {formatDate(log.lastAttempt)}
                           </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => showLogDetails(log)}
                                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              {log.isLocked && (
                                <button
                                  onClick={() => unlockAccount(log._id)}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-emerald-400 rounded text-xs transition-all"
                                  title="Unlock Account"
                                >
                                  <FaTimes />
                                </button>
                              )}
                            </div>
                           </td>
                         </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaExclamationTriangle className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No failed attempts found</p>
                          <p className="text-xs mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Page {pagination.page} of {pagination.totalPages} &nbsp;·&nbsp; {pagination.total} total
              </p>
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => fetchFailedLogins(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    pagination.page === 1
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600 hover:border-indigo-500'
                  }`}
                >
                  ← Prev
                </button>

                {getPaginationPages().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-xs text-gray-600 font-bold select-none">
                      ···
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => fetchFailedLogins(page)}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                        pagination.page === page
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600/30 hover:border-indigo-500/50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => fetchFailedLogins(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    pagination.page === pagination.totalPages
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600 hover:border-indigo-500'
                  }`}
                >
                  Next →
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>
      <Toaster position="top-right" />
    </section>
  );
};

export default FailedLoginLogs;