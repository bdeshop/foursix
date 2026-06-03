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
  FaUserCheck,
  FaIdCard as FaIdCardIcon,
  FaShieldAlt,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Activeuser = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  const navigate = useNavigate();
  const itemsPerPage = 10;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchActiveUsers();
  }, []);

  const fetchActiveUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      const response = await axios.get(`${base_url}/api/admin/users?status=active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUsers(response.data.users || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch active users');
      toast.error('Failed to fetch active users');
    } finally {
      setLoading(false);
    }
  };

  const kycStatuses = ['all', 'verified', 'unverified', 'pending', 'rejected'];

  const getUserInitials = (username) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  const getAvatarColor = (username) => {
    const colors = [
      'from-amber-500 to-orange-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-green-600',
      'from-rose-500 to-pink-600',
      'from-purple-500 to-indigo-600',
      'from-teal-500 to-blue-600'
    ];
    if (!username) return colors[0];
    const charCode = username.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Filter and sort users
  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.player_id?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term)
      );
    }

    if (kycFilter !== 'all') {
      filtered = filtered.filter(user => user.kycStatus === kycFilter);
    }

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'createdAt') {
        aVal = new Date(aVal || 0);
        bVal = new Date(bVal || 0);
      }
      if (sortConfig.key === 'balance') {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, kycFilter, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const currentItems = filteredAndSortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
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
    setUserToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      await axios.delete(`${base_url}/api/admin/users/${userToDelete}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUsers(users.filter(user => user._id !== userToDelete));
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting user');
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const user = users.find(u => u._id === id);
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

      const token = localStorage.getItem('adminToken');

      await axios.put(`${base_url}/api/admin/users/${id}/status`,
        { status: newStatus },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setUsers(users.map(user =>
        user._id === id ? { ...user, status: newStatus } : user
      ));
      toast.success(`User status changed to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating user status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0.00';
    return parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, kycFilter]);

  const stats = {
    total: users.length,
    kycVerified: users.filter(u => u.kycStatus === 'verified').length,
    vip: users.filter(u => u.role === 'vip').length,
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
                <button onClick={fetchActiveUsers} className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all">
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
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Active Users</h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                  <FaUserCheck className="text-amber-500" /> Manage all active platform users
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Link
                  to="/admin/users/new"
                  className="bg-[#1F2937] hover:bg-amber-600/20 border border-gray-700 hover:border-amber-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
                >
                  <FaPlus /> ADD USER
                </Link>
                <button
                  onClick={fetchActiveUsers}
                  className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'TOTAL ACTIVE', value: stats.total, color: 'border-emerald-500', valueClass: 'text-white', icon: <FaUsers /> },
                { label: 'KYC VERIFIED', value: stats.kycVerified, color: 'border-blue-500', valueClass: 'text-blue-400', icon: <FaIdCardIcon /> },
                { label: 'VIP USERS', value: stats.vip, color: 'border-amber-500', valueClass: 'text-amber-400', icon: <FaShieldAlt /> },
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
                  onClick={() => { setSearchTerm(''); setKycFilter('all'); }}
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
                    placeholder="Search username, email or ID..."
                  />
                </div>

                <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)} className={selectClass}>
                  <option value="all">All KYC Status</option>
                  {kycStatuses.filter(s => s !== 'all').map((status) => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>

                <select
                  className={selectClass}
                  value={sortConfig.key}
                  onChange={(e) => requestSort(e.target.value)}
                >
                  <option value="createdAt">Sort by Date</option>
                  <option value="username">Sort by Name</option>
                  <option value="balance">Sort by Balance</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-3 flex justify-between items-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Showing {currentItems.length} of {filteredAndSortedUsers.length} active users
              </p>
            </div>

            {/* Users Table */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
                Active User List
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('username')}>User {getSortIcon('username')}</th>
                      <th className="px-5 py-3">Player ID</th>
                      <th className="px-5 py-3">Contact</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('balance')}>Balance {getSortIcon('balance')}</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">KYC</th>
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
                            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading active users...</p>
                          </div>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((user) => (
                        <tr key={user._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${getAvatarColor(user.username)}`}>
                                {getUserInitials(user.username)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{user.username}</div>
                                <div className="text-[10px] text-gray-500 capitalize">{user.role || 'User'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-[10px] font-mono text-gray-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-800">
                              {user.player_id}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-300">{user.email}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <FaPhone className="text-[8px]" /> {user.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-amber-400">{formatCurrency(user.balance)} {user.currency || 'BDT'}</div>
                            <div className="text-[10px] text-gray-500">Bonus: {formatCurrency(user.bonusBalance)}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={user.status === 'active'}
                                  onChange={() => toggleStatus(user._id, user.status)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${
                                user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              }`}>
                                {user.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${
                              user.kycStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              user.kycStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {user.kycStatus || 'Unverified'}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(user.createdAt)}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <Link
                                to={`/users/view-user-details/${user._id}`}
                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/30 border border-blue-500/20 text-blue-400 rounded text-xs transition-all"
                                title="View details"
                              >
                                <FaEye />
                              </Link>
                              <Link
                                to={`/users/edit-user-details/${user._id}`}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 text-amber-400 rounded text-xs transition-all"
                                title="Edit user"
                              >
                                <FaEdit />
                              </Link>
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                title="Delete user"
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
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No active users found</p>
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
                  Page {currentPage} of {totalPages} &nbsp;·&nbsp; {filteredAndSortedUsers.length} total
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
                Are you sure you want to delete this user? This action cannot be undone.
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
                <FaTrash /> Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Activeuser;