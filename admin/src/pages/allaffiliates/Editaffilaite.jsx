import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaUser, FaMoneyBillWave, FaCreditCard, FaUsers, FaTimes, FaEye, 
  FaSpinner, FaSearch, FaSort, FaEdit, FaLock, FaPlus, FaMinus, 
  FaWallet, FaHistory, FaChartLine, FaSave, FaBan, FaCheck 
} from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Editaffilaite = () => {
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
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // Separate state for add balance form
  const [addBalanceForm, setAddBalanceForm] = useState({ 
    amount: '', 
    type: 'bonus', 
    description: '' 
  });
  
  // Separate state for deduct balance form
  const [deductBalanceForm, setDeductBalanceForm] = useState({ 
    amount: '', 
    reason: '', 
    description: '' 
  });
  
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);

  const itemsPerPage = 5;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch affiliate details
  const fetchAffiliateDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${base_url}/api/admin/affiliates/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch affiliate details');
      }

      const data = await response.json();
      setSelectedAffiliate(data);
      setEditForm({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website,
        status: data.status,
        verificationStatus: data.verificationStatus,
        commissionRate: data.commissionRate,
        depositRate: data.depositRate,
        commissionType: data.commissionType,
        cpaRate: data.cpaRate || 0, // Ensure cpaRate is included
        paymentMethod: data.paymentMethod,
        minimumPayout: data.minimumPayout,
        payoutSchedule: data.payoutSchedule,
        autoPayout: data.autoPayout,
        notes: data.notes,
        tags: data.tags?.join(', '),
        assignedManager: data.assignedManager
      });
    } catch (err) {
      setError(err.message);
      toast.error('Error fetching affiliate details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch master affiliates
  const fetchMasterAffiliates = async () => {
    try {
      setMasterAffiliatesLoading(true);
      const response = await axios.get(`${base_url}/api/admin/all-master-affiliate/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data.success) {
        setMasterAffiliates(response.data.data);
        setFilteredAffiliates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching master affiliates:', error);
      toast.error('Error fetching master affiliates');
    } finally {
      setMasterAffiliatesLoading(false);
    }
  };

  // Fetch balance and transaction history
  const fetchBalanceInfo = async () => {
    try {
      setIsLoadingBalance(true);
      const response = await axios.get(`${base_url}/api/admin/affiliates/${id}/balance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setTransactionHistory(response.data.transactions);
    } catch (error) {
      console.error('Error fetching balance info:', error);
      toast.error('Error fetching balance information');
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch performance metrics
  const fetchPerformanceData = async () => {
    try {
      setIsLoadingPerformance(true);
      const response = await axios.get(`${base_url}/api/admin/affiliates/${id}/performance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast.error('Error fetching performance data');
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  // Update affiliate
  const updateAffiliate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${base_url}/api/admin/affiliates/${id}`, editForm, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data) {
        toast.success('Affiliate updated successfully');
        setIsEditing(false);
        fetchAffiliateDetails();
      }
    } catch (error) {
      console.error('Error updating affiliate:', error);
      toast.error(error.response?.data?.error || 'Failed to update affiliate');
    }
  };

  // Add balance
  const addBalance = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${base_url}/api/admin/affiliates/${id}/balance/add`, {
        amount: parseFloat(addBalanceForm.amount),
        type: addBalanceForm.type,
        description: addBalanceForm.description
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data) {
        toast.success('Balance added successfully');
        // Clear only the add balance form
        setAddBalanceForm({ amount: '', type: 'bonus', description: '' });
        fetchAffiliateDetails();
        fetchBalanceInfo();
      }
    } catch (error) {
      console.error('Error adding balance:', error);
      toast.error(error.response?.data?.error || 'Failed to add balance');
    }
  };

  // Deduct balance
  const deductBalance = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${base_url}/api/admin/affiliates/${id}/balance/deduct`, {
        amount: parseFloat(deductBalanceForm.amount),
        reason: deductBalanceForm.reason,
        description: deductBalanceForm.description
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data) {
        toast.success('Balance deducted successfully');
        // Clear only the deduct balance form
        setDeductBalanceForm({ amount: '', reason: '', description: '' });
        fetchAffiliateDetails();
        fetchBalanceInfo();
      }
    } catch (error) {
      console.error('Error deducting balance:', error);
      toast.error(error.response?.data?.error || 'Failed to deduct balance');
    }
  };

  // Process payout
  const processPayout = async (amount) => {
    try {
      const response = await axios.post(`${base_url}/api/admin/affiliates/${id}/balance/payout`, {
        amount: parseFloat(amount)
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data) {
        toast.success('Payout processed successfully');
        fetchAffiliateDetails();
        fetchBalanceInfo();
      }
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error(error.response?.data?.error || 'Failed to process payout');
    }
  };

  // Update password
  const updatePassword = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${base_url}/api/admin/affiliates/${id}/password`, passwordForm, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.data) {
        toast.success('Password updated successfully');
        setPasswordForm({ newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error(error.response?.data?.error || 'Failed to update password');
    }
  };

  // Format functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      banned: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800'
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      verified: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      unverified: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return statusConfig[status] || 'bg-gray-100 text-gray-800';
  };

  // Search and sort functionality
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
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredAffiliates].sort((a, b) => {
      if (key === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (key === 'email') {
        return direction === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
      } else if (key === 'totalEarnings') {
        const earningsA = a.masterEarnings?.totalEarnings || 0;
        const earningsB = b.masterEarnings?.totalEarnings || 0;
        return direction === 'asc' ? earningsA - earningsB : earningsB - earningsA;
      } else if (key === 'createdAt') {
        return direction === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    setFilteredAffiliates(sorted);
  };

  // Pagination
  const paginatedAffiliates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAffiliates.slice(start, start + itemsPerPage);
  }, [filteredAffiliates, currentPage]);

  const totalPages = Math.ceil(filteredAffiliates.length / itemsPerPage);

  useEffect(() => {
    if (id) {
      fetchAffiliateDetails();
      fetchMasterAffiliates();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'balance') {
      fetchBalanceInfo();
    } else if (activeTab === 'performance') {
      fetchPerformanceData();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <section className="font-nunito min-h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex flex-col justify-center items-center h-64">
              <FaSpinner className="animate-spin text-orange-600 text-5xl mr-3" />
              <span className="text-gray-700 font-medium mt-2">Loading affiliate details...</span>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (!selectedAffiliate) {
    return (
      <section className="font-nunito min-h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="text-center py-8">
              <p className="text-red-600 font-medium">Affiliate not found</p>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-8 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedAffiliate.firstName} {selectedAffiliate.lastName}
                </h1>
                <p className="text-gray-600">{selectedAffiliate.email}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  <FaEdit className="mr-2" />
                  {isEditing ? 'Cancel Edit' : 'Edit Affiliate'}
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <FaLock className="mr-2" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-[5px] shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: FaUser },
                  { id: 'balance', label: 'Balance', icon: FaWallet },
                  { id: 'performance', label: 'Performance', icon: FaChartLine },
                  { id: 'transactions', label: 'Transactions', icon: FaHistory },
                  { id: 'password', label: 'Password', icon: FaLock }
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-base flex items-center ${
                        activeTab === tab.id
                          ? 'border-orange-500 text-orange-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <IconComponent className="mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                {isEditing ? (
                  <form onSubmit={updateAffiliate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bet Commission Rate (%)</label>
                        <input
                          type="number"
                          value={editForm.commissionRate}
                          onChange={(e) => setEditForm({...editForm, commissionRate: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Rate (%)</label>
                        <input
                          type="number"
                          value={editForm.depositRate}
                          onChange={(e) => setEditForm({...editForm, depositRate: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      {/* CPA Rate Field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Registration Rate (BDT)</label>
                        <input
                          type="number"
                          value={editForm.cpaRate || 0}
                          onChange={(e) => setEditForm({...editForm, cpaRate: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Personal Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{selectedAffiliate.firstName} {selectedAffiliate.lastName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{selectedAffiliate.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{selectedAffiliate.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedAffiliate.status)}`}>
                            {selectedAffiliate.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verification:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVerificationBadge(selectedAffiliate.verificationStatus)}`}>
                            {selectedAffiliate.verificationStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Commission Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Commission Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission Rate:</span>
                          <span className="font-medium">{(selectedAffiliate.commissionRate).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deposit Rate:</span>
                          <span className="font-medium">{(selectedAffiliate.depositRate).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission Type:</span>
                          <span className="font-medium">Revenue Share</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">CPA Rate:</span>
                          <span className="font-medium">{formatCurrency(selectedAffiliate.cpaRate || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Minimum Payout:</span>
                          <span className="font-medium">{formatCurrency(selectedAffiliate.minimumPayout || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payout Schedule:</span>
                          <span className="font-medium">{selectedAffiliate.payoutSchedule || 'Manual'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Earnings Summary */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Earnings Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Earnings:</span>
                          <span className="font-medium text-green-600">{formatCurrency(selectedAffiliate.totalEarnings || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Balance:</span>
                          <span className="font-medium text-yellow-600">{formatCurrency(selectedAffiliate.pendingEarnings || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Paid Earnings:</span>
                          <span className="font-medium text-blue-600">{formatCurrency(selectedAffiliate.paidEarnings || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">Additional Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Affiliate Code:</span>
                          <span className="font-medium">{selectedAffiliate.affiliateCode || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">{selectedAffiliate.paymentMethod || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Auto Payout:</span>
                          <span className="font-medium">{selectedAffiliate.autoPayout ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Login:</span>
                          <span className="font-medium">
                            {selectedAffiliate.lastLogin ? formatDate(selectedAffiliate.lastLogin) : 'Never'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Registered On:</span>
                          <span className="font-medium">{formatDate(selectedAffiliate.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Balance Tab */}
            {activeTab === 'balance' && (
              <div className="space-y-6">
                {/* Balance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="text-yellow-800 font-semibold">Balance</h4>
                    <p className="text-2xl font-bold text-yellow-900">{formatCurrency(selectedAffiliate.pendingEarnings || 0)}</p>
                  </div>
                </div>

                {/* Balance Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Add Balance */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FaPlus className="text-green-600 mr-2" /> Add Balance
                    </h4>
                    <form onSubmit={addBalance} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          value={addBalanceForm.amount}
                          onChange={(e) => setAddBalanceForm({...addBalanceForm, amount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter amount"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={addBalanceForm.type}
                          onChange={(e) => setAddBalanceForm({...addBalanceForm, type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="bonus">Bonus</option>
                          <option value="manual_adjustment">Manual Adjustment</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={addBalanceForm.description}
                          onChange={(e) => setAddBalanceForm({...addBalanceForm, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows="2"
                          placeholder="Description for this transaction"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center"
                      >
                        <FaPlus className="mr-2" /> Add Balance
                      </button>
                    </form>
                  </div>

                  {/* Deduct Balance */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FaMinus className="text-red-600 mr-2" /> Deduct Balance
                    </h4>
                    <form onSubmit={deductBalance} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                        <input
                          type="number"
                          value={deductBalanceForm.amount}
                          onChange={(e) => setDeductBalanceForm({...deductBalanceForm, amount: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Enter amount"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                        <input
                          type="text"
                          value={deductBalanceForm.reason}
                          onChange={(e) => setDeductBalanceForm({...deductBalanceForm, reason: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Reason for deduction"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={deductBalanceForm.description}
                          onChange={(e) => setDeductBalanceForm({...deductBalanceForm, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          rows="2"
                          placeholder="Additional details"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 flex items-center justify-center"
                      >
                        <FaMinus className="mr-2" /> Deduct Balance
                      </button>
                    </form>
                  </div>
                </div>

                {/* Payout Action */}
                {(selectedAffiliate.pendingEarnings || 0) > (selectedAffiliate.minimumPayout || 0) && (
                  <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">Process Payout</h4>
                    <p className="text-blue-700 mb-4">
                      Available for payout: {formatCurrency(selectedAffiliate.pendingEarnings || 0)}
                    </p>
                    <button
                      onClick={() => processPayout(selectedAffiliate.pendingEarnings)}
                      className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      <FaWallet className="mr-2" /> Process Full Payout
                    </button>
                  </div>
                )}

                {/* Transaction History */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h4>
                  {isLoadingBalance ? (
                    <div className="flex justify-center items-center py-8">
                      <FaSpinner className="animate-spin text-blue-600 text-xl mr-2" />
                      <span>Loading transactions...</span>
                    </div>
                  ) : transactionHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactionHistory.map((transaction, index) => (
                            <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {formatDate(transaction.earnedAt)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                                {transaction.type?.replace('_', ' ')}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {transaction.description}
                              </td>
                              <td className={`py-3 px-4 text-sm font-medium ${
                                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.status === 'paid' 
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No transactions found.</p>
                  )}
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div>
                {isLoadingPerformance ? (
                  <div className="flex justify-center items-center py-8">
                    <FaSpinner className="animate-spin text-blue-600 text-xl mr-2" />
                    <span>Loading performance data...</span>
                  </div>
                ) : performanceData ? (
                  <div className="space-y-6">

                    {/* Earnings by Type */}
                    {performanceData.earningsByType && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Earnings by Type</h4>
                        <div className="space-y-3">
                          {Object.entries(performanceData.earningsByType).map(([type, amount]) => (
                            <div key={type} className="flex justify-between items-center">
                              <span className="text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                              <span className="font-medium text-green-600">{formatCurrency(amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Transactions */}
                    {performanceData.recentTransactions && performanceData.recentTransactions.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h4>
                        <div className="space-y-3">
                          {performanceData.recentTransactions.map((transaction, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                              <div>
                                <p className="font-medium capitalize">{transaction.type?.replace('_', ' ')}</p>
                                <p className="text-sm text-gray-500">{formatDate(transaction.earnedAt)}</p>
                              </div>
                              <span className={`font-medium ${
                                transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No performance data available.</p>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
                {isLoadingBalance ? (
                  <div className="flex justify-center items-center py-8">
                    <FaSpinner className="animate-spin text-blue-600 text-xl mr-2" />
                    <span>Loading transactions...</span>
                  </div>
                ) : transactionHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Amount</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionHistory.map((transaction, index) => (
                          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDate(transaction.earnedAt)}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                              {transaction.type?.replace('_', ' ')}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {transaction.description}
                            </td>
                            <td className={`py-3 px-4 text-sm font-medium ${
                              transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.status === 'paid' 
                                  ? 'bg-green-100 text-green-800'
                                  : transaction.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No transactions found.</p>
                )}
              </div>
            )}

            {/* Master Affiliates Tab */}
            {activeTab === 'master-affiliates' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Master Affiliates Created</h3>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Total: {masterAffiliates.length}
                  </span>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearch}
                      placeholder="Search by name or email..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {masterAffiliatesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <FaSpinner className="animate-spin text-blue-600 text-3xl" />
                    <span className="ml-2 text-gray-700 font-medium">Loading master affiliates...</span>
                  </div>
                ) : filteredAffiliates.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            {[
                              { label: 'Name', key: 'name' },
                              { label: 'Email', key: 'email' },
                              { label: 'Phone', key: null },
                              { label: 'Total Earnings', key: 'totalEarnings' },
                              { label: 'Status', key: null },
                              { label: 'Created Date', key: 'createdAt' },
                              { label: 'Actions', key: null }
                            ].map((header, index) => (
                              <th
                                key={index}
                                className="py-4 px-6 text-left text-sm font-semibold text-gray-700 cursor-pointer"
                                onClick={header.key ? () => handleSort(header.key) : null}
                              >
                                <div className="flex items-center">
                                  {header.label}
                                  {header.key && (
                                    <FaSort className={`ml-2 text-gray-400 ${sortConfig.key === header.key ? 'text-blue-600' : ''}`} />
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedAffiliates.map((master) => (
                            <tr key={master._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-6 text-sm text-gray-700">
                                {master.firstName} {master.lastName}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-600">{master.email}</td>
                              <td className="py-4 px-6 text-sm text-gray-600">{master.phone}</td>
                              <td className="py-4 px-6 text-sm text-gray-600">
                                {formatCurrency(master.masterEarnings?.totalEarnings || 0)}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  master.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {master.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-600">
                                {formatDate(master.createdAt)}
                              </td>
                              <td className="py-4 px-6">
                                <button
                                  onClick={() => navigate(`/admin/affiliates/${master._id}`)}
                                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                >
                                  <FaEye className="mr-2" />
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-6">
                      <div className="text-sm text-gray-600">
                        Showing {paginatedAffiliates.length} of {filteredAffiliates.length} affiliates
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200"
                        >
                          Previous
                        </button>
                        <span className="px-4 py-2 text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FaUsers className="mx-auto text-gray-400 text-4xl mb-4" />
                    <p className="text-gray-600">No master affiliates found for this super affiliate.</p>
                  </div>
                )}
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="w-full mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
                <form onSubmit={updatePassword} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password"
                      required
                      minLength="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 flex items-center justify-center"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Editaffilaite;