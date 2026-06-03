import React, { useState, useEffect } from 'react';
import {
  FaSearch, FaEye, FaSort, FaSortUp, FaSortDown,
  FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle,
  FaSpinner, FaCalendarAlt
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiDownload } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Approvedwithdraw = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    completedAmount: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const methods = ['all', 'bkash', 'rocket', 'nagad', 'bank'];

  const getAccountDetails = (withdrawal) => {
    if (!withdrawal) return { accountNumber: 'N/A', fullDetails: 'N/A' };
    if (['bkash', 'rocket', 'nagad'].includes(withdrawal.method)) {
      if (withdrawal.mobileBankingDetails) {
        return {
          accountNumber: withdrawal.mobileBankingDetails.phoneNumber,
          accountType: withdrawal.mobileBankingDetails.accountType,
          fullDetails: `${withdrawal.mobileBankingDetails.phoneNumber}${withdrawal.mobileBankingDetails.accountType ? ` (${withdrawal.mobileBankingDetails.accountType})` : ''}`,
        };
      }
      return { accountNumber: withdrawal.phoneNumber || 'N/A', fullDetails: withdrawal.phoneNumber || 'N/A' };
    } else if (withdrawal.method === 'bank') {
      if (withdrawal.bankDetails) {
        return {
          accountNumber: withdrawal.bankDetails.accountNumber,
          bankName: withdrawal.bankDetails.bankName,
          accountHolderName: withdrawal.bankDetails.accountHolderName,
          branchName: withdrawal.bankDetails.branchName,
          district: withdrawal.bankDetails.district,
          routingNumber: withdrawal.bankDetails.routingNumber,
          fullDetails: `${withdrawal.bankDetails.bankName} - ${withdrawal.bankDetails.accountNumber}`,
        };
      }
      return { accountNumber: 'N/A', fullDetails: 'N/A' };
    }
    return { accountNumber: 'N/A', fullDetails: 'N/A' };
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('usertoken') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: 'completed',
          method: methodFilter !== 'all' ? methodFilter : undefined,
          search: searchTerm || undefined,
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
          sortBy: sortConfig.key || 'createdAt',
          sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc',
        },
      });

      if (response.data) {
        const arr = response.data.withdrawals || response.data.data || [];
        setWithdrawals(arr);
        const totalAmount = arr.reduce((sum, w) => sum + (w.amount || 0), 0);
        setStats({ total: arr.length, totalAmount, completedAmount: totalAmount });
      }
    } catch (err) {
      console.error('Error fetching completed withdrawals:', err);
      setError('Failed to load completed withdrawals. Please try again.');
      const sampleData = [
        {
          _id: '69c4c57a9763d121d14b47c0',
          userId: { _id: '69c4c4629763d121d14b418a', username: 'testuser', player_id: 'PID123456' },
          method: 'bkash',
          mobileBankingDetails: { phoneNumber: '01655585555', accountType: 'personal' },
          bankDetails: null,
          amount: 500,
          status: 'completed',
          transactionId: 'TXN123456789',
          processedAt: '2026-03-26T06:34:50.687Z',
          createdAt: '2026-03-26T05:34:50.687Z',
          adminNote: 'Withdrawal processed successfully',
        },
        {
          _id: '69c4c5be9763d121d14b4803',
          userId: { _id: '69c4c4629763d121d14b418a', username: 'testuser', player_id: 'PID123456' },
          method: 'bank',
          mobileBankingDetails: null,
          bankDetails: {
            bankName: 'Dutch Bangla Bank',
            accountHolderName: 'John Doe',
            accountNumber: '435345345345',
            branchName: 'Main Branch',
            district: 'Dhaka',
            routingNumber: '123456789',
          },
          amount: 500,
          status: 'completed',
          transactionId: 'TXN987654321',
          processedAt: '2026-03-26T06:35:58.042Z',
          createdAt: '2026-03-26T05:35:58.042Z',
          adminNote: 'Bank transfer completed',
        },
      ];
      setWithdrawals(sampleData);
      const totalAmount = sampleData.reduce((sum, w) => sum + w.amount, 0);
      setStats({ total: sampleData.length, totalAmount, completedAmount: totalAmount });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Processed Date', 'Player ID', 'Username', 'Method', 'Amount', 'Account Details', 'Transaction ID', 'Admin Notes'];
      const csvData = withdrawals.map((w) => [
        formatDate(w.createdAt),
        formatDate(w.processedAt),
        w.userId?.player_id || 'N/A',
        w.userId?.username || 'N/A',
        getMethodName(w.method),
        w.amount,
        getAccountDetails(w).fullDetails,
        w.transactionId || 'N/A',
        w.adminNote || '',
      ]);
      const csvContent = [headers, ...csvData].map((row) => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `completed_withdrawals_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully!');
    } catch (err) {
      toast.error('Failed to export data.');
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [currentPage, methodFilter, searchTerm, dateRange, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, methodFilter, dateRange]);

  const sortedWithdrawals = React.useMemo(() => {
    let sortableItems = [...withdrawals];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (['createdAt', 'processedAt'].includes(sortConfig.key)) {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        if (sortConfig.key === 'userId') {
          aValue = a.userId?.username || '';
          bValue = b.userId?.username || '';
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [withdrawals, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-emerald-400 inline ml-1" />;
    return <FaSortDown className="text-emerald-400 inline ml-1" />;
  };

  const viewWithdrawalDetails = (w) => { setSelectedWithdrawal(w); setShowWithdrawalDetails(true); };
  const closeWithdrawalDetails = () => { setShowWithdrawalDetails(false); setSelectedWithdrawal(null); };

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
    const map = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', bank: 'Bank Transfer' };
    return map[method] || (method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown');
  };

  const getMethodColor = (method) => {
    const map = { bkash: 'text-pink-400', nagad: 'text-orange-400', rocket: 'text-purple-400', bank: 'text-teal-400' };
    return map[method] || 'text-gray-400';
  };

  const totalPages = Math.ceil(stats.total / itemsPerPage);
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

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-emerald-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-emerald-500';

  const CloseIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }}
      />
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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Completed Withdrawals</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-emerald-500" /> View all successfully processed withdrawal transactions
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={exportToCSV}
                className="bg-[#1F2937] hover:bg-emerald-600/20 border border-gray-700 hover:border-emerald-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-emerald-400"
              >
                <FiDownload /> EXPORT CSV
              </button>
              <button
                onClick={fetchWithdrawals}
                className="bg-[#1F2937] hover:bg-emerald-600/30 border border-gray-700 hover:border-emerald-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-emerald-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'TOTAL COMPLETED', value: stats.total, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'TOTAL AMOUNT', value: `৳${formatCurrency(stats.totalAmount)}`, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'PAID OUT', value: `৳${formatCurrency(stats.completedAmount)}`, color: 'border-teal-500', valueClass: 'text-teal-400' },
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
                <div className="w-1 h-4 bg-emerald-500"></div> Filters & Search
              </h2>
              <button
                onClick={() => { setSearchTerm(''); setMethodFilter('all'); setDateRange({ start: '', end: '' }); }}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-8`}
                  placeholder="Search username, ID, account or TXN..."
                />
              </div>
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={selectClass}>
                <option value="all">All Methods</option>
                {methods.filter((m) => m !== 'all').map((m, i) => (
                  <option key={i} value={m}>{getMethodName(m)}</option>
                ))}
              </select>
              <select className={selectClass} value={sortConfig.key || ''} onChange={(e) => requestSort(e.target.value)}>
                <option value="">Sort By</option>
                <option value="createdAt">Request Date</option>
                <option value="processedAt">Processed Date</option>
                <option value="amount">Amount</option>
                <option value="userId">Username</option>
              </select>
            </div>

            <div className="mt-3 flex flex-col md:flex-row gap-2 items-center md:w-2/3">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className={inputClass} />
              <span className="text-gray-600 text-xs hidden md:block">→</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {withdrawals.length} of {stats.total} completed withdrawals
            </p>
          </div>

          {/* Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-emerald-400 uppercase tracking-widest">
              Completed Withdrawal Transactions
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('processedAt')}>
                      Processed Date {getSortIcon('processedAt')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('userId')}>
                      Player {getSortIcon('userId')}
                    </th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('amount')}>
                      Amount {getSortIcon('amount')}
                    </th>
                    <th className="px-5 py-3">Account Details</th>
                    <th className="px-5 py-3">Transaction ID</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaSpinner className="animate-spin text-emerald-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading completed withdrawals...</p>
                        </div>
                      </td>
                    </tr>
                  ) : sortedWithdrawals.length > 0 ? (
                    sortedWithdrawals.map((withdrawal) => {
                      const accountDetails = getAccountDetails(withdrawal);
                      return (
                        <tr key={withdrawal._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(withdrawal.processedAt || withdrawal.createdAt)}</div>
                            <div className="text-[9px] text-emerald-500 font-bold uppercase mt-0.5">Completed</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-white font-mono">{withdrawal.userId?.player_id || 'N/A'}</div>
                            <div className="text-[10px] text-gray-500">{withdrawal.userId?.username || 'Unknown'}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-xs font-bold ${getMethodColor(withdrawal.method)}`}>{getMethodName(withdrawal.method)}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm font-black text-emerald-400">৳{formatCurrency(withdrawal.amount)}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="text-xs font-mono text-gray-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-800 block truncate max-w-[160px]"
                              title={accountDetails.fullDetails}
                            >
                              {accountDetails.fullDetails}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs font-mono text-gray-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-800 block truncate max-w-[130px]">
                              {withdrawal.transactionId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              onClick={() => viewWithdrawalDetails(withdrawal)}
                              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                              title="View"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaSearch className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No completed withdrawals found</p>
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
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {stats.total} total
              </p>
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === 1
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-emerald-600/30 hover:border-emerald-500/50'
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
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-emerald-600/30 hover:border-emerald-500/50'
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
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-emerald-600/30 hover:border-emerald-500/50'
                  }`}
                >Next →</button>
              </nav>
            </div>
          )}
        </main>
      </div>

      {/* Withdrawal Details Modal */}
      {showWithdrawalDetails && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Completed Withdrawal Details</h3>
              <button onClick={closeWithdrawalDetails} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Transaction Info</p>
                  <dl className="space-y-2">
                    {[
                      ['Withdrawal ID', selectedWithdrawal._id],
                      ['Transaction ID', selectedWithdrawal.transactionId || 'N/A'],
                      ['Requested At', formatDate(selectedWithdrawal.createdAt)],
                      ['Completed At', formatDate(selectedWithdrawal.processedAt)],
                      ['Payment Method', getMethodName(selectedWithdrawal.method)],
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
                      ['Player ID', selectedWithdrawal.userId?.player_id || 'N/A'],
                      ['Username', selectedWithdrawal.userId?.username || 'Unknown'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500">{label}:</dt>
                        <dd className="text-xs font-medium text-gray-200 text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-[#0F111A] border border-emerald-500/20 p-4 rounded mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Amount Paid</span>
                  <span className="text-2xl font-black text-emerald-400">৳{formatCurrency(selectedWithdrawal.amount)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-[#0F111A] border border-gray-800 p-4 rounded mb-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Payment Details</p>
                <dl className="space-y-2">
                  {(() => {
                    const m = selectedWithdrawal.method;
                    if (['bkash', 'rocket', 'nagad'].includes(m) && selectedWithdrawal.mobileBankingDetails) {
                      const d = selectedWithdrawal.mobileBankingDetails;
                      return (
                        <>
                          <div className="flex justify-between gap-4">
                            <dt className="text-xs text-gray-500">Phone Number:</dt>
                            <dd className="text-xs font-medium text-gray-200">{d.phoneNumber}</dd>
                          </div>
                          {d.accountType && (
                            <div className="flex justify-between gap-4">
                              <dt className="text-xs text-gray-500">Account Type:</dt>
                              <dd className="text-xs font-medium text-gray-200 capitalize">{d.accountType}</dd>
                            </div>
                          )}
                        </>
                      );
                    } else if (m === 'bank' && selectedWithdrawal.bankDetails) {
                      const d = selectedWithdrawal.bankDetails;
                      return [
                        ['Bank Name', d.bankName],
                        ['Account Holder', d.accountHolderName],
                        ['Account Number', d.accountNumber],
                        ['Branch', d.branchName],
                        ['District', d.district],
                        ['Routing Number', d.routingNumber],
                      ].map(([label, val]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <dt className="text-xs text-gray-500">{label}:</dt>
                          <dd className="text-xs font-medium text-gray-200 font-mono">{val}</dd>
                        </div>
                      ));
                    }
                    return <p className="text-xs text-gray-600">No additional details available</p>;
                  })()}
                </dl>
              </div>

              {/* Status */}
              <div className="mb-5 flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Status:</span>
                <span className="text-[9px] px-3 py-1 rounded font-bold uppercase flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FaCheckCircle className="text-emerald-400" /> completed
                </span>
              </div>

              {selectedWithdrawal.adminNote && (
                <div className="mb-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Admin Notes</p>
                  <p className="text-xs text-gray-400 bg-[#0F111A] border border-gray-800 p-3 rounded">{selectedWithdrawal.adminNote}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end">
              <button
                onClick={closeWithdrawalDetails}
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

export default Approvedwithdraw;