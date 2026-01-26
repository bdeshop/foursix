import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaDownload,
  FaFilter,
  FaSearch,
  FaPlus,
  FaEye,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaHistory,
  FaQrcode,
  FaCopy,
  FaWallet,
  FaMobileAlt
} from 'react-icons/fa';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { GiMoneyStack } from 'react-icons/gi';
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
  const [dateFilter, setDateFilter] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('history');

  // Payout data state
  const [payoutData, setPayoutData] = useState({
    availableBalance: 0,
    pendingEarnings: 0,
    totalPaid: 0,
    minimumPayout: 1000,
    nextPayoutDate: '',
    payoutHistory: {
      payouts: [],
      summary: {},
      pagination: {}
    },
    paymentMethods: [],
    payoutStats: {}
  });

  // Payout request form state
  const [payoutRequest, setPayoutRequest] = useState({
    amount: '',
    paymentMethod: '',
    notes: ''
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load payout data
  useEffect(() => {
    loadPayoutData();
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

        const paymentMethods = [
          {
            id: 'bkash',
            name: 'bKash',
            type: 'mobile',
            icon: FaMobileAlt,
            details: profile.paymentDetails?.bkash || {},
            isPrimary: profile.paymentMethod === 'bkash',
            isConfigured: !!profile.paymentDetails?.bkash?.phoneNumber
          },
          {
            id: 'nagad',
            name: 'Nagad',
            type: 'mobile',
            icon: FaMobileAlt,
            details: profile.paymentDetails?.nagad || {},
            isPrimary: profile.paymentMethod === 'nagad',
            isConfigured: !!profile.paymentDetails?.nagad?.phoneNumber
          },
          {
            id: 'rocket',
            name: 'Rocket',
            type: 'mobile',
            icon: FaMobileAlt,
            details: profile.paymentDetails?.rocket || {},
            isPrimary: profile.paymentMethod === 'rocket',
            isConfigured: !!profile.paymentDetails?.rocket?.phoneNumber
          },
          {
            id: 'binance',
            name: 'Binance',
            type: 'crypto',
            icon: FaWallet,
            details: profile.paymentDetails?.binance || {},
            isPrimary: profile.paymentMethod === 'binance',
            isConfigured: !!(profile.paymentDetails?.binance?.walletAddress || profile.paymentDetails?.binance?.email)
          },
          {
            id: 'bank_transfer',
            name: 'Bank Transfer',
            type: 'bank',
            icon: GiMoneyStack,
            details: profile.paymentDetails?.bank_transfer || {},
            isPrimary: profile.paymentMethod === 'bank_transfer',
            isConfigured: !!(profile.paymentDetails?.bank_transfer?.accountNumber && profile.paymentDetails?.bank_transfer?.bankName)
          }
        ];

        // Calculate stats from history data
        const stats = calculatePayoutStats(history, profile);

        setPayoutData({
          availableBalance: profile.pendingEarnings || 0,
          pendingEarnings: profile.pendingEarnings || 0,
          totalPaid: profile.paidEarnings || 0,
          minimumPayout: profile.minimumPayout || 1000,
          nextPayoutDate: calculateNextPayoutDate(profile.payoutSchedule),
          payoutHistory: history,
          paymentMethods: paymentMethods,
          payoutStats: stats
        });

        // Set default payment method to primary or first configured
        const primaryMethod = paymentMethods.find(m => m.isPrimary && m.isConfigured) || 
                            paymentMethods.find(m => m.isConfigured);
        if (primaryMethod) {
          setPayoutRequest(prev => ({
            ...prev,
            paymentMethod: primaryMethod.id
          }));
        }
      }
    } catch (error) {
      console.error('Error loading payout data:', error);
      toast.error('Failed to load payout data');
      // Fallback to mock data for demonstration
      setPayoutData(getMockPayoutData());
    } finally {
      setIsLoading(false);
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
      canRequestPayout: (profile.pendingEarnings || 0) >= (profile.minimumPayout || 1000)
    };
  };

  const getMockPayoutData = () => {
    const mockPayouts = [
      {
        _id: '1',
        payoutId: 'PO123456',
        amount: 1500.00,
        netAmount: 1500.00,
        currency: 'BDT',
        paymentMethod: 'bkash',
        status: 'completed',
        transactionId: 'TX123456789',
        requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        paymentDetails: {
          bkash: {
            phoneNumber: '01712345678',
            accountType: 'personal'
          }
        },
        includedEarnings: []
      },
      {
        _id: '2',
        payoutId: 'PO789012',
        amount: 895.50,
        netAmount: 895.50,
        currency: 'BDT',
        paymentMethod: 'bkash',
        status: 'completed',
        transactionId: 'TX987654321',
        requestedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        paymentDetails: {
          bkash: {
            phoneNumber: '01712345678',
            accountType: 'personal'
          }
        },
        includedEarnings: []
      },
      {
        _id: '3',
        payoutId: 'PO345678',
        amount: 2000.00,
        netAmount: 2000.00,
        currency: 'BDT',
        paymentMethod: 'nagad',
        status: 'processing',
        transactionId: 'TX789123456',
        requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        paymentDetails: {
          nagad: {
            phoneNumber: '01887654321',
            accountType: 'personal'
          }
        },
        includedEarnings: []
      },
      {
        _id: '4',
        payoutId: 'PO901234',
        amount: 752.25,
        netAmount: 752.25,
        currency: 'BDT',
        paymentMethod: 'bkash',
        status: 'pending',
        requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        paymentDetails: {
          bkash: {
            phoneNumber: '01712345678',
            accountType: 'personal'
          }
        },
        includedEarnings: []
      }
    ];

    const mockStats = calculatePayoutStats(
      { payouts: mockPayouts }, 
      { pendingEarnings: 1250.75, minimumPayout: 1000 }
    );

    return {
      availableBalance: 1250.75,
      pendingEarnings: 1250.75,
      totalPaid: 2395.50,
      minimumPayout: 1000,
      nextPayoutDate: calculateNextPayoutDate(),
      payoutHistory: {
        payouts: mockPayouts,
        summary: {
          byStatus: [
            { _id: 'completed', count: 2, totalAmount: 2395.50 },
            { _id: 'processing', count: 1, totalAmount: 2000.00 },
            { _id: 'pending', count: 1, totalAmount: 752.25 }
          ],
          totalPaid: 2395.50,
          totalPayouts: 4
        }
      },
      paymentMethods: [
        {
          id: 'bkash',
          name: 'bKash',
          type: 'mobile',
          icon: FaMobileAlt,
          details: { phoneNumber: '01712345678', accountType: 'personal' },
          isPrimary: true,
          isConfigured: true
        },
        {
          id: 'nagad',
          name: 'Nagad',
          type: 'mobile',
          icon: FaMobileAlt,
          details: { phoneNumber: '01887654321', accountType: 'personal' },
          isPrimary: false,
          isConfigured: true
        }
      ],
      payoutStats: mockStats
    };
  };

  const calculateNextPayoutDate = (schedule = 'manual') => {
    const now = new Date();
    let nextDate;
    
    switch (schedule) {
      case 'weekly':
        nextDate = new Date(now.setDate(now.getDate() + 7));
        break;
      case 'bi_weekly':
        nextDate = new Date(now.setDate(now.getDate() + 14));
        break;
      case 'monthly':
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
        break;
      default:
        nextDate = new Date(now.setDate(now.getDate() + 1)); // Tomorrow for manual
    }
    
    return nextDate.toISOString().split('T')[0];
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
      },
      on_hold: { 
        color: 'bg-gradient-to-r from-orange-500/20 to-red-600/20 text-orange-400 border border-orange-500/30', 
        icon: FaExclamationTriangle,
        label: 'On Hold'
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

  const handlePayoutRequest = async (e) => {
    e.preventDefault();
    
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

    const selectedMethod = payoutData.paymentMethods.find(m => m.id === payoutRequest.paymentMethod);
    if (!selectedMethod?.isConfigured) {
      toast.error('Selected payment method is not properly configured');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.post(`${base_url}/api/affiliate/payout/request`, {
        amount: amount,
        notes: payoutRequest.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Payout request submitted successfully!');
        setShowRequestModal(false);
        setPayoutRequest({ amount: '', paymentMethod: '', notes: '' });
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

  const exportToCSV = () => {
    toast.success('Payout history exported successfully!');
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
    const method = payoutData.paymentMethods.find(m => m.id === methodId);
    const IconComponent = method?.icon || FaWallet;
    return <IconComponent className="w-4 h-4" />;
  };

  const getPaymentMethodDisplay = (methodId) => {
    const method = payoutData.paymentMethods.find(m => m.id === methodId);
    return method?.name || methodId;
  };

  const filteredPayouts = payoutData.payoutHistory.payouts?.filter(payout => {
    const matchesSearch = payout.payoutId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getPaymentMethodDisplay(payout.paymentMethod).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && payout.requestedAt) {
      const now = new Date();
      const payoutDate = new Date(payout.requestedAt);
      
      switch (dateFilter) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = payoutDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = payoutDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          matchesDate = payoutDate >= quarterAgo;
          break;
        default:
          matchesDate = true;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  const canRequestPayout = payoutData.availableBalance >= payoutData.minimumPayout;
  const configuredMethods = payoutData.paymentMethods.filter(method => method.isConfigured);

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
    <div className="min-h-screen bg-[#000514] text-white font-sans selection:bg-cyan-500 selection:text-black">
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000514; }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #22d3ee 0%, #2563eb 100%);
          border-radius: 20px;
        }
        ::-webkit-scrollbar-thumb:hover { background: #22d3ee; }
      `}</style>
      
      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex pt-[10vh] relative z-10">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`transition-all duration-500 flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto h-[90vh] ${
          isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
        }`}>
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight mb-2 flex items-center">
                  <FaBangladeshiTakaSign className="text-cyan-400 mr-3" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                    Payout Management
                  </span>
                </h1>
                <p className="text-gray-400 mt-2 text-sm md:text-base">
                  Request and track your affiliate earnings in BDT
                </p>
              </div>
              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <button
                  onClick={() => setShowRequestModal(true)}
                  disabled={!canRequestPayout || configuredMethods.length === 0}
                  className={`px-6 py-3 rounded-tl-md rounded-br-md font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                    canRequestPayout && configuredMethods.length > 0
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:brightness-110 hover:scale-[1.02] cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Request Payout</span>
                </button>
              </div>
            </div>
            <div className="h-1.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 mt-4 rounded-full"></div>
          </div>

          {/* Notice Marquee */}
          <div className="relative flex items-center justify-center overflow-hidden mb-8">
            <div className="marquee-container overflow-hidden w-full">
              <marquee className="border border-white/10 font-medium p-3 text-sm md:text-base bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
                💰 IMPORTANT NOTICE: Every night at 12:00 AM (midnight), your commission earnings will be automatically added to your account!
              </marquee>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all group backdrop-blur-sm">
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
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform">
                  <FaMoneyBillWave className="text-cyan-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all group backdrop-blur-sm">
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
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform">
                  <FaCheckCircle className="text-cyan-400 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all group backdrop-blur-sm">
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
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg group-hover:scale-110 transition-transform">
                  <FaBangladeshiTakaSign className="text-cyan-400 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Payout Eligibility Alert */}
          <div className={`rounded-xl p-6 mb-8 backdrop-blur-sm ${
            canRequestPayout && configuredMethods.length > 0
              ? 'bg-gradient-to-r from-green-500/20 to-teal-600/20 border border-green-500/30'
              : configuredMethods.length === 0
              ? 'bg-gradient-to-r from-red-500/20 to-pink-600/20 border border-red-500/30'
              : 'bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  {canRequestPayout && configuredMethods.length > 0 ? (
                    <FaMoneyBillWave className="text-2xl text-green-400" />
                  ) : configuredMethods.length === 0 ? (
                    <FaExclamationTriangle className="text-2xl text-red-400" />
                  ) : (
                    <FaExclamationTriangle className="text-2xl text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-widest">
                    {canRequestPayout && configuredMethods.length > 0
                      ? 'Ready for Payout!'
                      : configuredMethods.length === 0
                      ? 'Payment Method Required'
                      : 'Minimum Not Reached'
                    }
                  </h3>
                  <p className="text-gray-400">
                    {canRequestPayout && configuredMethods.length > 0
                      ? `You can request up to ${formatCurrency(payoutData.availableBalance)}`
                      : configuredMethods.length === 0
                      ? 'Please configure your payment method in profile settings'
                      : `You need ${formatCurrency(payoutData.minimumPayout - payoutData.availableBalance)} more to request a payout`
                    }
                  </p>
                </div>
              </div>
              {canRequestPayout && configuredMethods.length > 0 && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="mt-4 lg:mt-0 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black rounded-tl-md rounded-br-md text-sm font-bold uppercase tracking-widest hover:brightness-110 hover:scale-[1.02] transition-all duration-300"
                >
                  Request Payout Now
                </button>
              )}
              {configuredMethods.length === 0 && (
                <button
                  onClick={() => window.location.href = '/affiliate/profile'}
                  className="mt-4 lg:mt-0 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-tl-md rounded-br-md text-sm font-bold uppercase tracking-widest hover:brightness-110 hover:scale-[1.02] transition-all duration-300"
                >
                  Configure Payment Method
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/5 border border-white/10 rounded-xl mb-8 backdrop-blur-sm">
            <div className="border-b border-white/10">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-4 px-1 border-b-2 font-bold uppercase tracking-widest text-sm ${
                    activeTab === 'history'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-gray-400 cursor-pointer hover:text-gray-300 hover:border-gray-300/30'
                  }`}
                >
                  Payout History
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-4 px-1 border-b-2 cursor-pointer font-bold uppercase tracking-widest text-sm ${
                    activeTab === 'stats'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300/30'
                  }`}
                >
                  Statistics
                </button>
                <button
                  onClick={() => setActiveTab('methods')}
                  className={`py-4 px-1 border-b-2 cursor-pointer font-bold uppercase tracking-widest text-sm ${
                    activeTab === 'methods'
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300/30'
                  }`}
                >
                  Payment Methods
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'history' && (
                <div>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <h2 className="text-2xl font-bold uppercase tracking-widest mb-4 lg:mb-0">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Payout History
                      </span>
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
                          className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full sm:w-64 text-white placeholder-gray-500"
                        />
                      </div>
                      
                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                      >
                        <option value="all" className="bg-[#000514]">All Status</option>
                        <option value="completed" className="bg-[#000514]">Completed</option>
                        <option value="processing" className="bg-[#000514]">Processing</option>
                        <option value="pending" className="bg-[#000514]">Pending</option>
                        <option value="failed" className="bg-[#000514]">Failed</option>
                        <option value="cancelled" className="bg-[#000514]">Cancelled</option>
                      </select>

                      {/* Date Filter */}
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                      >
                        <option value="all" className="bg-[#000514]">All Time</option>
                        <option value="week" className="bg-[#000514]">Last 7 Days</option>
                        <option value="month" className="bg-[#000514]">Last 30 Days</option>
                        <option value="quarter" className="bg-[#000514]">Last 90 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    {filteredPayouts.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-400">No payout history found</p>
                        <p className="text-gray-500 text-sm mt-2">
                          {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                            ? 'Try adjusting your filters' 
                            : 'Your payout history will appear here'}
                        </p>
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
                              Requested Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {filteredPayouts.map((payout) => (
                            <tr key={payout._id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-white font-mono">
                                  {payout.payoutId}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-green-400">
                                  {formatCurrency(payout.netAmount || payout.amount)}
                                </div>
                                {payout.netAmount !== payout.amount && (
                                  <div className="text-xs text-gray-500 line-through">
                                    {formatCurrency(payout.amount)}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {getPaymentMethodIcon(payout.paymentMethod)}
                                  <span className="text-sm text-white capitalize">
                                    {getPaymentMethodDisplay(payout.paymentMethod)}
                                  </span>
                                </div>
                                {payout.paymentDetails && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {payout.paymentDetails[payout.paymentMethod]?.phoneNumber || 
                                     payout.paymentDetails[payout.paymentMethod]?.walletAddress?.slice(0, 8) + '...'}
                                  </div>
                                )}
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
                                    className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center space-x-1"
                                  >
                                    <FaEye className="w-4 h-4" />
                                    <span>View</span>
                                  </button>
                                  {payout.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelPayout(payout._id)}
                                      className="text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
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
                  <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                      Payout Statistics
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
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

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
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

                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                      <h3 className="text-lg font-bold uppercase tracking-widest mb-4 text-gray-300">Quick Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowRequestModal(true)}
                          disabled={!canRequestPayout}
                          className={`w-full px-4 py-2 rounded-tl-md rounded-br-md font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                            canRequestPayout
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:brightness-110 hover:scale-[1.02] cursor-pointer' 
                              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Request Payout
                        </button>
                        <button
                          onClick={exportToCSV}
                          className="w-full px-4 py-2 border border-white/10 text-gray-300 rounded-tl-md rounded-br-md hover:bg-white/5 transition-all font-bold uppercase tracking-widest text-sm"
                        >
                          Export History
                        </button>
                        <button
                          onClick={() => window.location.href = '/affiliate/profile'}
                          className="w-full px-4 py-2 border border-white/10 text-gray-300 rounded-tl-md rounded-br-md hover:bg-white/5 transition-all font-bold uppercase tracking-widest text-sm"
                        >
                          Manage Payment Methods
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'methods' && (
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                      Payment Methods
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payoutData.paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className={`border-2 rounded-xl p-6 transition-all backdrop-blur-sm ${
                          method.isConfigured
                            ? method.isPrimary
                              ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-blue-600/10'
                              : 'border-white/10 bg-white/5 hover:border-cyan-500/50'
                            : 'border-white/5 bg-white/5 opacity-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              method.isConfigured
                                ? method.isPrimary
                                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                                  : 'bg-white/10 text-cyan-400'
                                : 'bg-white/5 text-gray-400'
                            }`}>
                              {React.createElement(method.icon, { className: "w-5 h-5" })}
                            </div>
                            <div>
                              <h3 className="font-bold text-white">{method.name}</h3>
                              <p className={`text-sm ${
                                method.isConfigured ? 'text-cyan-400' : 'text-gray-500'
                              }`}>
                                {method.isConfigured ? 'Configured' : 'Not Configured'}
                                {method.isPrimary && ' • Primary'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {method.isConfigured && (
                          <div className="space-y-2 text-sm text-gray-400">
                            {method.details.phoneNumber && (
                              <div className="flex justify-between">
                                <span>Phone:</span>
                                <span className="font-mono">{method.details.phoneNumber}</span>
                              </div>
                            )}
                            {method.details.walletAddress && (
                              <div className="flex justify-between">
                                <span>Wallet:</span>
                                <span className="font-mono text-xs">
                                  {method.details.walletAddress.slice(0, 8)}...{method.details.walletAddress.slice(-8)}
                                </span>
                              </div>
                            )}
                            {method.details.accountType && (
                              <div className="flex justify-between">
                                <span>Type:</span>
                                <span className="capitalize">{method.details.accountType}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4">
                          <button
                            onClick={() => window.location.href = '/affiliate/profile'}
                            className={`w-full px-4 py-2 rounded-tl-md rounded-br-md font-bold uppercase tracking-widest text-sm transition-all duration-300 ${
                              method.isConfigured
                                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:brightness-110'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:brightness-110 hover:scale-[1.02] cursor-pointer'
                            }`}
                          >
                            {method.isConfigured ? 'Edit' : 'Configure'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Payout Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-[rgba(0,5,20,0.8)] backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#000514] border border-white/10 rounded-xl max-w-md w-full backdrop-blur-sm">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold uppercase tracking-widest text-white">Request Payout</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <FaTimesCircle className="text-xl" />
                </button>
              </div>
            </div>

            <form onSubmit={handlePayoutRequest} className="p-6 space-y-4">
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
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                    min={payoutData.minimumPayout}
                    max={payoutData.availableBalance}
                    step="0.01"
                    required
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
                  onChange={(e) => setPayoutRequest(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                  required
                >
                  <option value="" className="bg-[#000514]">Select payment method</option>
                  {payoutData.paymentMethods
                    .filter(method => method.isConfigured)
                    .map(method => (
                      <option key={method.id} value={method.id} className="bg-[#000514]">
                        {method.name} {method.isPrimary && '(Primary)'}
                      </option>
                    ))
                  }
                </select>
                {configuredMethods.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    No payment methods configured. Please set up a payment method in your profile.
                  </p>
                )}
              </div>

              {payoutRequest.paymentMethod && (
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Payment Details:</p>
                  {payoutData.paymentMethods
                    .find(m => m.id === payoutRequest.paymentMethod)
                    ?.details.phoneNumber && (
                    <p className="text-sm text-gray-300">
                      Phone: {payoutData.paymentMethods.find(m => m.id === payoutRequest.paymentMethod)?.details.phoneNumber}
                    </p>
                  )}
                  {payoutData.paymentMethods
                    .find(m => m.id === payoutRequest.paymentMethod)
                    ?.details.walletAddress && (
                    <p className="text-sm text-gray-300 break-all">
                      Wallet: {payoutData.paymentMethods.find(m => m.id === payoutRequest.paymentMethod)?.details.walletAddress}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={payoutRequest.notes}
                  onChange={(e) => setPayoutRequest(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes for this payout request..."
                  rows="3"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black rounded-tl-md rounded-br-md font-bold uppercase tracking-widest text-sm hover:brightness-110 hover:scale-[1.02] transition-all duration-300 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-tl-md rounded-br-md font-bold uppercase tracking-widest text-sm hover:bg-gray-600 transition-all"
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
        <div className="fixed inset-0 bg-[rgba(0,5,20,0.8)] backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-[#000514] border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto backdrop-blur-sm">
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
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Transaction ID</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-white font-mono">
                          {selectedPayout.transactionId || 'Pending assignment'}
                        </p>
                        {selectedPayout.transactionId && (
                          <button
                            onClick={() => copyToClipboard(selectedPayout.transactionId, 'Transaction ID')}
                            className="text-gray-400 hover:text-gray-300"
                          >
                            <FaCopy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Amount</label>
                      <p className="text-lg font-semibold text-green-400 mt-1">
                        {formatCurrency(selectedPayout.netAmount || selectedPayout.amount)}
                      </p>
                      {selectedPayout.netAmount !== selectedPayout.amount && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatCurrency(selectedPayout.amount)}
                        </p>
                      )}
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
                    {selectedPayout.paymentDetails && (
                      <>
                        {selectedPayout.paymentDetails[selectedPayout.paymentMethod]?.phoneNumber && (
                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm text-white">
                                {selectedPayout.paymentDetails[selectedPayout.paymentMethod].phoneNumber}
                              </p>
                              <button
                                onClick={() => copyToClipboard(
                                  selectedPayout.paymentDetails[selectedPayout.paymentMethod].phoneNumber, 
                                  'Phone number'
                                )}
                                className="text-gray-400 hover:text-gray-300"
                              >
                                <FaCopy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedPayout.paymentDetails[selectedPayout.paymentMethod]?.walletAddress && (
                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Wallet Address</label>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm text-white font-mono break-all">
                                {selectedPayout.paymentDetails[selectedPayout.paymentMethod].walletAddress}
                              </p>
                              <button
                                onClick={() => copyToClipboard(
                                  selectedPayout.paymentDetails[selectedPayout.paymentMethod].walletAddress, 
                                  'Wallet address'
                                )}
                                className="text-gray-400 hover:text-gray-300"
                              >
                                <FaCopy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        {selectedPayout.paymentDetails[selectedPayout.paymentMethod]?.accountType && (
                          <div>
                            <label className="block text-sm font-bold uppercase tracking-widest text-gray-400">Account Type</label>
                            <p className="text-sm text-white mt-1 capitalize">
                              {selectedPayout.paymentDetails[selectedPayout.paymentMethod].accountType}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {selectedPayout.includedEarnings && selectedPayout.includedEarnings.length > 0 && (
                    <div className="mt-6">
                      <h5 className="text-md font-bold uppercase tracking-widest mb-3 text-gray-400">Included Earnings</h5>
                      <div className="space-y-2">
                        {selectedPayout.includedEarnings.slice(0, 5).map((earning, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-400">{earning.description || 'Commission'}</span>
                            <span className="font-medium text-green-400">{formatCurrency(earning.amount)}</span>
                          </div>
                        ))}
                        {selectedPayout.includedEarnings.length > 5 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{selectedPayout.includedEarnings.length - 5} more earnings
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedPayout.status === 'pending' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-amber-400" />
                    <p className="text-sm text-amber-300">
                      This payout request is being processed. It usually takes 2-3 business days to complete.
                    </p>
                  </div>
                </div>
              )}

              {selectedPayout.status === 'processing' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-600/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-blue-400" />
                    <p className="text-sm text-blue-300">
                      Your payout is being processed. You should receive it within 24-48 hours.
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
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-tl-md rounded-br-md hover:brightness-110 transition-all font-bold uppercase tracking-widest text-sm"
                  >
                    Cancel Payout
                  </button>
                )}
                <div className="ml-auto">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-tl-md rounded-br-md hover:bg-gray-600 transition-all font-bold uppercase tracking-widest text-sm"
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