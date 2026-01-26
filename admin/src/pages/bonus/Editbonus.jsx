import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPercentage, FaDice, FaGift, FaSpinner, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

const Editbonus = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const [bonusTypes, setBonusTypes] = useState([
    'welcome', 'deposit', 'reload', 'cashback', 'free_spin', 'special', 'manual'
  ]);

  const [applicableToOptions, setApplicableToOptions] = useState([
    'all', 'new', 'existing'
  ]);

  const [formData, setFormData] = useState({
    name: '',
    bonusCode: '',
    bonusType: 'deposit',
    amount: 0,
    percentage: 0,
    minDeposit: 0,
    maxBonus: null,
    wageringRequirement: 0,
    validityDays: 30,
    status: 'active',
    applicableTo: 'all',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    createdBy: null
  });

  const [errors, setErrors] = useState({});
  const [originalData, setOriginalData] = useState(null);

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
          const bonus = data.bonus;
          
          // Format dates for input fields
          const startDate = bonus.startDate 
            ? new Date(bonus.startDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
            
          const endDate = bonus.endDate 
            ? new Date(bonus.endDate).toISOString().split('T')[0]
            : '';

          setFormData({
            name: bonus.name || '',
            bonusCode: bonus.bonusCode || '',
            bonusType: bonus.bonusType || 'deposit',
            amount: bonus.amount || 0,
            percentage: bonus.percentage || 0,
            minDeposit: bonus.minDeposit || 0,
            maxBonus: bonus.maxBonus !== undefined ? bonus.maxBonus : null,
            wageringRequirement: bonus.wageringRequirement || 0,
            validityDays: bonus.validityDays || 30,
            status: bonus.status || 'active',
            applicableTo: bonus.applicableTo || 'all',
            startDate: startDate,
            endDate: endDate,
            createdBy: bonus.createdBy || null
          });

          setOriginalData(bonus);
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to appropriate types
    let processedValue;
    if (type === 'number') {
      processedValue = value === '' ? '' : parseFloat(value);
      // Handle NaN cases
      if (isNaN(processedValue)) processedValue = '';
    } else {
      processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle radio button changes
  const handleRadioChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Bonus name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Bonus name must be at least 3 characters';
    }

    // Amount or percentage validation
    if (formData.amount <= 0 && formData.percentage <= 0) {
      newErrors.amount = 'Either amount or percentage must be greater than 0';
      newErrors.percentage = 'Either amount or percentage must be greater than 0';
    }

    // Amount validation
    if (formData.amount < 0) {
      newErrors.amount = 'Amount cannot be negative';
    }

    // Percentage validation
    if (formData.percentage < 0) {
      newErrors.percentage = 'Percentage cannot be negative';
    } else if (formData.percentage > 500) {
      newErrors.percentage = 'Percentage cannot exceed 500%';
    }

    // Min deposit validation
    if (formData.minDeposit < 0) {
      newErrors.minDeposit = 'Minimum deposit cannot be negative';
    }

    // Max bonus validation
    if (formData.maxBonus !== null && formData.maxBonus < 0) {
      newErrors.maxBonus = 'Maximum bonus cannot be negative';
    }

    // Wagering requirement validation
    if (formData.wageringRequirement < 0) {
      newErrors.wageringRequirement = 'Wagering requirement cannot be negative';
    } else if (formData.wageringRequirement > 100) {
      newErrors.wageringRequirement = 'Wagering requirement cannot exceed 100x';
    }

    // Validity days validation
    if (formData.validityDays <= 0) {
      newErrors.validityDays = 'Validity days must be greater than 0';
    } else if (formData.validityDays > 365) {
      newErrors.validityDays = 'Validity days cannot exceed 365 days';
    }

    // Date validation
    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission (Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          ...formData,
          amount: formData.amount || 0,
          percentage: formData.percentage || 0,
          maxBonus: formData.maxBonus === '' ? null : formData.maxBonus,
          endDate: formData.endDate === '' ? null : formData.endDate
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update bonus');
      }

      toast.success('Bonus updated successfully!');
      
      // Update original data
      setOriginalData(data.bonus);
      
      // Navigate back to bonuses list after 2 seconds
      setTimeout(() => navigate('/admin/bonuses'), 2000);

    } catch (error) {
      toast.error(error.message || 'Failed to update bonus');
      console.error('Error updating bonus:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel/edit mode
  const handleCancel = () => {
    if (originalData) {
      const startDate = originalData.startDate 
        ? new Date(originalData.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
        
      const endDate = originalData.endDate 
        ? new Date(originalData.endDate).toISOString().split('T')[0]
        : '';

      setFormData({
        name: originalData.name || '',
        bonusCode: originalData.bonusCode || '',
        bonusType: originalData.bonusType || 'deposit',
        amount: originalData.amount || 0,
        percentage: originalData.percentage || 0,
        minDeposit: originalData.minDeposit || 0,
        maxBonus: originalData.maxBonus !== undefined ? originalData.maxBonus : null,
        wageringRequirement: originalData.wageringRequirement || 0,
        validityDays: originalData.validityDays || 30,
        status: originalData.status || 'active',
        applicableTo: originalData.applicableTo || 'all',
        startDate: startDate,
        endDate: endDate,
        createdBy: originalData.createdBy || null
      });
    }
    setErrors({});
  };

  // Calculate bonus amount based on percentage
  const calculateBonusFromPercentage = () => {
    if (formData.percentage > 0 && formData.minDeposit > 0) {
      const calculated = (formData.minDeposit * formData.percentage) / 100;
      if (formData.maxBonus && calculated > formData.maxBonus) {
        return formData.maxBonus;
      }
      return calculated;
    }
    return formData.amount;
  };

  // Format bonus type for display
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
                <span className="ml-3 text-gray-700">Loading bonus data...</span>
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
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Edit Bonus: {originalData?.name || formData.name}
                  </h1>
                  <p className="text-sm md:text-base text-gray-500 mt-1">
                    Update bonus details and settings
                  </p>
                  {originalData?.createdBy && (
                    <p className="text-xs text-gray-400 mt-1">
                      Created by: {originalData.createdBy.username} • 
                      Last updated: {new Date(originalData.updatedAt || originalData.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/admin/bonuses')}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 text-sm"
                >
                  <FaTimes /> Back to List
                </button>
              </div>
            </div>

            {/* Main Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Bonus Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bonus Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Welcome Bonus 2024"
                        className={`w-full px-4 py-3 border rounded-lg outline-theme_color ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <FaInfoCircle /> {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Bonus Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bonus Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {bonusTypes.map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, bonusType: type }))}
                            className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                              formData.bonusType === type
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                            }`}
                          >
                            <span className="text-xl">{getBonusTypeIcon(type)}</span>
                            <span className="text-xs font-medium">{formatBonusType(type)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bonus Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bonus Code
                      </label>
                      <input
                        type="text"
                        name="bonusCode"
                        value={formData.bonusCode}
                        onChange={handleInputChange}
                        placeholder="WELCOME2024"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-theme_color uppercase"
                        maxLength={20}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Uppercase letters and numbers only
                      </p>
                    </div>

                    {/* Amount & Percentage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fixed Amount (BDT)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaBangladeshiTakaSign className="text-gray-400" />
                          </div>
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleInputChange}
                            min="0"
                            step="0.01"
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-theme_color ${
                              errors.amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {errors.amount && (
                          <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Percentage (%)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaPercentage className="text-gray-400" />
                          </div>
                          <input
                            type="number"
                            name="percentage"
                            value={formData.percentage}
                            onChange={handleInputChange}
                            min="0"
                            max="500"
                            step="0.1"
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-theme_color ${
                              errors.percentage ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {errors.percentage && (
                          <p className="mt-1 text-sm text-red-500">{errors.percentage}</p>
                        )}
                      </div>
                    </div>

                    {/* Minimum Deposit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Deposit (BDT)
                      </label>
                      <input
                        type="number"
                        name="minDeposit"
                        value={formData.minDeposit}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-3 border rounded-lg outline-theme_color ${
                          errors.minDeposit ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.minDeposit && (
                        <p className="mt-1 text-sm text-red-500">{errors.minDeposit}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Maximum Bonus */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Bonus (BDT)
                      </label>
                      <input
                        type="number"
                        name="maxBonus"
                        value={formData.maxBonus === null ? '' : formData.maxBonus}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="Leave blank for no limit"
                        className={`w-full px-4 py-3 border rounded-lg outline-theme_color ${
                          errors.maxBonus ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.maxBonus && (
                        <p className="mt-1 text-sm text-red-500">{errors.maxBonus}</p>
                      )}
                    </div>

                    {/* Wagering Requirement */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wagering Requirement (x)
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          name="wageringRequirement"
                          value={formData.wageringRequirement}
                          onChange={handleInputChange}
                          min="0"
                          max="100"
                          step="1"
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-lg font-bold text-orange-600 min-w-[60px]">
                          {formData.wageringRequirement}x
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>No Requirement</span>
                        <span>100x</span>
                      </div>
                      {errors.wageringRequirement && (
                        <p className="mt-1 text-sm text-red-500">{errors.wageringRequirement}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-600">
                        Players must wager bonus amount {formData.wageringRequirement} times before withdrawal
                      </p>
                    </div>

                    {/* Validity Days */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Validity Period (Days)
                      </label>
                      <input
                        type="number"
                        name="validityDays"
                        value={formData.validityDays}
                        onChange={handleInputChange}
                        min="1"
                        max="365"
                        className={`w-full px-4 py-3 border rounded-lg outline-theme_color ${
                          errors.validityDays ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.validityDays && (
                        <p className="mt-1 text-sm text-red-500">{errors.validityDays}</p>
                      )}
                      <p className="mt-2 text-sm text-gray-600">
                        Bonus will expire after {formData.validityDays} days from activation
                      </p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Date
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaCalendarAlt className="text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-theme_color"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaCalendarAlt className="text-gray-400" />
                          </div>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            min={formData.startDate}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg outline-theme_color ${
                              errors.endDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {errors.endDate && (
                          <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="status"
                            checked={formData.status === 'active'}
                            onChange={() => handleRadioChange('status', 'active')}
                            className="h-4 w-4 text-orange-600 outline-theme_color"
                          />
                          <span className="ml-2 text-sm text-gray-700">Active</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="status"
                            checked={formData.status === 'inactive'}
                            onChange={() => handleRadioChange('status', 'inactive')}
                            className="h-4 w-4 text-orange-600 outline-theme_color"
                          />
                          <span className="ml-2 text-sm text-gray-700">Inactive</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonus Preview Card */}
                <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaGift className="text-orange-500" /> Bonus Preview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Bonus Type</h4>
                      <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {getBonusTypeIcon(formData.bonusType)} {formatBonusType(formData.bonusType)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Bonus Value</h4>
                      <p className="text-lg font-bold text-green-600">
                        {formData.amount > 0 
                          ? `${formData.amount.toFixed(2)} BDT` 
                          : formData.percentage > 0 
                          ? `${formData.percentage}% up to ${formData.maxBonus ? formData.maxBonus.toFixed(2) + ' BDT' : 'No Limit'}`
                          : 'No Value Set'
                        }
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Wagering</h4>
                      <p className="text-lg font-bold text-blue-600">{formData.wageringRequirement}x</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Example Calculation</h4>
                      <p className="text-sm text-gray-700">
                        {formData.minDeposit > 0 && formData.percentage > 0 ? (
                          <>
                            Deposit <span className="font-bold">{formData.minDeposit.toFixed(2)} BDT</span> 
                            → Get <span className="font-bold text-green-600">
                              {calculateBonusFromPercentage().toFixed(2)} BDT
                            </span> bonus
                          </>
                        ) : (
                          'Set minimum deposit and percentage to see example calculation'
                        )}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Applicable To</h4>
                      <p className="text-sm font-medium text-gray-900">{getApplicableToLabel(formData.applicableTo)}</p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 flex flex-col md:flex-row justify-end gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        Update Bonus
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Editbonus;