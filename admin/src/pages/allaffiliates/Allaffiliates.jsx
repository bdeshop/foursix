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
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaUserCheck,
  FaUserPlus,
  FaChartLine,
  FaDollarSign,
  FaLink,
  FaCog,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AllAffiliates = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState(null);
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
        sortOrder: sortConfig.direction
      });

      const response = await axios.get(`${base_url}/api/admin/affiliates?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setAffiliates(response.data.affiliates || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalAffiliates(response.data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch affiliates');
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
      await axios.delete(`${base_url}/api/admin/affiliates/${affiliateToDelete}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setAffiliates(affiliates.filter(affiliate => affiliate._id !== affiliateToDelete));
      toast.success('Affiliate deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting affiliate');
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
        bet: affiliate.commissionRate || 10,
        deposit: affiliate.depositRate || 0,
        registration: affiliate.cpaRate || 0
      });
      setShowCommissionModal(true);
    } else {
      try {
        const token = localStorage.getItem('adminToken');
        await axios.put(`${base_url}/api/admin/affiliates/${id}/status`,
          { status: newStatus },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        setAffiliates(affiliates.map(affiliate =>
          affiliate._id === id ? { ...affiliate, status: newStatus } : affiliate
        ));
        toast.success(`Affiliate status changed to ${newStatus}`);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error updating affiliate status');
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
      await axios.put(`${base_url}/api/admin/affiliates/${id}/verification-status`,
        { verificationStatus: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setAffiliates(affiliates.map(affiliate =>
        affiliate._id === id ? { ...affiliate, verificationStatus: newStatus } : affiliate
      ));
      toast.success(`Verification status changed to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating verification status');
    }
  };

  const openEditModal = async (affiliate) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${base_url}/api/admin/affiliates/${affiliate._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = response.data;
      setEditForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        company: data.company || '',
        website: data.website || '',
        promoMethod: data.promoMethod || '',
        commissionRate: data.commissionRate || 0,
        commissionType: data.commissionType || '',
        cpaRate: data.cpaRate || 0,
        depositRate: data.depositRate || 0,
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
      toast.error(err.response?.data?.message || 'Error fetching affiliate details');
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
        commissionRate: editForm.commissionRate,
        depositRate: editForm.depositRate,
      };

      const response = await axios.put(`${base_url}/api/admin/affiliates/${selectedAffiliateId}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      setAffiliates(affiliates.map(a => a._id === selectedAffiliateId ? response.data.affiliate : a));
      toast.success('Affiliate updated successfully');
      setShowEditModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating affiliate');
    }
  };

  const submitCommissionAndActivate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');

      await axios.put(`${base_url}/api/admin/affiliates/${selectedAffiliateId}/commission`, {
        commissionRate: commissionForm.bet,
        depositRate: commissionForm.deposit,
        cpaRate: commissionForm.registration,
        commissionType: 'hybrid'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      await axios.put(`${base_url}/api/admin/affiliates/${selectedAffiliateId}/status`,
        { status: 'active' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setAffiliates(affiliates.map(a => {
        if (a._id === selectedAffiliateId) {
          return {
            ...a,
            status: 'active',
            commissionRate: commissionForm.bet,
            depositRate: commissionForm.deposit,
            cpaRate: commissionForm.registration
          };
        }
        return a;
      }));

      toast.success('Affiliate activated with commission rates');
      setShowCommissionModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error activating affiliate');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
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
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Affiliate Management</h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                  <FaUsers className="text-amber-500" /> Oversee and manage all platform affiliates efficiently
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
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
                { label: 'ACTIVE', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400', icon: <FaUserCheck /> },
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
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setVerificationFilter('all'); }}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider"
                >
                  Clear All
                </button>
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
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('firstName')}>Affiliate {getSortIcon('firstName')}</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('affiliateCode')}>Code {getSortIcon('affiliateCode')}</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('pendingEarnings')}>Pending Earnings {getSortIcon('pendingEarnings')}</th>
                      <th className="px-5 py-3">Verification</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>Registered {getSortIcon('createdAt')}</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-16 text-center">
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
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              onClick={() => toggleVerificationStatus(affiliate._id, affiliate.verificationStatus)}
                              className={`text-[9px] px-2 py-1 rounded font-bold uppercase cursor-pointer ${
                                affiliate.verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                affiliate.verificationStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                affiliate.verificationStatus === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                              }`}>
                              {affiliate.verificationStatus || 'Unverified'}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={affiliate.status === 'active'}
                                  onChange={() => toggleStatus(affiliate._id, affiliate.status)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${
                                affiliate.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                affiliate.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {affiliate.status}
                              </span>
                            </div>
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
                        <td colSpan="8" className="px-6 py-16 text-center">
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
            <form onSubmit={submitCommissionAndActivate}>
              <div className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>Bet Commission (%)</label>
                  <input
                    type="number"
                    name="bet"
                    value={commissionForm.bet}
                    onChange={handleCommissionChange}
                    className={inputClass}
                    required
                    step="0.01"
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
                    required
                    step="0.01"
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
                    required
                    step="0.01"
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                >
                  <FaUserCheck /> Activate with Commissions
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
                  <FaSave /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AllAffiliates;