import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaEye, FaDownload, FaSearch, FaFilter, FaSync, FaCheck, FaTimes, FaClock, FaCog } from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  
  // Fetch payouts on component mount
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
        // Remove the deleted payout from the list
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
        
        // Update the payout in the list
        setPayouts(payouts.map(payout => 
          payout._id === selectedPayout._id 
            ? { ...payout, status: statusUpdateData.status, ...response.data.data }
            : payout
        ));
        
        // Reset form and close modal
        setStatusUpdateData({
          status: '',
          notes: '',
          transactionId: ''
        });
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
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <FaCheck className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'processing':
        return <FaCog className="text-blue-500 animate-spin" />;
      case 'failed':
        return <FaTimes className="text-red-500" />;
      case 'cancelled':
        return <FaTimes className="text-gray-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Status options for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
    { value: 'processing', label: 'Processing', color: 'text-blue-600' },
    { value: 'completed', label: 'Completed', color: 'text-green-600' },
    { value: 'failed', label: 'Failed', color: 'text-red-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-gray-600' }
  ];

  // Filter payouts based on search term and status
  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = 
      payout.payoutId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.affiliate?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.affiliate?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.affiliate?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
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

  // Calculate statistics
  const totalAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);
  const completedAmount = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, payout) => sum + payout.amount, 0);
  const pendingAmount = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, payout) => sum + payout.amount, 0);

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Affiliate Payouts</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  <FaDownload /> Export CSV
                </button>
                <button
                  onClick={fetchPayouts}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-theme_color text-white font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
            </div>
            
            {/* Filters and Search */}
            <div className="bg-white rounded-lg p-4 mb-6 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Payouts
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Search by ID, name, or email..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    onChange={(e) => {
                      // Implement sorting logic here
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount-high">Amount (High to Low)</option>
                    <option value="amount-low">Amount (Low to High)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items per page
                  </label>
                  <select
                    onChange={(e) => {
                      // Handle items per page change
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    defaultValue="10"
                  >
                    <option value="5">5 items</option>
                    <option value="10">10 items</option>
                    <option value="20">20 items</option>
                    <option value="50">50 items</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <FaSync className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Payouts</div>
                    <div className="text-2xl font-bold text-gray-800">{payouts.length}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <FaCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total Amount</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(totalAmount, 'BDT')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <FaCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Completed</div>
                    <div className="text-2xl font-bold text-green-600">
                      {payouts.filter(p => p.status === 'completed').length}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(completedAmount, 'BDT')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                    <FaClock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Pending</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {payouts.filter(p => p.status === 'pending').length}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(pendingAmount, 'BDT')}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <FaCog className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Processing</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {payouts.filter(p => p.status === 'processing').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payouts Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {loading && payouts.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-center">
                    <div className="flex space-x-2 mb-4">
                      <div className="h-3 w-3 bg-orange-500 rounded-full animate-bounce"></div>
                      <div className="h-3 w-3 bg-orange-500 rounded-full animate-bounce animation-delay-200"></div>
                      <div className="h-3 w-3 bg-orange-500 rounded-full animate-bounce animation-delay-400"></div>
                    </div>
                    <p className="text-gray-500">Loading payouts...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payout ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Affiliate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment Method
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Requested Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentPayouts.length > 0 ? (
                          currentPayouts.map((payout) => (
                            <tr key={payout._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {payout.payoutId}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeColor(payout.priority)}`}>
                                    {payout.priority || 'normal'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-gray-600 font-medium">
                                      {payout.affiliate?.firstName?.charAt(0)}{payout.affiliate?.lastName?.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {payout.affiliate?.firstName} {payout.affiliate?.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {payout.affiliate?.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(payout.amount, payout.currency)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Net: {formatCurrency(payout.netAmount, payout.currency)}
                                </div>
                                    <div className="text-xs text-gray-500">
                                  Number: {payout?.paymentDetails}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="mr-2">
                                    {getStatusIcon(payout.status)}
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(payout.status)}`}>
                                    {payout.status}
                                  </span>
                                  
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                <div className="flex items-center">
                                  <div className="mr-2">
                                    {payout.paymentMethod === 'bkash' && <span className="text-green-600 font-bold">bKash</span>}
                                    {payout.paymentMethod === 'nagad' && <span className="text-red-600 font-bold">Nagad</span>}
                                    {payout.paymentMethod === 'rocket' && <span className="text-blue-600 font-bold">Rocket</span>}
                                    {!['bkash', 'nagad', 'rocket'].includes(payout.paymentMethod) && payout.paymentMethod}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(payout.requestedAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleViewPayout(payout._id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md transition-colors"
                                    title="View Details"
                                  >
                                    <FaEye /> View
                                  </button>
                                  <button
                                    onClick={() => openStatusModal(payout)}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 hover:bg-green-200 rounded-md transition-colors"
                                    title="Update Status"
                                  >
                                    <FaEdit /> Status
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(payout)}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-md transition-colors"
                                    title="Delete Payout"
                                  >
                                    <FaTrash /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="px-6 py-12 text-center">
                              <div className="text-gray-500">
                                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {searchTerm || statusFilter !== 'all' ? (
                                  'No payouts match your filters'
                                ) : (
                                  'No payouts found. Create your first payout.'
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="text-sm text-gray-700 mb-4 md:mb-0">
                          Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(indexOfLastItem, filteredPayouts.length)}
                          </span> of{' '}
                          <span className="font-medium">{filteredPayouts.length}</span> results
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          
                          {/* Page Numbers */}
                          <div className="flex space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                                    currentPage === pageNum
                                      ? 'bg-orange-500 text-white'
                                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* View Payout Modal */}
      {showViewModal && selectedPayout && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Payout Details
                  </h3>
                  <p className="text-sm text-gray-500">ID: {selectedPayout.payoutId}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedPayout.status)}`}>
                    {getStatusIcon(selectedPayout.status)}
                    <span className="ml-2">{selectedPayout.status}</span>
                  </span>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                  <dl className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Payout ID</dt>
                      <dd className="col-span-2 text-sm text-gray-900 font-mono">{selectedPayout.payoutId}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Affiliate</dt>
                      <dd className="col-span-2 text-sm text-gray-900">
                        {selectedPayout.affiliate?.firstName} {selectedPayout.affiliate?.lastName}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="col-span-2 text-sm text-gray-900">{selectedPayout.affiliate?.email}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Affiliate Code</dt>
                      <dd className="col-span-2 text-sm text-gray-900 font-mono">{selectedPayout.affiliate?.affiliateCode || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Payment Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Payment Information</h4>
                  <dl className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Amount</dt>
                      <dd className="col-span-2 text-sm text-gray-900 font-medium">
                        {formatCurrency(selectedPayout.amount, selectedPayout.currency)}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Net Amount</dt>
                      <dd className="col-span-2 text-sm text-gray-900">
                        {formatCurrency(selectedPayout.netAmount, selectedPayout.currency)}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                      <dd className="col-span-2 text-sm text-gray-900 capitalize">{selectedPayout.paymentMethod}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Payout Type</dt>
                      <dd className="col-span-2 text-sm text-gray-900 capitalize">{selectedPayout.payoutType}</dd>
                    </div>
                  </dl>
                </div>
                
                {/* Commission Breakdown */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Commission Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPayout.commissionBreakdown && Object.entries(selectedPayout.commissionBreakdown).map(([key, value]) => (
                      <div key={key} className={`bg-gray-50 p-3 rounded-md ${value > 0 ? 'border border-green-200' : ''}`}>
                        <div className="text-xs text-gray-500">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className={`text-sm font-medium ${value > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formatCurrency(value, selectedPayout.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Timestamps */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Timestamps</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500">Requested</div>
                      <div className="text-sm font-medium text-gray-900">{formatDate(selectedPayout.requestedAt)}</div>
                    </div>
                    {selectedPayout.processedAt && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-xs text-gray-500">Processed</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedPayout.processedAt)}</div>
                      </div>
                    )}
                    {selectedPayout.completedAt && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-xs text-gray-500">Completed</div>
                        <div className="text-sm font-medium text-gray-900">{formatDate(selectedPayout.completedAt)}</div>
                      </div>
                    )}
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-xs text-gray-500">Created</div>
                      <div className="text-sm font-medium text-gray-900">{formatDate(selectedPayout.createdAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Information */}
              {selectedPayout.failureReason && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-md font-medium text-red-800 mb-2">Failure Reason</h4>
                  <p className="text-sm text-red-700">{selectedPayout.failureReason}</p>
                  {selectedPayout.retryAttempt > 0 && (
                    <p className="text-sm text-red-700 mt-1">
                      Retry Attempt: {selectedPayout.retryAttempt} / {selectedPayout.maxRetries || 3}
                    </p>
                  )}
                </div>
              )}
              
              {/* Fees */}
              {(selectedPayout.fees && Object.values(selectedPayout.fees).some(fee => fee > 0)) && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Fees & Deductions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(selectedPayout.fees).map(([key, value]) => (
                      <div key={key} className={`bg-gray-50 p-3 rounded-md ${value > 0 ? 'border border-red-200' : ''}`}>
                        <div className="text-xs text-gray-500">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </div>
                        <div className={`text-sm font-medium ${value > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {formatCurrency(value, selectedPayout.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Payment Details */}
              {selectedPayout.paymentDetails && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Payment Details</h4>
                      <div className="bg-gray-50 p-4 rounded-md">
                    Payment Method
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap capitalize">
                      {selectedPayout.paymentMethod}
                    </pre>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    Account Number
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedPayout.paymentDetails}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between">
                <button
                  onClick={() => openStatusModal(selectedPayout)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  <FaEdit /> Update Status
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showStatusModal && selectedPayout && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Update Payout Status</h3>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Payout ID: {selectedPayout.payoutId}</p>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {statusOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatusUpdateData(prev => ({ ...prev, status: option.value }))}
                        className={`flex flex-col items-center justify-center p-3 rounded-md border ${
                          statusUpdateData.status === option.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`text-lg mb-1 ${option.color}`}>
                          {getStatusIcon(option.value)}
                        </div>
                        <span className={`text-xs font-medium ${option.color}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={statusUpdateData.transactionId}
                    onChange={(e) => setStatusUpdateData(prev => ({ ...prev, transactionId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter transaction/reference ID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={statusUpdateData.notes}
                    onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Add any notes about this status change..."
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Current Status</h4>
                      <div className="mt-1 text-sm text-blue-700">
                        {selectedPayout.status} - Last updated: {formatDate(selectedPayout.updatedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdate}
                  disabled={loading || !statusUpdateData.status}
                  className="px-4 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPayout && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Delete Payout</h3>
            </div>
            
            <div className="px-6 py-4">
              <div className="text-center mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Payout {selectedPayout.payoutId}?
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  This action cannot be undone. This will permanently delete the payout and all associated data.
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-red-800">Warning</h4>
                    <div className="mt-1 text-sm text-red-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Payout record will be permanently deleted</li>
                        <li>Transaction history will be lost</li>
                        <li>This action cannot be reversed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Payout Details</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Affiliate:</div>
                  <div className="text-gray-900 font-medium">
                    {selectedPayout.affiliate?.firstName} {selectedPayout.affiliate?.lastName}
                  </div>
                  <div className="text-gray-500">Amount:</div>
                  <div className="text-gray-900 font-medium">
                    {formatCurrency(selectedPayout.amount, selectedPayout.currency)}
                  </div>
                  <div className="text-gray-500">Status:</div>
                  <div className="text-gray-900 font-medium">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(selectedPayout.status)}`}>
                      {selectedPayout.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePayout}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Deleting...' : 'Delete Payout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Payout;