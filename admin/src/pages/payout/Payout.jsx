import React, { useState, useEffect } from 'react';
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaSearch,
  FaFilter,
  FaSync,
  FaCheck,
  FaTimes,
  FaClock,
  FaCog,
  FaSpinner,
  FaMoneyBillWave,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Payout = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    notes: '',
    transactionId: ''
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/affilaite-payouts`);

      if (response.data.success) {
        setPayouts(response.data.data || []);
      } else {
        toast.error('Failed to fetch payouts');
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPayout = async (id) => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/affilaite-payouts/${id}`);

      if (response.data.success) {
        setSelectedPayout(response.data.data);
        setShowViewModal(true);
      } else {
        toast.error('Failed to fetch payout details');
      }
    } catch (error) {
      console.error('Error fetching payout:', error);
      toast.error('Failed to fetch payout details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayout = async () => {
    if (!selectedPayout) return;

    try {
      setLoading(true);
      const response = await axios.delete(`${base_url}/api/admin/affilaite-payouts/${selectedPayout._id}`);

      if (response.data.success) {
        toast.success('Payout deleted successfully');
        setPayouts(payouts.filter(payout => payout._id !== selectedPayout._id));
        setShowDeleteModal(false);
        setSelectedPayout(null);
      } else {
        toast.error(response.data.error || 'Failed to delete payout');
      }
    } catch (error) {
      console.error('Error deleting payout:', error);
      toast.error('Failed to delete payout');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedPayout || !statusUpdateData.status) return;

    try {
      setLoading(true);
      const response = await axios.put(
        `${base_url}/api/admin/affilaite-payouts/${selectedPayout._id}/status`,
        statusUpdateData
      );

      if (response.data.success) {
        toast.success(`Payout status updated to ${statusUpdateData.status}`);

        setPayouts(payouts.map(payout =>
          payout._id === selectedPayout._id
            ? { ...payout, status: statusUpdateData.status, ...response.data.data }
            : payout
        ));

        setStatusUpdateData({ status: '', notes: '', transactionId: '' });
        setShowStatusModal(false);
        setSelectedPayout(null);
      } else {
        toast.error(response.data.error || 'Failed to update payout status');
      }
    } catch (error) {
      console.error('Error updating payout status:', error);
      toast.error('Failed to update payout status');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (payout) => {
    setSelectedPayout(payout);
    setShowDeleteModal(true);
  };

  const openStatusModal = (payout) => {
    setSelectedPayout(payout);
    setStatusUpdateData({
      status: payout.status,
      notes: '',
      transactionId: ''
    });
    setShowStatusModal(true);
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'processing':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'failed':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <FaCheck className="text-emerald-400" />;
      case 'pending':
        return <FaClock className="text-yellow-400" />;
      case 'processing':
        return <FaCog className="text-blue-400 animate-spin" />;
      case 'failed':
        return <FaTimes className="text-rose-400" />;
      case 'cancelled':
        return <FaTimes className="text-gray-400" />;
      default:
        return <FaClock className="text-gray-400" />;
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'low':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-yellow-400' },
    { value: 'processing', label: 'Processing', color: 'text-blue-400' },
    { value: 'completed', label: 'Completed', color: 'text-emerald-400' },
    { value: 'failed', label: 'Failed', color: 'text-rose-400' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-gray-400' }
  ];

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch =
      payout.payoutId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.affiliate?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.affiliate?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.affiliate?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayouts = filteredPayouts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);

  const exportToCSV = () => {
    const headers = [
      'Payout ID',
      'Affiliate Name',
      'Affiliate Email',
      'Amount',
      'Net Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Payout Type',
      'Requested Date',
      'Completed Date'
    ];

    const csvData = filteredPayouts.map(payout => [
      payout.payoutId,
      `${payout.affiliate?.firstName || ''} ${payout.affiliate?.lastName || ''}`,
      payout.affiliate?.email || '',
      payout.amount,
      payout.netAmount,
      payout.currency,
      payout.status,
      payout.paymentMethod,
      payout.payoutType,
      formatDate(payout.requestedAt),
      formatDate(payout.completedAt)
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Payouts exported successfully');
  };

  const totalAmount = payouts.reduce((sum, payout) => sum + (payout.amount || 0), 0);
  const completedAmount = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, payout) => sum + (payout.amount || 0), 0);
  const pendingAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, payout) => sum + (payout.amount || 0), 0);

  const getPaginationPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';
  const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2';

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

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full">
            {/* Header */}
            <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Affiliate Payouts</h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                  <FaMoneyBillWave className="text-amber-500" /> Manage and track affiliate payout requests
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <button
                  onClick={exportToCSV}
                  className="bg-[#1F2937] hover:bg-emerald-600/20 border border-gray-700 hover:border-emerald-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-emerald-400"
                >
                  <FaDownload /> EXPORT CSV
                </button>
                <button
                  onClick={fetchPayouts}
                  disabled={loading}
                  className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400 disabled:opacity-50"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'TOTAL PAYOUTS', value: payouts.length, color: 'border-blue-500', valueClass: 'text-white', icon: <FaMoneyBillWave /> },
                { label: 'TOTAL AMOUNT', value: formatCurrency(totalAmount, 'BDT'), color: 'border-emerald-500', valueClass: 'text-emerald-400', icon: <FaCheck /> },
                { label: 'COMPLETED', value: payouts.filter(p => p.status === 'completed').length, color: 'border-emerald-500', valueClass: 'text-emerald-400', subValue: formatCurrency(completedAmount, 'BDT'), icon: <FaCheck /> },
                { label: 'PENDING', value: payouts.filter(p => p.status === 'pending').length, color: 'border-yellow-500', valueClass: 'text-yellow-400', subValue: formatCurrency(pendingAmount, 'BDT'), icon: <FaClock /> },
                { label: 'PROCESSING', value: payouts.filter(p => p.status === 'processing').length, color: 'border-blue-500', valueClass: 'text-blue-400', icon: <FaCog /> },
              ].map((card, i) => (
                <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-4 rounded shadow-lg border-y border-r border-gray-800`}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                    <div className="text-gray-600 text-xs">{card.icon}</div>
                  </div>
                  <h2 className={`text-lg font-bold leading-none ${card.valueClass}`}>{card.value}</h2>
                  {card.subValue && <p className="text-[9px] text-gray-500 mt-1">{card.subValue}</p>}
                </div>
              ))}
            </div>

            {/* Filters Section */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <div className="w-1 h-4 bg-amber-500"></div> Filters & Search
                </h2>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider"
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
                    placeholder="Search by ID, name, or email..."
                  />
                </div>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                  <option value="all">All Status</option>
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <div className="relative">
                  <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                  <select
                    onChange={(e) => setCurrentPage(1)}
                    className={`${selectClass} pl-8`}
                    defaultValue="newest"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="amount-high">Sort: Amount (High to Low)</option>
                    <option value="amount-low">Sort: Amount (Low to High)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-3 flex justify-between items-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Showing {currentPayouts.length} of {filteredPayouts.length} payouts
              </p>
            </div>

            {/* Payouts Table */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
                Payout Requests
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-3">Payout ID</th>
                      <th className="px-5 py-3">Affiliate</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Payment Method</th>
                      <th className="px-5 py-3">Requested Date</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loading && payouts.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading payouts...</p>
                          </div>
                        </td>
                      </tr>
                    ) : currentPayouts.length > 0 ? (
                      currentPayouts.map((payout) => (
                        <tr key={payout._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-xs font-mono text-amber-400">{payout.payoutId}</div>
                              <div className="text-[9px] mt-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium ${getPriorityBadgeColor(payout.priority)}`}>
                                  {payout.priority || 'normal'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs">
                                {payout.affiliate?.firstName?.charAt(0) || 'A'}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">
                                  {payout.affiliate?.firstName} {payout.affiliate?.lastName}
                                </div>
                                <div className="text-[10px] text-gray-500">{payout.affiliate?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-amber-400">{formatCurrency(payout.amount, payout.currency)}</div>
                            <div className="text-[9px] text-gray-500">Net: {formatCurrency(payout.netAmount, payout.currency)}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="text-sm">{getStatusIcon(payout.status)}</div>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${getStatusBadgeColor(payout.status)}`}>
                                {payout.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-[10px] font-bold uppercase text-blue-400">{payout.paymentMethod || 'N/A'}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(payout.requestedAt)}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleViewPayout(payout._id)}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/20 text-blue-400 rounded text-xs transition-all"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => openStatusModal(payout)}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 text-amber-400 rounded text-xs transition-all"
                                title="Update Status"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openDeleteModal(payout)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                title="Delete Payout"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center text-gray-600">
                            <FaMoneyBillWave className="text-4xl mb-3 opacity-20" />
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No payouts found</p>
                            <p className="text-xs mt-1">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && !loading && (
                <div className="mt-4 px-5 pb-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    Page {currentPage} of {totalPages} &nbsp;·&nbsp; {filteredPayouts.length} total
                  </p>
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${currentPage === 1 ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >← Prev</button>
                    {getPaginationPages().map((page, idx) =>
                      page === '...' ? (
                        <span key={`e-${idx}`} className="px-2 py-1.5 text-xs text-gray-600 font-bold select-none">···</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${currentPage === page ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                        >{page}</button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${currentPage === totalPages ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >Next →</button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* View Payout Modal */}
      {showViewModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center sticky top-0">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Payout Details</h3>
                <p className="text-[9px] text-gray-500 font-mono mt-1">ID: {selectedPayout.payoutId}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-1 rounded font-bold uppercase ${getStatusBadgeColor(selectedPayout.status)}`}>
                  {getStatusIcon(selectedPayout.status)} {selectedPayout.status}
                </span>
                <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-300">
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Basic Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Payout ID</span>
                      <span className="text-[10px] font-mono text-amber-400">{selectedPayout.payoutId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Affiliate</span>
                      <span className="text-[10px] text-white">{selectedPayout.affiliate?.firstName} {selectedPayout.affiliate?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Email</span>
                      <span className="text-[10px] text-gray-400">{selectedPayout.affiliate?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Affiliate Code</span>
                      <span className="text-[10px] font-mono text-gray-400">{selectedPayout.affiliate?.affiliateCode || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">Payment Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Amount</span>
                      <span className="text-[10px] font-bold text-amber-400">{formatCurrency(selectedPayout.amount, selectedPayout.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Net Amount</span>
                      <span className="text-[10px] text-gray-300">{formatCurrency(selectedPayout.netAmount, selectedPayout.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Payment Method</span>
                      <span className="text-[10px] font-bold uppercase text-blue-400">{selectedPayout.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Payout Type</span>
                      <span className="text-[10px] capitalize text-gray-300">{selectedPayout.payoutType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Account Number</span>
                      <span className="text-[10px] font-mono text-gray-400">{selectedPayout.paymentDetails}</span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="md:col-span-2 bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4">Timestamps</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[8px] text-gray-500">Requested</p>
                      <p className="text-[10px] text-gray-300">{formatDate(selectedPayout.requestedAt)}</p>
                    </div>
                    {selectedPayout.processedAt && (
                      <div>
                        <p className="text-[8px] text-gray-500">Processed</p>
                        <p className="text-[10px] text-gray-300">{formatDate(selectedPayout.processedAt)}</p>
                      </div>
                    )}
                    {selectedPayout.completedAt && (
                      <div>
                        <p className="text-[8px] text-gray-500">Completed</p>
                        <p className="text-[10px] text-gray-300">{formatDate(selectedPayout.completedAt)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[8px] text-gray-500">Created</p>
                      <p className="text-[10px] text-gray-300">{formatDate(selectedPayout.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Failure Reason */}
                {selectedPayout.failureReason && (
                  <div className="md:col-span-2 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2 flex items-center gap-2">
                      <FaExclamationTriangle /> Failure Reason
                    </h4>
                    <p className="text-[10px] text-rose-300">{selectedPayout.failureReason}</p>
                    {selectedPayout.retryAttempt > 0 && (
                      <p className="text-[9px] text-rose-400/70 mt-2">Retry Attempt: {selectedPayout.retryAttempt} / {selectedPayout.maxRetries || 3}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-between">
              <button
                onClick={() => openStatusModal(selectedPayout)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaEdit /> Update Status
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Update Payout Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-500 hover:text-gray-300">
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelClass}>New Status</label>
                <div className="grid grid-cols-5 gap-2">
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatusUpdateData(prev => ({ ...prev, status: option.value }))}
                      className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all ${
                        statusUpdateData.status === option.value
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-gray-700 hover:bg-gray-800'
                      }`}
                    >
                      <div className={`text-sm mb-1 ${option.color}`}>
                        {getStatusIcon(option.value)}
                      </div>
                      <span className={`text-[8px] font-bold ${option.color}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={statusUpdateData.transactionId}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, transactionId: e.target.value }))}
                  className={inputClass}
                  placeholder="Enter transaction/reference ID"
                />
              </div>

              <div>
                <label className={labelClass}>Notes (Optional)</label>
                <textarea
                  value={statusUpdateData.notes}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                  rows="3"
                  className={`${inputClass} resize-none`}
                  placeholder="Add any notes about this status change..."
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-[9px] text-blue-400">Current Status: {selectedPayout.status}</p>
                <p className="text-[8px] text-gray-500 mt-1">Last updated: {formatDate(selectedPayout.updatedAt)}</p>
              </div>
            </div>

            <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={loading || !statusUpdateData.status}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaEdit />}
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPayout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Delete Payout</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-500 hover:text-gray-300">
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                <FaExclamationTriangle className="text-rose-400 text-xl" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Delete Payout {selectedPayout.payoutId}?</h4>
              <p className="text-[10px] text-gray-500 mb-4">
                This action cannot be undone. This will permanently delete the payout and all associated data.
              </p>

              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 mb-4 text-left">
                <ul className="text-[9px] text-rose-400 space-y-1 list-disc pl-4">
                  <li>Payout record will be permanently deleted</li>
                  <li>Transaction history will be lost</li>
                  <li>This action cannot be reversed</li>
                </ul>
              </div>

              <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-3">
                <div className="flex justify-between text-[9px]">
                  <span className="text-gray-500">Affiliate:</span>
                  <span className="text-white">{selectedPayout.affiliate?.firstName} {selectedPayout.affiliate?.lastName}</span>
                </div>
                <div className="flex justify-between text-[9px] mt-1">
                  <span className="text-gray-500">Amount:</span>
                  <span className="text-amber-400">{formatCurrency(selectedPayout.amount, selectedPayout.currency)}</span>
                </div>
                <div className="flex justify-between text-[9px] mt-1">
                  <span className="text-gray-500">Status:</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded ${getStatusBadgeColor(selectedPayout.status)}`}>{selectedPayout.status}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePayout}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                Delete Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Payout;