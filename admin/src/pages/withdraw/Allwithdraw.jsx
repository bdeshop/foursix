import React, { useState, useEffect } from 'react';
import {
  FaSearch, FaEye, FaSort, FaSortUp, FaSortDown,
  FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle,
  FaEdit, FaTrash, FaSpinner, FaCalendarAlt, FaFileExcel, FaFileCsv
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Allwithdraw = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Default to 50 items per page
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateTransactionId, setUpdateTransactionId] = useState('');
  const [updateAdminNote, setUpdateAdminNote] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    totalAmount: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalAmount: 0,
    completedAmount: 0,
  });

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const statuses = ['all', 'completed', 'pending', 'processing', 'failed', 'cancelled'];
  const methods = ['all', 'bkash', 'rocket', 'nagad', 'bank'];
  const pageSizeOptions = [10, 25, 50, 100];

  const getAccountDetails = (withdrawal) => {
    if (['bkash', 'rocket', 'nagad'].includes(withdrawal.method)) {
      if (withdrawal.mobileBankingDetails) {
        return {
          accountNumber: withdrawal.mobileBankingDetails.phoneNumber,
          accountType: withdrawal.mobileBankingDetails.accountType,
          fullDetails: `${withdrawal.mobileBankingDetails.phoneNumber}${withdrawal.mobileBankingDetails.accountType ? ` (${withdrawal.mobileBankingDetails.accountType})` : ''}`,
        };
      }
      return { accountNumber: 'N/A', fullDetails: 'N/A' };
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
      
      // Prepare params for API request
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.key || 'createdAt',
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc',
      };
      
      // Add filters only if they have values
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (methodFilter && methodFilter !== 'all') {
        params.method = methodFilter;
      }
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (dateRange.start) {
        params.startDate = dateRange.start;
      }
      if (dateRange.end) {
        params.endDate = dateRange.end;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/admin/withdrawals`, {
        headers: { Authorization: `Bearer ${token}` },
        params: params
      });
      
      console.log('API Response:', response.data);
      
      if (response.data) {
        // Get withdrawals array from response
        const withdrawalsData = response.data.withdrawals || [];
        setWithdrawals(withdrawalsData);
        
        // Update pagination info from backend
        setPagination({
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
          currentPage: response.data.currentPage || 1,
          totalAmount: response.data.totalAmount || 0
        });
        
        // Calculate stats based on statusCounts from response
        if (response.data.statusCounts) {
          const completedCount = response.data.statusCounts.find(s => s._id === 'completed')?.count || 0;
          const pendingCount = (response.data.statusCounts.find(s => s._id === 'pending')?.count || 0) + 
                               (response.data.statusCounts.find(s => s._id === 'processing')?.count || 0);
          const completedAmountTotal = response.data.statusCounts.find(s => s._id === 'completed')?.amount || 0;
          
          setStats({
            total: response.data.total || 0,
            completed: completedCount,
            pending: pendingCount,
            totalAmount: response.data.totalAmount || 0,
            completedAmount: completedAmountTotal,
          });
        } else {
          // Fallback: calculate from current page data (not accurate for global stats)
          setStats({
            total: response.data.total || withdrawalsData.length,
            completed: withdrawalsData.filter((w) => w.status === 'completed').length,
            pending: withdrawalsData.filter((w) => ['pending', 'processing'].includes(w.status)).length,
            totalAmount: withdrawalsData.reduce((sum, w) => sum + (w.amount || 0), 0),
            completedAmount: withdrawalsData.filter((w) => w.status === 'completed').reduce((sum, w) => sum + (w.amount || 0), 0),
          });
        }
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
      setError('Failed to load withdrawals. Please try again.');
      
      // Sample data for demonstration
      const sampleData = Array.from({ length: 50 }, (_, i) => ({
        _id: `${i + 1}`,
        userId: { _id: `user${i + 1}`, username: `testuser${i + 1}`, player_id: `PID${String(i + 1).padStart(6, '0')}` },
        method: i % 4 === 0 ? 'bkash' : i % 4 === 1 ? 'nagad' : i % 4 === 2 ? 'rocket' : 'bank',
        mobileBankingDetails: i % 4 !== 3 ? { phoneNumber: `017${String(i).padStart(8, '0')}`, accountType: i % 2 === 0 ? 'personal' : 'business' } : null,
        bankDetails: i % 4 === 3 ? {
          bankName: 'Dutch Bangla Bank',
          accountHolderName: `Account Holder ${i + 1}`,
          accountNumber: `ACC${String(i + 1).padStart(10, '0')}`,
          branchName: 'Main Branch',
          district: 'Dhaka',
          routingNumber: '123456789',
        } : null,
        amount: Math.floor(Math.random() * 5000) + 500,
        status: i % 5 === 0 ? 'pending' : i % 5 === 1 ? 'completed' : i % 5 === 2 ? 'processing' : i % 5 === 3 ? 'cancelled' : 'failed',
        transactionId: i % 5 === 1 ? `TXN${String(i + 1).padStart(8, '0')}` : null,
        processedAt: i % 5 === 1 ? new Date().toISOString() : null,
        adminNote: i % 5 === 3 ? 'User requested cancellation' : null,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
      }));
      
      setWithdrawals(sampleData.slice(0, itemsPerPage));
      setPagination({
        total: sampleData.length,
        totalPages: Math.ceil(sampleData.length / itemsPerPage),
        currentPage: 1,
        totalAmount: sampleData.reduce((sum, w) => sum + w.amount, 0)
      });
      
      const completedCount = sampleData.filter(w => w.status === 'completed').length;
      const pendingCount = sampleData.filter(w => ['pending', 'processing'].includes(w.status)).length;
      const completedAmountTotal = sampleData.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0);
      
      setStats({
        total: sampleData.length,
        completed: completedCount,
        pending: pendingCount,
        totalAmount: sampleData.reduce((sum, w) => sum + w.amount, 0),
        completedAmount: completedAmountTotal,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWithdrawalStatus = async (withdrawalId, status, transactionId = null, adminNote = null) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('usertoken') || localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}/status`,
        { status, transactionId, adminNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data) {
        toast.success('Withdrawal status updated successfully!');
        fetchWithdrawals();
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update withdrawal status');
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteWithdrawal = async (withdrawalId) => {
    try {
      const token = localStorage.getItem('usertoken') || localStorage.getItem('token');
      const response = await axios.delete(`${API_BASE_URL}/api/admin/withdrawals/${withdrawalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        toast.success('Withdrawal deleted successfully!');
        fetchWithdrawals();
        return true;
      }
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete withdrawal');
      return false;
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

  // Helper function to get filtered data for export (respects all filters)
  const getFilteredDataForExport = () => {
    let filtered = [...withdrawals];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(w => 
        w.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.userId?.player_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAccountDetails(w).fullDetails.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter);
    }
    
    // Apply method filter
    if (methodFilter !== 'all') {
      filtered = filtered.filter(w => w.method === methodFilter);
    }
    
    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(w => new Date(w.createdAt) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(w => new Date(w.createdAt) <= endDate);
    }
    
    return filtered;
  };

  // Custom CSV Export
  const exportToCSV = () => {
    try {
      const dataToExport = getFilteredDataForExport();
      
      if (dataToExport.length === 0) {
        toast.error('No data to export. Please adjust your filters.');
        return;
      }
      
      const headers = [
        'Date & Time', 'Player ID', 'Username', 'Method', 'Amount (BDT)',
        'Account Details', 'Status', 'Transaction ID', 'Processed At', 'Admin Note'
      ];
      
      const rows = dataToExport.map(w => [
        formatDateForExport(w.createdAt),
        w.userId?.player_id || 'N/A',
        w.userId?.username || 'Unknown',
        getMethodName(w.method),
        w.amount,
        getAccountDetails(w).fullDetails.replace(/,/g, ';'),
        w.status.toUpperCase(),
        w.transactionId || 'N/A',
        w.processedAt ? formatDateForExport(w.processedAt) : 'N/A',
        (w.adminNote || '').replace(/,/g, ';')
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      let filterContext = '';
      if (statusFilter !== 'all') filterContext += `_${statusFilter}`;
      if (methodFilter !== 'all') filterContext += `_${methodFilter}`;
      if (searchTerm) filterContext += `_search`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', `withdrawals${filterContext}_${timestamp}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`CSV exported successfully! (${dataToExport.length} records)`);
    } catch (err) {
      console.error('CSV Export error:', err);
      toast.error('Failed to export CSV. Please try again.');
    }
  };
  
  // Custom Excel Export
  const exportToExcel = () => {
    try {
      const dataToExport = getFilteredDataForExport();
      
      if (dataToExport.length === 0) {
        toast.error('No data to export. Please adjust your filters.');
        return;
      }
      
      const totalAmount = dataToExport.reduce((sum, w) => sum + (w.amount || 0), 0);
      const completedAmount = dataToExport.filter(w => w.status === 'completed').reduce((sum, w) => sum + (w.amount || 0), 0);
      const pendingAmount = dataToExport.filter(w => ['pending', 'processing'].includes(w.status)).reduce((sum, w) => sum + (w.amount || 0), 0);
      
      let htmlContent = `
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Withdrawal Report</title>
          <style>
            th { background-color: #F59E0B; color: white; padding: 8px; border: 1px solid #ddd; font-size: 11px; }
            td { padding: 6px; border: 1px solid #ddd; font-size: 10px; }
            table { border-collapse: collapse; width: 100%; }
            .title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .filters { font-size: 10px; color: #666; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="title">Withdrawal Transactions Report</div>
          <div class="filters">
            Generated: ${new Date().toLocaleString()}<br>
            Filters Applied: ${statusFilter !== 'all' ? `Status: ${statusFilter} | ` : ''}${methodFilter !== 'all' ? `Method: ${methodFilter} | ` : ''}${searchTerm ? `Search: ${searchTerm}` : 'No search filter'}
          </div>
          <table border="1">
            <thead>
              <tr>
                <th>Date & Time</th><th>Player ID</th><th>Username</th>
                <th>Method</th><th>Amount (BDT)</th><th>Account Details</th>
                <th>Status</th><th>Transaction ID</th><th>Processed At</th><th>Admin Note</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      dataToExport.forEach(w => {
        htmlContent += `
          <tr>
            <td>${formatDateForExport(w.createdAt)}</td>
            <td>${w.userId?.player_id || 'N/A'}</td>
            <td>${w.userId?.username || 'Unknown'}</td>
            <td>${getMethodName(w.method)}</td>
            <td>${w.amount}</td>
            <td>${getAccountDetails(w).fullDetails}</td>
            <td>${w.status.toUpperCase()}</td>
            <td>${w.transactionId || 'N/A'}</td>
            <td>${w.processedAt ? formatDateForExport(w.processedAt) : 'N/A'}</td>
            <td>${(w.adminNote || '').replace(/[&<>]/g, function(m) {
              if (m === '&') return '&amp;';
              if (m === '<') return '&lt;';
              if (m === '>') return '&gt;';
              return m;
            })}</td>
          </tr>
        `;
      });
      
      htmlContent += `
            </tbody>
            <tfoot>
              <tr><td colspan="4"><strong>Total:</strong></td><td><strong>${totalAmount} BDT</strong></td><td colspan="5"></td></tr>
              <tr><td colspan="4"><strong>Completed Amount:</strong></td><td><strong>${completedAmount} BDT</strong></td><td colspan="5"></td></tr>
              <tr><td colspan="4"><strong>Pending Amount:</strong></td><td><strong>${pendingAmount} BDT</strong></td><td colspan="5"></td></tr>
            </tfoot>
          </table>
          <div>Total Records: ${dataToExport.length} | Completed: ${dataToExport.filter(w => w.status === 'completed').length} | Pending: ${dataToExport.filter(w => ['pending', 'processing'].includes(w.status)).length}</div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().split('T')[0];
      
      let filterContext = '';
      if (statusFilter !== 'all') filterContext += `_${statusFilter}`;
      if (methodFilter !== 'all') filterContext += `_${methodFilter}`;
      if (searchTerm) filterContext += `_search`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', `withdrawals${filterContext}_${timestamp}.xls`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Excel file exported successfully! (${dataToExport.length} records)`);
    } catch (err) {
      console.error('Excel Export error:', err);
      toast.error('Failed to export Excel file. Please try again.');
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when items per page changes
    fetchWithdrawals();
  }, [currentPage, statusFilter, methodFilter, searchTerm, dateRange.start, dateRange.end, sortConfig, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, methodFilter, dateRange, itemsPerPage]);

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
  };

  const viewWithdrawalDetails = (w) => { setSelectedWithdrawal(w); setShowWithdrawalDetails(true); };
  const closeWithdrawalDetails = () => { setShowWithdrawalDetails(false); setSelectedWithdrawal(null); };

  const openUpdateModal = (w) => {
    if (w.status === 'cancelled') {
      toast.error('Cannot update a cancelled withdrawal.');
      return;
    }
    if (w.status === 'completed') {
      toast.error('Cannot update a completed withdrawal.');
      return;
    }
    setSelectedWithdrawal(w);
    setUpdateStatus(w.status);
    setUpdateTransactionId(w.transactionId || '');
    setUpdateAdminNote(w.adminNote || '');
    setShowUpdateModal(true);
  };
  
  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setSelectedWithdrawal(null);
    setUpdateStatus('');
    setUpdateTransactionId('');
    setUpdateAdminNote('');
  };

  const handleUpdateSubmit = async () => {
    if (!selectedWithdrawal) return;
    const success = await updateWithdrawalStatus(
      selectedWithdrawal._id,
      updateStatus,
      updateTransactionId || undefined,
      updateAdminNote || undefined
    );
    if (success) closeUpdateModal();
  };

  const openDeleteModal = (w) => { setSelectedWithdrawal(w); setShowDeleteModal(true); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setSelectedWithdrawal(null); };

  const handleDeleteSubmit = async () => {
    if (!selectedWithdrawal) return;
    const success = await deleteWithdrawal(selectedWithdrawal._id);
    if (success) closeDeleteModal();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: <FaCheckCircle className="text-emerald-400" />, badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
      case 'pending':
        return { icon: <FaClock className="text-amber-400" />, badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
      case 'processing':
        return { icon: <FaClock className="text-blue-400" />, badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };
      case 'failed':
      case 'cancelled':
        return { icon: <FaTimesCircle className="text-rose-400" />, badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
      default:
        return { icon: <FaExclamationTriangle className="text-gray-400" />, badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    }
  };

  const getMethodName = (method) => {
    const map = { bkash: 'bKash', nagad: 'Nagad', rocket: 'Rocket', bank: 'Bank Transfer' };
    return map[method] || (method ? method.charAt(0).toUpperCase() + method.slice(1) : 'Unknown');
  };

  const getMethodColor = (method) => {
    const map = { bkash: 'text-pink-400', nagad: 'text-orange-400', rocket: 'text-purple-400', bank: 'text-teal-400' };
    return map[method] || 'text-gray-400';
  };

  const getPaginationPages = () => {
    const totalPages = pagination.totalPages;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
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

          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300 ml-4 text-lg leading-none">×</button>
            </div>
          )}

          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Withdrawal History</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-amber-500" /> Track and manage all withdrawal transactions
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <div className="flex items-center gap-2 bg-[#1F2937] border border-gray-700 rounded-md overflow-hidden">
                <button onClick={exportToCSV} className="px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 text-emerald-400 hover:bg-emerald-600/20">
                  <FaFileCsv /> CSV
                </button>
                <button onClick={exportToExcel} className="px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 text-amber-400 hover:bg-amber-600/20">
                  <FaFileExcel /> Excel
                </button>
              </div>
              <button onClick={fetchWithdrawals} className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400">
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'COMPLETED', value: stats.completed, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
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

          <div className="bg-[#161B22] border border-gray-800 rounded mb-6 px-5 py-3 flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Completed Amount</span>
            <span className="text-emerald-400 font-black text-sm">৳{formatCurrency(stats.completedAmount)}</span>
          </div>

          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500"></div> Filters & Search
              </h2>
              <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setMethodFilter('all'); setDateRange({ start: '', end: '' }); setCurrentPage(1); }} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider">
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputClass} pl-8`} placeholder="Search username, ID, account..." />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">All Status</option>
                {statuses.filter((s) => s !== 'all').map((s, i) => (<option key={i} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
              </select>
              <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className={selectClass}>
                <option value="all">All Methods</option>
                {methods.filter((m) => m !== 'all').map((m, i) => (<option key={i} value={m}>{getMethodName(m)}</option>))}
              </select>
              <select className={selectClass} value={sortConfig.key || ''} onChange={(e) => requestSort(e.target.value)}>
                <option value="createdAt">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="userId">Sort by Username</option>
              </select>
            </div>
            <div className="mt-3 flex flex-col md:flex-row gap-2 items-center md:w-2/3">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className={inputClass} />
              <span className="text-gray-600 text-xs hidden md:block">→</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="mb-3 flex justify-between items-center flex-wrap gap-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {withdrawals.length} of {pagination.total} withdrawals
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-500"
              >
                {pageSizeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <span className="text-[10px] text-gray-500">entries per page</span>
            </div>
          </div>

          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
              Withdrawal Transactions
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>Date & Time {getSortIcon('createdAt')}</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('userId')}>Player {getSortIcon('userId')}</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('amount')}>Amount {getSortIcon('amount')}</th>
                    <th className="px-5 py-3">Account Details</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading withdrawals...</p>
                        </div>
                      </td>
                    </tr>
                  ) : withdrawals.length > 0 ? (
                    withdrawals.map((withdrawal) => {
                      const statusInfo = getStatusInfo(withdrawal.status);
                      const accountDetails = getAccountDetails(withdrawal);
                      const isEditDisabled = withdrawal.status === 'cancelled' || withdrawal.status === 'completed';
                      const disabledReason = withdrawal.status === 'cancelled' ? 'Cannot update a cancelled withdrawal' : 'Cannot update a completed withdrawal';
                      
                      return (
                        <tr key={withdrawal._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(withdrawal.createdAt)}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-white font-mono">{withdrawal.userId?.player_id || 'N/A'}</div>
                            <div className="text-[10px] text-gray-500">{withdrawal.userId?.username || 'Unknown'}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-xs font-bold ${getMethodColor(withdrawal.method)}`}>{getMethodName(withdrawal.method)}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-sm font-black text-amber-400">৳{formatCurrency(withdrawal.amount)}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs font-mono text-gray-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-800 block truncate max-w-[160px]" title={accountDetails.fullDetails}>
                              {accountDetails.fullDetails}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1 w-fit ${statusInfo.badge}`}>
                              {statusInfo.icon} {withdrawal.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <button onClick={() => viewWithdrawalDetails(withdrawal)} className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all" title="View Details">
                                <FaEye />
                              </button>
                              <button onClick={() => openUpdateModal(withdrawal)} disabled={isEditDisabled} className={`p-1.5 rounded text-xs transition-all ${isEditDisabled ? 'bg-gray-500/10 border border-gray-500/20 text-gray-500 cursor-not-allowed opacity-50' : 'bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-emerald-400'}`} title={disabledReason}>
                                <FaEdit />
                              </button>
                              {/* <button onClick={() => openDeleteModal(withdrawal)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all" title="Delete Withdrawal">
                                <FaTrash />
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaSearch className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No withdrawals found</p>
                          <p className="text-xs mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Page {currentPage} of {pagination.totalPages} &nbsp;·&nbsp; {pagination.total} total
              </p>
              <nav className="flex items-center gap-1">
                <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1} className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${currentPage === 1 ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}>
                  ← Prev
                </button>
                {getPaginationPages().map((page, idx) => page === '...' ? (<span key={`e-${idx}`} className="px-2 py-1.5 text-xs text-gray-600 font-bold select-none">···</span>) : (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${currentPage === page ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(p + 1, pagination.totalPages))} disabled={currentPage === pagination.totalPages} className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${currentPage === pagination.totalPages ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}>
                  Next →
                </button>
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
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Withdrawal Details</h3>
              <button onClick={closeWithdrawalDetails} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Transaction Info</p>
                  <dl className="space-y-2">
                    {[['Withdrawal ID', selectedWithdrawal._id], ['Transaction ID', selectedWithdrawal.transactionId || 'N/A'], ['Requested At', formatDate(selectedWithdrawal.createdAt)], ['Payment Method', getMethodName(selectedWithdrawal.method)], ...(selectedWithdrawal.processedAt ? [['Processed At', formatDate(selectedWithdrawal.processedAt)]] : [])].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4"><dt className="text-xs text-gray-500 shrink-0">{label}:</dt><dd className="text-xs font-medium text-gray-200 text-right truncate max-w-[180px]">{val}</dd></div>
                    ))}
                  </dl>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">User Info</p>
                  <dl className="space-y-2">
                    {[['Player ID', selectedWithdrawal.userId?.player_id || 'N/A'], ['Username', selectedWithdrawal.userId?.username || 'Unknown']].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4"><dt className="text-xs text-gray-500">{label}:</dt><dd className="text-xs font-medium text-gray-200 text-right">{val}</dd></div>
                    ))}
                  </dl>
                </div>
              </div>
              <div className="bg-[#0F111A] border border-gray-800 p-4 rounded mb-5"><div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Amount</span><span className="text-2xl font-black text-amber-400">৳{formatCurrency(selectedWithdrawal.amount)}</span></div></div>
              <div className="bg-[#0F111A] border border-gray-800 p-4 rounded mb-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Payment Details</p>
                <dl className="space-y-2">
                  {(() => { const m = selectedWithdrawal.method;
                    if (['bkash', 'rocket', 'nagad'].includes(m) && selectedWithdrawal.mobileBankingDetails) { const d = selectedWithdrawal.mobileBankingDetails; return (<><div className="flex justify-between gap-4"><dt className="text-xs text-gray-500">Phone Number:</dt><dd className="text-xs font-medium text-gray-200">{d.phoneNumber}</dd></div>{d.accountType && (<div className="flex justify-between gap-4"><dt className="text-xs text-gray-500">Account Type:</dt><dd className="text-xs font-medium text-gray-200 capitalize">{d.accountType}</dd></div>)}</>); } 
                    else if (m === 'bank' && selectedWithdrawal.bankDetails) { const d = selectedWithdrawal.bankDetails; return [['Bank Name', d.bankName], ['Account Holder', d.accountHolderName], ['Account Number', d.accountNumber], ['Branch', d.branchName], ['District', d.district], ['Routing Number', d.routingNumber]].map(([label, val]) => (<div key={label} className="flex justify-between gap-4"><dt className="text-xs text-gray-500">{label}:</dt><dd className="text-xs font-medium text-gray-200 font-mono">{val}</dd></div>)); } 
                    return <p className="text-xs text-gray-600">No additional details available</p>;
                  })()}
                </dl>
              </div>
              <div className="mb-5 flex items-center gap-3"><span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Status:</span><span className={`text-[9px] px-3 py-1 rounded font-bold uppercase flex items-center gap-1 ${getStatusInfo(selectedWithdrawal.status).badge}`}>{getStatusInfo(selectedWithdrawal.status).icon} {selectedWithdrawal.status}</span></div>
              {selectedWithdrawal.adminNote && (<div className="mb-5"><p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Admin Notes</p><p className="text-xs text-gray-400 bg-[#0F111A] border border-gray-800 p-3 rounded">{selectedWithdrawal.adminNote}</p></div>)}
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              <button onClick={() => { closeWithdrawalDetails(); if (selectedWithdrawal.status !== 'cancelled' && selectedWithdrawal.status !== 'completed') { openUpdateModal(selectedWithdrawal); } else if (selectedWithdrawal.status === 'cancelled') { toast.error('Cannot update a cancelled withdrawal.'); } else if (selectedWithdrawal.status === 'completed') { toast.error('Cannot update a completed withdrawal.'); } }} disabled={selectedWithdrawal.status === 'cancelled' || selectedWithdrawal.status === 'completed'} className={`px-4 py-2 rounded text-xs font-bold transition-all ${(selectedWithdrawal.status === 'cancelled' || selectedWithdrawal.status === 'completed') ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}>Update Status</button>
              <button onClick={closeWithdrawalDetails} className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Update Withdrawal Status</h3>
              <button onClick={closeUpdateModal} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <div className="bg-[#0F111A] border border-gray-800 rounded p-3 mb-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Withdrawal Info</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-300">User: <span className="text-white font-bold">{selectedWithdrawal.userId?.username}</span></p>
                  <p className="text-xs text-gray-300">Amount: <span className="text-amber-400 font-black">৳{formatCurrency(selectedWithdrawal.amount)}</span></p>
                  <p className="text-xs text-gray-300">Method: <span className={`font-bold ${getMethodColor(selectedWithdrawal.method)}`}>{getMethodName(selectedWithdrawal.method)}</span></p>
                  <p className="text-xs text-gray-300">Account: <span className="text-gray-200 font-mono">{getAccountDetails(selectedWithdrawal).fullDetails}</span></p>
                </div>
              </div>
              <div className="space-y-4">
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</label><select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} className={selectClass}><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></div>
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Transaction ID (Optional)</label><input type="text" value={updateTransactionId} onChange={(e) => setUpdateTransactionId(e.target.value)} className={inputClass} placeholder="Enter transaction ID if applicable" /></div>
                <div><label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Admin Note (Optional)</label><textarea value={updateAdminNote} onChange={(e) => setUpdateAdminNote(e.target.value)} rows={3} className={inputClass} placeholder="Add any notes about this withdrawal..." /></div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={closeUpdateModal} disabled={updatingStatus} className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all disabled:opacity-50">Cancel</button>
                <button onClick={handleUpdateSubmit} disabled={updatingStatus} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2">{updatingStatus ? <><FaSpinner className="animate-spin" /> Updating...</> : 'Update Status'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confirm Deletion</h3>
              <button onClick={closeDeleteModal} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-5">Are you sure you want to delete this withdrawal request? This action cannot be undone.</p>
              <div className="bg-rose-500/5 border border-rose-500/20 rounded p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-3">Withdrawal Details</p>
                <div className="space-y-1.5">
                  {[['Amount', `৳${formatCurrency(selectedWithdrawal.amount)}`], ['User', `${selectedWithdrawal.userId?.username || 'Unknown'} (${selectedWithdrawal.userId?.player_id || 'N/A'})`], ['Method', getMethodName(selectedWithdrawal.method)], ['Account', getAccountDetails(selectedWithdrawal).fullDetails], ['Status', selectedWithdrawal.status]].map(([label, val]) => (<div key={label} className="flex justify-between gap-4"><dt className="text-xs text-rose-400/70">{label}:</dt><dd className="text-xs text-rose-300 text-right">{val}</dd></div>))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              <button onClick={closeDeleteModal} className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all">Cancel</button>
              <button onClick={handleDeleteSubmit} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"><FaTrash /> Delete Withdrawal</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Allwithdraw;