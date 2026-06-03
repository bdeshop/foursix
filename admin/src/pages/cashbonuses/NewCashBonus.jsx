import React, { useState, useEffect } from 'react';
import { FaPlus, FaCalendarAlt, FaPercentage, FaGift, FaSpinner, FaInfoCircle, FaUsers, FaMoneyBillWave, FaClock, FaTags, FaRegClock, FaBan, FaSearch } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import axios from 'axios';

const NewCashBonus = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    bonusType: 'special_event',
    occasion: '',
    notes: '',
    noExpiry: false,
    expiresAt: '',
    userIds: []
  });
  
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const bonusTypeOptions = [
    { value: 'special_event', label: '🎉 Special Event', description: 'Holiday, festival, or special occasion bonuses' },
    { value: 'welcome_bonus', label: '👋 Welcome Bonus', description: 'For new user registrations' },
    { value: 'loyalty_reward', label: '🏆 Loyalty Reward', description: 'Reward for loyal customers' },
    { value: 'compensation', label: '🤝 Compensation', description: 'Compensation for issues or problems' },
    { value: 'promotional', label: '📢 Promotional', description: 'Marketing and promotional campaigns' },
    { value: 'referral', label: '🔗 Referral', description: 'Referral program rewards' },
    { value: 'achievement', label: '⭐ Achievement', description: 'Milestone and achievement rewards' }
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${base_url}/api/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const users = response.data.data || response.data.users || [];
      setAllUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search term
  const getFilteredUsers = () => {
    if (!searchTerm.trim()) return allUsers;
    
    const search = searchTerm.toLowerCase();
    return allUsers.filter(user => 
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.player_id?.toLowerCase().includes(search) ||
      user.phone?.includes(search)
    );
  };

  const handleUserSelect = (user) => {
    const isSelected = selectedUsers.some(u => u._id === user._id);
    
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
      setFormData(prev => ({
        ...prev,
        userIds: prev.userIds.filter(id => id !== user._id)
      }));
    } else {
      setSelectedUsers([...selectedUsers, user]);
      setFormData(prev => ({
        ...prev,
        userIds: [...prev.userIds, user._id]
      }));
    }
  };

  const handleSelectAll = () => {
    const filteredUsers = getFilteredUsers();
    const allUserIds = filteredUsers.map(u => u._id);
    const allSelected = filteredUsers.every(user => selectedUsers.some(u => u._id === user._id));
    
    if (allSelected) {
      // Deselect all filtered users
      setSelectedUsers(selectedUsers.filter(u => !allUserIds.includes(u._id)));
      setFormData(prev => ({
        ...prev,
        userIds: prev.userIds.filter(id => !allUserIds.includes(id))
      }));
    } else {
      // Select all filtered users
      const newUsers = filteredUsers.filter(user => !selectedUsers.some(u => u._id === user._id));
      setSelectedUsers([...selectedUsers, ...newUsers]);
      setFormData(prev => ({
        ...prev,
        userIds: [...prev.userIds, ...newUsers.map(u => u._id)]
      }));
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.filter(id => id !== userId)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const processedValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Bonus title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot exceed 100 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valid bonus amount is required';
    } else if (formData.amount > 100000) {
      newErrors.amount = 'Amount cannot exceed 100,000 BDT';
    }
    
    if (!formData.userIds || formData.userIds.length === 0) {
      newErrors.userIds = 'At least one user must be selected';
    } else if (formData.userIds.length > 500) {
      newErrors.userIds = 'Cannot assign bonus to more than 500 users at once';
    }
    
    if (!formData.noExpiry) {
      if (!formData.expiresAt) {
        newErrors.expiresAt = 'Expiry date is required when no expiry is not checked';
      } else {
        const expiryDate = new Date(formData.expiresAt);
        if (expiryDate <= new Date()) {
          newErrors.expiresAt = 'Expiry date must be in the future';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`${base_url}/api/admin/cash-bonus/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
          expiresAt: formData.noExpiry ? null : formData.expiresAt,
          noExpiry: formData.noExpiry,
          bonusType: formData.bonusType,
          occasion: formData.occasion || '',
          notes: formData.notes || '',
          userIds: formData.userIds
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create cash bonus');
      }
      
      toast.success(data.message || 'Cash bonus created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        amount: '',
        bonusType: 'special_event',
        occasion: '',
        notes: '',
        noExpiry: false,
        expiresAt: '',
        userIds: []
      });
      setSelectedUsers([]);
      setSearchTerm('');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/bonuses/cash-bonus-list');
      }, 2000);
      
    } catch (error) {
      toast.error(error.message || 'Failed to create cash bonus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBonusTypeLabel = (value) => {
    const option = bonusTypeOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const inputClass = (field) =>
    `w-full bg-[#0F111A] border ${errors[field] ? 'border-rose-500' : 'border-gray-700'} text-gray-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 placeholder-gray-600 transition-colors`;

  const labelClass = 'block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2';

  const filteredUsers = getFilteredUsers();
  const areAllFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(user => selectedUsers.some(u => u._id === user._id));

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>

          {/* Page Header */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Create Cash Bonus</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaMoneyBillWave className="text-amber-500" /> Distribute cash bonuses directly to users' accounts
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column */}
              <div className="space-y-5">

                {/* Title & Description */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <div className="w-1 h-4 bg-amber-500"></div> Basic Information
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Bonus Title <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Summer Special Bonus, Welcome Reward, etc."
                        className={inputClass('title')}
                      />
                      {errors.title && <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><FaInfoCircle /> {errors.title}</p>}
                    </div>
                    
                    <div>
                      <label className={labelClass}>Description <span className="text-rose-400">*</span></label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe what this bonus is for..."
                        rows="3"
                        className={inputClass('description') + ' resize-none'}
                      />
                      {errors.description && <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><FaInfoCircle /> {errors.description}</p>}
                    </div>
                  </div>
                </div>

                {/* Bonus Amount */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <div className="w-1 h-4 bg-amber-500"></div> Bonus Amount
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Amount (BDT) <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <FaBangladeshiTakaSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm" />
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="1"
                        step="1"
                        className={inputClass('amount') + ' pl-8'}
                      />
                    </div>
                    {errors.amount && <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><FaInfoCircle /> {errors.amount}</p>}
                    <p className="mt-2 text-[10px] text-gray-600">This amount will be added directly to the user's main balance when claimed</p>
                  </div>
                </div>

                {/* Bonus Type & Occasion */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <div className="w-1 h-4 bg-amber-500"></div> Bonus Classification
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Bonus Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        {bonusTypeOptions.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, bonusType: type.value }))}
                            className={`p-3 rounded-lg border transition-all text-left ${
                              formData.bonusType === type.value
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-gray-700 bg-[#0F111A] hover:border-amber-500/40'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{type.label.split(' ')[0]}</span>
                              <span className={`text-xs font-medium ${formData.bonusType === type.value ? 'text-amber-400' : 'text-gray-400'}`}>
                                {type.label}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-600 mt-1">{type.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">

                {/* User Selection */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <div className="w-1 h-4 bg-amber-500"></div> <FaUsers className="text-amber-500" /> Assign Users
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Select Users <span className="text-rose-400">*</span></label>
                    
                    {/* Search Bar */}
                    <div className="relative mb-4">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                      <input
                        type="text"
                        placeholder="Search users by username, email, player ID, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    
                    {/* Select All Button */}
                    {filteredUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="mb-3 text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                      >
                        {areAllFilteredSelected ? 'Deselect All' : 'Select All'} ({filteredUsers.length} users)
                      </button>
                    )}
                    
                    {/* Users List */}
                    {loadingUsers ? (
                      <div className="flex justify-center py-8">
                        <FaSpinner className="animate-spin text-amber-500 text-2xl" />
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto border border-gray-800 rounded-lg bg-[#0F111A]">
                        {filteredUsers.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            {searchTerm ? 'No users found matching your search' : 'No users available'}
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <label
                              key={user._id}
                              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                selectedUsers.some(u => u._id === user._id)
                                  ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                                  : 'hover:bg-[#1F2937] border-l-2 border-l-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedUsers.some(u => u._id === user._id)}
                                onChange={() => handleUserSelect(user)}
                                className="w-4 h-4 rounded border-gray-600 bg-[#0F111A] text-amber-500 focus:ring-amber-500"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">{user.username}</p>
                                <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                                  {user.email && <span>{user.email}</span>}
                                  {user.player_id && <span>{user.player_id}</span>}
                                  {user.phone && <span> {user.phone}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Balance</p>
                                <p className="text-sm font-semibold text-amber-400">৳{user.balance?.toLocaleString() || 0}</p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                    
                    {errors.userIds && <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><FaInfoCircle /> {errors.userIds}</p>}
                    
                    {/* Selected Users Count */}
                    <div className="mt-3 p-3 bg-[#0F111A] rounded border border-gray-800">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Selected Users</p>
                      <p className="text-lg font-bold text-amber-400">{selectedUsers.length}</p>
                      {selectedUsers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedUsers.slice(0, 5).map(user => (
                            <span key={user._id} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 rounded text-xs text-amber-400">
                              {user.username}
                              <button
                                type="button"
                                onClick={() => handleRemoveUser(user._id)}
                                className="hover:text-amber-300 ml-1"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {selectedUsers.length > 5 && (
                            <span className="text-xs text-gray-500">+{selectedUsers.length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
           
                  </div>
                </div>

                {/* Expiry Settings */}
        {/* Expiry Settings */}
<div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
      <div className="w-1 h-4 bg-amber-500"></div> <FaClock className="text-amber-500" /> Expiry Settings
    </p>
  </div>
  <div className="space-y-4">
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        name="noExpiry"
        checked={formData.noExpiry}
        onChange={handleInputChange}
        className="w-4 h-4 rounded border-gray-700 bg-[#0F111A] text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
      />
      <span className="text-sm text-gray-300">No Expiry - This bonus never expires</span>
    </label>
    
    {!formData.noExpiry && (
      <div>
        <label className={labelClass}>Expiry Date <span className="text-rose-400">*</span></label>
        <div className="relative">
          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs z-10" />
          <input
            type="datetime-local"
            name="expiresAt"
            value={formData.expiresAt}
            onChange={handleInputChange}
            min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)}
            className={`${inputClass('expiresAt')} pl-8 [color-scheme:dark]`}
            style={{ 
              colorScheme: 'dark',
              WebkitAppearance: 'none',
              appearance: 'auto'
            }}
          />
        </div>
        {errors.expiresAt && <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><FaInfoCircle /> {errors.expiresAt}</p>}
        <p className="mt-1.5 text-[10px] text-gray-600">
          Users cannot claim the bonus after this date and time
        </p>
      </div>
    )}
  </div>
</div>

                {/* Summary Preview */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <div className="w-1 h-4 bg-amber-500"></div> <FaGift className="text-amber-500" /> Bonus Summary
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase font-black">Title</span>
                      <span className="text-xs text-gray-300 font-medium">{formData.title || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase font-black">Amount</span>
                      <span className="text-sm font-bold text-amber-400">
                        {formData.amount ? `৳${parseFloat(formData.amount).toFixed(2)}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase font-black">Type</span>
                      <span className="text-xs text-gray-300">{getBonusTypeLabel(formData.bonusType)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase font-black">Users</span>
                      <span className="text-xs text-amber-400 font-bold">{selectedUsers.length} selected</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] text-gray-500 uppercase font-black">Expiry</span>
                      <span className="text-xs text-gray-300">
                        {formData.noExpiry ? (
                          <span className="text-emerald-400 flex items-center gap-1"><FaRegClock /> Never</span>
                        ) : formData.expiresAt ? (
                          new Date(formData.expiresAt).toLocaleString()
                        ) : (
                          'Not set'
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {formData.amount && selectedUsers.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded">
                      <p className="text-[9px] text-amber-400 uppercase font-black">Total Value</p>
                      <p className="text-lg font-bold text-amber-400">
                        ৳{(parseFloat(formData.amount || 0) * selectedUsers.length).toLocaleString()}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-1">
                        {selectedUsers.length} users × ৳{parseFloat(formData.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? <><FaSpinner className="animate-spin" /> Creating...</> : <> Create Cash Bonus</>}
              </button>
            </div>
          </form>
        </main>
      </div>
    </section>
  );
};

export default NewCashBonus;