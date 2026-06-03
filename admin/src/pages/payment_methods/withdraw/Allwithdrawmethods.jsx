import React, { useState, useEffect } from 'react';
import {
  FaEyeSlash,
  FaEye,
  FaTrash,
  FaEdit,
  FaPlus,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaCreditCard,
  FaUniversity,
  FaMobileAlt,
  FaSpinner,
  FaToggleOn,
  FaToggleOff,
  FaDollarSign,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import { Toaster, toast } from 'react-hot-toast';
import loader from "../../../assets/loading.gif";

const Allwithdrawmethods = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [withdrawGateways, setWithdrawGateways] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGateways, setTotalGateways] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gatewayToDelete, setGatewayToDelete] = useState(null);

  const navigate = useNavigate();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchWithdrawMethods();
  }, []);

  useEffect(() => {
    filterAndSortGateways();
  }, [searchTerm, statusFilter, sortConfig, withdrawGateways, currentPage]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchWithdrawMethods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/withdraw-methods`);
      setWithdrawGateways(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load withdrawal methods");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortGateways = () => {
    let filtered = [...withdrawGateways];

    // Apply status filter
    if (statusFilter !== 'all') {
      const isEnabled = statusFilter === 'active';
      filtered = filtered.filter(g => g.enabled === isEnabled);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.gatewayName?.toLowerCase().includes(term) ||
        g.currencyName?.toLowerCase().includes(term)
      );
    }

    setTotalGateways(filtered.length);

    // Apply sorting
    filtered.sort((a, b) => {
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
    const paginated = filtered.slice(start, start + itemsPerPage);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    
    // We need to store paginated results separately or override the state
    // For simplicity, we'll use a separate state for displayed gateways
    window._paginatedGateways = paginated;
  };

  const getDisplayedGateways = () => {
    let filtered = [...withdrawGateways];

    if (statusFilter !== 'all') {
      const isEnabled = statusFilter === 'active';
      filtered = filtered.filter(g => g.enabled === isEnabled);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.gatewayName?.toLowerCase().includes(term) ||
        g.currencyName?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
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

    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  };

  const displayedGateways = getDisplayedGateways();
  const totalFiltered = withdrawGateways.filter(g => {
    if (statusFilter !== 'all') {
      const isEnabled = statusFilter === 'active';
      if (g.enabled !== isEnabled) return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!g.gatewayName?.toLowerCase().includes(term) && !g.currencyName?.toLowerCase().includes(term)) return false;
    }
    return true;
  }).length;

  const handleStatusUpdate = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const response = await axios.put(
        `${base_url}/api/admin/manual-withdraw/status/${id}`,
        { enabled: newStatus }
      );

      Swal.fire({
        title: "Success",
        text: response.data.message,
        icon: "success",
        background: "#161B22",
        color: "#e5e7eb"
      });

      setWithdrawGateways(withdrawGateways.map(gateway => 
        gateway._id === id ? { ...gateway, enabled: newStatus } : gateway
      ));

    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update status.",
        icon: "error",
        background: "#161B22",
        color: "#e5e7eb"
      });
    }
  };

  const handleEdit = (id) => {
    navigate(`/payment-method/edit-withdraw-method/${id}`);
  };

  const handleDelete = async (id) => {
    setGatewayToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(`${base_url}/api/admin/withdraw-methods/${gatewayToDelete}`);
      
      Swal.fire({
        title: "Deleted!",
        text: response.data.message,
        icon: "success",
        background: "#161B22",
        color: "#e5e7eb"
      });

      setWithdrawGateways(withdrawGateways.filter(gateway => gateway._id !== gatewayToDelete));
    } catch (error) {
      console.error("Error deleting method:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to delete the withdrawal method.",
        icon: "error",
        background: "#161B22",
        color: "#e5e7eb"
      });
    } finally {
      setShowDeleteConfirm(false);
      setGatewayToDelete(null);
    }
  };

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

  const getGatewayIcon = (name) => {
    const lowerName = name?.toLowerCase() || '';
    if (lowerName.includes('bkash')) return <FaMobileAlt className="text-pink-400" />;
    if (lowerName.includes('nagad')) return <FaMobileAlt className="text-orange-400" />;
    if (lowerName.includes('bank')) return <FaUniversity className="text-blue-400" />;
    if (lowerName.includes('card')) return <FaCreditCard className="text-purple-400" />;
    return <FaMoneyBillWave className="text-amber-400" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka', year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const stats = {
    total: withdrawGateways.length,
    active: withdrawGateways.filter(g => g.enabled).length,
    inactive: withdrawGateways.filter(g => !g.enabled).length,
    currencies: new Set(withdrawGateways.map(g => g.currencyName)).size,
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

  if (loading) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}>
            <div className="flex justify-center items-center h-full">
              <img src={loader} className='w-[65px]' alt="Loading..." />
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
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Withdrawal Methods</h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                  <FaArrowUp className="text-amber-500" /> Manage all withdrawal gateways and payment methods
                </p>
              </div>
              <div className="flex gap-3 mt-4 md:mt-0">
                <Link
                  to="/payment-method/create-withdraw-method"
                  className="bg-[#1F2937] hover:bg-amber-600/20 border border-gray-700 hover:border-amber-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
                >
                  <FaPlus /> ADD METHOD
                </Link>
                <button
                  onClick={fetchWithdrawMethods}
                  className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'TOTAL METHODS', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white', icon: <FaPlus /> },
                { label: 'ACTIVE', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400', icon: <FaEye /> },
                { label: 'INACTIVE', value: stats.inactive, color: 'border-rose-500', valueClass: 'text-rose-400', icon: <FaEyeSlash /> },
                { label: 'CURRENCIES', value: stats.currencies, color: 'border-amber-500', valueClass: 'text-amber-400', icon: <FaDollarSign /> },
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
                    placeholder="Search by name or currency..."
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
                Showing {displayedGateways.length} of {totalFiltered} methods
              </p>
            </div>

            {/* Table Section */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
                Withdrawal Methods List
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('gatewayName')}>Gateway {getSortIcon('gatewayName')}</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('currencyName')}>Currency / Rate {getSortIcon('currencyName')}</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('minAmount')}>Amount Range {getSortIcon('minAmount')}</th>
                      <th className="px-5 py-3">Charges</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>Created {getSortIcon('createdAt')}</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {displayedGateways.length > 0 ? (
                      displayedGateways.map((gateway) => (
                        <tr key={gateway._id} className="hover:bg-[#1F2937] transition-colors">
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
                                <div className="text-[10px] text-gray-500">Withdrawal</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-amber-400">{gateway.currencyName}</div>
                            <div className="text-[10px] text-gray-500">Rate: {gateway.rate || '1.00'}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-300">
                              ৳{parseFloat(gateway.minAmount || 0).toFixed(2)} - ৳{parseFloat(gateway.maxAmount || 0).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-500">BDT Range</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-300">
                              ৳{parseFloat(gateway.fixedCharge || 0).toFixed(2)} + {parseFloat(gateway.percentCharge || 0).toFixed(2)}%
                            </div>
                            <div className="text-[10px] text-gray-500">Fixed + Percent</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={gateway.enabled}
                                  onChange={() => handleStatusUpdate(gateway._id, gateway.enabled)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                              </label>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${gateway.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                {gateway.enabled ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(gateway.createdAt)}</div>
                          </td>
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center text-gray-600">
                            <FaMoneyBillWave className="text-4xl mb-3 opacity-20" />
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No withdrawal methods found</p>
                            <p className="text-xs mt-1 mb-4">Try adjusting your search or filters</p>
                            <Link
                              to="/payment-method/create-withdraw-method"
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
                  Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalFiltered} total
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

            {/* Additional Information */}
            {withdrawGateways.length > 0 && (
              <div className="mt-6 bg-[#161B22] border border-gray-800 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                      <FaEye className="text-white text-sm" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-400">Manage Withdrawal Methods</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Enable or disable withdrawal gateways, edit their settings, or remove them entirely. 
                      Active methods will be available to users for withdrawal requests.
                    </p>
                  </div>
                </div>
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
              <button onClick={() => setShowDeleteConfirm(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-5">
                Are you sure you want to delete this withdrawal method? This action cannot be undone.
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

export default Allwithdrawmethods;