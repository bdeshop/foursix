import React, { useState, useEffect, useMemo } from 'react';
import {
  FaUser,
  FaMoneyBillWave,
  FaCreditCard,
  FaUsers,
  FaTimes,
  FaEye,
  FaSpinner,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaCalendarAlt,
  FaDollarSign,
  FaChartLine,
  FaUserCheck,
  FaUserTimes,
  FaArrowLeft,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const AffiliateDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [masterAffiliates, setMasterAffiliates] = useState([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [masterAffiliatesLoading, setMasterAffiliatesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchAffiliateDetails = async (affiliateId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${base_url}/api/admin/affiliates/${affiliateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setSelectedAffiliate(response.data);
      await fetchMasterAffiliates(affiliateId);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch affiliate details');
      toast.error('Failed to fetch affiliate details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterAffiliates = async (superAffiliateId) => {
    try {
      setMasterAffiliatesLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${base_url}/api/admin/all-master-affiliate/${superAffiliateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        setMasterAffiliates(response.data.data || []);
        setFilteredAffiliates(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching master affiliates:', error);
      toast.error('Error fetching master affiliates');
    } finally {
      setMasterAffiliatesLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '0.00 BDT';
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount) + ' BDT';
  };

  const handleViewMasterDetails = (masterId) => {
    navigate(`/affiliates/affiliate-details/${masterId}`);
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1);
    const filtered = masterAffiliates.filter(
      (affiliate) =>
        `${affiliate.firstName} ${affiliate.lastName}`.toLowerCase().includes(query) ||
        affiliate.email.toLowerCase().includes(query)
    );
    setFilteredAffiliates(filtered);
  };

  const handleSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredAffiliates].sort((a, b) => {
      let aVal, bVal;
      if (key === 'name') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (key === 'totalEarnings') {
        aVal = a.masterEarnings?.totalEarnings || 0;
        bVal = b.masterEarnings?.totalEarnings || 0;
      } else if (key === 'createdAt') {
        aVal = new Date(a.createdAt || 0);
        bVal = new Date(b.createdAt || 0);
      } else {
        aVal = a[key]?.toLowerCase() || '';
        bVal = b[key]?.toLowerCase() || '';
      }

      if (aVal < bVal) return direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return direction === 'ascending' ? 1 : -1;
      return 0;
    });

    setFilteredAffiliates(sorted);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-500 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
  };

  const paginatedAffiliates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAffiliates.slice(start, start + itemsPerPage);
  }, [filteredAffiliates, currentPage]);

  const totalPages = Math.ceil(filteredAffiliates.length / itemsPerPage);

  useEffect(() => {
    if (id) {
      fetchAffiliateDetails(id);
    }
  }, [id]);

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
                <button onClick={() => fetchAffiliateDetails(id)} className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all">
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
          {loading ? (
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-12 flex justify-center items-center">
              <div className="flex flex-col items-center gap-3">
                <FaSpinner className="animate-spin text-amber-400 text-3xl" />
                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading affiliate details...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Back Button */}
              <button
                onClick={() => navigate('/affiliates/all-affiliates')}
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <FaArrowLeft /> Back to Affiliates
              </button>

              {/* Affiliate Details Card */}
              <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-xl font-bold text-white tracking-tighter uppercase">Affiliate Details</h1>
                  <span className={`text-[9px] px-3 py-1 rounded-full font-bold uppercase ${selectedAffiliate?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {selectedAffiliate?.status}
                  </span>
                </div>

                {/* Personal Information */}
                <div className="mb-8">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                    <FaUser className="mr-2" /> Personal Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Full Name</p>
                      <p className="text-sm font-semibold text-white">{selectedAffiliate?.firstName} {selectedAffiliate?.lastName}</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Email Address</p>
                      <p className="text-sm font-semibold text-white">{selectedAffiliate?.email}</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                      <p className="text-sm font-semibold text-white">{selectedAffiliate?.phone || 'N/A'}</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Country</p>
                      <p className="text-sm font-semibold text-white">{selectedAffiliate?.address?.country || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Earnings Information */}
                <div className="mb-8">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                    <FaMoneyBillWave className="mr-2" /> Earnings Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-5 border border-blue-500/30">
                      <p className="text-[8px] font-black uppercase tracking-wider text-blue-200">Total Earnings</p>
                      <p className="text-xl font-bold text-white mt-2">{formatCurrency(selectedAffiliate?.totalEarnings || 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600 to-amber-700 rounded-lg p-5 border border-yellow-500/30">
                      <p className="text-[8px] font-black uppercase tracking-wider text-yellow-200">Pending Earnings</p>
                      <p className="text-xl font-bold text-white mt-2">{formatCurrency(selectedAffiliate?.pendingEarnings || 0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-lg p-5 border border-emerald-500/30">
                      <p className="text-[8px] font-black uppercase tracking-wider text-emerald-200">Paid Earnings</p>
                      <p className="text-xl font-bold text-white mt-2">{formatCurrency(selectedAffiliate?.paidEarnings || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="mb-8">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                    <FaCreditCard className="mr-2" /> Payment Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                      <p className="text-sm font-semibold text-white capitalize">{selectedAffiliate?.paymentMethod || 'N/A'}</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Minimum Payout</p>
                      <p className="text-sm font-semibold text-white">{formatCurrency(selectedAffiliate?.minimumPayout || 0)}</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Payout Schedule</p>
                      <p className="text-sm font-semibold text-white capitalize">{selectedAffiliate?.payoutSchedule || 'N/A'}</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Commission Type</p>
                      <p className="text-sm font-semibold text-white capitalize">{selectedAffiliate?.commissionType || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedAffiliate?.paymentMethod === 'bkash' && selectedAffiliate?.paymentDetails?.bkash?.phoneNumber && (
                    <div className="mt-4 bg-[#0F111A] border border-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 mb-1">Bkash Number</p>
                      <p className="text-sm font-semibold text-white">{selectedAffiliate.paymentDetails.bkash.phoneNumber}</p>
                    </div>
                  )}
                </div>

                {/* Commission Rates */}
                <div className="mb-8">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                    <FaChartLine className="mr-2" /> Commission Rates
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4 text-center">
                      <p className="text-[10px] text-gray-500">Bet Commission</p>
                      <p className="text-lg font-bold text-amber-400">{(selectedAffiliate?.commissionRate || 0).toFixed(2)}%</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4 text-center">
                      <p className="text-[10px] text-gray-500">Deposit Commission</p>
                      <p className="text-lg font-bold text-amber-400">{(selectedAffiliate?.depositRate || 0).toFixed(2)}%</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4 text-center">
                      <p className="text-[10px] text-gray-500">CPA Rate</p>
                      <p className="text-lg font-bold text-amber-400">{formatCurrency(selectedAffiliate?.cpaRate || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Referral Statistics */}
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4 flex items-center">
                    <FaUsers className="mr-2" /> Referral Statistics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4 text-center">
                      <p className="text-[10px] text-gray-500">Total Referrals</p>
                      <p className="text-xl font-bold text-white">{selectedAffiliate?.referralCount || 0}</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4 text-center">
                      <p className="text-[10px] text-gray-500">Active Referrals</p>
                      <p className="text-xl font-bold text-white">{selectedAffiliate?.activeReferrals || 0}</p>
                    </div>
                    <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4 text-center">
                      <p className="text-[10px] text-gray-500">Avg Earnings/Referral</p>
                      <p className="text-xl font-bold text-white">{formatCurrency(selectedAffiliate?.averageEarningPerReferral || 0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Affiliates Table */}
              <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
                <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    <FaUsers className="mr-1" /> Master Affiliates Created
                  </h2>
                  <span className="text-[9px] px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold">
                    Total: {masterAffiliates.length}
                  </span>
                </div>

                {/* Search Bar */}
                <div className="p-5 border-b border-gray-800">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearch}
                      placeholder="Search by name or email..."
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>

                {masterAffiliatesLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                      <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading master affiliates...</p>
                    </div>
                  </div>
                ) : filteredAffiliates.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                          <tr>
                            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                              <div className="flex items-center">Name {getSortIcon('name')}</div>
                            </th>
                            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('email')}>
                              <div className="flex items-center">Email {getSortIcon('email')}</div>
                            </th>
                            <th className="py-3 px-4">Phone</th>
                            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('totalEarnings')}>
                              <div className="flex items-center">Total Earnings {getSortIcon('totalEarnings')}</div>
                            </th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 cursor-pointer" onClick={() => handleSort('createdAt')}>
                              <div className="flex items-center">Created Date {getSortIcon('createdAt')}</div>
                            </th>
                            <th className="py-3 px-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {paginatedAffiliates.map((master) => (
                            <tr key={master._id} className="hover:bg-[#1F2937] transition-colors">
                              <td className="py-3 px-4 text-sm text-white">
                                {master.firstName} {master.lastName}
                              </td>
                              <td className="py-3 px-4 text-xs text-gray-400">{master.email}</td>
                              <td className="py-3 px-4 text-xs text-gray-400">{master.phone || 'N/A'}</td>
                              <td className="py-3 px-4 text-xs font-bold text-amber-400">
                                {formatCurrency(master.masterEarnings?.totalEarnings || 0)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${
                                  master.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {master.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-[10px] text-gray-500">{formatDate(master.createdAt)}</td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleViewMasterDetails(master._id)}
                                  className="text-[9px] px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                                >
                                  <FaEye className="text-[8px]" /> View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-5 px-4 pb-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                          Showing {paginatedAffiliates.length} of {filteredAffiliates.length} affiliates
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
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FaUsers className="mx-auto text-gray-600 text-3xl mb-3" />
                    <p className="text-xs text-gray-500">No master affiliates found for this super affiliate.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </section>
  );
};

export default AffiliateDetails;