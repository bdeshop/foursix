import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaExclamationTriangle, 
  FaEdit, 
  FaTrash, 
  FaSpinner,
  FaUserCheck,
  FaUser,
  FaIdCard,
  FaFileAlt,
  FaCalendarAlt,
  FaUserTie,
  FaInfoCircle,
  FaCheck,
  FaTimes,
  FaDownload,
  FaEnvelope,
  FaPhone
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiDownload, FiUsers } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import axios from 'axios';
import moment from 'moment';
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const KYCList = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    assigned: 0
  });
  const [admins, setAdmins] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const statuses = ['all', 'pending', 'assigned', 'approved', 'rejected'];
  const documentTypes = ['all', 'nid', 'passport', 'driving_license', 'birth_certificate'];

  const fetchKYCList = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      let url = `${API_BASE_URL}/api/admin/kyc/all?page=${currentPage}&limit=${itemsPerPage}`;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (params.toString()) url += `&${params.toString()}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setKycList(response.data.data);
      setStats({
        total: response.data.pagination.total,
        pending: response.data.data.filter(k => k.status === 'pending').length,
        approved: response.data.data.filter(k => k.status === 'approved').length,
        rejected: response.data.data.filter(k => k.status === 'rejected').length,
        assigned: response.data.data.filter(k => k.status === 'assigned').length
      });
    } catch (err) {
      console.error('Error fetching KYC list:', err);
      setError('Failed to load KYC applications. Please try again.');
      toast.error('Failed to load KYC applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/kyc/counts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.counts);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(response.data.data || []);
    } catch (err) {
      console.error('Error fetching admins:', err);
    }
  };

  useEffect(() => {
    fetchKYCList();
    fetchStats();
    fetchAdmins();
  }, [currentPage, statusFilter, documentTypeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, documentTypeFilter]);

  const handleApprove = async (kycId) => {
    const result = await Swal.fire({
      title: 'Approve KYC?',
      text: 'Are you sure you want to approve this KYC application?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, approve it!',
      cancelButtonText: 'Cancel',
      background: '#161B22',
      color: '#fff',
      customClass: {
        popup: 'bg-[#161B22] border border-gray-700',
        title: 'text-white',
        confirmButton: 'bg-emerald-600 hover:bg-emerald-700',
        cancelButton: 'bg-gray-600 hover:bg-gray-700'
      }
    });
    
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/admin/kyc/${kycId}/approve`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchKYCList();
        fetchStats();
        setShowKYCModal(false);
        
        toast.success('KYC approved successfully!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        Swal.fire({
          title: 'Approved!',
          text: 'KYC application has been approved successfully.',
          icon: 'success',
          confirmButtonColor: '#10b981',
          background: '#161B22',
          color: '#fff',
          customClass: {
            popup: 'bg-[#161B22] border border-gray-700'
          }
        });
      } catch (err) {
        setError('Failed to approve KYC.');
        toast.error('Failed to approve KYC. Please try again.');
      }
    }
  };

  const handleReject = async (kycId) => {
    if (!rejectReason.trim()) {
      toast.warning('Please enter a rejection reason', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Reject KYC?',
      text: 'Are you sure you want to reject this KYC application?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, reject it!',
      cancelButtonText: 'Cancel',
      background: '#161B22',
      color: '#fff',
      customClass: {
        popup: 'bg-[#161B22] border border-gray-700',
        title: 'text-white',
        confirmButton: 'bg-rose-600 hover:bg-rose-700',
        cancelButton: 'bg-gray-600 hover:bg-gray-700'
      }
    });
    
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/admin/kyc/${kycId}/reject`, {
          rejectionReason: rejectReason
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchKYCList();
        fetchStats();
        setShowRejectModal(false);
        setRejectReason('');
        setShowKYCModal(false);
        
        toast.error('KYC rejected successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        Swal.fire({
          title: 'Rejected!',
          text: 'KYC application has been rejected.',
          icon: 'error',
          confirmButtonColor: '#ef4444',
          background: '#161B22',
          color: '#fff',
          customClass: {
            popup: 'bg-[#161B22] border border-gray-700'
          }
        });
      } catch (err) {
        setError('Failed to reject KYC.');
        toast.error('Failed to reject KYC. Please try again.');
      }
    }
  };

  const handleAssign = async (kycId) => {
    if (!selectedAdmin) {
      toast.warning('Please select an admin', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    const result = await Swal.fire({
      title: 'Assign KYC?',
      text: 'Are you sure you want to assign this KYC to the selected admin?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, assign it!',
      cancelButtonText: 'Cancel',
      background: '#161B22',
      color: '#fff',
      customClass: {
        popup: 'bg-[#161B22] border border-gray-700',
        title: 'text-white',
        confirmButton: 'bg-amber-600 hover:bg-amber-700',
        cancelButton: 'bg-gray-600 hover:bg-gray-700'
      }
    });
    
    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_BASE_URL}/api/admin/kyc/${kycId}/assign`, {
          assignedTo: selectedAdmin
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchKYCList();
        fetchStats();
        setShowAssignModal(false);
        setSelectedAdmin('');
        setShowKYCModal(false);
        
        toast.success('KYC assigned successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        Swal.fire({
          title: 'Assigned!',
          text: 'KYC application has been assigned successfully.',
          icon: 'success',
          confirmButtonColor: '#f59e0b',
          background: '#161B22',
          color: '#fff',
          customClass: {
            popup: 'bg-[#161B22] border border-gray-700'
          }
        });
      } catch (err) {
        setError('Failed to assign KYC.');
        toast.error('Failed to assign KYC. Please try again.');
      }
    }
  };

  const viewKYCDetails = (kyc) => {
    setSelectedKYC(kyc);
    setShowKYCModal(true);
  };

  const openAssignModal = (kyc) => {
    setSelectedKYC(kyc);
    setSelectedAdmin('');
    setShowAssignModal(true);
  };

  const openRejectModal = (kyc) => {
    setSelectedKYC(kyc);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return moment(dateString).format('DD MMM YYYY, hh:mm A');
  };

  const getDocumentTypeLabel = (type) => {
    const types = {
      nid: 'National ID Card',
      passport: 'Passport',
      driving_license: 'Driving License',
      birth_certificate: 'Birth Certificate'
    };
    return types[type] || type;
  };

  const getDocumentTypeIcon = (type) => {
    const icons = {
      nid: <FaIdCard className="text-indigo-400" />,
      passport: <FaFileAlt className="text-purple-400" />,
      driving_license: <FaIdCard className="text-teal-400" />,
      birth_certificate: <FaFileAlt className="text-orange-400" />
    };
    return icons[type] || <FaIdCard className="text-gray-400" />;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved':
        return {
          icon: <FaCheckCircle className="text-emerald-400" />,
          badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          label: 'Approved'
        };
      case 'pending':
        return {
          icon: <FaClock className="text-amber-400" />,
          badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          label: 'Pending'
        };
      case 'assigned':
        return {
          icon: <FaUserCheck className="text-indigo-400" />,
          badge: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
          label: 'Assigned'
        };
      case 'rejected':
        return {
          icon: <FaTimesCircle className="text-rose-400" />,
          badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          label: 'Rejected'
        };
      default:
        return {
          icon: <FaExclamationTriangle className="text-gray-400" />,
          badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
          label: status
        };
    }
  };

  const filteredKYC = React.useMemo(() => {
    let filtered = [...kycList];
    
    if (searchTerm) {
      filtered = filtered.filter(kyc => 
        kyc.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kyc.userId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kyc.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (documentTypeFilter !== 'all') {
      filtered = filtered.filter(kyc => kyc.documentType === documentTypeFilter);
    }
    
    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        let aValue = sortConfig.key.includes('.')
          ? sortConfig.key.split('.').reduce((o, i) => o?.[i], a)
          : a[sortConfig.key];
        let bValue = sortConfig.key.includes('.')
          ? sortConfig.key.split('.').reduce((o, i) => o?.[i], b)
          : b[sortConfig.key];
        
        if (sortConfig.key === 'submittedAt' || sortConfig.key === 'reviewedAt') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [kycList, searchTerm, documentTypeFilter, sortConfig]);

  const totalPages = Math.ceil(stats.total / itemsPerPage);

  const getPaginationPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';

  if (loading && kycList.length === 0) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="animate-spin text-amber-400 text-3xl" />
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Error Banner */}
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300 ml-4 text-lg leading-none">×</button>
            </div>
          )}

          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">KYC Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaUserCheck className="text-amber-500" /> Manage and verify KYC applications
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => { fetchKYCList(); fetchStats(); }}
                className="bg-[#1F2937] hover:bg-amber-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'TOTAL', value: stats.total, color: 'border-gray-500', valueClass: 'text-white', icon: <FiUsers className="text-gray-400" /> },
              { label: 'PENDING', value: stats.pending, color: 'border-amber-500', valueClass: 'text-amber-400', icon: <FaClock className="text-amber-400" /> },
              { label: 'ASSIGNED', value: stats.assigned, color: 'border-indigo-500', valueClass: 'text-indigo-400', icon: <FaUserCheck className="text-indigo-400" /> },
              { label: 'APPROVED', value: stats.approved, color: 'border-emerald-500', valueClass: 'text-emerald-400', icon: <FaCheckCircle className="text-emerald-400" /> },
              { label: 'REJECTED', value: stats.rejected, color: 'border-rose-500', valueClass: 'text-rose-400', icon: <FaTimesCircle className="text-rose-400" /> },
            ].map((card, i) => (
              <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                  {card.icon}
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
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDocumentTypeFilter('all'); }}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-8`}
                  placeholder="Search by name, username or email..."
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">All Status</option>
                {statuses.filter(s => s !== 'all').map((s, i) => (
                  <option key={i} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select value={documentTypeFilter} onChange={(e) => setDocumentTypeFilter(e.target.value)} className={selectClass}>
                <option value="all">All Document Types</option>
                {documentTypes.filter(d => d !== 'all').map((d, i) => (
                  <option key={i} value={d}>{getDocumentTypeLabel(d)}</option>
                ))}
              </select>
              <select className={selectClass} value={sortConfig.key || ''} onChange={(e) => requestSort(e.target.value)}>
                <option value="">Sort By</option>
                <option value="submittedAt">Submission Date</option>
                <option value="fullName">Full Name</option>
                <option value="documentType">Document Type</option>
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {filteredKYC.length} of {stats.total} KYC applications
            </p>
          </div>

          {/* Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
              KYC Verification Requests
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('submittedAt')}>
                      Submitted {getSortIcon('submittedAt')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('userId.username')}>
                      User {getSortIcon('userId.username')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('fullName')}>
                      Full Name {getSortIcon('fullName')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('documentType')}>
                      Document {getSortIcon('documentType')}
                    </th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Assigned To</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredKYC.length > 0 ? (
                    filteredKYC.map((kyc) => {
                      const statusInfo = getStatusInfo(kyc.status);
                      return (
                        <tr key={kyc._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{formatDate(kyc.submittedAt)}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <FaUser className="text-amber-400 text-[10px]" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{kyc.userId?.username || 'N/A'}</div>
                                <div className="text-[9px] text-gray-500">{kyc.userId?.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs font-medium text-white">{kyc.fullName}</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getDocumentTypeIcon(kyc.documentType)}
                              <span className="text-xs">{getDocumentTypeLabel(kyc.documentType)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-full border ${statusInfo.badge}`}>
                              {statusInfo.icon}
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {kyc.assignedTo ? (
                              <div className="flex items-center gap-1">
                                <FaUserTie className="text-indigo-400 text-[8px]" />
                                <span className="text-[10px] text-gray-400">{kyc.assignedTo?.username || 'Unknown'}</span>
                              </div>
                            ) : (
                              <span className="text-[9px] text-gray-600">Not assigned</span>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => viewKYCDetails(kyc)}
                                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              {kyc.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(kyc._id)}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-emerald-400 rounded text-xs transition-all"
                                    title="Approve"
                                  >
                                    <FaCheckCircle />
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(kyc)}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                    title="Reject"
                                  >
                                    <FaTimesCircle />
                                  </button>
                                </>
                              )}
                              {kyc.status === 'assigned' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(kyc._id)}
                                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-emerald-400 rounded text-xs transition-all"
                                    title="Approve"
                                  >
                                    <FaCheckCircle />
                                  </button>
                                  <button
                                    onClick={() => openRejectModal(kyc)}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                    title="Reject"
                                  >
                                    <FaTimesCircle />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaUserCheck className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No KYC applications found</p>
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
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {stats.total} total
              </p>
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === 1
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600 hover:border-amber-500'
                  }`}
                >
                  ← Prev
                </button>

                {getPaginationPages().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-xs text-gray-600 font-bold select-none">
                      ···
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                        currentPage === page
                          ? 'bg-amber-600 border-amber-500 text-white'
                          : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === totalPages
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600 hover:border-amber-500'
                  }`}
                >
                  Next →
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>

      {/* KYC Details Modal */}
      {showKYCModal && selectedKYC && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128] sticky top-0 z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaUserCheck /> KYC Details
              </h3>
              <button onClick={() => setShowKYCModal(false)} className="text-gray-500 hover:text-gray-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              {/* User Information */}
              <div className="mb-6">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                  <FaUser /> User Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] text-gray-500">Username</p>
                    <p className="text-xs text-white font-medium">{selectedKYC.userId?.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500">Email</p>
                    <p className="text-xs text-white">{selectedKYC.userId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500">Phone</p>
                    <p className="text-xs text-white">{selectedKYC.userId?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500">Full Name</p>
                    <p className="text-xs text-white">{selectedKYC.fullName}</p>
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="mb-6">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                  <FaIdCard /> Document Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] text-gray-500">Document Type</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getDocumentTypeIcon(selectedKYC.documentType)}
                      <p className="text-xs text-white">{getDocumentTypeLabel(selectedKYC.documentType)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500">Submitted At</p>
                    <p className="text-xs text-white">{formatDate(selectedKYC.submittedAt)}</p>
                  </div>
                  {selectedKYC.reviewedAt && (
                    <div>
                      <p className="text-[8px] text-gray-500">Reviewed At</p>
                      <p className="text-xs text-white">{formatDate(selectedKYC.reviewedAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[8px] text-gray-500">Status</p>
                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-full border ${getStatusInfo(selectedKYC.status).badge} mt-1`}>
                      {getStatusInfo(selectedKYC.status).icon}
                      {getStatusInfo(selectedKYC.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Document Images */}
              <div className="mb-6">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                  <FaFileAlt /> Document Images
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {selectedKYC.documentFront && (
                    <div>
                      <p className="text-[8px] text-gray-500 mb-2">Front Side</p>
                      <a href={`${API_BASE_URL}/uploads/kyc/${selectedKYC.documentFront}`} target="_blank" rel="noopener noreferrer" className="block">
                        <img 
                          src={`${API_BASE_URL}/uploads/kyc/${selectedKYC.documentFront}`} 
                          alt="Document Front" 
                          className="w-full h-32 object-cover rounded-lg border border-gray-700 hover:border-amber-500 transition-all"
                        />
                      </a>
                    </div>
                  )}
                  {selectedKYC.documentBack && (
                    <div>
                      <p className="text-[8px] text-gray-500 mb-2">Back Side</p>
                      <a href={`${API_BASE_URL}/uploads/kyc/${selectedKYC.documentBack}`} target="_blank" rel="noopener noreferrer" className="block">
                        <img 
                          src={`${API_BASE_URL}/uploads/kyc/${selectedKYC.documentBack}`} 
                          alt="Document Back" 
                          className="w-full h-32 object-cover rounded-lg border border-gray-700 hover:border-amber-500 transition-all"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x150?text=Image+Not+Found'; }}
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes & Rejection Reason */}
              {(selectedKYC.adminNotes || selectedKYC.rejectionReason) && (
                <div className="mb-6">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Notes</h4>
                  {selectedKYC.adminNotes && (
                    <div className="p-3 bg-[#0F111A] rounded-lg border border-gray-800 mb-2">
                      <p className="text-[8px] text-gray-500 mb-1">Admin Notes:</p>
                      <p className="text-xs text-gray-300">{selectedKYC.adminNotes}</p>
                    </div>
                  )}
                  {selectedKYC.rejectionReason && (
                    <div className="p-3 bg-rose-500/5 rounded-lg border border-rose-500/20">
                      <p className="text-[8px] text-rose-400 mb-1">Rejection Reason:</p>
                      <p className="text-xs text-rose-300">{selectedKYC.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {(selectedKYC.status === 'pending' || selectedKYC.status === 'assigned') && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setShowKYCModal(false);
                      handleApprove(selectedKYC._id);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <FaCheckCircle /> Approve
                  </button>
                  <button
                    onClick={() => {
                      setShowKYCModal(false);
                      openRejectModal(selectedKYC);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <FaTimesCircle /> Reject
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end">
              <button
                onClick={() => setShowKYCModal(false)}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedKYC && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaUserCheck /> Assign KYC to Admin
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4">
                <p className="text-[9px] text-gray-500 mb-2">User: <span className="text-white">{selectedKYC.userId?.username}</span></p>
                <p className="text-[9px] text-gray-500 mb-4">Document: <span className="text-white">{getDocumentTypeLabel(selectedKYC.documentType)}</span></p>
                
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  Select Admin
                </label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className={selectClass}
                >
                  <option value="">-- Select Admin --</option>
                  {admins.map(admin => (
                    <option key={admin._id} value={admin._id}>{admin.name || admin.username} ({admin.email})</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssign(selectedKYC._id)}
                  disabled={!selectedAdmin}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <FaUserCheck /> Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedKYC && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                <FaTimesCircle /> Reject KYC
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-500 hover:text-gray-300">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4">
                <p className="text-[9px] text-gray-500 mb-2">User: <span className="text-white">{selectedKYC.userId?.username}</span></p>
                <p className="text-[9px] text-gray-500 mb-4">Document: <span className="text-white">{getDocumentTypeLabel(selectedKYC.documentType)}</span></p>
                
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  Rejection Reason <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className={inputClass}
                  placeholder="Enter reason for rejection..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedKYC._id)}
                  disabled={!rejectReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <FaTimesCircle /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default KYCList;