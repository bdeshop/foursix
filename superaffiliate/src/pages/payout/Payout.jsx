import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaDownload,
  FaFilter,
  FaSearch,
  FaEye,
  FaExclamationTriangle,
  FaCopy,
  FaWallet,
  FaMobileAlt,
  FaIdCard,
  FaUpload,
  FaSpinner,
  FaCheck,
  FaCamera,
  FaInfoCircle,
  FaLock
} from 'react-icons/fa';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Payout = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [kycData, setKycData] = useState(null);
  const [showKycUploadModal, setShowKycUploadModal] = useState(false);
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  
  // KYC upload state
  const [kycImages, setKycImages] = useState({
    front: null,
    back: null
  });
  
  const [uploadProgress, setUploadProgress] = useState({
    front: 0,
    back: 0
  });

  // Fixed payment methods (4 methods)
  const fixedPaymentMethods = [
    {
      id: 'bkash',
      name: 'bKash',
      type: 'mobile',
      icon: FaMobileAlt,
      placeholder: 'Number',
      fieldLabel: 'bKash Phone Number',
      validation: /^01[3-9]\d{8}$/
    },
    {
      id: 'nagad',
      name: 'Nagad',
      type: 'mobile',
      icon: FaMobileAlt,
      placeholder: 'Number',
      fieldLabel: 'Nagad Phone Number',
      validation: /^01[3-9]\d{8}$/
    },
    {
      id: 'rocket',
      name: 'Rocket',
      type: 'mobile',
      icon: FaMobileAlt,
      placeholder: 'Number',
      fieldLabel: 'Rocket Phone Number',
      validation: /^01[3-9]\d{8}$/
    },
    {
      id: 'binance',
      name: 'Binance',
      type: 'crypto',
      icon: FaWallet,
      placeholder: 'Binance Wallet Address or Email',
      fieldLabel: 'Binance Details',
      validation: /.+/
    }
  ];

  // Payout data state
  const [payoutData, setPayoutData] = useState({
    availableBalance: 0,
    totalPaid: 0,
    minimumPayout: 1000,
    payoutHistory: {
      payouts: [],
      summary: {},
      pagination: {}
    },
    payoutStats: {}
  });

  // Payout request form state
  const [payoutRequest, setPayoutRequest] = useState({
    amount: '',
    paymentMethod: 'bkash',
    paymentDetails: '',
    notes: ''
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load payout data and KYC status
  useEffect(() => {
    loadPayoutData();
    loadKycStatus();
  }, []);

  const loadPayoutData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('affiliatetoken');
      
      // Load profile data
      const profileResponse = await axios.get(`${base_url}/api/affiliate/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Load payout history
      const historyResponse = await axios.get(`${base_url}/api/affiliate/payout/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        const profile = profileResponse.data.affiliate;
        const history = historyResponse.data.success ? historyResponse.data : { payouts: [], summary: {} };

        // Calculate stats from history data
        const stats = calculatePayoutStats(history, profile);

        setPayoutData({
          availableBalance: profile.pendingEarnings || 0,
          totalPaid: profile.totalPaid || 0,
          minimumPayout: profile.minimumPayout || 1000,
          payoutHistory: history,
          payoutStats: stats
        });
      }
    } catch (error) {
      console.error('Error loading payout data:', error);
      toast.error('Failed to load payout data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadKycStatus = async () => {
    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.get(`${base_url}/api/affiliate/kyc/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setKycData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading KYC status:', error);
      // Don't show error toast here, just set default values
      setKycData({
        kycverified: false,
        kycStatus: 'pending',
        kycFrontImage: null,
        kycBackImage: null,
        canWithdraw: false,
        requirements: {
          frontImageRequired: true,
          backImageRequired: true,
          bothRequired: true
        }
      });
    }
  };

  const calculatePayoutStats = (history, profile) => {
    const payouts = history.payouts || [];
    const completedPayouts = payouts.filter(p => p.status === 'completed');
    const totalAmount = completedPayouts.reduce((sum, p) => sum + (p.netAmount || p.amount), 0);
    const averagePayout = completedPayouts.length > 0 ? totalAmount / completedPayouts.length : 0;
    const largestPayout = completedPayouts.length > 0 ? Math.max(...completedPayouts.map(p => p.netAmount || p.amount)) : 0;

    return {
      totalPayouts: payouts.length,
      totalAmount: totalAmount,
      completedPayouts: completedPayouts.length,
      pendingPayouts: payouts.filter(p => p.status === 'pending').length,
      averagePayout: averagePayout,
      largestPayout: largestPayout,
      availableForPayout: profile.pendingEarnings || 0,
      minimumPayout: profile.minimumPayout || 1000,
      canRequestPayout: (profile.pendingEarnings || 0) >= (profile.minimumPayout || 1000) && 
                       kycData?.kycverified && 
                       kycData?.kycStatus === 'approved'
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { 
        color: 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400 border border-green-500/30', 
        icon: FaCheckCircle,
        label: 'Completed'
      },
      processing: { 
        color: 'bg-gradient-to-r from-blue-500/20 to-cyan-600/20 text-blue-400 border border-blue-500/30', 
        icon: FaClock,
        label: 'Processing'
      },
      pending: { 
        color: 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 text-amber-400 border border-amber-500/30', 
        icon: FaClock,
        label: 'Pending'
      },
      failed: { 
        color: 'bg-gradient-to-r from-red-500/20 to-pink-600/20 text-red-400 border border-red-500/30', 
        icon: FaTimesCircle,
        label: 'Failed'
      },
      cancelled: { 
        color: 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-400 border border-gray-500/30', 
        icon: FaTimesCircle,
        label: 'Cancelled'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getKycStatusBadge = (status) => {
    const statusConfig = {
      approved: { 
        color: 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-400 border border-green-500/30', 
        icon: FaCheckCircle,
        label: 'Approved'
      },
      pending: { 
        color: 'bg-gradient-to-r from-amber-500/20 to-yellow-600/20 text-amber-400 border border-amber-500/30', 
        icon: FaClock,
        label: 'Pending'
      },
      rejected: { 
        color: 'bg-gradient-to-r from-red-500/20 to-pink-600/20 text-red-400 border border-red-500/30', 
        icon: FaTimesCircle,
        label: 'Rejected'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Check if KYC can be uploaded
  const canUploadKyc = () => {
    // Can upload if KYC is rejected or if no KYC data exists
    if (!kycData) return true;
    return kycData.kycStatus === 'rejected' || 
           (!kycData.kycFrontImage && !kycData.kycBackImage) ||
           (kycData.kycStatus !== 'pending' && kycData.kycStatus !== 'approved');
  };

  // Handle KYC image upload
  const handleImageSelect = (e, imageType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, or GIF images.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onload = (e) => {
      setKycImages(prev => ({
        ...prev,
        [imageType]: {
          file,
          preview: e.target.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadKyc = async () => {
    if (!kycImages.front && !kycImages.back) {
      toast.error('Please upload at least one KYC image');
      return;
    }

    try {
      setIsUploadingKyc(true);
      setUploadProgress({ front: 0, back: 0 });

      const token = localStorage.getItem('affiliatetoken');
      const formData = new FormData();

      if (kycImages.front?.file) {
        formData.append('frontImage', kycImages.front.file);
      }
      if (kycImages.back?.file) {
        formData.append('backImage', kycImages.back.file);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          front: prev.front < 90 ? prev.front + 10 : 90,
          back: prev.back < 90 ? prev.back + 10 : 90
        }));
      }, 300);

      const response = await axios.post(`${base_url}/api/affiliate/kyc/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({
            front: progress,
            back: progress
          });
        }
      });

      clearInterval(progressInterval);
      setUploadProgress({ front: 100, back: 100 });

      if (response.data.success) {
        toast.success('KYC images uploaded successfully!');
        setShowKycUploadModal(false);
        setKycImages({ front: null, back: null });
        await loadKycStatus();
        
        // Reload after 2 seconds to show updated status
        setTimeout(() => {
          loadKycStatus();
        }, 2000);
      }
    } catch (error) {
      console.error('KYC upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload KYC images');
    } finally {
      setIsUploadingKyc(false);
      setUploadProgress({ front: 0, back: 0 });
    }
  };

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    
    // Check KYC verification
    if (!kycData?.kycverified || kycData?.kycStatus !== 'approved') {
      toast.error('Please complete KYC verification before requesting payout');
      return;
    }
    
    if (isSubmitting) return;
    
    const amount = parseFloat(payoutRequest.amount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payout amount');
      return;
    }
    
    if (amount < payoutData.minimumPayout) {
      toast.error(`Minimum payout amount is ${formatCurrency(payoutData.minimumPayout)}`);
      return;
    }
    
    if (amount > payoutData.availableBalance) {
      toast.error('Insufficient available balance');
      return;
    }

    if (!payoutRequest.paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!payoutRequest.paymentDetails || payoutRequest.paymentDetails.trim() === '') {
      toast.error('Please enter payment details');
      return;
    }

    // Validate payment details based on selected method
    const selectedMethod = fixedPaymentMethods.find(m => m.id === payoutRequest.paymentMethod);
    if (selectedMethod && selectedMethod.validation) {
      if (!selectedMethod.validation.test(payoutRequest.paymentDetails.trim())) {
        if (payoutRequest.paymentMethod === 'binance') {
          toast.error('Please enter valid Binance wallet address or email');
        } else {
          toast.error(`Please enter a valid ${selectedMethod.name} phone number (01XXXXXXXXX)`);
        }
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.post(`${base_url}/api/affiliate/payout/request`, {
        amount: amount,
        paymentMethod: payoutRequest.paymentMethod,
        paymentDetails: payoutRequest.paymentDetails,
        notes: payoutRequest.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Payout request submitted successfully!');
        setShowRequestModal(false);
        setPayoutRequest({ 
          amount: '', 
          paymentMethod: 'bkash', 
          paymentDetails: '', 
          notes: '' 
        });
        await loadPayoutData(); // Refresh data
      }
    } catch (error) {
      console.error('Payout request error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit payout request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPayout = async (payoutId) => {
    if (!confirm('Are you sure you want to cancel this payout request?')) return;

    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.post(`${base_url}/api/affiliate/payout/${payoutId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Payout request cancelled successfully!');
        await loadPayoutData(); // Refresh data
      }
    } catch (error) {
      console.error('Cancel payout error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel payout request');
    }
  };

  const viewPayoutDetails = async (payout) => {
    try {
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.get(`${base_url}/api/affiliate/payout/${payout._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSelectedPayout(response.data.payout);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching payout details:', error);
      setSelectedPayout(payout);
      setShowDetailsModal(true);
    }
  };

  const copyToClipboard = (text, label = 'text') => {
    if (!text) {
      toast.error('No text to copy');
      return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard!`);
    });
  };

  const getPaymentMethodIcon = (methodId) => {
    const method = fixedPaymentMethods.find(m => m.id === methodId);
    const IconComponent = method?.icon || FaWallet;
    return <IconComponent className="w-4 h-4" />;
  };

  const getPaymentMethodDisplay = (methodId) => {
    const method = fixedPaymentMethods.find(m => m.id === methodId);
    return method?.name || methodId;
  };

  const filteredPayouts = payoutData.payoutHistory.payouts?.filter(payout => {
    const matchesSearch = payout.payoutId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getPaymentMethodDisplay(payout.paymentMethod).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const canRequestPayout = payoutData.availableBalance >= payoutData.minimumPayout && 
                          kycData?.kycverified && 
                          kycData?.kycStatus === 'approved';

  // KYC Verification Alert Component
  const KYCVerificationAlert = () => {
    if (kycData?.kycverified && kycData?.kycStatus === 'approved') {
      return null; // Don't show alert if KYC is verified
    }

    return (
      <div className="mb-8">
        <div className={`rounded-xl p-6 ${
          kycData?.kycStatus === 'pending' 
            ? 'bg-amber-500/10 border border-amber-500/20' 
            : kycData?.kycStatus === 'rejected'
            ? 'bg-red-500/10 border border-red-500/20'
            : 'bg-cyan-500/10 border border-cyan-500/20'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-lg">
                {kycData?.kycStatus === 'pending' ? (
                  <FaClock className="text-2xl text-amber-400" />
                ) : kycData?.kycStatus === 'rejected' ? (
                  <FaTimesCircle className="text-2xl text-red-400" />
                ) : (
                  <FaIdCard className="text-2xl text-cyan-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-widest">
                  {kycData?.kycStatus === 'pending' 
                    ? 'KYC Verification Pending'
                    : kycData?.kycStatus === 'rejected'
                    ? 'KYC Verification Rejected'
                    : 'KYC Verification Required'
                  }
                </h3>
                <p className="text-gray-400 mt-1">
                  {kycData?.kycStatus === 'pending' 
                    ? 'Your KYC documents are under review. You cannot withdraw funds until approved.'
                    : kycData?.kycStatus === 'rejected'
                    ? 'Your KYC documents were rejected. Please upload valid documents.'
                    : 'You need to complete KYC verification to withdraw funds.'
                  }
                </p>
                {kycData?.kycStatus === 'rejected' && (
                  <p className="text-sm text-red-300 mt-2">
                    Please check your email for rejection reasons or contact support.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowKycUploadModal(true)}
              disabled={!canUploadKyc()}
              className={`mt-4 lg:mt-0 px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest ${
                canUploadKyc()
                  ? 'bg-cyan-500 text-black hover:bg-cyan-600'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {kycData?.kycStatus === 'pending' 
                ? 'View Status' 
                : canUploadKyc() 
                ? 'Upload KYC' 
                : 'KYC Uploaded'
              }
            </button>
          </div>
          
          {kycData?.kycStatus === 'pending' && (
            <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
              <div className="flex items-center space-x-2">
                <FaInfoCircle className="text-amber-400" />
                <p className="text-sm text-amber-300">
                  KYC verification usually takes 24-48 hours. Please be patient. You cannot upload new documents while under review.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000514] text-white font-sans">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-16">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`flex-1 p-8 ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000514] text-white font-sans">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight mb-2 flex items-center">
                  <FaBangladeshiTakaSign className="text-cyan-400 mr-3" />
                  <span className="text-cyan-400">
                    Payout Management
                  </span>
                </h1>
                <p className="text-gray-400 mt-2 text-sm md:text-base">
                  Request and track your affiliate earnings in BDT
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                {/* KYC Status Badge */}
                <div className="hidden md:block">
                  {getKycStatusBadge(kycData?.kycStatus || 'pending')}
                </div>
                
                <button
                  onClick={() => setShowRequestModal(true)}
                  disabled={!canRequestPayout}
                  className={`px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-sm ${
                    canRequestPayout
                      ? 'bg-cyan-500 text-black hover:bg-cyan-600 cursor-pointer' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Request Payout</span>
                </button>
              </div>
            </div>
          </div>

          {/* KYC Verification Alert */}
          <KYCVerificationAlert />

          {/* Notice */}
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-8">
            <p className="text-sm text-center">
              💰 IMPORTANT NOTICE: Every night at 12:00 AM (midnight), your commission earnings will be automatically added to your account!
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Available Balance</p>
                  <p className="text-2xl md:text-3xl font-bold mb-2">
                    {formatCurrency(payoutData.availableBalance)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Ready for payout
                  </p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <FaMoneyBillWave className="text-cyan-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Total Paid</p>
                  <p className="text-2xl md:text-3xl font-bold mb-2">
                    {formatCurrency(payoutData.totalPaid)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Lifetime earnings
                  </p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <FaCheckCircle className="text-cyan-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Minimum Payout</p>
                  <p className="text-2xl md:text-3xl font-bold mb-2">
                    {formatCurrency(payoutData.minimumPayout)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Required amount
                  </p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-lg">
                  <FaBangladeshiTakaSign className="text-cyan-400 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Payout Eligibility Alert */}
          <div className={`rounded-xl p-6 mb-8 ${
            canRequestPayout
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-amber-500/10 border border-amber-500/20'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  {canRequestPayout ? (
                    <FaMoneyBillWave className="text-2xl text-green-400" />
                  ) : (
                    <FaExclamationTriangle className="text-2xl text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest">
                    {canRequestPayout
                      ? 'Ready for Payout!'
                      : !kycData?.kycverified
                      ? 'KYC Verification Required'
                      : kycData?.kycStatus === 'pending'
                      ? 'KYC Verification Pending'
                      : 'Minimum Not Reached'
                    }
                  </h3>
                  <p className="text-gray-400">
                    {canRequestPayout
                      ? `You can request up to ${formatCurrency(payoutData.availableBalance)}`
                      : !kycData?.kycverified
                      ? 'Complete KYC verification to withdraw funds'
                      : kycData?.kycStatus === 'pending'
                      ? 'Your KYC documents are under review'
                      : `You need ${formatCurrency(payoutData.minimumPayout - payoutData.availableBalance)} more to request a payout`
                    }
                  </p>
                </div>
              </div>
              {canRequestPayout ? (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="mt-4 lg:mt-0 px-6 py-3 bg-cyan-500 text-black rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-cyan-600"
                >
                  Request Payout Now
                </button>
              ) : (!kycData?.kycverified || kycData?.kycStatus === 'rejected') && canUploadKyc() && (
                <button
                  onClick={() => setShowKycUploadModal(true)}
                  className="mt-4 lg:mt-0 px-6 py-3 bg-cyan-500 text-black rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-cyan-600"
                >
                  {kycData?.kycStatus === 'rejected' ? 'Re-upload KYC' : 'Upload KYC'}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/5 border border-white/10 rounded-xl mb-8">
            <div className="border-b border-white/10">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-4 px-1 border-b-2 font-bold uppercase tracking-widest text-sm ${
                    activeTab === 'history'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-gray-400 cursor-pointer hover:text-gray-300'
                  }`}
                >
                  Payout History
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-4 px-1 border-b-2 cursor-pointer font-bold uppercase tracking-widest text-sm ${
                    activeTab === 'stats'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Statistics
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'history' && (
                <div>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <h2 className="text-2xl font-bold uppercase tracking-widest mb-4 lg:mb-0 text-cyan-400">
                      Payout History
                    </h2>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Input */}
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by ID or method..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full sm:w-64 text-white placeholder-gray-500"
                        />
                      </div>
                      
                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                      >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="processing">Processing</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredPayouts.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">No payout history found</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                              Payout ID
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                              Amount
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                              Method
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                              Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {filteredPayouts.map((payout) => (
                            <tr key={payout._id} className="hover:bg-white/5">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white font-mono">
                                  {payout.payoutId}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-green-400">
                                  {formatCurrency(payout.netAmount || payout.amount)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {getPaymentMethodIcon(payout.paymentMethod)}
                                  <span className="text-sm text-white capitalize">
                                    {getPaymentMethodDisplay(payout.paymentMethod)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {payout.paymentDetails && typeof payout.paymentDetails === 'string' 
                                    ? (payout.paymentMethod === 'binance' && payout.paymentDetails.length > 16
                                        ? `${payout.paymentDetails.slice(0, 8)}...${payout.paymentDetails.slice(-8)}`
                                        : payout.paymentDetails)
                                    : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(payout.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-300">
                                  {formatDate(payout.requestedAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => viewPayoutDetails(payout)}
                                    className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                                  >
                                    <FaEye className="w-4 h-4" />
                                    <span>View</span>
                                  </button>
                                  {payout.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelPayout(payout._id)}
                                      className="text-red-400 hover:text-red-300 flex items-center space-x-1"
                                    >
                                      <FaTimesCircle className="w-4 h-4" />
                                      <span>Cancel</span>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-widest mb-6 text-cyan-400">
                    Payout Statistics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Payouts:</span>
                          <span className="font-semibold">{payoutData.payoutStats.totalPayouts || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Completed:</span>
                          <span className="font-semibold text-green-400">{payoutData.payoutStats.completedPayouts || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Pending:</span>
                          <span className="font-semibold text-amber-400">{payoutData.payoutStats.pendingPayouts || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Amount:</span>
                          <span className="font-semibold">{formatCurrency(payoutData.payoutStats.totalAmount || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Averages</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average Payout:</span>
                          <span className="font-semibold">{formatCurrency(payoutData.payoutStats.averagePayout || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Largest Payout:</span>
                          <span className="font-semibold">{formatCurrency(payoutData.payoutStats.largestPayout || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Success Rate:</span>
                          <span className="font-semibold">
                            {payoutData.payoutStats.totalPayouts ? 
                              Math.round(((payoutData.payoutStats.completedPayouts || 0) / payoutData.payoutStats.totalPayouts) * 100) : 0
                            }%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Quick Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowRequestModal(true)}
                          disabled={!canRequestPayout}
                          className={`w-full px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-sm ${
                            canRequestPayout
                              ? 'bg-cyan-500 text-black hover:bg-cyan-600 cursor-pointer' 
                              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Request Payout
                        </button>
                        {canUploadKyc() && (
                          <button
                            onClick={() => setShowKycUploadModal(true)}
                            className="w-full px-4 py-2 border border-white/10 text-gray-300 rounded-lg hover:bg-white/5 font-bold uppercase tracking-widest text-sm"
                          >
                            {kycData?.kycStatus === 'rejected' ? 'Re-upload KYC' : 'Upload KYC'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* KYC Upload Modal */}
      {showKycUploadModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#000514] border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FaIdCard className="text-cyan-400 text-2xl" />
                  <h3 className="text-xl font-bold uppercase tracking-widest text-white">KYC Verification</h3>
                </div>
                <button
                  onClick={() => {
                    setShowKycUploadModal(false);
                    setKycImages({ front: null, back: null });
                  }}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FaTimesCircle className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Current KYC Status */}
              <div className="mb-8">
                <h4 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Current Status</h4>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">KYC Status</p>
                      <div className="flex items-center space-x-2">
                        {getKycStatusBadge(kycData?.kycStatus || 'pending')}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">Verification</p>
                      <p className="text-sm">
                        {kycData?.kycverified ? (
                          <span className="text-green-400 flex items-center">
                            <FaCheckCircle className="mr-2" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-400 flex items-center">
                            <FaClock className="mr-2" /> Not Verified
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending KYC Notice */}
              {kycData?.kycStatus === 'pending' && (
                <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FaLock className="text-amber-400 text-xl" />
                    <div>
                      <h5 className="text-lg font-bold text-amber-400 mb-1">KYC Under Review</h5>
                      <p className="text-amber-300 text-sm">
                        Your KYC documents are currently under review. You cannot upload new documents while your application is being processed.
                      </p>
                      <p className="text-amber-200 text-sm mt-2">
                        Verification usually takes 24-48 hours. Please be patient.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejected KYC Notice */}
              {kycData?.kycStatus === 'rejected' && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FaInfoCircle className="text-red-400 text-xl" />
                    <div>
                      <h5 className="text-lg font-bold text-red-400 mb-1">KYC Rejected</h5>
                      <p className="text-red-300 text-sm">
                        Your previous KYC documents were rejected. Please upload new, valid documents.
                      </p>
                      <p className="text-red-200 text-sm mt-2">
                        Make sure your documents are clear, valid, and match the requirements below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Instructions */}
              <div className="mb-8">
                <h4 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Upload Requirements</h4>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <FaCheck className="text-green-400" />
                      <span>Upload clear photos of your government-issued ID (NID, Passport, Driving License)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FaCheck className="text-green-400" />
                      <span>Both front and back sides are required for verification</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FaCheck className="text-green-400" />
                      <span>File size: Maximum 5MB per image</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <FaCheck className="text-green-400" />
                      <span>Supported formats: JPG, PNG, GIF, WebP</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Image Upload Section - Only show if can upload */}
              {canUploadKyc() ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Front Image Upload */}
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6">
                      <div className="text-center">
                        <FaCamera className="text-cyan-400 text-3xl mx-auto mb-3" />
                        <h5 className="text-lg font-bold uppercase tracking-widest mb-2">Front Side</h5>
                        <p className="text-gray-400 text-sm mb-4">Upload the front of your ID</p>
                        
                        {kycImages.front ? (
                          <div className="mb-4">
                            <img 
                              src={kycImages.front.preview} 
                              alt="Front ID Preview" 
                              className="w-full h-48 object-contain rounded-lg mb-3"
                            />
                            <p className="text-xs text-gray-400">
                              {kycImages.front.file.name} ({Math.round(kycImages.front.file.size / 1024)}KB)
                            </p>
                          </div>
                        ) : (
                          <div className="h-48 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-gray-500">No image selected</span>
                          </div>
                        )}
                        
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageSelect(e, 'front')}
                            className="hidden"
                          />
                          <div className="px-4 py-2 bg-cyan-500 text-black rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-cyan-600 cursor-pointer">
                            Choose Front Image
                          </div>
                        </label>
                        
                        {/* Upload Progress */}
                        {uploadProgress.front > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Uploading...</span>
                              <span>{uploadProgress.front}%</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-500 transition-all duration-300"
                                style={{ width: `${uploadProgress.front}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Back Image Upload */}
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6">
                      <div className="text-center">
                        <FaCamera className="text-cyan-400 text-3xl mx-auto mb-3" />
                        <h5 className="text-lg font-bold uppercase tracking-widest mb-2">Back Side</h5>
                        <p className="text-gray-400 text-sm mb-4">Upload the back of your ID</p>
                        
                        {kycImages.back ? (
                          <div className="mb-4">
                            <img 
                              src={kycImages.back.preview} 
                              alt="Back ID Preview" 
                              className="w-full h-48 object-contain rounded-lg mb-3"
                            />
                            <p className="text-xs text-gray-400">
                              {kycImages.back.file.name} ({Math.round(kycImages.back.file.size / 1024)}KB)
                            </p>
                          </div>
                        ) : (
                          <div className="h-48 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-gray-500">No image selected</span>
                          </div>
                        )}
                        
                        <label className="block">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageSelect(e, 'back')}
                            className="hidden"
                          />
                          <div className="px-4 py-2 bg-cyan-500 text-black rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-cyan-600 cursor-pointer">
                            Choose Back Image
                          </div>
                        </label>
                        
                        {/* Upload Progress */}
                        {uploadProgress.back > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Uploading...</span>
                              <span>{uploadProgress.back}%</span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-500 transition-all duration-300"
                                style={{ width: `${uploadProgress.back}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Current Uploaded Images (if any) */}
                  {kycData?.kycFrontImage || kycData?.kycBackImage ? (
                    <div className="mb-8">
                      <h4 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Currently Uploaded Images</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {kycData?.kycFrontImage && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Front Image</p>
                            <div className="h-32 bg-white/5 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400">Uploaded ✓</span>
                            </div>
                          </div>
                        )}
                        {kycData?.kycBackImage && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Back Image</p>
                            <div className="h-32 bg-white/5 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400">Uploaded ✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handleUploadKyc}
                      disabled={isUploadingKyc || (!kycImages.front && !kycImages.back)}
                      className={`flex-1 px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-sm ${
                        isUploadingKyc
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : (!kycImages.front && !kycImages.back)
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-cyan-500 text-black hover:bg-cyan-600 cursor-pointer'
                      }`}
                    >
                      {isUploadingKyc ? (
                        <div className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" />
                          Uploading...
                        </div>
                      ) : (
                        kycData?.kycStatus === 'rejected' ? 'Re-upload KYC Documents' : 'Upload KYC Documents'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowKycUploadModal(false);
                        setKycImages({ front: null, back: null });
                      }}
                      className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                /* If cannot upload (pending status) */
                <div className="text-center py-8">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg inline-block">
                    <FaClock className="text-amber-400 text-4xl mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-amber-400 mb-2">KYC Under Review</h4>
                    <p className="text-gray-300 mb-4">
                      Your KYC documents are currently being reviewed. You cannot upload new documents at this time.
                    </p>
                    <p className="text-gray-400 text-sm">
                      Please check back in 24-48 hours for the verification result.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowKycUploadModal(false)}
                    className="mt-6 px-6 py-3 bg-gray-700 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              )}

              {/* Verification Notice */}
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FaClock className="text-amber-400" />
                  <p className="text-sm text-amber-300">
                    After uploading your KYC documents, verification usually takes 24-48 hours. You will be notified once your KYC is approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] flex items-center justify-center z-[10000]  p-4">
          <div className="bg-[#000514] border border-white/10 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold uppercase tracking-widest text-white">Request Payout</h3>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setPayoutRequest({ 
                      amount: '', 
                      paymentMethod: 'bkash', 
                      paymentDetails: '', 
                      notes: '' 
                    });
                  }}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FaTimesCircle className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePayoutRequest} className="p-6 space-y-4">
              {/* KYC Verification Notice */}
              {!kycData?.kycverified && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FaTimesCircle className="text-red-400" />
                    <p className="text-sm text-red-300">
                      KYC verification is required before requesting payout.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Payout Amount (BDT)
                </label>
                <div className="relative">
                  <FaBangladeshiTakaSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={payoutRequest.amount}
                    onChange={(e) => setPayoutRequest(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder={`Minimum: ${formatCurrency(payoutData.minimumPayout)}`}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                    min={payoutData.minimumPayout}
                    max={payoutData.availableBalance}
                    step="0.01"
                    required
                    disabled={!kycData?.kycverified}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Available: {formatCurrency(payoutData.availableBalance)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Payment Method
                </label>
                <select
                  value={payoutRequest.paymentMethod}
                  onChange={(e) => {
                    setPayoutRequest(prev => ({ 
                      ...prev, 
                      paymentMethod: e.target.value,
                      paymentDetails: '' // Clear payment details when method changes
                    }));
                  }}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                  required
                  disabled={!kycData?.kycverified}
                >
                  {fixedPaymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Details Input */}
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                  {fixedPaymentMethods.find(m => m.id === payoutRequest.paymentMethod)?.fieldLabel || 'Payment Details'}
                </label>
                <div className="relative">
                  {fixedPaymentMethods.find(m => m.id === payoutRequest.paymentMethod)?.icon && 
                    React.createElement(
                      fixedPaymentMethods.find(m => m.id === payoutRequest.paymentMethod)?.icon,
                      { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }
                    )
                  }
                  <input
                    type="text"
                    value={payoutRequest.paymentDetails}
                    onChange={(e) => setPayoutRequest(prev => ({ ...prev, paymentDetails: e.target.value }))}
                    placeholder={fixedPaymentMethods.find(m => m.id === payoutRequest.paymentMethod)?.placeholder || 'Enter payment details'}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                    required
                    disabled={!kycData?.kycverified}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {payoutRequest.paymentMethod === 'binance' 
                    ? 'Enter your Binance wallet address or registered email'
                    : 'Enter your 11-digit mobile number'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={payoutRequest.notes}
                  onChange={(e) => setPayoutRequest(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes for this payout request..."
                  rows="3"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
                  disabled={!kycData?.kycverified}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !kycData?.kycverified}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold uppercase tracking-widest text-sm ${
                    !kycData?.kycverified
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : isSubmitting
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-cyan-500 text-black hover:bg-cyan-600 cursor-pointer'
                  }`}
                >
                  {!kycData?.kycverified 
                    ? 'KYC Required'
                    : isSubmitting 
                    ? 'Submitting...'
                    : 'Submit Request'
                  }
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setPayoutRequest({ 
                      amount: '', 
                      paymentMethod: 'bkash', 
                      paymentDetails: '', 
                      notes: '' 
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout Details Modal */}
      {showDetailsModal && selectedPayout && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#000514] border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold uppercase tracking-widest text-white">Payout Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FaTimesCircle className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Transaction Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Payout ID</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-white font-mono">
                          {selectedPayout.payoutId}
                        </p>
                        <button
                          onClick={() => copyToClipboard(selectedPayout.payoutId, 'Payout ID')}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <FaCopy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Amount</label>
                      <p className="text-lg font-semibold text-green-400 mt-1">
                        {formatCurrency(selectedPayout.netAmount || selectedPayout.amount)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedPayout.status)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Requested Date</label>
                      <p className="text-sm text-gray-300 mt-1">
                        {formatDate(selectedPayout.requestedAt)}
                      </p>
                    </div>
                    {selectedPayout.completedAt && (
                      <div>
                        <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Completed Date</label>
                        <p className="text-sm text-gray-300 mt-1">
                          {formatDate(selectedPayout.completedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Payment Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Payment Method</label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getPaymentMethodIcon(selectedPayout.paymentMethod)}
                        <p className="text-sm text-white capitalize">
                          {getPaymentMethodDisplay(selectedPayout.paymentMethod)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Payment Details</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-white">
                          {selectedPayout.paymentDetails && typeof selectedPayout.paymentDetails === 'string'
                            ? (selectedPayout.paymentMethod === 'binance' && selectedPayout.paymentDetails.length > 16
                                ? `${selectedPayout.paymentDetails.slice(0, 8)}...${selectedPayout.paymentDetails.slice(-8)}`
                                : selectedPayout.paymentDetails)
                            : 'N/A'}
                        </p>
                        {selectedPayout.paymentDetails && (
                          <button
                            onClick={() => copyToClipboard(selectedPayout.paymentDetails, 'Payment details')}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            <FaCopy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPayout.status === 'pending' && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-amber-400" />
                    <p className="text-sm text-amber-300">
                      This payout request is being processed. It usually takes 2-3 business days to complete.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-white/10 bg-white/5 rounded-b-xl">
              <div className="flex justify-between items-center">
                {selectedPayout.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleCancelPayout(selectedPayout._id);
                      setShowDetailsModal(false);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-red-600"
                  >
                    Cancel Payout
                  </button>
                )}
                <div className="ml-auto">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payout;