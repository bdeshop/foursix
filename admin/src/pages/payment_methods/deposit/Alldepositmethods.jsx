import React, { useState, useEffect } from 'react';
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaCreditCard,
  FaUniversity,
  FaMobileAlt,
  FaSpinner,
  FaCopy,
  FaFilter,
  FaToggleOn,
  FaToggleOff,
  FaDollarSign,
  FaChartLine,
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import Header from '../../../components/Header';
import toast, { Toaster } from 'react-hot-toast';
import axios from "axios";

const Alldepositmethods = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [depositGateways, setDepositGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGateways, setTotalGateways] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gatewayToDelete, setGatewayToDelete] = useState(null);

  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchDepositMethods();
  }, [currentPage, statusFilter, searchTerm, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const fetchDepositMethods = async () => {
    try {
      setLoading(true);
      // Since the original endpoint might not support pagination/sorting/filtering,
      // we'll fetch all and apply them client-side for consistency with the original API.
      const response = await axios.get(`${base_url}/api/admin/deposit-methods`);
      let gateways = response.data;

      // Apply filters
      if (statusFilter !== 'all') {
        const isEnabled = statusFilter === 'active';
        gateways = gateways.filter(g => g.enabled === isEnabled);
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        gateways = gateways.filter(g =>
          g.gatewayName?.toLowerCase().includes(term) ||
          g.currencyName?.toLowerCase().includes(term) ||
          g.accountType?.toLowerCase().includes(term)
        );
      }

      setTotalGateways(gateways.length);

      // Apply sorting
      gateways.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'minAmount') aVal = parseFloat(a.minAmount || 0);
        if (sortConfig.key === 'minAmount') bVal = parseFloat(b.minAmount || 0);
        if (sortConfig.key === 'createdAt') aVal = new Date(a.createdAt || 0);
        if (sortConfig.key === 'createdAt') bVal = new Date(b.createdAt || 0);
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });

      // Paginate
      const start = (currentPage - 1) * itemsPerPage;
      const paginated = gateways.slice(start, start + itemsPerPage);
      setDepositGateways(paginated);
      setTotalPages(Math.ceil(gateways.length / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load deposit methods");
      toast.error("Failed to load deposit methods");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = ['all', 'active', 'inactive'];

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
    setGatewayToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`${base_url}/api/admin/deposit-methods/${gatewayToDelete}`);
      toast.success(response.data.message || 'Deposit method deleted successfully');
      await fetchDepositMethods(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete deposit method');
    } finally {
      setShowDeleteConfirm(false);
      setGatewayToDelete(null);
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const response = await axios.put(
        `${base_url}/api/admin/manual/status/${id}`,
        { enabled: newStatus }
      );
      toast.success(response.data.message || `Status changed to ${newStatus ? 'Active' : 'Inactive'}`);
      await fetchDepositMethods(); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEdit = (id) => {
    navigate(`/payment-method/edit-deposit-method/${id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getGatewayIcon = (name) => {
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.includes('bkash')) return <FaMobileAlt className="text-pink-400" />;
    if (lowerName.includes('nagad')) return <FaMobileAlt className="text-orange-400" />;
    if (lowerName.includes('bank')) return <FaUniversity className="text-blue-400" />;
    if (lowerName.includes('card')) return <FaCreditCard className="text-purple-400" />;
    return <FaMoneyBillWave className="text-amber-400" />;
  };

  const stats = {
    total: totalGateways,
    active: depositGateways.filter(g => g.enabled).length,
    totalMethods: totalGateways,
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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Deposit Methods</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCreditCard className="text-amber-500" /> Manage all payment gateways and deposit methods
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Link
                to="/payment-method/create-deposit-method"
                className="bg-[#1F2937] hover:bg-amber-600/20 border border-gray-700 hover:border-amber-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FaPlus /> ADD METHOD
              </Link>
              <button
                onClick={fetchDepositMethods}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL METHODS', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white', icon: <FaCreditCard /> },
              { label: 'ACTIVE', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400', icon: <FaEye /> },
              { label: 'INACTIVE', value: stats.total - stats.active, color: 'border-rose-500', valueClass: 'text-rose-400', icon: <FaEyeSlash /> },
              { label: 'TOTAL GATEWAYS', value: stats.totalMethods, color: 'border-amber-500', valueClass: 'text-amber-400', icon: <FaMoneyBillWave /> },
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

          {/* Filters */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-8`}
                  placeholder="Search by name, currency, or account type..."
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {depositGateways.length} of {totalGateways} methods
            </p>
          </div>

          {/* Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
              Deposit Methods List
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('gatewayName')}>Gateway {getSortIcon('gatewayName')}</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('currencyName')}>Currency / Rate {getSortIcon('currencyName')}</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('minAmount')}>Amount Range {getSortIcon('minAmount')}</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>Created {getSortIcon('createdAt')}</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading deposit methods...</p>
                        </div>
                      </td>
                    </tr>
                  ) : depositGateways.length > 0 ? (
                    depositGateways.map((gateway) => {
                      const isActive = gateway.enabled;
                      return (
                        <tr key={gateway._id} className="hover:bg-[#1F2937] transition-colors">
                          {/* Gateway */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {gateway.image ? (
                                <img
                                  src={`${base_url}/images/${gateway.image}`}
                                  alt={gateway.gatewayName}
                                  className="h-10 w-10 rounded-lg object-cover border border-gray-700 bg-[#0F111A]"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-[#0F111A] border border-gray-700 flex items-center justify-center text-amber-400">
                                  {getGatewayIcon(gateway.gatewayName)}
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-bold text-white">{gateway.gatewayName}</div>
                                <div className="text-[10px] text-gray-500">{gateway.accountType || 'Standard'}</div>
                              </div>
                            </div>
                          </td>
                          {/* Currency / Rate */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-amber-400">{gateway.currencyName}</div>
                            <div className="text-[10px] text-gray-500">Rate: {gateway.rate || '1.00'}</div>
                          </td>
                          {/* Amount Range */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-300">
                        ৳{gateway.minAmount} - ৳{gateway.maxAmount}
                            </div>
                            <div className="text-[10px] text-gray-500">
                                 Charge: ৳{gateway.fixedCharge} + {gateway.percentCharge}%
                            </div>
                          </td>
                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => handleStatusUpdate(gateway._id, isActive)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                              </label>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          {/* Created */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(gateway.createdAt)}</div>
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleEdit(gateway._id)}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 text-amber-400 rounded text-xs transition-all"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(gateway._id)}
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
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaMoneyBillWave className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No deposit methods found</p>
                          <p className="text-xs mt-1 mb-4">Try adjusting your search or filters</p>
                          <Link
                            to="/payment-method/create-deposit-method"
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                          >
                            <FaPlus /> Add Your First Method
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
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalGateways} total
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
                Are you sure you want to delete this deposit method? This action cannot be undone.
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
                <FaTrash /> Delete Method
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default Alldepositmethods;