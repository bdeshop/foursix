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
  FaGift, 
  FaCalendarAlt, 
  FaPercentage, 
  FaMoneyBill,
  FaUsers,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaExternalLinkAlt,
  FaCopy,
  FaCalendar
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Allbonuses = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [applicableToFilter, setApplicableToFilter] = useState('all');
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

  // Fetch bonuses from API
  useEffect(() => {
    fetchBonuses();
  }, [currentPage, statusFilter, typeFilter, applicableToFilter, searchTerm, sortConfig]);

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
        sortOrder: sortConfig.direction === 'descending' ? 'desc' : 'asc'
      });

      const response = await fetch(`${base_url}/api/admin/bonuses?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bonuses');
      }

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
      console.error('Error fetching bonuses:', err);
      toast.error(err.message || 'Failed to fetch bonuses');
    } finally {
      setLoading(false);
    }
  };

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'inactive', label: 'Inactive', color: 'gray' },
    { value: 'expired', label: 'Expired', color: 'red' }
  ];

  // Bonus type options
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'welcome', label: 'Welcome Bonus', icon: '🎉' },
    { value: 'deposit', label: 'Deposit Bonus', icon: '💰' },
    { value: 'reload', label: 'Reload Bonus', icon: '🔄' },
    { value: 'cashback', label: 'Cashback', icon: '💸' },
    { value: 'free_spin', label: 'Free Spins', icon: '🎰' },
    { value: 'special', label: 'Special Bonus', icon: '⭐' },
    { value: 'manual', label: 'Manual Bonus', icon: '✏️' }
  ];

  // Applicable to options
  const applicableOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'all', label: 'All Users', icon: '👥' },
    { value: 'new', label: 'New Users', icon: '🆕' },
    { value: 'existing', label: 'Existing Users', icon: '👤' }
  ];

  // Handle sort
  const requestSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-orange-500" />;
    return <FaSortDown className="text-orange-500" />;
  };

  // Handle bonus deletion
  const handleDelete = (id) => {
    setBonusToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/${bonusToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete bonus');
      }

      setBonuses(bonuses.filter(bonus => bonus._id !== bonusToDelete));
      toast.success('Bonus deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete bonus');
    } finally {
      setShowDeleteConfirm(false);
      setBonusToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setBonusToDelete(null);
  };

  // Toggle bonus status
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update bonus status');
      }

      setBonuses(bonuses.map(bonus => {
        if (bonus._id === id) {
          return { ...bonus, status: newStatus };
        }
        return bonus;
      }));

      toast.success(`Bonus status changed to ${newStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update bonus status');
    }
  };

  // View bonus details
  const viewBonusDetails = (bonus) => {
    setSelectedBonus(bonus);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBonus(null);
  };

  // Open assign modal
  const openAssignModal = (bonus) => {
    setSelectedBonus(bonus);
    setAssignAmount(bonus.amount || '');
    setAssignReason('');
    setAssignUserId('');
    setShowAssignModal(true);
  };

  // Handle assign bonus to user
  const handleAssignBonus = async (e) => {
    e.preventDefault();
    
    if (!assignUserId.trim()) {
      toast.error('Please enter user ID');
      return;
    }

    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/assign-to-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          userId: assignUserId,
          bonusId: selectedBonus._id,
          amount: assignAmount || undefined,
          reason: assignReason
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign bonus');
      }

      toast.success('Bonus assigned successfully');
      setShowAssignModal(false);
      setAssignUserId('');
      setAssignAmount('');
      setAssignReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to assign bonus');
    }
  };

  // Open validate modal
  const openValidateModal = () => {
    setValidateCode('');
    setValidateUserId('');
    setValidationResult(null);
    setShowValidateModal(true);
  };

  // Handle code validation
  const handleValidateCode = async (e) => {
    e.preventDefault();
    
    if (!validateCode.trim() || !validateUserId.trim()) {
      toast.error('Please enter both bonus code and user ID');
      return;
    }

    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/validate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          bonusCode: validateCode.toUpperCase(),
          userId: validateUserId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed');
      }

      setValidationResult(data);
      if (data.isValid) {
        toast.success('Bonus code is valid!');
      }
    } catch (err) {
      toast.error(err.message || 'Validation failed');
      setValidationResult({ isValid: false, error: err.message });
    }
  };

  // Copy bonus code
  const copyBonusCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Bonus code copied to clipboard!');
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

  // Format bonus type
  const formatBonusType = (type) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get bonus type icon
  const getBonusTypeIcon = (type) => {
    switch(type) {
      case 'welcome': return '🎉';
      case 'deposit': return '💰';
      case 'reload': return '🔄';
      case 'cashback': return '💸';
      case 'free_spin': return '🎰';
      case 'special': return '⭐';
      case 'manual': return '✏️';
      default: return '🎁';
    }
  };

  // Get applicable to label
  const getApplicableToLabel = (type) => {
    switch(type) {
      case 'all': return 'All Users';
      case 'new': return 'New Users Only';
      case 'existing': return 'Existing Users Only';
      default: return type;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate bonus display value
  const getBonusValue = (bonus) => {
    if (bonus.amount > 0) {
      return `${bonus.amount.toFixed(2)} BDT`;
    } else if (bonus.percentage > 0) {
      return `${bonus.percentage}% ${bonus.maxBonus ? `up to ${bonus.maxBonus.toFixed(2)} BDT` : ''}`;
    }
    return 'No Value';
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setApplicableToFilter('all');
    setCurrentPage(1);
  };

  if (loading && bonuses.length === 0) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="flex justify-center items-center py-8">
                <FaSpinner className="animate-spin text-orange-500 text-2xl" />
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300 flex-1 p-4 md:p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Bonus Management</h1>
                  <p className="text-sm md:text-base text-gray-500 mt-1">
                    Manage and monitor all platform bonuses
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { 
                  title: 'Total Bonuses', 
                  value: totalBonuses, 
                  icon: <FaGift className="text-orange-500 text-xl" />,
                  color: 'orange'
                },
                { 
                  title: 'Active Bonuses', 
                  value: bonuses.filter(b => b.status === 'active').length, 
                  icon: <FaCheckCircle className="text-green-500 text-xl" />,
                  color: 'green'
                },
                { 
                  title: 'Welcome Bonuses', 
                  value: bonuses.filter(b => b.bonusType === 'welcome').length, 
                  icon: '🎉',
                  color: 'purple'
                },
                { 
                  title: 'Expired Soon', 
                  value: bonuses.filter(b => {
                    if (!b.endDate) return false;
                    const endDate = new Date(b.endDate);
                    const now = new Date();
                    const daysDiff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    return daysDiff <= 7 && daysDiff > 0;
                  }).length, 
                  icon: <FaCalendar className="text-red-500 text-xl" />,
                  color: 'red'
                },
              ].map((stat, index) => (
                <div key={index} className="bg-white p-4 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      {stat.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaFilter className="mr-2 text-orange-500" />
                  Filters & Search
                </h2>
                <button 
                  onClick={resetFilters}
                  className="text-sm text-orange-500 hover:text-orange-700 flex items-center transition-colors duration-200"
                >
                  Clear All Filters
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                    placeholder="Search name or code..."
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                >
                  {statusOptions.map((option, index) => (
                    <option key={index} value={option.value}>{option.label}</option>
                  ))}
                </select>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                >
                  {typeOptions.map((option, index) => (
                    <option key={index} value={option.value}>{option.label}</option>
                  ))}
                </select>

                {/* Applicable To Filter */}
                <select
                  value={applicableToFilter}
                  onChange={(e) => setApplicableToFilter(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                >
                  {applicableOptions.map((option, index) => (
                    <option key={index} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-gray-600">
              <p>
                Showing {bonuses.length} of {totalBonuses} bonuses
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm">Sort by:</span>
                <select
                  value={sortConfig.key}
                  onChange={(e) => requestSort(e.target.value)}
                  className="text-sm border-none bg-transparent focus:outline-none text-orange-600 font-medium"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="name">Name</option>
                  <option value="amount">Amount</option>
                  <option value="wageringRequirement">Wagering</option>
                </select>
                <button onClick={() => requestSort(sortConfig.key)}>
                  {sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />}
                </button>
              </div>
            </div>

            {/* Bonuses Table */}
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('name')}>
                        <div className="flex items-center gap-1">
                          Bonus Name {getSortIcon('name')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('bonusCode')}>
                        <div className="flex items-center gap-1">
                          Code {getSortIcon('bonusCode')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('amount')}>
                        <div className="flex items-center gap-1">
                          Value {getSortIcon('amount')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Wagering
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdAt')}>
                        <div className="flex items-center gap-1">
                          Created {getSortIcon('createdAt')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bonuses.length > 0 ? (
                      bonuses.map((bonus) => (
                        <tr key={bonus._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                <span className="text-xl">{getBonusTypeIcon(bonus.bonusType)}</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">{bonus.name}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <FaUsers className="text-xs" /> {getApplicableToLabel(bonus.applicableTo)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{bonus.bonusCode}</code>
                              <button
                                onClick={() => copyBonusCode(bonus.bonusCode)}
                                className="text-gray-400 hover:text-orange-500"
                                title="Copy code"
                              >
                                <FaCopy className="text-sm" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{formatBonusType(bonus.bonusType)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getBonusValue(bonus)}
                            </div>
                            {bonus.minDeposit > 0 && (
                              <div className="text-xs text-gray-500">
                                Min: {bonus.minDeposit.toFixed(2)} BDT
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{bonus.wageringRequirement}x</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={bonus.status === 'active'}
                                  onChange={() => toggleStatus(bonus._id, bonus.status)}
                                  className="sr-only peer"
                                  disabled={bonus.status === 'expired'}
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-focus:ring-orange-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                              </label>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{formatDate(bonus.createdAt)}</div>
                            {bonus.endDate && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <FaCalendarAlt /> Expires: {formatDate(bonus.endDate)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                        <Link
                                to={`/deposit-bonus/view-bonus/${bonus._id}`}
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-blue-600 text-white rounded-lg text-[16px] hover:bg-blue-700 shadow-sm"
                                title="View details"
                              >
                                <FaEye />
                              </Link>
                              <Link
                                to={`/deposit-bonus/edit-bonus/${bonus._id}`}
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-orange-600 text-white rounded-lg text-[16px] hover:bg-orange-700 shadow-sm"
                                title="Edit bonus"
                              >
                                <FaEdit />
                              </Link>
                              <button 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-red-600 text-white rounded-lg text-[16px] hover:bg-red-700 shadow-sm"
                                onClick={() => handleDelete(bonus._id)}
                                title="Delete bonus"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FaGift className="text-5xl mb-3 opacity-30" />
                            <p className="text-lg font-medium text-gray-500">No bonuses found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                            <Link
                              to="/create-bonus"
                              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center gap-2"
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
            {bonuses.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white rounded-lg shadow-md border border-gray-200">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalBonuses)}
                      </span> of{' '}
                      <span className="font-medium">{totalBonuses}</span> bonuses
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1 
                            ? 'bg-gray-50 text-gray-800 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'z-10 bg-orange-500 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this bonus? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none transition-colors duration-200 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Details Modal */}
      {showDetailsModal && selectedBonus && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FaGift className="text-orange-500" /> Bonus Details
              </h3>
              <button onClick={closeDetailsModal} className="text-gray-400 hover:text-gray-500 cursor-pointer">
                <FaTimes />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedBonus.name}</h2>
                <div className="flex items-center gap-4">
                  <code className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-lg">{selectedBonus.bonusCode}</code>
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(selectedBonus.status)}`}>
                    {selectedBonus.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Bonus Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium flex items-center gap-2">
                        {getBonusTypeIcon(selectedBonus.bonusType)} {formatBonusType(selectedBonus.bonusType)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Applicable To:</span>
                      <span className="font-medium">{getApplicableToLabel(selectedBonus.applicableTo)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonus Value:</span>
                      <span className="font-medium text-green-600">{getBonusValue(selectedBonus)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Deposit:</span>
                      <span className="font-medium">{selectedBonus.minDeposit.toFixed(2)} BDT</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Requirements & Validity</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wagering Requirement:</span>
                      <span className="font-medium text-blue-600">{selectedBonus.wageringRequirement}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Validity Period:</span>
                      <span className="font-medium">{selectedBonus.validityDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{formatDate(selectedBonus.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{selectedBonus.endDate ? formatDate(selectedBonus.endDate) : 'No expiry'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Bonus Description</h4>
                <p className="text-sm text-gray-700">
                  {selectedBonus.name} offers players a great opportunity to boost their gaming experience. 
                  {selectedBonus.percentage > 0 && ` Get ${selectedBonus.percentage}% bonus on your deposit. `}
                  {selectedBonus.amount > 0 && ` Receive a fixed bonus of ${selectedBonus.amount.toFixed(2)} BDT. `}
                  {selectedBonus.wageringRequirement > 0 && ` Wagering requirement: ${selectedBonus.wageringRequirement}x. `}
                  {selectedBonus.validityDays && ` Valid for ${selectedBonus.validityDays} days from activation.`}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end sticky bottom-0">
              <button
                onClick={closeDetailsModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-400 focus:outline-none transition-colors duration-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Bonus Modal */}
      {showAssignModal && selectedBonus && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Bonus to User</h3>
            <form onSubmit={handleAssignBonus}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    placeholder="Enter user ID"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Amount (Optional)
                  </label>
                  <input
                    type="number"
                    value={assignAmount}
                    onChange={(e) => setAssignAmount(e.target.value)}
                    placeholder="Leave blank to use default amount"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                    placeholder="Reason for manual assignment"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows="3"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none transition-colors duration-200 cursor-pointer"
                >
                  Assign Bonus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Validate Code Modal */}
      {showValidateModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" /> Validate Bonus Code
            </h3>
            <form onSubmit={handleValidateCode}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bonus Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={validateCode}
                    onChange={(e) => setValidateCode(e.target.value.toUpperCase())}
                    placeholder="Enter bonus code"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={validateUserId}
                    onChange={(e) => setValidateUserId(e.target.value)}
                    placeholder="Enter user ID to check eligibility"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Validation Result */}
                {validationResult && (
                  <div className={`p-4 rounded-lg border ${
                    validationResult.isValid 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {validationResult.isValid ? (
                        <>
                          <FaCheckCircle className="text-green-500" />
                          <span className="font-medium text-green-800">Valid Bonus Code</span>
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="text-red-500" />
                          <span className="font-medium text-red-800">Invalid Bonus Code</span>
                        </>
                      )}
                    </div>
                    {validationResult.bonus && (
                      <div className="mt-2 text-sm text-gray-700">
                        <p><strong>Name:</strong> {validationResult.bonus.name}</p>
                        <p><strong>Type:</strong> {formatBonusType(validationResult.bonus.bonusType)}</p>
                        <p><strong>Value:</strong> {getBonusValue(validationResult.bonus)}</p>
                      </div>
                    )}
                    {validationResult.error && (
                      <p className="mt-2 text-sm text-red-700">{validationResult.error}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-between space-x-3">
                <button
                  type="button"
                  onClick={() => setShowValidateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none transition-colors duration-200 cursor-pointer"
                >
                  Validate Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Allbonuses;