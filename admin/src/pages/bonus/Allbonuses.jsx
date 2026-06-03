import React, { useState, useEffect } from 'react';
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaEye,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaGift,
  FaCalendarAlt,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaCopy,
  FaCalendar,
  FaFilter,
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import toast, { Toaster } from 'react-hot-toast';

const Allbonuses = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBonuses, setTotalBonuses] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bonusToDelete, setBonusToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignAmount, setAssignAmount] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validateCode, setValidateCode] = useState('');
  const [validateUserId, setValidateUserId] = useState('');
  const [validationResult, setValidationResult] = useState(null);

  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchBonuses();
  }, [currentPage, statusFilter, typeFilter, searchTerm, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : '',
        bonusType: typeFilter !== 'all' ? typeFilter : '',
        search: searchTerm,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction === 'descending' ? 'desc' : 'asc',
      });

      const response = await fetch(`${base_url}/api/admin/bonuses?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bonuses');

      const data = await response.json();
      if (data.success) {
        setBonuses(data.bonuses || []);
        setTotalPages(data.totalPages || 1);
        setTotalBonuses(data.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch bonuses');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch bonuses');
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = ['all', 'active', 'inactive', 'expired'];
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'welcome', label: 'Welcome Bonus' },
    { value: 'deposit', label: 'Deposit Bonus' },
    { value: 'reload', label: 'Reload Bonus' },
    { value: 'cashback', label: 'Cashback' },
    { value: 'free_spin', label: 'Free Spins' },
    { value: 'special', label: 'Special Bonus' },
    { value: 'manual', label: 'Manual Bonus' },
  ];

  const requestSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
  };

  const handleDelete = (id) => {
    setBonusToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/${bonusToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete bonus');
      setBonuses(bonuses.filter((b) => b._id !== bonusToDelete));
      toast.success('Bonus deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete bonus');
    } finally {
      setShowDeleteConfirm(false);
      setBonusToDelete(null);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update bonus status');
      setBonuses(bonuses.map((b) => (b._id === id ? { ...b, status: newStatus } : b)));
      toast.success(`Bonus status changed to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update bonus status');
    }
  };

  const openAssignModal = (bonus) => {
    setSelectedBonus(bonus);
    setAssignAmount(bonus.amount || '');
    setAssignReason('');
    setAssignUserId('');
    setShowAssignModal(true);
  };

  const handleAssignBonus = async (e) => {
    e.preventDefault();
    if (!assignUserId.trim()) { toast.error('Please enter user ID'); return; }
    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/assign-to-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ userId: assignUserId, bonusId: selectedBonus._id, amount: assignAmount || undefined, reason: assignReason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to assign bonus');
      toast.success('Bonus assigned successfully');
      setShowAssignModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to assign bonus');
    }
  };

  const handleValidateCode = async (e) => {
    e.preventDefault();
    if (!validateCode.trim() || !validateUserId.trim()) { toast.error('Please enter both bonus code and user ID'); return; }
    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/validate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ bonusCode: validateCode.toUpperCase(), userId: validateUserId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Validation failed');
      setValidationResult(data);
      if (data.isValid) toast.success('Bonus code is valid!');
    } catch (err) {
      toast.error(err.message || 'Validation failed');
      setValidationResult({ isValid: false, error: err.message });
    }
  };

  const copyBonusCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Bonus code copied!');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatBonusType = (type) =>
    type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getBonusTypeIcon = (type) => {
    const icons = { welcome: '🎉', deposit: '💰', reload: '🔄', cashback: '💸', free_spin: '🎰', special: '⭐', manual: '✏️' };
    return icons[type] || '🎁';
  };

  const getApplicableToLabel = (type) => {
    const map = { all: 'All Users', new: 'New Users Only', existing: 'Existing Users Only' };
    return map[type] || type;
  };

  const getBonusValue = (bonus) => {
    if (bonus.amount > 0) return `৳${bonus.amount.toFixed(2)}`;
    if (bonus.percentage > 0) return `${bonus.percentage}%${bonus.maxBonus ? ` (max ৳${bonus.maxBonus.toFixed(2)})` : ''}`;
    return 'No Value';
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'active': return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400' };
      case 'inactive': return { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', dot: 'bg-gray-400' };
      case 'expired': return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', dot: 'bg-rose-400' };
      default: return { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', dot: 'bg-gray-400' };
    }
  };

  const stats = {
    total: totalBonuses,
    active: bonuses.filter((b) => b.status === 'active').length,
    welcome: bonuses.filter((b) => b.bonusType === 'welcome').length,
    expiringSoon: bonuses.filter((b) => {
      if (!b.endDate) return false;
      const diff = Math.ceil((new Date(b.endDate) - new Date()) / (1000 * 60 * 60 * 24));
      return diff <= 7 && diff > 0;
    }).length,
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

          {/* Error Banner */}
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-4 text-lg leading-none hover:text-rose-300">×</button>
            </div>
          )}

          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Bonus Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-amber-500" /> Manage and monitor all platform bonuses
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link
                to="/create-bonus"
                className="bg-[#1F2937] hover:bg-amber-600/20 border border-gray-700 hover:border-amber-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FaPlus /> CREATE BONUS
              </Link>
              <button
                onClick={fetchBonuses}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL BONUSES', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'ACTIVE', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'WELCOME BONUS', value: stats.welcome, color: 'border-amber-500', valueClass: 'text-amber-400' },
              { label: 'EXPIRING SOON', value: stats.expiringSoon, color: 'border-rose-500', valueClass: 'text-rose-400' },
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
                <div className="w-1 h-4 bg-amber-500"></div> Filters & Search
              </h2>
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setTypeFilter('all'); }}
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
                  placeholder="Search name or code..."
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">All Status</option>
                {statusOptions.filter((s) => s !== 'all').map((s, i) => (
                  <option key={i} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
                {typeOptions.map((opt, i) => (
                  <option key={i} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {bonuses.length} of {totalBonuses} bonuses
            </p>
          </div>

          {/* Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
              Bonus List
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('name')}>Bonus Name {getSortIcon('name')}</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('bonusCode')}>Code {getSortIcon('bonusCode')}</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('amount')}>Value {getSortIcon('amount')}</th>
                    <th className="px-5 py-3">Wagering</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>Created {getSortIcon('createdAt')}</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading bonuses...</p>
                        </div>
                      </td>
                    </tr>
                  ) : bonuses.length > 0 ? (
                    bonuses.map((bonus) => {
                      const statusInfo = getStatusInfo(bonus.status);
                      return (
                        <tr key={bonus._id} className="hover:bg-[#1F2937] transition-colors">
                          {/* Name */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getBonusTypeIcon(bonus.bonusType)}</span>
                              <div>
                                <div className="text-sm font-bold text-white">{bonus.name}</div>
                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <FaUsers className="text-[9px]" /> {getApplicableToLabel(bonus.applicableTo)}
                                </div>
                              </div>
                            </div>
                          </td>
                          {/* Code */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-gray-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-800">
                                {bonus.bonusCode}
                              </span>
                              <button onClick={() => copyBonusCode(bonus.bonusCode)} className="text-gray-600 hover:text-amber-400 transition-colors">
                                <FaCopy className="text-xs" />
                              </button>
                            </div>
                          </td>
                          {/* Type */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-amber-400">{formatBonusType(bonus.bonusType)}</span>
                          </td>
                          {/* Value */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-black text-amber-400">{getBonusValue(bonus)}</div>
                            {bonus.minDeposit > 0 && (
                              <div className="text-[10px] text-gray-500">Min: ৳{bonus.minDeposit.toFixed(2)}</div>
                            )}
                          </td>
                          {/* Wagering */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-indigo-400">{bonus.wageringRequirement}x</span>
                          </td>
                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={bonus.status === 'active'}
                                  onChange={() => toggleStatus(bonus._id, bonus.status)}
                                  className="sr-only peer"
                                  disabled={bonus.status === 'expired'}
                                />
                                <div className="w-9 h-5 bg-gray-700 peer-disabled:opacity-40 peer-disabled:cursor-not-allowed rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                              </label>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${statusInfo.badge}`}>
                                {bonus.status}
                              </span>
                            </div>
                          </td>
                          {/* Created */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(bonus.createdAt)}</div>
                            {bonus.endDate && (
                              <div className="text-[10px] text-rose-400/70 flex items-center gap-1 mt-0.5">
                                <FaCalendarAlt className="text-[9px]" /> Expires: {formatDate(bonus.endDate)}
                              </div>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <Link
                                to={`/deposit-bonus/view-bonus/${bonus._id}`}
                                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                                title="View"
                              >
                                <FaEye />
                              </Link>
                              <Link
                                to={`/deposit-bonus/edit-bonus/${bonus._id}`}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 text-amber-400 rounded text-xs transition-all"
                                title="Edit"
                              >
                                <FaEdit />
                              </Link>
                              <button
                                onClick={() => handleDelete(bonus._id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                title="Delete"
                              >
                                <FaTrash />
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
                          <FaGift className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No bonuses found</p>
                          <p className="text-xs mt-1 mb-4">Try adjusting your search or filters</p>
                          <Link
                            to="/create-bonus"
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                          >
                            <FaPlus /> Create Your First Bonus
                          </Link>
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
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalBonuses} total
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

        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confirm Deletion</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-5">
                Are you sure you want to delete this bonus? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >Cancel</button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaTrash /> Delete Bonus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Details Modal */}
      {showDetailsModal && selectedBonus && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128] sticky top-0 z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaGift /> Bonus Details
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-5">
                <h2 className="text-xl font-black text-white mb-2">{selectedBonus.name}</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-gray-400 bg-[#0F111A] px-3 py-1.5 rounded border border-gray-800">{selectedBonus.bonusCode}</span>
                  <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${getStatusInfo(selectedBonus.status).badge}`}>{selectedBonus.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="bg-[#0F111A] border border-gray-800 p-4 rounded">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Bonus Info</p>
                  <dl className="space-y-2">
                    {[
                      ['Type', `${getBonusTypeIcon(selectedBonus.bonusType)} ${formatBonusType(selectedBonus.bonusType)}`],
                      ['Applicable To', getApplicableToLabel(selectedBonus.applicableTo)],
                      ['Value', getBonusValue(selectedBonus)],
                      ['Min Deposit', `৳${selectedBonus.minDeposit?.toFixed(2) || '0.00'}`],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500">{label}:</dt>
                        <dd className="text-xs font-medium text-gray-200 text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="bg-[#0F111A] border border-gray-800 p-4 rounded">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Requirements & Validity</p>
                  <dl className="space-y-2">
                    {[
                      ['Wagering', `${selectedBonus.wageringRequirement}x`],
                      ['Validity', `${selectedBonus.validityDays} days`],
                      ['Start Date', formatDate(selectedBonus.startDate)],
                      ['End Date', selectedBonus.endDate ? formatDate(selectedBonus.endDate) : 'No expiry'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500">{label}:</dt>
                        <dd className="text-xs font-medium text-gray-200 text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end sticky bottom-0">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Bonus Modal */}
      {showAssignModal && selectedBonus && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Assign Bonus to User</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <form onSubmit={handleAssignBonus} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">User ID <span className="text-rose-400">*</span></label>
                <input type="text" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} placeholder="Enter user ID" className={inputClass} required />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Bonus Amount (Optional)</label>
                <input type="number" value={assignAmount} onChange={(e) => setAssignAmount(e.target.value)} placeholder="Leave blank to use default" className={inputClass} step="0.01" min="0" />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Reason (Optional)</label>
                <textarea value={assignReason} onChange={(e) => setAssignReason(e.target.value)} placeholder="Reason for manual assignment" className={inputClass} rows="3" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all">Assign Bonus</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validate Code Modal */}
      {showValidateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaCheckCircle className="text-emerald-400" /> Validate Bonus Code
              </h3>
              <button onClick={() => setShowValidateModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <form onSubmit={handleValidateCode} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Bonus Code <span className="text-rose-400">*</span></label>
                <input type="text" value={validateCode} onChange={(e) => setValidateCode(e.target.value.toUpperCase())} placeholder="Enter bonus code" className={`${inputClass} uppercase`} required />
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">User ID <span className="text-rose-400">*</span></label>
                <input type="text" value={validateUserId} onChange={(e) => setValidateUserId(e.target.value)} placeholder="Enter user ID" className={inputClass} required />
              </div>
              {validationResult && (
                <div className={`p-4 rounded border ${validationResult.isValid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {validationResult.isValid
                      ? <><FaCheckCircle className="text-emerald-400" /><span className="text-xs font-bold text-emerald-400">Valid Bonus Code</span></>
                      : <><FaTimesCircle className="text-rose-400" /><span className="text-xs font-bold text-rose-400">Invalid Bonus Code</span></>
                    }
                  </div>
                  {validationResult.bonus && (
                    <div className="space-y-1">
                      {[['Name', validationResult.bonus.name], ['Type', formatBonusType(validationResult.bonus.bonusType)], ['Value', getBonusValue(validationResult.bonus)]].map(([l, v]) => (
                        <div key={l} className="flex justify-between">
                          <dt className="text-xs text-gray-500">{l}:</dt>
                          <dd className="text-xs text-gray-200">{v}</dd>
                        </div>
                      ))}
                    </div>
                  )}
                  {validationResult.error && <p className="text-xs text-rose-400 mt-1">{validationResult.error}</p>}
                </div>
              )}
              <div className="flex justify-between gap-3 pt-2">
                <button type="button" onClick={() => setShowValidateModal(false)} className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all">Close</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all">Validate Code</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default Allbonuses;