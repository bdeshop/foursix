import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPercentage, FaGift, FaSpinner, FaTimes, FaInfoCircle, FaUser, FaClock, FaEdit } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

const Viewbonus = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [bonusData, setBonusData] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch bonus data on component mount
  useEffect(() => {
    const fetchBonusData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${base_url}/api/admin/bonuses/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch bonus data');
        }

        if (data.success && data.bonus) {
          setBonusData(data.bonus);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load bonus data');
        console.error('Error fetching bonus:', error);
        // Redirect to bonuses list if not found
        setTimeout(() => navigate('/admin/bonuses'), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBonusData();
    }
  }, [id, base_url, navigate]);

  // Format bonus type for display
  const formatBonusType = (type) => {
    if (!type) return 'N/A';
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
      default: return type || 'N/A';
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate bonus amount based on percentage
  const calculateBonusFromPercentage = () => {
    if (!bonusData) return 0;
    
    if (bonusData.percentage > 0 && bonusData.minDeposit > 0) {
      const calculated = (bonusData.minDeposit * bonusData.percentage) / 100;
      if (bonusData.maxBonus && calculated > bonusData.maxBonus) {
        return bonusData.maxBonus;
      }
      return calculated;
    }
    return bonusData.amount;
  };

  // Check if bonus is expired
  const isBonusExpired = () => {
    if (!bonusData || !bonusData.endDate) return false;
    const endDate = new Date(bonusData.endDate);
    const now = new Date();
    return endDate < now;
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
                <FaSpinner className="animate-spin text-orange-500 text-2xl" />
                <span className="ml-3 text-gray-700">Loading bonus details...</span>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (!bonusData) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Bonus Not Found</h2>
                <p className="text-gray-600 mb-4">The bonus you're looking for doesn't exist or has been deleted.</p>
                <button
                  onClick={() => navigate('/admin/bonuses')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                >
                  Back to Bonuses List
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
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {bonusData.name}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(bonusData.status)}`}>
                      {bonusData.status.toUpperCase()}
                      {isBonusExpired() && ' (EXPIRED)'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FaUser className="text-xs" />
                      <span>Created by: {bonusData.createdBy?.username || 'Admin'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaClock className="text-xs" />
                      <span>
                        Created: {formatDate(bonusData.createdAt)} • 
                        Updated: {formatDate(bonusData.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      ID: {bonusData._id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Bonus Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Bonus Overview Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaGift className="text-orange-500" /> Bonus Overview
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Bonus Type */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Bonus Type</h3>
                        <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-xl">{getBonusTypeIcon(bonusData.bonusType)}</span>
                          {formatBonusType(bonusData.bonusType)}
                        </p>
                      </div>

                      {/* Bonus Code */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Bonus Code</h3>
                        <p className="text-lg font-bold text-gray-900 font-mono">
                          {bonusData.bonusCode || 'N/A'}
                        </p>
                      </div>

                      {/* Applicable To */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Applicable To</h3>
                        <p className="text-lg font-bold text-gray-900">
                          {getApplicableToLabel(bonusData.applicableTo)}
                        </p>
                      </div>

                      {/* Validity Period */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Validity Period</h3>
                        <p className="text-lg font-bold text-gray-900">
                          {bonusData.validityDays} days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Financial Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Amount & Percentage */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Fixed Amount</h3>
                          <div className="flex items-center">
                            <FaBangladeshiTakaSign className="text-gray-400 mr-2" />
                            <span className="text-lg font-bold text-gray-900">
                              {bonusData.amount > 0 ? `${bonusData.amount.toFixed(2)} BDT` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Percentage</h3>
                          <div className="flex items-center">
                            <FaPercentage className="text-gray-400 mr-2" />
                            <span className="text-lg font-bold text-gray-900">
                              {bonusData.percentage > 0 ? `${bonusData.percentage}%` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Minimum Deposit</h3>
                          <div className="flex items-center">
                            <FaBangladeshiTakaSign className="text-gray-400 mr-2" />
                            <span className="text-lg font-bold text-gray-900">
                              {bonusData.minDeposit > 0 ? `${bonusData.minDeposit.toFixed(2)} BDT` : 'No Minimum'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Max Bonus & Wagering */}
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Maximum Bonus</h3>
                          <div className="flex items-center">
                            <FaBangladeshiTakaSign className="text-gray-400 mr-2" />
                            <span className="text-lg font-bold text-gray-900">
                              {bonusData.maxBonus ? `${bonusData.maxBonus.toFixed(2)} BDT` : 'No Limit'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Wagering Requirement</h3>
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-blue-600">
                              {bonusData.wageringRequirement}x
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              ({bonusData.wageringRequirement} times the bonus amount)
                            </span>
                          </div>
                        </div>

                        {/* Example Calculation */}
                        {bonusData.minDeposit > 0 && bonusData.percentage > 0 && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <h3 className="text-sm font-medium text-green-700 mb-2">Example Calculation</h3>
                            <p className="text-sm text-green-800">
                              Deposit <span className="font-bold">{bonusData.minDeposit.toFixed(2)} BDT</span> 
                              → Get <span className="font-bold">
                                {calculateBonusFromPercentage().toFixed(2)} BDT
                              </span> bonus
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-orange-500" /> Date Information
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-gray-400 mr-2" />
                            <span className="text-lg font-bold text-gray-900">
                              {formatDate(bonusData.startDate)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Created At</h3>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-gray-400 mr-2" />
                            <span className="text-lg font-bold text-gray-900">
                              {formatDate(bonusData.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-gray-400 mr-2" />
                            <span className={`text-lg font-bold ${bonusData.endDate ? 'text-gray-900' : 'text-gray-500'}`}>
                              {bonusData.endDate ? formatDate(bonusData.endDate) : 'Not set'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                          <div className="flex items-center">
                            <FaCalendarAlt className="text-gray-400 mr-2" />
                            <span className="text-lg font-bold text-gray-900">
                              {formatDate(bonusData.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Validity Status */}
                    {bonusData.endDate && (
                      <div className={`mt-4 p-4 rounded-lg ${isBonusExpired() ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                        <div className="flex items-center gap-2">
                          <FaInfoCircle className={isBonusExpired() ? 'text-red-500' : 'text-green-500'} />
                          <span className={`font-medium ${isBonusExpired() ? 'text-red-700' : 'text-green-700'}`}>
                            {isBonusExpired() 
                              ? 'This bonus has expired.' 
                              : `This bonus expires on ${formatDate(bonusData.endDate)}.`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Actions */}
              <div className="space-y-6">
                {/* Bonus Value Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Bonus Value</h2>
                    
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Total Bonus Value</h3>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold text-green-600">
                            {bonusData.amount > 0 
                              ? `${bonusData.amount.toFixed(2)} BDT` 
                              : bonusData.percentage > 0 
                              ? `${bonusData.percentage}% up to ${bonusData.maxBonus ? bonusData.maxBonus.toFixed(2) + ' BDT' : 'No Limit'}`
                              : 'No Value Set'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Effective Value</h3>
                        <p className="text-lg font-bold text-gray-900">
                          {bonusData.percentage > 0 
                            ? `${bonusData.percentage}% of deposit`
                            : `${bonusData.amount.toFixed(2)} BDT fixed`
                          }
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Activation Condition</h3>
                        <p className="text-sm text-gray-700">
                          Minimum deposit of {bonusData.minDeposit > 0 ? `${bonusData.minDeposit.toFixed(2)} BDT` : 'any amount'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h2>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Wagering Requirement</span>
                        <span className="font-bold text-blue-600">{bonusData.wageringRequirement}x</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Validity Period</span>
                        <span className="font-bold text-gray-900">{bonusData.validityDays} days</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Minimum Deposit</span>
                        <span className="font-bold text-gray-900">{bonusData.minDeposit.toFixed(2)} BDT</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Applicable Users</span>
                        <span className="font-bold text-gray-900">{getApplicableToLabel(bonusData.applicableTo)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonus Preview */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Bonus Preview</h2>
                  
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Bonus Type</h3>
                      <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {getBonusTypeIcon(bonusData.bonusType)} {formatBonusType(bonusData.bonusType)}
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Bonus Code</h3>
                      <p className="text-lg font-bold text-gray-900 font-mono">
                        {bonusData.bonusCode || 'AUTO-GENERATED'}
                      </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">For Players</h3>
                      <p className="text-sm text-gray-700">
                        {bonusData.minDeposit > 0 && bonusData.percentage > 0 ? (
                          <>
                            Deposit {bonusData.minDeposit.toFixed(2)} BDT and get {bonusData.percentage}% bonus
                            {bonusData.maxBonus && ` up to ${bonusData.maxBonus.toFixed(2)} BDT`}
                          </>
                        ) : bonusData.amount > 0 ? (
                          `Get ${bonusData.amount.toFixed(2)} BDT bonus`
                        ) : (
                          'Bonus details not specified'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Viewbonus;