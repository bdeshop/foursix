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
  FaFilter,
  FaClock,
  FaMoneyBillWave,
  FaUserPlus,
  FaDownload,
  FaBan,
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import toast, { Toaster } from 'react-hot-toast';

const CashBonusList = () => {
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
  const [showAddUsersModal, setShowAddUsersModal] = useState(false);
  const [selectedBonusForUsers, setSelectedBonusForUsers] = useState(null);
  const [newUserIds, setNewUserIds] = useState('');
  const [addingUsers, setAddingUsers] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalAssigned: 0,
    totalClaimed: 0,
    totalUnclaimed: 0,
    totalBonusAmount: 0,
  });

  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchBonuses();
    fetchStats();
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

      const response = await fetch(`${base_url}/api/admin/cash-bonus/list?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch cash bonuses');

      const data = await response.json();
      if (data.success) {
        setBonuses(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalBonuses(data.pagination?.total || 0);
      } else {
        throw new Error(data.message || 'Failed to fetch bonuses');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to fetch cash bonuses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/cash-bonus/stats/summary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStats({
          total: data.data.bonuses.total,
          active: data.data.bonuses.active,
          totalAssigned: data.data.users.totalAssigned,
          totalClaimed: data.data.users.claimed,
          totalUnclaimed: data.data.users.unclaimed,
          totalBonusAmount: data.data.totalBonusAmount,
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const statusOptions = ['all', 'active', 'expired'];
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'special_event', label: '🎉 Special Event' },
    { value: 'welcome_bonus', label: '👋 Welcome Bonus' },
    { value: 'loyalty_reward', label: '🏆 Loyalty Reward' },
    { value: 'compensation', label: '🤝 Compensation' },
    { value: 'promotional', label: '📢 Promotional' },
    { value: 'referral', label: '🔗 Referral' },
    { value: 'achievement', label: '⭐ Achievement' },
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
      const response = await fetch(`${base_url}/api/admin/cash-bonus/${bonusToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to delete bonus');
      setBonuses(bonuses.filter((b) => b._id !== bonusToDelete));
      toast.success('Cash bonus deleted successfully');
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to delete bonus');
    } finally {
      setShowDeleteConfirm(false);
      setBonusToDelete(null);
    }
  };

  const openAddUsersModal = (bonus) => {
    setSelectedBonusForUsers(bonus);
    setNewUserIds('');
    setShowAddUsersModal(true);
  };

  const handleAddUsers = async (e) => {
    e.preventDefault();
    if (!newUserIds.trim()) {
      toast.error('Please enter user IDs');
      return;
    }

    const userIdsArray = newUserIds.split(',').map(id => id.trim()).filter(id => id);
    if (userIdsArray.length === 0) {
      toast.error('Please enter valid user IDs');
      return;
    }

    setAddingUsers(true);
    try {
      const response = await fetch(`${base_url}/api/admin/cash-bonus/${selectedBonusForUsers._id}/add-users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify({ userIds: userIdsArray }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add users');
      toast.success(data.message || 'Users added successfully');
      setShowAddUsersModal(false);
      fetchBonuses();
      fetchStats();
    } catch (err) {
      toast.error(err.message || 'Failed to add users');
    } finally {
      setAddingUsers(false);
    }
  };

  const copyBonusId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success('Bonus ID copied!');
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

  const formatBonusType = (type) => {
    const types = {
      special_event: 'Special Event',
      welcome_bonus: 'Welcome Bonus',
      loyalty_reward: 'Loyalty Reward',
      compensation: 'Compensation',
      promotional: 'Promotional',
      referral: 'Referral',
      achievement: 'Achievement',
    };
    return types[type] || type?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Bonus';
  };

  const getBonusTypeIcon = (type) => {
    const icons = {
      special_event: '🎉',
      welcome_bonus: '👋',
      loyalty_reward: '🏆',
      compensation: '🤝',
      promotional: '📢',
      referral: '🔗',
      achievement: '⭐',
    };
    return icons[type] || '🎁';
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400' };
      case 'expired':
        return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', dot: 'bg-rose-400' };
      default:
        return { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', dot: 'bg-gray-400' };
    }
  };

  const isExpired = (bonus) => {
    if (bonus.noExpiry) return false;
    return bonus.expiresAt && new Date(bonus.expiresAt) < new Date();
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
      <Toaster toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Cash Bonus Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaMoneyBillWave className="text-amber-500" /> Distribute and manage direct cash bonuses to users
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link
                to="/bonuses/new-cash-bonus"
                className="bg-[#1F2937] hover:bg-amber-600/20 border border-gray-700 hover:border-amber-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FaPlus /> CREATE BONUS
              </Link>
              <button
                onClick={() => { fetchBonuses(); fetchStats(); }}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL BONUSES', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white', icon: <FaGift className="text-indigo-400" /> },
              { label: 'ACTIVE BONUSES', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400', icon: <FaCheckCircle className="text-emerald-400" /> },
              { label: 'USERS ASSIGNED', value: stats.totalAssigned, color: 'border-amber-500', valueClass: 'text-amber-400', icon: <FaUsers className="text-amber-400" /> },
              { label: 'CLAIMED / UNCLAIMED', value: `${stats.totalClaimed}/${stats.totalUnclaimed}`, color: 'border-purple-500', valueClass: 'text-purple-400', icon: <FaMoneyBillWave className="text-purple-400" /> },
            ].map((card, i) => (
              <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                  {card.icon}
                </div>
                <h2 className={`text-xl font-bold mt-1 leading-none ${card.valueClass}`}>{card.value}</h2>
                {card.label === 'TOTAL BONUS AMOUNT' && (
                  <p className="text-[10px] text-gray-500 mt-1">Total value: ৳{stats.totalBonusAmount.toLocaleString()}</p>
                )}
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
                  placeholder="Search by title, description, or occasion..."
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
              Cash Bonus List
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('title')}>Title {getSortIcon('title')}</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</th>
                    <th className="px-5 py-3">Users</th>
                    <th className="px-5 py-3">Expiry</th>
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
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading cash bonuses...</p>
                        </div>
                      </td>
                    </tr>
                  ) : bonuses.length > 0 ? (
                    bonuses.map((bonus) => {
                      const statusInfo = getStatusInfo(bonus.status);
                      const expired = isExpired(bonus);
                      const displayStatus = expired ? 'expired' : bonus.status;
                      const displayStatusInfo = getStatusInfo(displayStatus);
                      
                      return (
                        <tr key={bonus._id} className="hover:bg-[#1F2937] transition-colors">
                          {/* Title */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getBonusTypeIcon(bonus.bonusType)}</span>
                              <div>
                                <div className="text-sm font-bold text-white">{bonus.title}</div>
                                <div className="text-[10px] text-gray-500 max-w-xs truncate">{bonus.description}</div>
                                {bonus.occasion && (
                                  <div className="text-[9px] text-amber-500/70 mt-0.5 flex items-center gap-1">
                                    <FaCalendarAlt className="text-[8px]" /> {bonus.occasion}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Amount */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-black text-amber-400">৳{bonus.amount?.toLocaleString() || 0}</div>
                            <div className="text-[10px] text-gray-500">per user</div>
                          </td>
                          {/* Type */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-amber-400">{formatBonusType(bonus.bonusType)}</span>
                          </td>
                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${displayStatusInfo.badge}`}>
                                {displayStatus}
                              </span>
                              {bonus.noExpiry && (
                                <span className="text-[9px] px-2 py-1 rounded font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  No Expiry
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Users */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <div className="text-xs">
                                <span className="text-gray-500">Total:</span>{' '}
                                <span className="font-bold text-white">{bonus.totalUsers || bonus.users?.length || 0}</span>
                              </div>
                              <div className="text-[10px] flex gap-3">
                                <span className="text-emerald-400">Claimed: {bonus.claimedUsers || 0}</span>
                                <span className="text-gray-500">Unclaimed: {bonus.unclaimedUsers || 0}</span>
                              </div>
                            </div>
                          </td>
                          {/* Expiry */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {bonus.noExpiry ? (
                              <span className="text-xs text-blue-400 flex items-center gap-1">
                                <FaClock className="text-[10px]" /> Never expires
                              </span>
                            ) : bonus.expiresAt ? (
                              <div className="text-xs">
                                <div className={expired ? 'text-rose-400' : 'text-gray-400'}>
                                  {formatDate(bonus.expiresAt)}
                                </div>
                                {!expired && (
                                  <div className="text-[9px] text-gray-500 mt-0.5">
                                    {Math.ceil((new Date(bonus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days left
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">Not set</span>
                            )}
                          </td>
                          {/* Created */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(bonus.createdAt)}</div>
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedBonus(bonus);
                                  setShowDetailsModal(true);
                                }}
                                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              {/* <button
                                onClick={() => openAddUsersModal(bonus)}
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-emerald-400 rounded text-xs transition-all"
                                title="Add Users"
                              >
                                <FaUserPlus />
                              </button> */}
                              <button
                                onClick={() => copyBonusId(bonus._id)}
                                className="p-1.5 bg-gray-500/10 hover:bg-gray-500/30 border border-gray-500/20 text-gray-400 rounded text-xs transition-all"
                                title="Copy Bonus ID"
                              >
                                <FaCopy />
                              </button>
                              <button
                                onClick={() => handleDelete(bonus._id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                title="Delete"
                                disabled={bonus.claimedUsers > 0}
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
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No cash bonuses found</p>
                          <p className="text-xs mt-1 mb-4">Try adjusting your search or filters</p>
                          <Link
                            to="/bonuses/new-cash-bonus"
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                          >
                            <FaPlus /> Create Your First Cash Bonus
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
                Are you sure you want to delete this cash bonus? This action cannot be undone.
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
                <FaGift /> Cash Bonus Details
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-5">
                <h2 className="text-xl font-black text-white mb-2">{selectedBonus.title}</h2>
                <p className="text-sm text-gray-400">{selectedBonus.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${getStatusInfo(selectedBonus.status).badge}`}>
                    {selectedBonus.status}
                  </span>
                  {selectedBonus.noExpiry && (
                    <span className="text-[9px] px-2 py-1 rounded font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Never Expires
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="bg-[#0F111A] border border-gray-800 p-4 rounded">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Bonus Info</p>
                  <dl className="space-y-2">
                    {[
                      ['Amount', `৳${selectedBonus.amount?.toLocaleString() || 0}`],
                      ['Type', `${getBonusTypeIcon(selectedBonus.bonusType)} ${formatBonusType(selectedBonus.bonusType)}`],
                      ['Occasion', selectedBonus.occasion || '—'],
                      ['Internal Notes', selectedBonus.notes || '—'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500">{label}:</dt>
                        <dd className="text-xs font-medium text-gray-200 text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="bg-[#0F111A] border border-gray-800 p-4 rounded">
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Expiry & Dates</p>
                  <dl className="space-y-2">
                    {[
                      ['Expires At', selectedBonus.noExpiry ? 'Never' : (selectedBonus.expiresAt ? formatDate(selectedBonus.expiresAt) : 'Not set')],
                      ['Created At', formatDate(selectedBonus.createdAt)],
                      ['Last Updated', formatDate(selectedBonus.updatedAt)],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between gap-4">
                        <dt className="text-xs text-gray-500">{label}:</dt>
                        <dd className="text-xs font-medium text-gray-200 text-right">{val}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="bg-[#0F111A] border border-gray-800 p-4 rounded">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                  <FaUsers /> User Statistics
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{selectedBonus.totalUsers || selectedBonus.users?.length || 0}</p>
                    <p className="text-[9px] text-gray-500">Total Users</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">{selectedBonus.claimedUsers || 0}</p>
                    <p className="text-[9px] text-gray-500">Claimed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-500">{selectedBonus.unclaimedUsers || 0}</p>
                    <p className="text-[9px] text-gray-500">Unclaimed</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-[10px] text-amber-400 font-bold">
                    Total Value: ৳{((selectedBonus.amount || 0) * (selectedBonus.totalUsers || selectedBonus.users?.length || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >Close</button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  openAddUsersModal(selectedBonus);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaUserPlus /> Add More Users
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Users Modal */}
      {showAddUsersModal && selectedBonusForUsers && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <FaUserPlus /> Add Users to "{selectedBonusForUsers.title}"
              </h3>
              <button onClick={() => setShowAddUsersModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <form onSubmit={handleAddUsers} className="p-6 space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  User IDs <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={newUserIds}
                  onChange={(e) => setNewUserIds(e.target.value)}
                  placeholder="Enter user IDs separated by commas&#10;Example: 669c1a2b3c4d5e6f7g8h9i0j, 669c1a2b3c4d5e6f7g8h9i1k"
                  className={inputClass}
                  rows="4"
                  required
                />
                <p className="text-[9px] text-gray-500 mt-1.5">
                  Enter multiple user IDs separated by commas. Each user will receive this cash bonus.
                </p>
              </div>
              <div className="bg-[#0F111A] p-3 rounded border border-gray-800">
                <p className="text-[9px] text-gray-500 uppercase font-black">Current Statistics</p>
                <div className="flex justify-between mt-2 text-sm">
                  <span>Current Users:</span>
                  <span className="font-bold text-white">{selectedBonusForUsers.totalUsers || selectedBonusForUsers.users?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bonus Amount per User:</span>
                  <span className="font-bold text-amber-400">৳{selectedBonusForUsers.amount?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-800 mt-2">
                  <span>New Total Value:</span>
                  <span className="font-bold text-emerald-400">
                    ৳{((selectedBonusForUsers.amount || 0) * ((selectedBonusForUsers.totalUsers || selectedBonusForUsers.users?.length || 0) + (newUserIds.split(',').filter(id => id.trim()).length))).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUsersModal(false)}
                  className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={addingUsers}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                >
                  {addingUsers ? <><FaSpinner className="animate-spin" /> Adding...</> : <><FaUserPlus /> Add Users</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default CashBonusList;