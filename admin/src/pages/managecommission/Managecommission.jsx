import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSearch, FaFilter, FaEye, FaPlus, FaSort, FaSortUp, FaSortDown, FaUser, FaPhone, FaEnvelope, FaMoneyBill, FaIdCard, FaSpinner, FaBalanceScale, FaSyncAlt } from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

const Managecommission = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [affiliateToDelete, setAffiliateToDelete] = useState(null);
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [statusToastMessage, setStatusToastMessage] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [showAffiliateDetails, setShowAffiliateDetails] = useState(false);
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
  
  // New states for balance adjustment
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: 'add',
    amount: '',
    reason: '',
    description: '',
    notes: ''
  });
  const [showBulkAdjustModal, setShowBulkAdjustModal] = useState(false);
  const [bulkAdjustmentForm, setBulkAdjustmentForm] = useState({
    notes: '',
    limit: 100,
    skip: 0
  });
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedAffiliates, setSelectedAffiliates] = useState([]);
  const [showSelectedAdjustModal, setShowSelectedAdjustModal] = useState(false);
  const [selectedAdjustmentForm, setSelectedAdjustmentForm] = useState({
    notes: ''
  });

  const navigate = useNavigate();
  const itemsPerPage = 10;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch affiliates from API
  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter !== 'all' ? statusFilter : '',
          verificationStatus: verificationFilter !== 'all' ? verificationFilter : '',
          search: searchTerm,
          sortBy: sortConfig.key || 'createdAt',
          sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
        });

        const response = await fetch(`${base_url}/api/admin/affiliates?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch affiliates');
        }

        const data = await response.json();
        setAffiliates(data.affiliates || []);
        setTotalPages(data.totalPages || 1);
        setTotalAffiliates(data.total || 0);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching affiliates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAffiliates();
  }, [currentPage, statusFilter, verificationFilter, searchTerm, sortConfig]);

  const statuses = ['all', 'pending', 'active', 'suspended', 'banned'];
  const verificationStatuses = ['all', 'unverified', 'pending', 'verified', 'rejected'];

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
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

  // Handle affiliate deletion
  const handleDelete = (id) => {
    setAffiliateToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliateToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete affiliate');
      }

      setAffiliates(affiliates.filter(affiliate => affiliate._id !== affiliateToDelete));
      setStatusToastMessage('Affiliate deleted successfully');
      setShowStatusToast(true);
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error deleting affiliate');
      setShowStatusToast(true);
    } finally {
      setShowDeleteConfirm(false);
      setAffiliateToDelete(null);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setAffiliateToDelete(null);
  };

  // Handle affiliate status toggle
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const affiliate = affiliates.find(a => a._id === id);

    if (newStatus === 'active') {
      setSelectedAffiliateId(id);
      setCommissionForm({
        bet: (affiliate.commissionRate * 100).toFixed(0) || 10,
        deposit: (affiliate.depositRate * 100).toFixed(0) || 0,
        registration: affiliate.cpaRate || 0
      });
      setShowCommissionModal(true);
    } else {
      try {
        const response = await fetch(`${base_url}/api/admin/affiliates/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
          throw new Error('Failed to update affiliate status');
        }

        const updatedAffiliates = affiliates.map(affiliate => {
          if (affiliate._id === id) {
            return { ...affiliate, status: newStatus };
          }
          return affiliate;
        });

        setAffiliates(updatedAffiliates);
        setStatusToastMessage(`Affiliate status changed to ${newStatus}`);
        setShowStatusToast(true);
      } catch (err) {
        setError(err.message);
        setStatusToastMessage('Error updating affiliate status');
        setShowStatusToast(true);
      } finally {
        setTimeout(() => setShowStatusToast(false), 3000);
      }
    }
  };

  // Handle commission form change
  const handleCommissionChange = (e) => {
    const { name, value } = e.target;
    setCommissionForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  // Handle affiliate verification status toggle
  const toggleVerificationStatus = async (id, currentStatus) => {
    try {
      let newStatus;
      switch (currentStatus) {
        case 'verified': newStatus = 'rejected'; break;
        case 'rejected': newStatus = 'pending'; break;
        case 'pending': newStatus = 'unverified'; break;
        default: newStatus = 'verified';
      }

      const response = await fetch(`${base_url}/api/admin/affiliates/${id}/verification-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ verificationStatus: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      const updatedAffiliates = affiliates.map(affiliate => {
        if (affiliate._id === id) {
          return { ...affiliate, verificationStatus: newStatus };
        }
        return affiliate;
      });

      setAffiliates(updatedAffiliates);
      setStatusToastMessage(`Verification status changed to ${newStatus}`);
      setShowStatusToast(true);
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error updating verification status');
      setShowStatusToast(true);
    } finally {
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // View affiliate details
  const viewAffiliateDetails = async (affiliate) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliate._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch affiliate details');
      }

      const data = await response.json();
      setSelectedAffiliate(data);
      setShowAffiliateDetails(true);
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error fetching affiliate details');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Close affiliate details modal
  const closeAffiliateDetails = () => {
    setShowAffiliateDetails(false);
    setSelectedAffiliate(null);
  };

  // Open edit modal
  const openEditModal = async (affiliate) => {
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliate._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch affiliate details for edit');
      }

      const data = await response.json();
      setEditForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
        company: data.company || '',
        website: data.website || '',
        promoMethod: data.promoMethod || '',
        commissionRate: data.commissionRate * 100 || 0,
        commissionType: data.commissionType || '',
        cpaRate: data.cpaRate || 0,
        depositRate: data.depositRate * 100 || 0,
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
      setError(err.message);
      setStatusToastMessage('Error fetching affiliate details for edit');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Handle edit form change
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Submit edit form
  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        ...editForm,
        commissionRate: editForm.commissionRate / 100,
        depositRate: editForm.depositRate / 100,
      };

      const response = await fetch(`${base_url}/api/admin/affiliates/${selectedAffiliateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update affiliate');
      }

      const updatedData = await response.json();
      setAffiliates(affiliates.map(a => a._id === selectedAffiliateId ? updatedData.affiliate : a));
      setStatusToastMessage('Affiliate updated successfully');
      setShowStatusToast(true);
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
      setStatusToastMessage('Error updating affiliate');
      setShowStatusToast(true);
    } finally {
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // ==================== BALANCE ADJUSTMENT FUNCTIONS ====================

  // Open adjust balance modal for single affiliate
  const openAdjustBalanceModal = (affiliate) => {
    setSelectedAffiliateId(affiliate._id);
    setAdjustmentForm({
      type: 'add',
      amount: '',
      reason: '',
      description: `Balance adjustment for ${affiliate.firstName} ${affiliate.lastName}`,
      notes: ''
    });
    setShowAdjustBalanceModal(true);
  };

  // Handle adjustment form change
  const handleAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit single affiliate balance adjustment
  const submitBalanceAdjustment = async (e) => {
    e.preventDefault();
    try {
      const { type, amount, reason, description, notes } = adjustmentForm;
      
      if (!amount || parseFloat(amount) <= 0) {
        setStatusToastMessage('Please enter a valid positive amount');
        setShowStatusToast(true);
        setTimeout(() => setShowStatusToast(false), 3000);
        return;
      }

      let url = '';
      let body = {};
      
      if (type === 'add') {
        url = `${base_url}/api/admin/affiliates/${selectedAffiliateId}/balance/add`;
        body = {
          amount: parseFloat(amount),
          type: 'manual_adjustment',
          description: description,
          notes: notes || `Balance addition: ${reason || 'No reason provided'}`
        };
      } else {
        url = `${base_url}/api/admin/affiliates/${selectedAffiliateId}/balance/deduct`;
        body = {
          amount: parseFloat(amount),
          reason: reason,
          description: description,
          notes: notes
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to adjust balance');
      }

      const result = await response.json();
      
      // Update the affiliate in the list
      setAffiliates(affiliates.map(a => {
        if (a._id === selectedAffiliateId) {
          return {
            ...a,
            pendingEarnings: result.newBalance || a.pendingEarnings,
            totalEarnings: result.totalEarnings || a.totalEarnings
          };
        }
        return a;
      }));

      setStatusToastMessage(`Balance ${type === 'add' ? 'added' : 'deducted'} successfully`);
      setShowStatusToast(true);
      setShowAdjustBalanceModal(false);
      
      // Reset form
      setAdjustmentForm({
        type: 'add',
        amount: '',
        reason: '',
        description: '',
        notes: ''
      });
    } catch (err) {
      setStatusToastMessage(err.message || 'Error adjusting balance');
      setShowStatusToast(true);
    } finally {
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Open bulk adjustment modal
  const openBulkAdjustModal = () => {
    setBulkAdjustmentForm({
      notes: '',
      limit: 100,
      skip: 0
    });
    setShowBulkAdjustModal(true);
  };

  // Handle bulk adjustment form change
  const handleBulkAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setBulkAdjustmentForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit bulk adjustment
  const submitBulkAdjustment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/adjust-all-balances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(bulkAdjustmentForm)
      });

      if (!response.ok) {
        throw new Error('Failed to process bulk adjustment');
      }

      const result = await response.json();
      setStatusToastMessage(result.message || 'Bulk adjustment completed successfully');
      setShowStatusToast(true);
      setShowBulkAdjustModal(false);
      
      // Refresh the affiliates list
      fetchAffiliates();
    } catch (err) {
      setStatusToastMessage(err.message || 'Error processing bulk adjustment');
      setShowStatusToast(true);
    } finally {
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Fetch adjustment preview
  const fetchAdjustmentPreview = async () => {
    try {
      const queryParams = new URLSearchParams({
        limit: bulkAdjustmentForm.limit,
        skip: bulkAdjustmentForm.skip
      });

      const response = await fetch(`${base_url}/api/admin/affiliates/adjustment-preview?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch adjustment preview');
      }

      const data = await response.json();
      setPreviewData(data.preview);
      setShowPreviewModal(true);
    } catch (err) {
      setStatusToastMessage(err.message || 'Error fetching preview');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Handle affiliate selection for multi-adjustment
  const toggleAffiliateSelection = (affiliateId) => {
    setSelectedAffiliates(prev => {
      if (prev.includes(affiliateId)) {
        return prev.filter(id => id !== affiliateId);
      } else {
        return [...prev, affiliateId];
      }
    });
  };

  // Open selected affiliates adjustment modal
  const openSelectedAdjustModal = () => {
    if (selectedAffiliates.length === 0) {
      setStatusToastMessage('Please select at least one affiliate');
      setShowStatusToast(true);
      setTimeout(() => setShowStatusToast(false), 3000);
      return;
    }
    
    setSelectedAdjustmentForm({
      notes: ''
    });
    setShowSelectedAdjustModal(true);
  };

  // Submit selected affiliates adjustment
  const submitSelectedAdjustment = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${base_url}/api/admin/affiliates/adjust-selected-balances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          affiliateIds: selectedAffiliates,
          notes: selectedAdjustmentForm.notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to adjust selected affiliates');
      }

      const result = await response.json();
      setStatusToastMessage(result.message || 'Selected affiliates adjusted successfully');
      setShowStatusToast(true);
      setShowSelectedAdjustModal(false);
      
      // Clear selection and refresh list
      setSelectedAffiliates([]);
      fetchAffiliates();
    } catch (err) {
      setStatusToastMessage(err.message || 'Error adjusting selected affiliates');
      setShowStatusToast(true);
    } finally {
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Process payout for affiliate
  const processPayout = async (affiliateId) => {
    try {
      const affiliate = affiliates.find(a => a._id === affiliateId);
      if (!affiliate) return;

      const payoutAmount = parseFloat(prompt(`Enter payout amount for ${affiliate.firstName} ${affiliate.lastName}\nAvailable: ${affiliate.pendingEarnings} BDT\nMinimum: ${affiliate.minimumPayout} BDT`));
      
      if (!payoutAmount || isNaN(payoutAmount) || payoutAmount <= 0) {
        setStatusToastMessage('Invalid payout amount');
        setShowStatusToast(true);
        setTimeout(() => setShowStatusToast(false), 3000);
        return;
      }

      if (payoutAmount > affiliate.pendingEarnings) {
        setStatusToastMessage('Payout amount exceeds pending earnings');
        setShowStatusToast(true);
        setTimeout(() => setShowStatusToast(false), 3000);
        return;
      }

      if (payoutAmount < affiliate.minimumPayout) {
        setStatusToastMessage(`Payout amount must be at least ${affiliate.minimumPayout} BDT`);
        setShowStatusToast(true);
        setTimeout(() => setShowStatusToast(false), 3000);
        return;
      }

      const transactionId = prompt('Enter transaction ID (optional):') || `PAYOUT-${Date.now()}`;
      const notes = prompt('Enter notes (optional):') || '';

      const response = await fetch(`${base_url}/api/admin/affiliates/${affiliateId}/balance/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          amount: payoutAmount,
          transactionId: transactionId,
          notes: notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payout');
      }

      const result = await response.json();
      
      // Update the affiliate in the list
      setAffiliates(affiliates.map(a => {
        if (a._id === affiliateId) {
          return {
            ...a,
            pendingEarnings: result.newPendingBalance || a.pendingEarnings - payoutAmount,
            paidEarnings: result.totalPaid || a.paidEarnings + payoutAmount,
            lastPayoutDate: result.payoutDate || new Date()
          };
        }
        return a;
      }));

      setStatusToastMessage(`Payout of ${payoutAmount} BDT processed successfully`);
      setShowStatusToast(true);
    } catch (err) {
      setStatusToastMessage(err.message || 'Error processing payout');
      setShowStatusToast(true);
    } finally {
      setTimeout(() => setShowStatusToast(false), 3000);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, verificationFilter]);

  // Function to fetch affiliates (reusable)
  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter !== 'all' ? statusFilter : '',
        verificationStatus: verificationFilter !== 'all' ? verificationFilter : '',
        search: searchTerm,
        sortBy: sortConfig.key || 'createdAt',
        sortOrder: sortConfig.direction === 'ascending' ? 'asc' : 'desc'
      });

      const response = await fetch(`${base_url}/api/admin/affiliates?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch affiliates');
      }

      const data = await response.json();
      setAffiliates(data.affiliates || []);
      setTotalPages(data.totalPages || 1);
      setTotalAffiliates(data.total || 0);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="flex justify-center items-center py-8">
                <FaSpinner className="animate-spin text-orange-500 text-5xl" />
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-2xl mb-4">Error</div>
                <p className="text-gray-600">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
                >
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
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Affiliate Management</h1>
                <p className="text-sm text-gray-500 mt-1">Oversee and manage all platform affiliates efficiently</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openBulkAdjustModal}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center"
                >
                  <FaSyncAlt className="mr-2" /> Bulk Balance Adjustment
                </button>
                {selectedAffiliates.length > 0 && (
                  <button
                    onClick={openSelectedAdjustModal}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                  >
                    <FaBalanceScale className="mr-2" /> Adjust Selected ({selectedAffiliates.length})
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { title: 'Total Affiliates', value: totalAffiliates, color: 'blue' },
                { title: 'Active Affiliates', value: affiliates.filter(a => a.status === 'active').length, color: 'green' },
                { title: 'Verified Affiliates', value: affiliates.filter(a => a.verificationStatus === 'verified').length, color: 'yellow' },
                { title: 'Pending Earnings', value: affiliates.reduce((sum, a) => sum + (a.pendingEarnings || 0), 0).toFixed(2) + ' BDT', color: 'purple' },
              ].map((stat, index) => (
                <div key={index} className={`bg-white p-4 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200`}>
                  <h3 className="text-sm font-medium text-gray-500">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaFilter className="mr-2 text-orange-500" />
                  Filters & Search
                </h2>
                <div className="flex items-center gap-3">
                  {selectedAffiliates.length > 0 && (
                    <span className="text-sm text-green-600 font-medium">
                      {selectedAffiliates.length} selected
                    </span>
                  )}
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setVerificationFilter('all');
                      setSelectedAffiliates([]);
                    }}
                    className="text-sm text-orange-500 hover:text-orange-700 flex items-center transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                    placeholder="Search name, email, or affiliate code..."
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                >
                  {statuses.map((status, index) => (
                    <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>

                {/* Verification Status Filter */}
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                >
                  {verificationStatuses.map((status, index) => (
                    <option key={index} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-gray-600">
              <p>
                Showing {affiliates.length} of {totalAffiliates} affiliates
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchAdjustmentPreview}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FaBalanceScale className="mr-1" /> Preview Balance Adjustment
                </button>
              </div>
            </div>

            {/* Affiliates Table */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                    <tr className=''>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider w-8">
                        <input
                          type="checkbox"
                          checked={selectedAffiliates.length === affiliates.length && affiliates.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAffiliates(affiliates.map(a => a._id));
                            } else {
                              setSelectedAffiliates([]);
                            }
                          }}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Affiliate
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('affiliateCode')}>
                        Affiliate Code 
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('pendingEarnings')}>
                        Pending Earnings
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer" onClick={() => requestSort('createdAt')}>
                        Registered 
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {affiliates.length > 0 ? (
                      affiliates.map((affiliate) => (
                        <tr key={affiliate._id} className="hover:bg-gray-50 text-nowrap transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedAffiliates.includes(affiliate._id)}
                              onChange={() => toggleAffiliateSelection(affiliate._id)}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12">
                                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                                  <FaUser />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">{`${affiliate.firstName} ${affiliate.lastName}`}</div>
                                <div className="text-xs text-gray-500">{affiliate.company || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700 font-mono px-2 py-1">{affiliate.affiliateCode}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{affiliate.email}</div>
                            <div className="text-xs text-gray-500 flex items-center mt-1">
                              {affiliate.phone || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{affiliate.pendingEarnings?.toFixed(2) || 0} BDT</div>
                            <div className="text-xs text-gray-500">Commission: {(affiliate.commissionRate).toFixed(0)}%</div>
                            {affiliate.minusBalance > 0 && (
                              <div className="text-xs text-red-500 font-medium">
                                Minus Balance: {affiliate.minusBalance} BDT
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-700">{formatDate(affiliate.createdAt)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                className="p-2 px-[8px] py-[7px] cursor-pointer bg-blue-600 text-white rounded-[3px] text-[16px] hover:bg-blue-700 shadow-sm"
                                title="View details"
                                onClick={() => navigate(`/affiliates/affiliate-details/${affiliate._id}`)}
                              >
                                <FaEye />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-400">
                            <FaSearch className="text-5xl mb-3 opacity-30" />
                            <p className="text-lg font-medium text-gray-500">No affiliates found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {affiliates.length > 0 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white rounded-lg shadow-md border border-gray-200">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalAffiliates)}
                      </span> of{' '}
                      <span className="font-medium">{totalAffiliates}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1 
                            ? 'bg-gray-50 text-gray-800 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative cursor-pointer inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-orange-500 text-white'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
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
              Are you sure you want to delete this affiliate? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Commission Setup Modal */}
      {showCommissionModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Commission Rates for Activation</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const responseCommission = await fetch(`${base_url}/api/admin/affiliates/${selectedAffiliateId}/commission`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                  },
                  body: JSON.stringify({
                    commissionRate: commissionForm.bet / 100,
                    depositRate: commissionForm.deposit / 100,
                    cpaRate: commissionForm.registration,
                    commissionType: 'hybrid'
                  })
                });

                if (!responseCommission.ok) {
                  throw new Error('Failed to update commissions');
                }

                const responseStatus = await fetch(`${base_url}/api/admin/affiliates/${selectedAffiliateId}/status`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                  },
                  body: JSON.stringify({ status: 'active' })
                });

                if (!responseStatus.ok) {
                  throw new Error('Failed to update status');
                }

                setAffiliates(affiliates.map(a => {
                  if (a._id === selectedAffiliateId) {
                    return {
                      ...a,
                      status: 'active',
                      commissionRate: commissionForm.bet / 100,
                      depositRate: commissionForm.deposit / 100,
                      cpaRate: commissionForm.registration
                    };
                  }
                  return a;
                }));

                setStatusToastMessage('Affiliate activated with new commission rates');
                setShowStatusToast(true);
                setShowCommissionModal(false);
                setTimeout(() => setShowStatusToast(false), 3000);
              } catch (err) {
                setStatusToastMessage('Error activating affiliate');
                setShowStatusToast(true);
                setTimeout(() => setShowStatusToast(false), 3000);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bet Commission (%)</label>
                  <input 
                    type="number" 
                    name="bet"
                    value={commissionForm.bet}
                    onChange={handleCommissionChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    min="1"
                    max="50"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deposit Commission (%)</label>
                  <input 
                    type="number" 
                    name="deposit"
                    value={commissionForm.deposit}
                    onChange={handleCommissionChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    min="0"
                    max="50"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Registration Commission (BDT)</label>
                  <input 
                    type="number" 
                    name="registration"
                    value={commissionForm.registration}
                    onChange={handleCommissionChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCommissionModal(false)}
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white cursor-pointer rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none transition-colors duration-200"
                >
                  Activate with Commissions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Affiliate Balance Adjustment Modal */}
      {showAdjustBalanceModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Affiliate Balance</h3>
            <form onSubmit={submitBalanceAdjustment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adjustment Type</label>
                  <select
                    name="type"
                    value={adjustmentForm.type}
                    onChange={handleAdjustmentChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  >
                    <option value="add">Add Balance</option>
                    <option value="deduct">Deduct Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (BDT)</label>
                  <input 
                    type="number" 
                    name="amount"
                    value={adjustmentForm.amount}
                    onChange={handleAdjustmentChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reason</label>
                  <input 
                    type="text" 
                    name="reason"
                    value={adjustmentForm.reason}
                    onChange={handleAdjustmentChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    placeholder="e.g., Bonus, Correction, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea 
                    name="description"
                    value={adjustmentForm.description}
                    onChange={handleAdjustmentChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea 
                    name="notes"
                    value={adjustmentForm.notes}
                    onChange={handleAdjustmentChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    rows="2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustBalanceModal(false)}
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white cursor-pointer rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none transition-colors duration-200"
                >
                  Adjust Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Adjustment Modal */}
      {showBulkAdjustModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Balance Adjustment</h3>
            <form onSubmit={submitBulkAdjustment}>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Notice</h4>
                  <p className="text-sm text-yellow-700">
                    This will deduct the <strong>minusBalance</strong> from <strong>totalEarnings</strong> for all affiliates with positive minusBalance.
                    MinusBalance will be reset to 0.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea 
                    name="notes"
                    value={bulkAdjustmentForm.notes}
                    onChange={handleBulkAdjustmentChange}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    rows="3"
                    placeholder="Enter reason for bulk adjustment..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBulkAdjustModal(false)}
                    className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white cursor-pointer rounded-md text-sm font-medium hover:bg-purple-700 focus:outline-none transition-colors duration-200"
                  >
                    Process Bulk Adjustment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">Adjustment Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Affected:</span>
                      <span className="font-medium">{previewData.totalAffected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Batch:</span>
                      <span className="font-medium">{previewData.currentBatch}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Financial Impact</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Total Earnings:</span>
                      <span className="font-medium">{previewData.totals.currentTotalEarnings.toFixed(2)} BDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Minus Balance:</span>
                      <span className="font-medium">{previewData.totals.totalMinusBalance.toFixed(2)} BDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Projected Total Earnings:</span>
                      <span className="font-medium">{previewData.totals.projectedTotalEarnings.toFixed(2)} BDT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Adjustment:</span>
                      <span className="font-medium text-red-600">{previewData.totals.totalAdjustment.toFixed(2)} BDT</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Affiliates to be Adjusted</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Current Earnings</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Minus Balance</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Projected Earnings</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.affiliates.map((affiliate, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{affiliate.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">{affiliate.currentTotalEarnings.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-red-600">{affiliate.minusBalance.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-green-600">{affiliate.projectedTotalEarnings.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-red-600">{affiliate.adjustmentAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Affiliates Adjustment Modal */}
      {showSelectedAdjustModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Selected Affiliates</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will adjust {selectedAffiliates.length} selected affiliate(s). MinusBalance will be deducted from totalEarnings.
            </p>
            <form onSubmit={submitSelectedAdjustment}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                  <textarea 
                    name="notes"
                    value={selectedAdjustmentForm.notes}
                    onChange={(e) => setSelectedAdjustmentForm({ notes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 p-[10px] rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    rows="3"
                    placeholder="Enter reason for adjustment..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSelectedAdjustModal(false)}
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white cursor-pointer rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none transition-colors duration-200"
                >
                  Adjust Selected
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Toast */}
      {showStatusToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {statusToastMessage}
        </div>
      )}
    </section>
  );
};

export default Managecommission;