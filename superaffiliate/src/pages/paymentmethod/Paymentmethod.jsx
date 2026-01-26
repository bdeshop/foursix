import React, { useState, useEffect } from 'react';
import { 
  FaCreditCard, 
  FaMobileAlt, 
  FaUniversity, 
  FaBitcoin, 
  FaCheckCircle,
  FaEdit,
  FaPlus,
  FaTrash,
  FaExclamationTriangle,
  FaTimes,
  FaShieldAlt
} from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Paymentmethod = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('edit'); // 'add' or 'edit'
  const [activeMethod, setActiveMethod] = useState('bkash');
  const [isSaving, setIsSaving] = useState(false);

  // Payment methods state
  const defaultMethods = {
    bkash: {
      phoneNumber: '',
      accountType: 'personal',
      isVerified: false,
      isPrimary: false
    },
    nagad: {
      phoneNumber: '',
      accountType: 'personal',
      isVerified: false,
      isPrimary: false
    },
    rocket: {
      phoneNumber: '',
      accountType: 'personal',
      isVerified: false,
      isPrimary: false
    },
    binance: {
      email: '',
      walletAddress: '',
      binanceId: '',
      isVerified: false,
      isPrimary: false
    },
    bank_transfer: {
      bankName: '',
      accountName: '',
      accountNumber: '',
      branchName: '',
      routingNumber: '',
      swiftCode: '',
      isVerified: false,
      isPrimary: false
    }
  };

  const [paymentMethods, setPaymentMethods] = useState({
    currentMethod: 'bkash',
    methods: defaultMethods
  });

  // Form data for add/edit
  const [formData, setFormData] = useState({
    type: 'bkash',
    phoneNumber: '',
    accountType: 'personal',
    email: '',
    walletAddress: '',
    binanceId: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    routingNumber: '',
    swiftCode: ''
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load payment methods
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.get(`${base_url}/api/affiliate/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const profile = response.data.affiliate;
        setPaymentMethods({
          currentMethod: profile.paymentMethod,
          methods: {
            ...defaultMethods,
            [profile.paymentMethod]: {
              ...defaultMethods[profile.paymentMethod],
              ...profile.formattedPaymentDetails,
              isPrimary: true
            }
          }
        });
        setActiveMethod(profile.paymentMethod);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePaymentMethod = async (methodData) => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('affiliatetoken');
      const response = await axios.put(`${base_url}/api/affiliate/profile/payment`, 
        methodData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Payment method updated successfully!');
        setShowForm(false);
        await loadPaymentMethods();
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenForm = (mode, method = 'bkash') => {
    if (mode === 'add') {
      setFormData({
        type: 'bkash',
        phoneNumber: '',
        accountType: 'personal',
        email: '',
        walletAddress: '',
        binanceId: '',
        bankName: '',
        accountName: '',
        accountNumber: '',
        branchName: '',
        routingNumber: '',
        swiftCode: ''
      });
    } else {
      setActiveMethod(method);
      setFormData({
        type: method,
        ...paymentMethods.methods[method]
      });
    }
    setFormMode(mode);
    setShowForm(true);
  };

  const handleSave = () => {
    const type = formMode === 'add' ? formData.type : activeMethod;
    const details = getPaymentDetailsForType(type);

    if (!validateForm(type, details)) {
      return;
    }

    const methodData = {
      paymentMethod: type,
      paymentDetails: details
    };

    updatePaymentMethod(methodData);
  };

  const validateForm = (type, details) => {
    let valid = true;
    switch (type) {
      case 'bkash':
      case 'nagad':
      case 'rocket':
        if (!details.phoneNumber || details.phoneNumber.length < 10) {
          toast.error('Please enter a valid phone number');
          valid = false;
        }
        break;
      case 'binance':
        if (!details.email || !/\S+@\S+\.\S+/.test(details.email)) {
          toast.error('Please enter a valid email');
          valid = false;
        }
        if (!details.walletAddress) {
          toast.error('Please enter wallet address');
          valid = false;
        }
        break;
      case 'bank_transfer':
        if (!details.bankName || !details.accountName || !details.accountNumber) {
          toast.error('Please fill required bank details');
          valid = false;
        }
        break;
      default:
        valid = false;
    }
    return valid;
  };

  const getPaymentDetailsForType = (type) => {
    switch (type) {
      case 'bkash':
      case 'nagad':
      case 'rocket':
        return {
          phoneNumber: formData.phoneNumber,
          accountType: formData.accountType
        };
      case 'binance':
        return {
          email: formData.email,
          walletAddress: formData.walletAddress,
          binanceId: formData.binanceId
        };
      case 'bank_transfer':
        return {
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
          branchName: formData.branchName,
          routingNumber: formData.routingNumber,
          swiftCode: formData.swiftCode
        };
      default:
        return {};
    }
  };

  const setAsPrimary = (methodType) => {
    const details = paymentMethods.methods[methodType];
    if (!hasMethodDetails(methodType, details)) {
      toast.info('Please set up the method first');
      handleOpenForm('edit', methodType);
      return;
    }

    setPaymentMethods(prev => {
      const updatedMethods = { ...prev.methods };
      Object.keys(updatedMethods).forEach(key => {
        updatedMethods[key].isPrimary = false;
      });
      updatedMethods[methodType].isPrimary = true;
      return {
        currentMethod: methodType,
        methods: updatedMethods
      };
    });
    
    setActiveMethod(methodType);
    updatePaymentMethod({
      paymentMethod: methodType,
      paymentDetails: details
    });
  };

  const hasMethodDetails = (type, details) => {
    switch (type) {
      case 'bkash':
      case 'nagad':
      case 'rocket':
        return !!details.phoneNumber;
      case 'binance':
        return !!details.email || !!details.walletAddress;
      case 'bank_transfer':
        return !!details.accountNumber;
      default:
        return false;
    }
  };

  const getMethodDisplayName = (method) => {
    const names = {
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      binance: 'Binance',
      bank_transfer: 'Bank Transfer'
    };
    return names[method] || method;
  };

  const getMethodIcon = (method) => {
    const icons = {
      bkash: FaMobileAlt,
      nagad: FaMobileAlt,
      rocket: FaMobileAlt,
      binance: FaBitcoin,
      bank_transfer: FaUniversity
    };
    return icons[method] || FaCreditCard;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Not set';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  };

  const maskAccountNumber = (account) => {
    if (!account) return 'Not set';
    return `****${account.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000514]">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`flex-1 p-6 ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 rounded-lg p-4">
                    <div className="h-6 bg-white/10 rounded w-1/2 mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    </div>
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
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'} p-4 md:p-6 lg:p-8 overflow-y-auto h-[90vh]`}>
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
                  <span className="text-gray-400">Payment</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Methods</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base mt-2">
                  Manage your affiliate earnings payment methods
                </p>
              </div>
              <button
                onClick={() => handleOpenForm('add')}
                className="mt-4 lg:mt-0 px-4 md:px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300 flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                <FaPlus />
                <span className="uppercase tracking-widest text-sm">Add Method</span>
              </button>
            </div>
            <div className="h-1.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 mt-4 rounded-full"></div>
          </div>

          {/* Payment Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6 md:mb-8">
            {Object.entries(paymentMethods.methods).map(([method, details]) => {
              const IconComponent = getMethodIcon(method);
              const isPrimary = details.isPrimary;
              const hasDetails = hasMethodDetails(method, details);
              const isActive = activeMethod === method;

              return (
                <div
                  key={method}
                  className={`rounded-xl p-4 border transition-all duration-300 cursor-pointer backdrop-blur-sm ${
                    isActive
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]' 
                      : 'bg-white/5 border-white/10 hover:border-cyan-500/30 hover:bg-white/10'
                  } ${isPrimary ? 'ring-1 ring-cyan-500' : ''}`}
                  onClick={() => setActiveMethod(method)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${
                        isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-gray-400'
                      }`}>
                        <IconComponent className="text-base" />
                      </div>
                      <div>
                        <h3 className="font-bold uppercase tracking-widest text-sm">
                          {getMethodDisplayName(method)}
                        </h3>
                        {isPrimary && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30">
                            <FaCheckCircle className="w-2 h-2 mr-1" />
                            Primary
                          </span>
                        )}
                      </div>
                    </div>
                    {!isPrimary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAsPrimary(method);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest"
                      >
                        Set Primary
                      </button>
                    )}
                  </div>

                  {hasDetails ? (
                    <div className="space-y-1 text-xs text-gray-400">
                      {['bkash', 'nagad', 'rocket'].includes(method) ? (
                        <>
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <span className="font-mono text-cyan-300">{formatPhoneNumber(details.phoneNumber)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="capitalize text-cyan-300">{details.accountType}</span>
                          </div>
                        </>
                      ) : method === 'binance' ? (
                        <>
                          {details.email && (
                            <div className="truncate">
                              <span className="block truncate text-cyan-300">{details.email}</span>
                            </div>
                          )}
                          {details.walletAddress && (
                            <div className="truncate">
                              <span className="font-mono text-xs truncate block text-cyan-300">
                                {details.walletAddress.slice(0, 16)}...
                              </span>
                            </div>
                          )}
                        </>
                      ) : method === 'bank_transfer' ? (
                        <>
                          <div className="flex justify-between">
                            <span>Account:</span>
                            <span className="font-mono text-cyan-300">{maskAccountNumber(details.accountNumber)}</span>
                          </div>
                          <div className="truncate">
                            <span className="block truncate text-cyan-300">{details.bankName}</span>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <div className="text-gray-500 mb-1">
                        <IconComponent className="text-xl mx-auto" />
                      </div>
                      <p className="text-gray-500 text-xs mb-2">Not configured</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenForm('edit', method);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest"
                      >
                        Set up
                      </button>
                    </div>
                  )}

                  {hasDetails && (
                    <div className="mt-3 pt-2 border-t border-white/10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenForm('edit', method);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1"
                      >
                        <FaEdit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Payment Method Form */}
          {showForm && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 mb-6 md:mb-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-widest">
                  {formMode === 'add' ? 'Add Payment Method' : `Edit ${getMethodDisplayName(formData.type)}`}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes className="text-base" />
                </button>
              </div>

              <div className="space-y-4">
                {formMode === 'add' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Payment Method Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                    >
                      <option value="bkash" className="bg-[#000514]">bKash</option>
                      <option value="nagad" className="bg-[#000514]">Nagad</option>
                      <option value="rocket" className="bg-[#000514]">Rocket</option>
                      <option value="binance" className="bg-[#000514]">Binance</option>
                      <option value="bank_transfer" className="bg-[#000514]">Bank Transfer</option>
                    </select>
                  </div>
                )}

                {['bkash', 'nagad', 'rocket'].includes(formData.type) && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="--- --- ---"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Account Type
                      </label>
                      <select
                        value={formData.accountType}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                      >
                        <option value="personal" className="bg-[#000514]">Personal</option>
                        <option value="merchant" className="bg-[#000514]">Merchant</option>
                      </select>
                    </div>
                  </>
                )}

                {formData.type === 'binance' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Binance Email
                      </label>
                      <input
                        type="email"
                        placeholder="your-email@binance.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        placeholder="Your Binance wallet address"
                        value={formData.walletAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                        Binance ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Your Binance ID"
                        value={formData.binanceId}
                        onChange={(e) => setFormData(prev => ({ ...prev, binanceId: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                      />
                    </div>
                  </>
                )}

                {formData.type === 'bank_transfer' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          placeholder="Bank name"
                          value={formData.bankName}
                          onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Account Name
                        </label>
                        <input
                          type="text"
                          placeholder="Account holder name"
                          value={formData.accountName}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Account Number
                        </label>
                        <input
                          type="text"
                          placeholder="Account number"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Branch Name
                        </label>
                        <input
                          type="text"
                          placeholder="Branch name"
                          value={formData.branchName}
                          onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Routing Number
                        </label>
                        <input
                          type="text"
                          placeholder="Routing number"
                          value={formData.routingNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, routingNumber: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                          SWIFT Code
                        </label>
                        <input
                          type="text"
                          placeholder="SWIFT code"
                          value={formData.swiftCode}
                          onChange={(e) => setFormData(prev => ({ ...prev, swiftCode: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300 flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] ${
                      isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-white/10 text-white font-bold rounded-tl-md rounded-br-md hover:bg-white/20 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-4 md:p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <FaShieldAlt className="text-cyan-400 text-xl mt-1" />
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 mb-1">Security Notice</h3>
                <p className="text-xs text-gray-400">
                  Your payment information is encrypted and securely stored. We never share your payment details with third parties.
                  {paymentMethods.methods.bkash.isVerified && (
                    <span className="block mt-1 text-green-400">✓ Your bKash account is verified</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Paymentmethod;