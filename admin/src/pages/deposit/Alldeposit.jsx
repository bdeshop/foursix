import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaEye, FaSort, FaSortUp, FaSortDown, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { FaCalendarAlt } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import axios from 'axios';

const Alldeposit = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showDepositDetails, setShowDepositDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalAmount: 0,
    completedAmount: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const statuses = ['all', 'pending', 'completed', 'cancelled'];
  const methods = ['all', 'bkash', 'nagad', 'rocket', 'upay', 'bank', 'card'];

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/admin/deposits?page=${currentPage}&limit=${itemsPerPage}`;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (methodFilter !== 'all') params.append('method', methodFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (params.toString()) url += `&${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDeposits(response.data.deposits);
      setStats({
        total: response.data.total,
        completed: response.data.statusCounts?.find((s) => s._id === 'approved')?.count || 0,
        pending: response.data.statusCounts?.find((s) => s._id === 'pending')?.count || 0,
        totalAmount: response.data.totalAmount,
        completedAmount: response.data.statusCounts?.find((s) => s._id === 'approved')?.amount || 0,
      });
    } catch (err) {
      console.error('Error fetching deposits:', err);
      setError('Failed to load deposits. Please try again.');
      // Mock data for demo
      setDeposits([
        {
          _id: '68ae24b8c2b1c27dfe6572c1',
          userId: { username: 'abusaid', player_id: 'PID507954' },
          amount: 5000,
          method: 'bkash',
          phoneNumber: '01712345678',
          transactionId: 'TX789456123',
          status: 'approved',
          createdAt: '2025-08-26T21:18:48.904Z',
          processedAt: '2025-08-26T21:25:48.904Z',
          adminNotes: 'Initial deposit',
        },
        {
          _id: '68ae24b8c2b1c27dfe6572c2',
          userId: { username: 'johndoe', player_id: 'PID507955' },
          amount: 10000,
          method: 'bank',
          phoneNumber: '01987654321',
          transactionId: 'TX987654321',
          status: 'pending',
          createdAt: '2025-08-27T10:15:30.904Z',
          processedAt: null,
          adminNotes: 'Waiting for confirmation',
        },
      ]);
      setStats({
        total: 2,
        completed: 1,
        pending: 1,
        totalAmount: 15000,
        completedAmount: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/deposits-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats((prev) => ({
        ...prev,
        total: response.data.total.totalCount,
        completed: response.data.byStatus?.find((s) => s._id === 'approved')?.count || 0,
        pending: response.data.byStatus?.find((s) => s._id === 'pending')?.count || 0,
        totalAmount: response.data.total.totalAmount,
        completedAmount: response.data.byStatus?.find((s) => s._id === 'approved')?.amount || 0,
      }));
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchDeposits();
    fetchStats();
  }, [currentPage, statusFilter, methodFilter, dateRange, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, dateRange, itemsPerPage]);

  const updateDepositStatus = async (depositId, newStatus, notes = '') => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/admin/deposits/${depositId}/status`,
        { status: newStatus, adminNotes: notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDeposits();
      fetchStats();
      setShowDepositDetails(false);
    } catch (err) {
      setError('Failed to update deposit status.');
    }
  };

  const editDeposit = async (depositId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/admin/deposits/${depositId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDeposits();
      setShowEditModal(false);
    } catch (err) {
      setError('Failed to edit deposit.');
    }
  };

  const deleteDeposit = async (depositId) => {
    if (!window.confirm('Are you sure you want to delete this deposit? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/deposits/${depositId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDeposits();
      fetchStats();
      setShowDepositDetails(false);
    } catch (err) {
      setError('Failed to delete deposit.');
    }
  };

  // Helper function to format date for export
  const formatDateForExport = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Helper function to get filtered data for export
  const getFilteredDataForExport = () => {
    let filtered = [...deposits];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(deposit => 
        deposit.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.userId?.player_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deposit.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(deposit => deposit.status === statusFilter);
    }
    
    // Apply method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(deposit => deposit.method === methodFilter);
    }
    
    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(deposit => new Date(deposit.createdAt) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(deposit => new Date(deposit.createdAt) <= endDate);
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
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
    
    return filtered;
  };

  // Custom CSV Export - No external libraries
  const exportToCSV = () => {
    try {
      const dataToExport = getFilteredDataForExport();
      
      if (dataToExport.length === 0) {
        setError('No data to export. Please adjust your filters.');
        return;
      }
      
      // Define CSV headers
      const headers = [
        'Date & Time',
        'Player ID',
        'Username',
        'Method',
        'Amount (BDT)',
        'Phone Number',
        'Transaction ID',
        'Status',
        'Processed At',
        'Admin Notes'
      ];
      
      // Convert data to CSV rows
      const rows = dataToExport.map(deposit => [
        formatDateForExport(deposit.createdAt),
        deposit.userId?.player_id || 'N/A',
        deposit.userId?.username || 'Unknown',
        getMethodName(deposit.method),
        deposit.amount,
        deposit.phoneNumber || 'N/A',
        deposit.transactionId || 'N/A',
        deposit.status.toUpperCase(),
        deposit.processedAt ? formatDateForExport(deposit.processedAt) : 'N/A',
        (deposit.adminNotes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
      ]);
      
      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Add BOM for UTF-8 with Bengali support
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Build filename with filter context
      let filterContext = '';
      if (statusFilter !== 'all') filterContext += `_${statusFilter}`;
      if (methodFilter !== 'all') filterContext += `_${methodFilter}`;
      if (searchTerm) filterContext += `_search`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', `deposits${filterContext}_${timestamp}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setError(null);
    } catch (err) {
      console.error('CSV Export error:', err);
      setError('Failed to export CSV. Please try again.');
    }
  };
  
  // Custom Excel (XLS) Export - No external libraries, pure HTML table method
  const exportToExcel = () => {
    try {
      const dataToExport = getFilteredDataForExport();
      
      if (dataToExport.length === 0) {
        setError('No data to export. Please adjust your filters.');
        return;
      }
      
      // Build HTML table for Excel
      let htmlContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Deposit Report</title>
          <style>
            th { background-color: #4F46E5; color: white; padding: 8px; border: 1px solid #ddd; }
            td { padding: 6px; border: 1px solid #ddd; }
            table { border-collapse: collapse; width: 100%; }
          </style>
        </head>
        <body>
          <h2>Deposit Transactions Report</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <p>Filters Applied: ${statusFilter !== 'all' ? `Status: ${statusFilter} | ` : ''}${methodFilter !== 'all' ? `Method: ${methodFilter} | ` : ''}${searchTerm ? `Search: ${searchTerm}` : 'No search filter'}</p>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Player ID</th>
                <th>Username</th>
                <th>Method</th>
                <th>Amount (BDT)</th>
                <th>Phone Number</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Processed At</th>
                <th>Admin Notes</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Add data rows
      dataToExport.forEach(deposit => {
        htmlContent += `
          <tr>
            <td>${formatDateForExport(deposit.createdAt)}</td>
            <td>${deposit.userId?.player_id || 'N/A'}</td>
            <td>${deposit.userId?.username || 'Unknown'}</td>
            <td>${getMethodName(deposit.method)}</td>
            <td>${deposit.amount}</td>
            <td>${deposit.phoneNumber || 'N/A'}</td>
            <td>${deposit.transactionId || 'N/A'}</td>
            <td>${deposit.status.toUpperCase()}</td>
            <td>${deposit.processedAt ? formatDateForExport(deposit.processedAt) : 'N/A'}</td>
            <td>${(deposit.adminNotes || '').replace(/[&<>]/g, function(m) {
              if (m === '&') return '&amp;';
              if (m === '<') return '&lt;';
              if (m === '>') return '&gt;';
              return m;
            })}</td>
          </tr>
        `;
      });
      
      // Add summary row
      const totalAmount = dataToExport.reduce((sum, d) => sum + (d.amount || 0), 0);
      const completedAmount = dataToExport.filter(d => d.status === 'approved').reduce((sum, d) => sum + (d.amount || 0), 0);
      
      htmlContent += `
            </tbody>
            <tfoot>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td colspan="4" style="text-align: right;">Total:</td>
                <td>${totalAmount} BDT</td>
                <td colspan="5"></td>
              </tr>
              <tr style="background-color: #f3f4f6; font-weight: bold;">
                <td colspan="4" style="text-align: right;">Completed Amount:</td>
                <td>${completedAmount} BDT</td>
                <td colspan="5"></td>
              </tr>
            </tfoot>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Total Records: ${dataToExport.length}</p>
        </body>
        </html>
      `;
      
      // Create blob with proper MIME type for Excel
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Build filename with filter context
      let filterContext = '';
      if (statusFilter !== 'all') filterContext += `_${statusFilter}`;
      if (methodFilter !== 'all') filterContext += `_${methodFilter}`;
      if (searchTerm) filterContext += `_search`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', `deposits${filterContext}_${timestamp}.xls`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setError(null);
    } catch (err) {
      console.error('Excel Export error:', err);
      setError('Failed to export Excel file. Please try again.');
    }
  };

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
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-indigo-400 inline ml-1" />;
    return <FaSortDown className="text-indigo-400 inline ml-1" />;
  };

  const viewDepositDetails = (deposit) => {
    setSelectedDeposit(deposit);
    setShowDepositDetails(true);
  };

  const closeDepositDetails = () => {
    setShowDepositDetails(false);
    setSelectedDeposit(null);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved':
        return {
          icon: <FaCheckCircle className="text-emerald-400" />,
          badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        };
      case 'pending':
        return {
          icon: <FaClock className="text-amber-400" />,
          badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        };
      case 'rejected':
      case 'cancelled':
        return {
          icon: <FaTimesCircle className="text-rose-400" />,
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        };
      default:
        return {
          icon: <FaExclamationTriangle className="text-gray-400" />,
          badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
        };
    }
  };

  const getMethodName = (method) => {
    const map = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', upay: 'Upay', bank: 'Bank Transfer', card: 'Card' };
    return map[method] || method;
  };

  const getMethodColor = (method) => {
    const map = {
      bkash: 'text-pink-400',
      nagad: 'text-orange-400',
      rocket: 'text-purple-400',
      upay: 'text-blue-400',
      bank: 'text-teal-400',
      card: 'text-indigo-400',
    };
    return map[method] || 'text-gray-400';
  };

  // Smart pagination: always show first, last, current ± 1, with ellipsis
  const getPaginationPages = () => {
    const totalPages = Math.ceil(stats.total / itemsPerPage);
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

  const totalPages = Math.ceil(stats.total / itemsPerPage);

  const inputClass =
    'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-gray-600';
  const selectClass =
    'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500';

  if (loading && deposits.length === 0) {
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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Deposit Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-indigo-500" /> Track and manage all deposit transactions
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={exportToCSV}
                className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiDownload /> EXPORT CSV
              </button>
              <button
                onClick={exportToExcel}
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiDownload /> EXPORT EXCEL
              </button>
              <button
                onClick={() => { fetchDeposits(); fetchStats(); }}
                className="bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL DEPOSITS', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'APPROVED', value: stats.completed, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'PENDING', value: stats.pending, color: 'border-amber-500', valueClass: 'text-amber-400' },
              { label: 'TOTAL AMOUNT', value: `৳${formatCurrency(stats.totalAmount)}`, color: 'border-rose-500', valueClass: 'text-rose-400' },
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

          {/* Approved Amount Banner */}
          <div className="bg-[#161B22] border border-gray-800 rounded mb-6 px-5 py-3 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Approved Amount</span>
            <span className="text-emerald-400 font-black text-sm">৳{formatCurrency(stats.completedAmount)}</span>
          </div>

          {/* Filters */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500"></div> Filters & Search
              </h2>
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setMethodFilter('all'); setDateRange({ start: '', end: '' }); }}
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-8`}
                  placeholder="Search username, ID or TXN..."
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">All Status</option>
                {statuses.filter((s) => s !== 'all').map((s, i) => (
                  <option key={i} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={selectClass}>
                <option value="all">All Methods</option>
                {methods.filter((m) => m !== 'all').map((m, i) => (
                  <option key={i} value={m}>{getMethodName(m)}</option>
                ))}
              </select>
              <select className={selectClass} value={sortConfig.key || ''} onChange={(e) => requestSort(e.target.value)}>
                <option value="">Sort By</option>
                <option value="createdAt">Date</option>
                <option value="amount">Amount</option>
                <option value="userId.username">Username</option>
              </select>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col md:flex-row gap-2 items-center">
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
          </div>

          {/* Results Info & Items Per Page Selector */}
          <div className="mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {deposits.length} of {stats.total} deposits
            </p>
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-indigo-400 uppercase tracking-widest">
              All Deposit Transactions
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
                  {sortedDeposits.length > 0 ? (
                    sortedDeposits.map((deposit) => {
                      const statusInfo = getStatusInfo(deposit.status);
                      return (
                        <tr key={deposit._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(deposit.createdAt)}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-white font-mono">{deposit.userId?.player_id || 'N/A'}</div>
                            <div className="text-[10px] text-yellow-500">{deposit.userId?.username || 'Unknown'}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-xs font-bold ${getMethodColor(deposit.method)}`}>{getMethodName(deposit.method)}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm font-black text-emerald-400">৳{formatCurrency(deposit.amount)}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-400">{deposit.phoneNumber || 'N/A'}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs font-mono text-gray-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-800">
                              {deposit.transactionId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1 w-fit ${statusInfo.badge}`}>
                              {statusInfo.icon}
                              {deposit.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button
                                onClick={() => viewDepositDetails(deposit)}
                                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => { setSelectedDeposit(deposit); setShowEditModal(true); }}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-emerald-400 rounded text-xs transition-all"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaSearch className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No deposits found</p>
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
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                        currentPage === page
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600/30 hover:border-indigo-500/50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === totalPages
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

      {/* Deposit Details Modal */}
      {showDepositDetails && selectedDeposit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Deposit Details</h3>
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
                      ['Transaction ID', selectedDeposit.transactionId || 'N/A'],
                      ['Date & Time', formatDate(selectedDeposit.createdAt)],
                      ['Payment Method', getMethodName(selectedDeposit.method)],
                      ...(selectedDeposit.processedAt ? [['Processed At', formatDate(selectedDeposit.processedAt)]] : []),
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500">{label}:</dt>
                        <dd className="text-xs font-medium text-gray-200 text-right">{val}</dd>
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
                  <span className="text-2xl font-black text-emerald-400">৳{formatCurrency(selectedDeposit.amount)}</span>
                </div>
              </div>

              <div className="mb-5 flex items-center gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Status:</span>
                <span className={`text-[9px] px-3 py-1 rounded font-bold uppercase flex items-center gap-1 ${getStatusInfo(selectedDeposit.status).badge}`}>
                  {getStatusInfo(selectedDeposit.status).icon}
                  {selectedDeposit.status}
                </span>
              </div>

              {selectedDeposit.adminNotes && (
                <div className="mb-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Admin Notes</p>
                  <p className="text-xs text-gray-400 bg-[#0F111A] border border-gray-800 p-3 rounded">{selectedDeposit.adminNotes}</p>
                </div>
              )}

              {selectedDeposit.status === 'pending' && (
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => updateDepositStatus(selectedDeposit._id, 'approved', 'Deposit approved by admin')}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 rounded text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => updateDepositStatus(selectedDeposit._id, 'rejected', 'Deposit rejected by admin')}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 rounded text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    ✕ Reject
                  </button>
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

      {/* Edit Deposit Modal */}
      {showEditModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Edit Deposit</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  editDeposit(selectedDeposit._id, {
                    amount: parseFloat(formData.get('amount')),
                    method: formData.get('method'),
                    phoneNumber: formData.get('phoneNumber'),
                    transactionId: formData.get('transactionId'),
                    adminNotes: formData.get('adminNotes'),
                  });
                }}
              >
                <div className="space-y-4">
                  {[
                    { label: 'Amount (BDT)', name: 'amount', type: 'number', defaultValue: selectedDeposit.amount, extra: { min: 300, max: 50000 } },
                    { label: 'Phone Number', name: 'phoneNumber', type: 'text', defaultValue: selectedDeposit.phoneNumber },
                    { label: 'Transaction ID', name: 'transactionId', type: 'text', defaultValue: selectedDeposit.transactionId },
                  ].map((f) => (
                    <div key={f.name}>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">{f.label}</label>
                      <input
                        type={f.type}
                        name={f.name}
                        defaultValue={f.defaultValue}
                        className={inputClass}
                        {...(f.extra || {})}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Method</label>
                    <select name="method" defaultValue={selectedDeposit.method} className={selectClass}>
                      {methods.filter((m) => m !== 'all').map((m, i) => (
                        <option key={i} value={m}>{getMethodName(m)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Admin Notes</label>
                    <textarea
                      name="adminNotes"
                      defaultValue={selectedDeposit.adminNotes}
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Alldeposit;