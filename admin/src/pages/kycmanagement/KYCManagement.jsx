import React, { useState, useEffect } from 'react';
import { 
  FaSpinner, 
  FaSearch, 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaUpload,
  FaDownload,
  FaFilter,
  FaCalendar,
  FaIdCard,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaChartBar,
  FaExclamationTriangle,
  FaImage,
  FaTrash,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaCopy,
  FaChevronLeft,
  FaChevronRight,
  FaList,
  FaColumns
} from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';

const KYCManagement = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [affiliates, setAffiliates] = useState([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAffiliates, setTotalAffiliates] = useState(0);
  const [limit, setLimit] = useState(10);
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Bulk actions
  const [selectedAffiliates, setSelectedAffiliates] = useState([]);
  const [bulkAction, setBulkAction] = useState('approve');
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');
  
  // View modes
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch affiliates with KYC data
  const fetchAffiliates = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        date: dateFilter !== 'all' ? dateFilter : '',
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      const response = await fetch(`${base_url}/api/admin/affiliates/kyc/pending?${params}`);
      const result = await response.json();
      console.log(result)
      if (response.ok) {
        setAffiliates(result.affiliates || []);
        setTotalPages(result.totalPages || 1);
        setTotalAffiliates(result.total || 0);
      } else {
        toast.error(result.error || 'Failed to fetch affiliates');
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error);
      toast.error('Error fetching affiliates');
    } finally {
      setFetching(false);
    }
  };

  // Fetch KYC stats
  const fetchKYCStats = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/kyc/stats`);
      const result = await response.json();
      
      if (response.ok) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching KYC stats:', error);
    }
  };

  // Fetch affiliate KYC timeline
  const fetchKYCTimeline = async (affiliateId) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliateId}/kyc/timeline`);
      const result = await response.json();
      
      if (response.ok) {
        setTimeline(result.timeline || []);
      }
    } catch (error) {
      console.error('Error fetching KYC timeline:', error);
    }
  };

  // Fetch affiliate KYC details
  const fetchAffiliateDetails = async (affiliateId) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliateId}/kyc-status`);
      const result = await response.json();
      
      if (response.ok) {
        setSelectedAffiliate(result);
        await fetchKYCTimeline(affiliateId);
      }
    } catch (error) {
      console.error('Error fetching affiliate details:', error);
      toast.error('Error fetching affiliate details');
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAffiliates();
    fetchKYCStats();
  }, [currentPage, limit, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  // Handle KYC status update
// Handle KYC status update
const handleUpdateKYCStatus = async (affiliateId, status, rejectionReason = '', notes = '') => {
  // Validate affiliateId
  if (!affiliateId || affiliateId === 'undefined') {
    toast.error('Invalid affiliate ID');
    return;
  }

  // Validate it looks like a MongoDB ObjectId (24 character hex string)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(affiliateId)) {
    toast.error('Invalid affiliate ID format');
    console.error('Invalid affiliate ID:', affiliateId);
    return;
  }

  setLoading(true);
  try {
    const payload = { kycStatus: status };
    if (rejectionReason) payload.rejectionReason = rejectionReason;
    if (notes) payload.notes = notes;

    console.log('Updating KYC status for affiliate:', affiliateId); // Debug log
    console.log('Payload:', payload); // Debug log

    const response = await fetch(`${base_url}/api/admin/affiliates/${affiliateId}/kyc-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      toast.success(result.message || 'KYC status updated successfully!');
      fetchAffiliates();
      setShowDetailsModal(false);
    } else {
      toast.error(result.error || 'Failed to update KYC status');
    }
  } catch (error) {
    console.error('Error updating KYC status:', error);
    toast.error('Error updating KYC status');
  } finally {
    setLoading(false);
  }
};
  // Handle bulk KYC update
  const handleBulkUpdate = async () => {
    if (selectedAffiliates.length === 0) {
      toast.error('Please select at least one affiliate');
      return;
    }

    if (bulkAction === 'reject' && !bulkRejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        affiliateIds: selectedAffiliates,
        action: bulkAction,
        rejectionReason: bulkRejectionReason,
        notes: bulkNotes
      };

      const response = await fetch(`${base_url}/api/admin/affiliates/kyc/bulk-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message || 'Bulk KYC update completed!');
        setSelectedAffiliates([]);
        setShowBulkModal(false);
        setBulkRejectionReason('');
        setBulkNotes('');
        fetchAffiliates();
        fetchKYCStats();
      } else {
        toast.error(result.error || 'Failed to process bulk update');
      }
    } catch (error) {
      console.error('Error processing bulk update:', error);
      toast.error('Error processing bulk update');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete KYC documents
  const handleDeleteDocuments = async (affiliateId, imageType) => {
    if (!window.confirm(`Are you sure you want to delete ${imageType} KYC documents?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliateId}/kyc/documents`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageType })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(result.message || 'KYC documents deleted successfully!');
        fetchAffiliateDetails(affiliateId);
      } else {
        toast.error(result.error || 'Failed to delete KYC documents');
      }
    } catch (error) {
      console.error('Error deleting KYC documents:', error);
      toast.error('Error deleting KYC documents');
    } finally {
      setLoading(false);
    }
  };

  // Handle affiliate selection
  const handleAffiliateSelect = (affiliateId) => {
    setSelectedAffiliates(prev => {
      if (prev.includes(affiliateId)) {
        return prev.filter(id => id !== affiliateId);
      } else {
        return [...prev, affiliateId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAffiliates.length === affiliates.length) {
      setSelectedAffiliates([]);
    } else {
      setSelectedAffiliates(affiliates.map(a => a._id));
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
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

  // Get status badge
  const getStatusBadge = (status) => {
    const config = {
      approved: { color: 'bg-green-100 text-green-800', icon: <FaCheck className="inline mr-1" /> },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <FaClock className="inline mr-1" /> },
      rejected: { color: 'bg-red-100 text-red-800', icon: <FaTimes className="inline mr-1" /> }
    };
    
    const { color, icon } = config[status] || config.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {icon}
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Get verification badge
  const getVerificationBadge = (verified) => {
    if (verified) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaUserCheck className="inline mr-1" />
          Verified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FaUserTimes className="inline mr-1" />
          Not Verified
        </span>
      );
    }
  };

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (column) => {
    if (sortBy !== column) return <FaSort className="inline ml-1 text-gray-400" />;
    return sortOrder === 'asc' 
      ? <FaSortUp className="inline ml-1 text-blue-500" /> 
      : <FaSortDown className="inline ml-1 text-blue-500" />;
  };

  // Handle view details
  const handleViewDetails = async (affiliate) => {
    await fetchAffiliateDetails(affiliate._id);
    setShowDetailsModal(true);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster />
      
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">KYC Management</h1>
                <p className="text-gray-600 mt-1">Manage affiliate KYC verifications</p>
              </div>
              
              <div className="flex space-x-2 mt-4 md:mt-0">
                <button
                  onClick={fetchKYCStats}
                  className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
                >
                  <FaChartBar className="mr-2" />
                  View Stats
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Affiliates</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.totalAffiliates}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaIdCard className="text-blue-500 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">KYC Verified</p>
                      <p className="text-2xl font-bold text-green-600">{stats.kycVerified}</p>
                      <p className="text-xs text-gray-500">
                        {stats.kycVerifiedPercentage?.toFixed(1)}% of total
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaUserCheck className="text-green-500 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending KYC</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.kycPending}</p>
                    </div>
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <FaClock className="text-yellow-500 text-xl" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Complete Documents</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.withBothImages}</p>
                      <p className="text-xs text-gray-500">
                        {stats.completeKycPercentage?.toFixed(1)}% of total
                      </p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FaImage className="text-purple-500 text-xl" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or affiliate code..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div className="w-full md:w-auto">
                  <select
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-md ${
                      viewMode === 'list' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaList />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 rounded-md ${
                      viewMode === 'grid' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <FaColumns />
                  </button>
                </div>
              </div>
            </div>

            {/* Affiliates Table/Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {fetching ? (
                <div className="flex justify-center items-center py-12">
                  <FaSpinner className="animate-spin text-blue-500 text-3xl" />
                </div>
              ) : affiliates.length === 0 ? (
                <div className="text-center py-12">
                  <FaExclamationTriangle className="mx-auto text-gray-400 text-4xl mb-4" />
                  <p className="text-gray-600">No affiliates found matching your criteria</p>
                </div>
              ) : viewMode === 'list' ? (
                // List View
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedAffiliates.length === affiliates.length && affiliates.length > 0}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('firstName')}
                        >
                          Affiliate {getSortIcon('firstName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('kycStatus')}
                        >
                          KYC Status {getSortIcon('kycStatus')}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('createdAt')}
                        >
                          Registered {getSortIcon('createdAt')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {affiliates.map((affiliate) => (
                        <tr key={affiliate._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedAffiliates.includes(affiliate._id)}
                              onChange={() => handleAffiliateSelect(affiliate._id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FaIdCard className="text-blue-600" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {affiliate.firstName} {affiliate.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {affiliate.affiliateCode}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{affiliate.email}</div>
                            <div className="text-sm text-gray-500">{affiliate.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {getStatusBadge(affiliate.kycStatus)}
                              <div className="text-xs text-gray-500">
                                {getVerificationBadge(affiliate.kycverified)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(affiliate.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(affiliate)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <FaEye className="inline mr-1" /> View
                            </button>
                            {affiliate.kycStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateKYCStatus(affiliate._id, 'approved', '', 'Approved by admin')}
                                  className="text-green-600 hover:text-green-900 mr-3"
                                >
                                  <FaCheck className="inline mr-1" /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) {
                                      handleUpdateKYCStatus(affiliate._id, 'rejected', reason);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <FaTimes className="inline mr-1" /> Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Grid View
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {affiliates.map((affiliate) => (
                    <div key={affiliate._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAffiliates.includes(affiliate._id)}
                            onChange={() => handleAffiliateSelect(affiliate._id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                          />
                          <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FaIdCard className="text-blue-600 text-xl" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {affiliate.firstName} {affiliate.lastName}
                            </h3>
                            <p className="text-xs text-gray-500">{affiliate.affiliateCode}</p>
                          </div>
                        </div>
                        {getStatusBadge(affiliate.kycStatus)}
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">{affiliate.email}</p>
                        <p className="text-sm text-gray-600">{affiliate.phone}</p>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex items-center text-xs text-gray-500 mb-1">
                          <FaCalendar className="mr-1" />
                          Registered: {formatDate(affiliate.createdAt)}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <FaImage className="mr-1" />
                          Documents: 
                          {affiliate.kycFrontImage && (
                            <span className="ml-1 text-green-600">Front</span>
                          )}
                          {affiliate.kycBackImage && (
                            <span className="ml-1 text-green-600">Back</span>
                          )}
                          {!affiliate.kycFrontImage && !affiliate.kycBackImage && (
                            <span className="ml-1 text-red-600">None</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={() => handleViewDetails(affiliate)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          <FaEye className="inline mr-1" /> Details
                        </button>
                        
                        {affiliate.kycStatus === 'pending' && (
                          <div className="space-x-2">
                            <button
                              onClick={() => handleUpdateKYCStatus(affiliate._id, 'approved', '', 'Approved by admin')}
                              className="text-sm text-green-600 hover:text-green-800"
                            >
                              <FaCheck className="inline" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  handleUpdateKYCStatus(affiliate._id, 'rejected', reason);
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              <FaTimes className="inline" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {affiliates.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * limit, totalAffiliates)}
                        </span> of{' '}
                        <span className="font-medium">{totalAffiliates}</span> affiliates
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronLeft />
                      </button>
                      
                      <span className="px-3 py-1 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Affiliate Details Modal */}
      {showDetailsModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  KYC Details - {selectedAffiliate.firstName} {selectedAffiliate.lastName}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">

                {/* KYC Status */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">KYC Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">KYC Status:</span>
                      {getStatusBadge(selectedAffiliate.kycStatus)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Verified:</span>
                      {getVerificationBadge(selectedAffiliate.kycverified)}
                    </div>
                  </div>

                  {/* KYC Documents */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">KYC Documents</h5>
                    <div className="grid grid-cols-2 gap-4">

<div className="grid grid-cols-2 gap-4">
  {selectedAffiliate.kycFrontImage ? (
    <div className="border border-gray-200 rounded-lg p-2">
      <div className="text-xs text-gray-500 mb-1">Front Image</div>
      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
        <img
          src={`${selectedAffiliate.kycFrontImage}`}
          alt="KYC Front"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  ) : (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
      <FaImage className="text-gray-400 mx-auto mb-2" />
      <div className="text-xs text-gray-500">No Front Image</div>
    </div>
  )}

  {selectedAffiliate.kycBackImage ? (
    <div className="border border-gray-200 rounded-lg p-2">
      <div className="text-xs text-gray-500 mb-1">Back Image</div>
      <div className="aspect-video bg-gray-100 rounded overflow-hidden">
        <img
          src={`${selectedAffiliate.kycBackImage}`}
          alt="KYC Back"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  ) : (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
      <FaImage className="text-gray-400 mx-auto mb-2" />
      <div className="text-xs text-gray-500">No Back Image</div>
    </div>
  )}
</div>

{/* Rejection Reason */}
{selectedAffiliate.kycStatus === 'rejected' && selectedAffiliate.rejectionReason && (
  <div className="mt-4">
    <label className="text-xs text-gray-500">Rejection Reason</label>
    <p className="text-sm bg-red-50 p-2 rounded mt-1">{selectedAffiliate.rejectionReason}</p>
  </div>
)}

{/* Admin Notes */}
{selectedAffiliate.notes && (
  <div className="mt-4">
    <label className="text-xs text-gray-500">Admin Notes</label>
    <p className="text-sm bg-gray-50 p-2 rounded mt-1">{selectedAffiliate.notes}</p>
  </div>
)}
</div>
</div>



<div className="mt-6 flex justify-end">
  <button
    onClick={() => setShowDetailsModal(false)}
    className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
  >
    Close
  </button>
</div>
</div>
</div>
</div>
</div>

{/* Bulk Action Modal */}
{showBulkModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Bulk KYC Update ({selectedAffiliates.length} affiliates)
        </h3>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Action
          </label>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="approve">Approve Selected</option>
            <option value="reject">Reject Selected</option>
            <option value="pending">Mark as Pending</option>
          </select>
        </div>

        {bulkAction === 'reject' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason (Required)
            </label>
            <textarea
              value={bulkRejectionReason}
              onChange={(e) => setBulkRejectionReason(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for rejection..."
              required
            />
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={bulkNotes}
            onChange={(e) => setBulkNotes(e.target.value)}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional notes..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowBulkModal(false);
              setBulkRejectionReason('');
              setBulkNotes('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkUpdate}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <FaUpload className="mr-2" />
                Update {selectedAffiliates.length} Affiliates
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Stats Modal */}
{showStatsModal && stats && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">KYC Statistics</h3>
          <button
            onClick={() => setShowStatsModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 mb-2">Document Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-blue-600">Total with Documents:</span>
                <span className="font-medium">{stats.withAnyImage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-600">Complete Documents:</span>
                <span className="font-medium">{stats.withBothImages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-yellow-600">Only Front Image:</span>
                <span className="font-medium">{stats.withOnlyFrontImage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-600">No Documents:</span>
                <span className="font-medium">{stats.withoutImages}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-700 mb-2">Verification Status</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-600">Verified Affiliates:</span>
                <span className="font-medium">{stats.kycVerified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-green-600">Verification Rate:</span>
                <span className="font-medium">{stats.kycVerifiedPercentage?.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-600">Pending Verification:</span>
                <span className="font-medium">{stats.kycPending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-600">Rejected Applications:</span>
                <span className="font-medium">{stats.kycRejected}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => {
                setStatusFilter('pending');
                setShowStatsModal(false);
              }}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 font-medium rounded-md hover:bg-yellow-200 transition-colors flex items-center justify-center"
            >
              <FaClock className="mr-2" />
              View Pending ({stats.kycPending})
            </button>
            <button
              onClick={() => {
                setStatusFilter('rejected');
                setShowStatsModal(false);
              }}
              className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-md hover:bg-red-200 transition-colors flex items-center justify-center"
            >
              <FaTimes className="mr-2" />
              View Rejected ({stats.kycRejected})
            </button>
            <button
              onClick={() => {
                setStatusFilter('all');
                setShowStatsModal(false);
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center"
            >
              <FaIdCard className="mr-2" />
              View All
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end">
          <button
            onClick={() => setShowStatsModal(false)}
            className="px-4 py-2 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
          </div> 
      )}
</section>
);
};

export default KYCManagement;