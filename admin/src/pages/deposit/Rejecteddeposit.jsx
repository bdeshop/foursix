import React, { useState, useEffect } from 'react';
import {
  FaSearch, FaEye, FaSort, FaSortUp, FaSortDown,
  FaTimesCircle, FaExclamationTriangle,
  FaSpinner, FaCalendarAlt
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiDownload } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import axios from 'axios';

const Rejecteddeposit = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showDepositDetails, setShowDepositDetails] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRejected: 0,
    totalAmount: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const methods = ['all', 'bkash', 'nagad', 'rocket', 'upay', 'bank', 'card', 'opay', 'external_gateway'];

  const fetchRejectedDeposits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/admin/deposits?page=${currentPage}&limit=${itemsPerPage}&status=rejected`;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (methodFilter !== 'all') params.append('method', methodFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (params.toString()) url += `&${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeposits(response.data.deposits);
      setStats({
        totalRejected: response.data.total,
        totalAmount: response.data.totalAmount,
      });
    } catch (err) {
      console.error('Error fetching rejected deposits:', err);
      setError('Failed to load rejected deposits. Please try again.');
      setDeposits([
        {
          _id: '68ae24b8c2b1c27dfe6572c4',
          userId: { username: 'mikejones', player_id: 'PID507957' },
          amount: 7500,
          method: 'rocket',
          phoneNumber: '01798765432',
          transactionId: 'TX456123789',
          paymentId: 'order-507957-456123789',
          status: 'rejected',
          createdAt: '2025-08-27T14:15:45.904Z',
          processedAt: '2025-08-27T14:30:45.904Z',
          adminNotes: 'Insufficient balance in sender account',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedDeposits();
  }, [currentPage, methodFilter, dateRange, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, methodFilter, dateRange]);

  const sortedDeposits = React.useMemo(() => {
    let sortableItems = [...deposits];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = sortConfig.key.includes('.')
          ? sortConfig.key.split('.').reduce((o, i) => o?.[i], a)
          : a[sortConfig.key];
        let bValue = sortConfig.key.includes('.')
          ? sortConfig.key.split('.').reduce((o, i) => o?.[i], b)
          : b[sortConfig.key];
        if (sortConfig.key === 'createdAt' || sortConfig.key === 'processedAt') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [deposits, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-rose-400 inline ml-1" />;
    return <FaSortDown className="text-rose-400 inline ml-1" />;
  };

  const viewDepositDetails = (deposit) => { setSelectedDeposit(deposit); setShowDepositDetails(true); };
  const closeDepositDetails = () => { setShowDepositDetails(false); setSelectedDeposit(null); };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

  const getMethodName = (method) => {
    const map = {
      bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'Upay',
      bank: 'Bank Transfer', card: 'Card', opay: 'OPay', external_gateway: 'External Gateway',
    };
    return map[method] || (method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown');
  };

  const getMethodColor = (method) => {
    const map = {
      bkash: 'text-pink-400', nagad: 'text-orange-400', rocket: 'text-purple-400',
      upay: 'text-blue-400', bank: 'text-teal-400', card: 'text-indigo-400',
      opay: 'text-cyan-400', external_gateway: 'text-gray-400',
    };
    return map[method] || 'text-gray-400';
  };

  const exportToCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/admin/deposits/export?status=rejected`;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (methodFilter !== 'all') params.append('method', methodFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (params.toString()) url += `&${params.toString()}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `rejected_deposits_${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError('Failed to export CSV.');
    }
  };

  const totalPages = Math.ceil(stats.totalRejected / itemsPerPage);
  const getPaginationPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-rose-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-rose-500';

  const CloseIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Rejected Deposits</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-rose-500" /> View and manage rejected deposit transactions
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchRejectedDeposits}
                className="bg-[#1F2937] hover:bg-rose-600/30 border border-gray-700 hover:border-rose-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-rose-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-[#161B22] border-l-4 border-rose-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Rejected</p>
                <FiTrendingUp className="text-gray-700" />
              </div>
              <h2 className="text-xl font-bold mt-1 leading-none text-rose-400">{stats.totalRejected}</h2>
            </div>
            <div className="bg-[#161B22] border-l-4 border-orange-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Total Amount</p>
                <FiTrendingUp className="text-gray-700" />
              </div>
              <h2 className="text-xl font-bold mt-1 leading-none text-orange-400">৳{formatCurrency(stats.totalAmount)}</h2>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-rose-500"></div> Filters & Search
              </h2>
              <button
                onClick={() => { setSearchTerm(''); setMethodFilter('all'); setDateRange({ start: '', end: '' }); }}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-8`}
                  placeholder="Search username, ID or TXN..."
                />
              </div>
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={selectClass}>
                <option value="all">All Methods</option>
                {methods.filter((m) => m !== 'all').map((m, i) => (
                  <option key={i} value={m}>{getMethodName(m)}</option>
                ))}
              </select>
              <select
                className={selectClass}
                value={sortConfig.key || ''}
                onChange={(e) => requestSort(e.target.value)}
              >
                <option value="">Sort By</option>
                <option value="createdAt">Date</option>
                <option value="amount">Amount</option>
                <option value="userId.username">Username</option>
              </select>
            </div>

            <div className="mt-3 flex flex-col md:flex-row gap-2 items-center md:w-2/3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className={inputClass}
              />
              <span className="text-gray-600 text-xs hidden md:block">→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {deposits.length} of {stats.totalRejected} rejected deposits
            </p>
          </div>

          {/* Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-rose-400 uppercase tracking-widest">
              Rejected Deposit Transactions
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>
                      Date & Time {getSortIcon('createdAt')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('userId.username')}>
                      Player {getSortIcon('userId.username')}
                    </th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('amount')}>
                      Amount {getSortIcon('amount')}
                    </th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Transaction ID</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-600">
                          <FaSpinner className="animate-spin text-rose-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading deposits...</p>
                        </div>
                      </td>
                    </tr>
                  ) : sortedDeposits.length > 0 ? (
                    sortedDeposits.map((deposit) => (
                      <tr key={deposit._id} className="hover:bg-[#1F2937] transition-colors">
                        <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(deposit.createdAt)}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-white font-mono">{deposit.userId?.player_id || 'N/A'}</div>
                          <div className="text-[10px] text-gray-500">{deposit.userId?.username || 'Unknown'}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-xs font-bold ${getMethodColor(deposit.method)}`}>{getMethodName(deposit.method)}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm font-black text-rose-400">৳{formatCurrency(deposit.amount)}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-400">{deposit.phoneNumber || 'N/A'}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono text-gray-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-800 block truncate max-w-[140px]">
                            {deposit.transactionId || 'N/A'}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-[9px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1 w-fit bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <FaTimesCircle className="text-rose-400" /> rejected
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => viewDepositDetails(deposit)}
                            className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                            title="View"
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaSearch className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No rejected deposits found</p>
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
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {stats.totalRejected} total
              </p>
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === 1
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-rose-600/30 hover:border-rose-500/50'
                  }`}
                >← Prev</button>

                {getPaginationPages().map((page, idx) =>
                  page === '...' ? (
                    <span key={`e-${idx}`} className="px-2 py-1.5 text-xs text-gray-600 font-bold select-none">···</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                        currentPage === page
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-rose-600/30 hover:border-rose-500/50'
                      }`}
                    >{page}</button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === totalPages
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-rose-600/30 hover:border-rose-500/50'
                  }`}
                >Next →</button>
              </nav>
            </div>
          )}
        </main>
      </div>

      {/* Deposit Details Modal */}
      {showDepositDetails && selectedDeposit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Rejected Deposit Details</h3>
              <button onClick={closeDepositDetails} className="text-gray-500 hover:text-gray-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Transaction Info</p>
                  <dl className="space-y-2">
                    {[
                      ['Deposit ID', selectedDeposit._id],
                      ['Transaction ID', selectedDeposit.transactionId || 'N/A'],
                      ['Payment ID', selectedDeposit.paymentId || 'N/A'],
                      ['Date & Time', formatDate(selectedDeposit.createdAt)],
                      ['Payment Method', getMethodName(selectedDeposit.method)],
                      ...(selectedDeposit.processedAt ? [['Processed At', formatDate(selectedDeposit.processedAt)]] : []),
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500 shrink-0">{label}:</dt>
                        <dd className="text-xs font-medium text-gray-200 text-right truncate max-w-[180px]">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">User Info</p>
                  <dl className="space-y-2">
                    {[
                      ['Player ID', selectedDeposit.userId?.player_id || 'N/A'],
                      ['Username', selectedDeposit.userId?.username || 'Unknown'],
                      ['Phone', selectedDeposit.phoneNumber || 'N/A'],
                      ['User ID', selectedDeposit.userId?._id || 'N/A'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500">{label}:</dt>
                        <dd className="text-xs font-medium text-gray-200 text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="bg-[#0F111A] border border-gray-800 p-4 rounded mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Amount</span>
                  <span className="text-2xl font-black text-rose-400">৳{formatCurrency(selectedDeposit.amount)}</span>
                </div>
              </div>

              <div className="mb-5 flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Status:</span>
                <span className="text-[9px] px-3 py-1 rounded font-bold uppercase flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <FaTimesCircle className="text-rose-400" /> rejected
                </span>
              </div>

              {selectedDeposit.adminNotes && (
                <div className="mb-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Admin Notes</p>
                  <p className="text-xs text-gray-400 bg-[#0F111A] border border-gray-800 p-3 rounded">{selectedDeposit.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end">
              <button
                onClick={closeDepositDetails}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Rejecteddeposit;