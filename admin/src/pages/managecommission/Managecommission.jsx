import React, { useState, useEffect } from 'react';
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEye,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMoneyBill,
  FaIdCard,
  FaSpinner,
  FaBalanceScale,
  FaSyncAlt,
  FaDollarSign,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaUsers,
  FaCog,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import toast, { Toaster } from 'react-hot-toast';

const Managecommission = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState(null);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [statusToastMessage, setStatusToastMessage] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showAffiliateDetails, setShowAffiliateDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [affiliates, setAffiliates] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAffiliates, setTotalAffiliates] = useState(0);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [commissionForm, setCommissionForm] = useState({ bet: 10, deposit: 0, registration: 0 });
  const [selectedAffiliateId, setSelectedAffiliateId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    website: '',
    promoMethod: '',
    commissionRate: 0,
    commissionType: '',
    cpaRate: 0,
    depositRate: 0,
    status: '',
    verificationStatus: '',
    paymentMethod: '',
    minimumPayout: 0,
    payoutSchedule: '',
    autoPayout: false,
    notes: '',
    tags: [],
  });
  
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: 'add',
    amount: '',
    reason: '',
    description: '',
    notes: ''
  });
  const [showBulkAdjustModal, setShowBulkAdjustModal] = useState(false);
  const [bulkAdjustmentForm, setBulkAdjustmentForm] = useState({
    notes: '',
    limit: 100,
    skip: 0
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedAffiliates, setSelectedAffiliates] = useState([]);
  const [showSelectedAdjustModal, setShowSelectedAdjustModal] = useState(false);
  const [selectedAdjustmentForm, setSelectedAdjustmentForm] = useState({
    notes: ''
  });

  const navigate = useNavigate();
  const itemsPerPage = 10;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchAffiliates();
  }, [currentPage, statusFilter, verificationFilter, searchTerm, sortConfig]);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : '',
        verificationStatus: verificationFilter !== 'all' ? verificationFilter : '',
        search: searchTerm,
        sortBy: sortConfig.key || 'createdAt',
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
      });

      const response = await fetch(`${base_url}/api/admin/affiliates?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch affiliates');

      const data = await response.json();
      setAffiliates(data.affiliates || []);
      setTotalPages(data.totalPages || 1);
      setTotalAffiliates(data.total || 0);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch affiliates');
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['all', 'pending', 'active', 'suspended', 'banned'];
  const verificationStatuses = ['all', 'unverified', 'pending', 'verified', 'rejected'];

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-500 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
  };

  const handleDelete = (id) => {
    setAffiliateToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliateToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete affiliate');

      setAffiliates(affiliates.filter(affiliate => affiliate._id !== affiliateToDelete));
      toast.success('Affiliate deleted successfully');
    } catch (err) {
      toast.error('Error deleting affiliate');
    } finally {
      setShowDeleteConfirm(false);
      setAffiliateToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAffiliateToDelete(null);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const affiliate = affiliates.find(a => a._id === id);

    if (newStatus === 'active') {
      setSelectedAffiliateId(id);
      setCommissionForm({
        bet: (affiliate.commissionRate * 100).toFixed(0) || 10,
        deposit: (affiliate.depositRate * 100).toFixed(0) || 0,
        registration: affiliate.cpaRate || 0
      });
      setShowCommissionModal(true);
    } else {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${base_url}/api/admin/affiliates/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update affiliate status');

        setAffiliates(affiliates.map(affiliate =>
          affiliate._id === id ? { ...affiliate, status: newStatus } : affiliate
        ));
        toast.success(`Affiliate status changed to ${newStatus}`);
      } catch (err) {
        toast.error('Error updating affiliate status');
      }
    }
  };

  const handleCommissionChange = (e) => {
    const { name, value } = e.target;
    setCommissionForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const toggleVerificationStatus = async (id, currentStatus) => {
    try {
      let newStatus;
      switch (currentStatus) {
        case 'verified': newStatus = 'rejected'; break;
        case 'rejected': newStatus = 'pending'; break;
        case 'pending': newStatus = 'unverified'; break;
        default: newStatus = 'verified';
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${base_url}/api/admin/affiliates/${id}/verification-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ verificationStatus: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update verification status');

      setAffiliates(affiliates.map(affiliate =>
        affiliate._id === id ? { ...affiliate, verificationStatus: newStatus } : affiliate
      ));
      toast.success(`Verification status changed to ${newStatus}`);
    } catch (err) {
      toast.error('Error updating verification status');
    }
  };

  const openEditModal = async (affiliate) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliate._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch affiliate details');

      const data = await response.json();
      setEditForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        company: data.company || '',
        website: data.website || '',
        promoMethod: data.promoMethod || '',
        commissionRate: data.commissionRate * 100 || 0,
        commissionType: data.commissionType || '',
        cpaRate: data.cpaRate || 0,
        depositRate: data.depositRate * 100 || 0,
        status: data.status || '',
        verificationStatus: data.verificationStatus || '',
        paymentMethod: data.paymentMethod || '',
        minimumPayout: data.minimumPayout || 0,
        payoutSchedule: data.payoutSchedule || '',
        autoPayout: data.autoPayout || false,
        notes: data.notes || '',
        tags: data.tags || [],
      });
      setSelectedAffiliateId(affiliate._id);
      setShowEditModal(true);
    } catch (err) {
      toast.error('Error fetching affiliate details');
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const updateData = {
        ...editForm,
        commissionRate: editForm.commissionRate / 100,
        depositRate: editForm.depositRate / 100,
      };

      const response = await fetch(`${base_url}/api/admin/affiliates/${selectedAffiliateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update affiliate');

      const updatedData = await response.json();
      setAffiliates(affiliates.map(a => a._id === selectedAffiliateId ? updatedData.affiliate : a));
      toast.success('Affiliate updated successfully');
      setShowEditModal(false);
    } catch (err) {
      toast.error('Error updating affiliate');
    }
  };

  const openAdjustBalanceModal = (affiliate) => {
    setSelectedAffiliateId(affiliate._id);
    setAdjustmentForm({
      type: 'add',
      amount: '',
      reason: '',
      description: `Balance adjustment for ${affiliate.firstName} ${affiliate.lastName}`,
      notes: ''
    });
    setShowAdjustBalanceModal(true);
  };

  const handleAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentForm(prev => ({ ...prev, [name]: value }));
  };

  const submitBalanceAdjustment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const { type, amount, reason, description, notes } = adjustmentForm;
      
      if (!amount || parseFloat(amount) <= 0) {
        toast.error('Please enter a valid positive amount');
        return;
      }

      let url = '';
      let body = {};
      
      if (type === 'add') {
        url = `${base_url}/api/admin/affiliates/${selectedAffiliateId}/balance/add`;
        body = {
          amount: parseFloat(amount),
          type: 'manual_adjustment',
          description: description,
          notes: notes || `Balance addition: ${reason || 'No reason provided'}`
        };
      } else {
        url = `${base_url}/api/admin/affiliates/${selectedAffiliateId}/balance/deduct`;
        body = {
          amount: parseFloat(amount),
          reason: reason,
          description: description,
          notes: notes
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to adjust balance');
      }

      const result = await response.json();
      
      setAffiliates(affiliates.map(a => {
        if (a._id === selectedAffiliateId) {
          return {
            ...a,
            pendingEarnings: result.newBalance || a.pendingEarnings,
            totalEarnings: result.totalEarnings || a.totalEarnings
          };
        }
        return a;
      }));

      toast.success(`Balance ${type === 'add' ? 'added' : 'deducted'} successfully`);
      setShowAdjustBalanceModal(false);
      setAdjustmentForm({ type: 'add', amount: '', reason: '', description: '', notes: '' });
    } catch (err) {
      toast.error(err.message || 'Error adjusting balance');
    }
  };

  const openBulkAdjustModal = () => {
    setBulkAdjustmentForm({ notes: '', limit: 100, skip: 0 });
    setShowBulkAdjustModal(true);
  };

  const handleBulkAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setBulkAdjustmentForm(prev => ({ ...prev, [name]: value }));
  };

  const submitBulkAdjustment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${base_url}/api/admin/affiliates/adjust-all-balances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bulkAdjustmentForm)
      });

      if (!response.ok) throw new Error('Failed to process bulk adjustment');

      const result = await response.json();
      toast.success(result.message || 'Bulk adjustment completed successfully');
      setShowBulkAdjustModal(false);
      fetchAffiliates();
    } catch (err) {
      toast.error(err.message || 'Error processing bulk adjustment');
    }
  };

  const fetchAdjustmentPreview = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const queryParams = new URLSearchParams({
        limit: bulkAdjustmentForm.limit,
        skip: bulkAdjustmentForm.skip
      });

      const response = await fetch(`${base_url}/api/admin/affiliates/adjustment-preview?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch adjustment preview');

      const data = await response.json();
      setPreviewData(data.preview);
      setShowPreviewModal(true);
    } catch (err) {
      toast.error(err.message || 'Error fetching preview');
    }
  };

  const toggleAffiliateSelection = (affiliateId) => {
    setSelectedAffiliates(prev => {
      if (prev.includes(affiliateId)) {
        return prev.filter(id => id !== affiliateId);
      } else {
        return [...prev, affiliateId];
      }
    });
  };

  const openSelectedAdjustModal = () => {
    if (selectedAffiliates.length === 0) {
      toast.error('Please select at least one affiliate');
      return;
    }
    setSelectedAdjustmentForm({ notes: '' });
    setShowSelectedAdjustModal(true);
  };

  const submitSelectedAdjustment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${base_url}/api/admin/affiliates/adjust-selected-balances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          affiliateIds: selectedAffiliates,
          notes: selectedAdjustmentForm.notes
        })
      });

      if (!response.ok) throw new Error('Failed to adjust selected affiliates');

      const result = await response.json();
      toast.success(result.message || 'Selected affiliates adjusted successfully');
      setShowSelectedAdjustModal(false);
      setSelectedAffiliates([]);
      fetchAffiliates();
    } catch (err) {
      toast.error(err.message || 'Error adjusting selected affiliates');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, verificationFilter]);

  const stats = {
    total: totalAffiliates,
    active: affiliates.filter(a => a.status === 'active').length,
    verified: affiliates.filter(a => a.verificationStatus === 'verified').length,
    pendingEarnings: affiliates.reduce((sum, a) => sum + (a.pendingEarnings || 0), 0).toFixed(2),
  };

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

  if (error && !loading) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center bg-[#161B22] border border-gray-800 rounded-lg p-8 max-w-md">
                <div className="text-rose-400 text-4xl mb-4">⚠️</div>
                <p className="text-gray-400 text-sm">{error}</p>
                <button onClick={fetchAffiliates} className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all">
                  Try Again
                </button>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

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
            {/* Page Header */}
            <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Commission Management</h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                  <FaChartLine className="text-amber-500" /> Manage affiliate commissions and balance adjustments
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
                <button
                  onClick={openBulkAdjustModal}
                  className="bg-[#1F2937] hover:bg-purple-600/20 border border-gray-700 hover:border-purple-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-purple-400"
                >
                  <FaSyncAlt /> BULK ADJUSTMENT
                </button>
                {selectedAffiliates.length > 0 && (
                  <button
                    onClick={openSelectedAdjustModal}
                    className="bg-[#1F2937] hover:bg-emerald-600/20 border border-gray-700 hover:border-emerald-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-emerald-400"
                  >
                    <FaBalanceScale /> ADJUST SELECTED ({selectedAffiliates.length})
                  </button>
                )}
                <button
                  onClick={fetchAffiliates}
                  className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'TOTAL AFFILIATES', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white', icon: <FaUsers /> },
                { label: 'ACTIVE', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400', icon: <FaUser /> },
                { label: 'VERIFIED', value: stats.verified, color: 'border-blue-500', valueClass: 'text-blue-400', icon: <FaCheckCircle /> },
                { label: 'PENDING EARNINGS', value: `${stats.pendingEarnings} BDT`, color: 'border-amber-500', valueClass: 'text-amber-400', icon: <FaDollarSign /> },
              ].map((card, i) => (
                <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                    <div className="text-gray-600">{card.icon}</div>
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
                  {selectedAffiliates.length > 0 && (
                    <span className="text-[9px] text-emerald-400 font-bold">
                      {selectedAffiliates.length} selected
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setVerificationFilter('all');
                      setSelectedAffiliates([]);
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputClass} pl-8`}
                    placeholder="Search name, email, or code..."
                  />
                </div>

                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>

                <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} className={selectClass}>
                  {verificationStatuses.map((status) => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>

                <select
                  className={selectClass}
                  value={sortConfig.key}
                  onChange={(e) => requestSort(e.target.value)}
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="firstName">Sort by Name</option>
                  <option value="pendingEarnings">Sort by Earnings</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-3 flex justify-between items-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Showing {affiliates.length} of {totalAffiliates} affiliates
              </p>
              <button
                onClick={fetchAdjustmentPreview}
                className="text-[9px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <FaBalanceScale /> Preview Balance Adjustment
              </button>
            </div>

            {/* Affiliates Table */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
                Affiliate List
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedAffiliates.length === affiliates.length && affiliates.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAffiliates(affiliates.map(a => a._id));
                            } else {
                              setSelectedAffiliates([]);
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-[#0F111A]"
                        />
                      </th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('firstName')}>Affiliate {getSortIcon('firstName')}</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('affiliateCode')}>Code {getSortIcon('affiliateCode')}</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('pendingEarnings')}>Pending Earnings {getSortIcon('pendingEarnings')}</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>Registered {getSortIcon('createdAt')}</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading affiliates...</p>
                          </div>
                        </td>
                      </tr>
                    ) : affiliates.length > 0 ? (
                      affiliates.map((affiliate) => (
                        <tr key={affiliate._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedAffiliates.includes(affiliate._id)}
                              onChange={() => toggleAffiliateSelection(affiliate._id)}
                              className="h-4 w-4 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-[#0F111A]"
                            />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                {affiliate.firstName?.charAt(0) || 'A'}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{`${affiliate.firstName || ''} ${affiliate.lastName || ''}`}</div>
                                <div className="text-[10px] text-gray-500">{affiliate.company || 'Individual'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-[10px] font-mono text-amber-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-800">
                              {affiliate.affiliateCode}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-300">{affiliate.email}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <FaPhone className="text-[8px]" /> {affiliate.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-amber-400">{affiliate.pendingEarnings?.toFixed(2) || 0} BDT</div>
                            <div className="text-[10px] text-gray-500">Commission: {(affiliate.commissionRate || 0).toFixed(0)}%</div>
                            {affiliate.minusBalance > 0 && (
                              <div className="text-[9px] text-rose-400 font-medium">Minus Balance: {affiliate.minusBalance} BDT</div>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(affiliate.createdAt)}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => navigate(`/affiliates/affiliate-details/${affiliate._id}`)}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/20 text-blue-400 rounded text-xs transition-all"
                                title="View details"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => openEditModal(affiliate)}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 text-amber-400 rounded text-xs transition-all"
                                title="Edit affiliate"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => openAdjustBalanceModal(affiliate)}
                                className="p-1.5 bg-purple-500/10 hover:bg-purple-500/30 border border-purple-500/20 text-purple-400 rounded text-xs transition-all"
                                title="Adjust Balance"
                              >
                                <FaBalanceScale />
                              </button>
                              <button
                                onClick={() => handleDelete(affiliate._id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                title="Delete affiliate"
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
                            <FaUsers className="text-4xl mb-3 opacity-20" />
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No affiliates found</p>
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
            {totalPages > 1 && !loading && (
              <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                  Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalAffiliates} total
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
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confirm Deletion</h3>
              <button onClick={cancelDelete} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-5">
                Are you sure you want to delete this affiliate? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >Cancel</button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaTrash /> Delete Affiliate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Setup Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaCog /> Set Commission Rates
              </h3>
              <button onClick={() => setShowCommissionModal(false)} className="text-gray-500 hover:text-gray-300">
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const token = localStorage.getItem('adminToken');
                const responseCommission = await fetch(`${base_url}/api/admin/affiliates/${selectedAffiliateId}/commission`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    commissionRate: commissionForm.bet / 100,
                    depositRate: commissionForm.deposit / 100,
                    cpaRate: commissionForm.registration,
                    commissionType: 'hybrid'
                  })
                });

                if (!responseCommission.ok) throw new Error('Failed to update commissions');

                const responseStatus = await fetch(`${base_url}/api/admin/affiliates/${selectedAffiliateId}/status`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ status: 'active' })
                });

                if (!responseStatus.ok) throw new Error('Failed to update status');

                setAffiliates(affiliates.map(a => {
                  if (a._id === selectedAffiliateId) {
                    return {
                      ...a,
                      status: 'active',
                      commissionRate: commissionForm.bet / 100,
                      depositRate: commissionForm.deposit / 100,
                      cpaRate: commissionForm.registration
                    };
                  }
                  return a;
                }));

                toast.success('Affiliate activated with new commission rates');
                setShowCommissionModal(false);
              } catch (err) {
                toast.error('Error activating affiliate');
              }
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>Bet Commission (%)</label>
                  <input 
                    type="number" 
                    name="bet"
                    value={commissionForm.bet}
                    onChange={handleCommissionChange}
                    className={inputClass}
                    min="1"
                    max="50"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Deposit Commission (%)</label>
                  <input 
                    type="number" 
                    name="deposit"
                    value={commissionForm.deposit}
                    onChange={handleCommissionChange}
                    className={inputClass}
                    min="0"
                    max="50"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Registration Commission (BDT)</label>
                  <input 
                    type="number" 
                    name="registration"
                    value={commissionForm.registration}
                    onChange={handleCommissionChange}
                    className={inputClass}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all"
                >
                  Activate with Commissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center sticky top-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaEdit /> Edit Affiliate
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-300">
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={submitEdit}>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" name="firstName" value={editForm.firstName} onChange={handleEditChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input type="text" name="lastName" value={editForm.lastName} onChange={handleEditChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Company</label>
                    <input type="text" name="company" value={editForm.company} onChange={handleEditChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Website</label>
                    <input type="text" name="website" value={editForm.website} onChange={handleEditChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Promo Method</label>
                    <input type="text" name="promoMethod" value={editForm.promoMethod} onChange={handleEditChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Commission Rate (%)</label>
                    <input type="number" name="commissionRate" value={editForm.commissionRate} onChange={handleEditChange} className={inputClass} step="0.01" />
                  </div>
                  <div>
                    <label className={labelClass}>Commission Type</label>
                    <input type="text" name="commissionType" value={editForm.commissionType} onChange={handleEditChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>CPA Rate (BDT)</label>
                    <input type="number" name="cpaRate" value={editForm.cpaRate} onChange={handleEditChange} className={inputClass} step="0.01" />
                  </div>
                  <div>
                    <label className={labelClass}>Deposit Rate (%)</label>
                    <input type="number" name="depositRate" value={editForm.depositRate} onChange={handleEditChange} className={inputClass} step="0.01" />
                  </div>
                  <div>
                    <label className={labelClass}>Status</label>
                    <select name="status" value={editForm.status} onChange={handleEditChange} className={selectClass}>
                      {statuses.slice(1).map((status) => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Verification Status</label>
                    <select name="verificationStatus" value={editForm.verificationStatus} onChange={handleEditChange} className={selectClass}>
                      {verificationStatuses.slice(1).map((status) => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Payment Method</label>
                    <input type="text" name="paymentMethod" value={editForm.paymentMethod} onChange={handleEditChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Minimum Payout (BDT)</label>
                    <input type="number" name="minimumPayout" value={editForm.minimumPayout} onChange={handleEditChange} className={inputClass} step="0.01" />
                  </div>
                  <div>
                    <label className={labelClass}>Payout Schedule</label>
                    <input type="text" name="payoutSchedule" value={editForm.payoutSchedule} onChange={handleEditChange} className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Notes</label>
                    <textarea name="notes" value={editForm.notes} onChange={handleEditChange} className={`${inputClass} min-h-[80px]`} />
                  </div>
                </div>
              </div>
              <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                >
                  <FaEdit /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Affiliate Balance Adjustment Modal */}
      {showAdjustBalanceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <FaBalanceScale /> Adjust Affiliate Balance
              </h3>
              <button onClick={() => setShowAdjustBalanceModal(false)} className="text-gray-500 hover:text-gray-300">
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={submitBalanceAdjustment}>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>Adjustment Type</label>
                  <select name="type" value={adjustmentForm.type} onChange={handleAdjustmentChange} className={selectClass}>
                    <option value="add">Add Balance</option>
                    <option value="deduct">Deduct Balance</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Amount (BDT)</label>
                  <input type="number" name="amount" value={adjustmentForm.amount} onChange={handleAdjustmentChange} className={inputClass} min="0.01" step="0.01" required />
                </div>
                <div>
                  <label className={labelClass}>Reason</label>
                  <input type="text" name="reason" value={adjustmentForm.reason} onChange={handleAdjustmentChange} className={inputClass} placeholder="e.g., Bonus, Correction, etc." />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea name="description" value={adjustmentForm.description} onChange={handleAdjustmentChange} className={`${inputClass} min-h-[60px]`} />
                </div>
                <div>
                  <label className={labelClass}>Notes (Optional)</label>
                  <textarea name="notes" value={adjustmentForm.notes} onChange={handleAdjustmentChange} className={`${inputClass} min-h-[60px]`} />
                </div>
              </div>
              <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdjustBalanceModal(false)} className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all">Adjust Balance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Adjustment Modal */}
      {showBulkAdjustModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                <FaSyncAlt /> Bulk Balance Adjustment
              </h3>
              <button onClick={() => setShowBulkAdjustModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <form onSubmit={submitBulkAdjustment}>
              <div className="p-6 space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="text-[9px] font-bold text-yellow-400 mb-2">Important Notice</h4>
                  <p className="text-[9px] text-yellow-300">This will deduct the <strong>minusBalance</strong> from <strong>totalEarnings</strong> for all affiliates with positive minusBalance. MinusBalance will be reset to 0.</p>
                </div>
                <div>
                  <label className={labelClass}>Notes (Optional)</label>
                  <textarea name="notes" value={bulkAdjustmentForm.notes} onChange={handleBulkAdjustmentChange} className={`${inputClass} min-h-[80px]`} placeholder="Enter reason for bulk adjustment..." />
                </div>
              </div>
              <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowBulkAdjustModal(false)} className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-bold transition-all">Process Bulk Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center sticky top-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Adjustment Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                  <h4 className="text-[9px] font-bold text-gray-400 mb-3">Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-[9px] text-gray-500">Total Affected:</span><span className="text-[9px] font-bold text-white">{previewData.totalAffected}</span></div>
                    <div className="flex justify-between"><span className="text-[9px] text-gray-500">Current Batch:</span><span className="text-[9px] font-bold text-white">{previewData.currentBatch}</span></div>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-[9px] font-bold text-blue-400 mb-3">Financial Impact</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-[9px] text-gray-500">Current Total Earnings:</span><span className="text-[9px] font-bold text-white">{previewData.totals.currentTotalEarnings.toFixed(2)} BDT</span></div>
                    <div className="flex justify-between"><span className="text-[9px] text-gray-500">Total Minus Balance:</span><span className="text-[9px] font-bold text-rose-400">{previewData.totals.totalMinusBalance.toFixed(2)} BDT</span></div>
                    <div className="flex justify-between"><span className="text-[9px] text-gray-500">Projected Total Earnings:</span><span className="text-[9px] font-bold text-emerald-400">{previewData.totals.projectedTotalEarnings.toFixed(2)} BDT</span></div>
                    <div className="flex justify-between"><span className="text-[9px] text-gray-500">Total Adjustment:</span><span className="text-[9px] font-bold text-rose-400">{previewData.totals.totalAdjustment.toFixed(2)} BDT</span></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-bold text-gray-400 mb-3">Affiliates to be Adjusted</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#0F111A] text-[8px] text-gray-500 uppercase">
                      <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Current Earnings</th><th className="px-3 py-2">Minus Balance</th><th className="px-3 py-2">Projected Earnings</th><th className="px-3 py-2">Adjustment</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {previewData.affiliates.map((affiliate, index) => (
                        <tr key={index} className="hover:bg-[#1F2937]"><td className="px-3 py-2 text-[9px] text-white">{affiliate.name}</td><td className="px-3 py-2 text-[9px] text-gray-400">{affiliate.currentTotalEarnings.toFixed(2)}</td><td className="px-3 py-2 text-[9px] text-rose-400">{affiliate.minusBalance.toFixed(2)}</td><td className="px-3 py-2 text-[9px] text-emerald-400">{affiliate.projectedTotalEarnings.toFixed(2)}</td><td className="px-3 py-2 text-[9px] text-rose-400">{affiliate.adjustmentAmount.toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end"><button onClick={() => setShowPreviewModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-all">Close</button></div>
          </div>
        </div>
      )}

      {/* Selected Affiliates Adjustment Modal */}
      {showSelectedAdjustModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2"><FaBalanceScale /> Adjust Selected Affiliates</h3>
              <button onClick={() => setShowSelectedAdjustModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <form onSubmit={submitSelectedAdjustment}>
              <div className="p-6 space-y-4">
                <p className="text-[9px] text-gray-500 mb-2">This will adjust {selectedAffiliates.length} selected affiliate(s). MinusBalance will be deducted from totalEarnings.</p>
                <div><label className={labelClass}>Notes (Optional)</label><textarea name="notes" value={selectedAdjustmentForm.notes} onChange={(e) => setSelectedAdjustmentForm({ notes: e.target.value })} className={`${inputClass} min-h-[80px]`} placeholder="Enter reason for adjustment..." /></div>
              </div>
              <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowSelectedAdjustModal(false)} className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all">Adjust Selected</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Managecommission;