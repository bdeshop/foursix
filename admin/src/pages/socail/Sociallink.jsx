import React, { useState, useEffect } from 'react';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaTimes, 
  FaFacebook, 
  FaInstagram, 
  FaTwitter, 
  FaYoutube, 
  FaPinterest, 
  FaTiktok, 
  FaTelegram, 
  FaWhatsapp, 
  FaLinkedin, 
  FaDiscord, 
  FaReddit, 
  FaMedium, 
  FaGithub, 
  FaSnapchat, 
  FaViber, 
  FaWeixin, 
  FaSkype,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaEye,
  FaCopy
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import { FaShareAlt } from "react-icons/fa";

const Sociallink = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    platform: '',
    url: '',
    displayName: '',
    backgroundColor: '#1877F2',
    order: 0,
    isActive: true,
    opensInNewTab: true
  });
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'order', direction: 'ascending' });
  
  // Platform options with default colors
  const platformOptions = [
    { value: 'facebook', label: 'Facebook', color: '#1877F2', icon: <FaFacebook /> },
    { value: 'instagram', label: 'Instagram', color: '#E4405F', icon: <FaInstagram /> },
    { value: 'twitter', label: 'Twitter', color: '#1DA1F2', icon: <FaTwitter /> },
    { value: 'youtube', label: 'YouTube', color: '#FF0000', icon: <FaYoutube /> },
    { value: 'pinterest', label: 'Pinterest', color: '#E60023', icon: <FaPinterest /> },
    { value: 'tiktok', label: 'TikTok', color: '#000000', icon: <FaTiktok /> },
    { value: 'telegram', label: 'Telegram', color: '#0088CC', icon: <FaTelegram /> },
    { value: 'whatsapp', label: 'WhatsApp', color: '#25D366', icon: <FaWhatsapp /> },
    { value: 'linkedin', label: 'LinkedIn', color: '#0077B5', icon: <FaLinkedin /> },
    { value: 'discord', label: 'Discord', color: '#5865F2', icon: <FaDiscord /> },
    { value: 'reddit', label: 'Reddit', color: '#FF4500', icon: <FaReddit /> },
    { value: 'medium', label: 'Medium', color: '#000000', icon: <FaMedium /> },
    { value: 'github', label: 'GitHub', color: '#181717', icon: <FaGithub /> },
    { value: 'snapchat', label: 'Snapchat', color: '#FFFC00', icon: <FaSnapchat /> },
    { value: 'viber', label: 'Viber', color: '#7360F2', icon: <FaViber /> },
    { value: 'wechat', label: 'WeChat', color: '#07C160', icon: <FaWeixin /> },
    { value: 'skype', label: 'Skype', color: '#00AFF0', icon: <FaSkype /> }
  ];

  // Fetch social links on component mount
  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const fetchSocialLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${base_url}/api/admin/social-links`);
      if (response.ok) {
        const data = await response.json();
        setSocialLinks(data.data || []);
      } else {
        console.error('Failed to fetch social links');
        toast.error('Failed to fetch social links');
      }
    } catch (error) {
      console.error('Error fetching social links:', error);
      toast.error('Error fetching social links');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-fill display name and background color when platform is selected
    if (name === 'platform' && value) {
      const selectedPlatform = platformOptions.find(opt => opt.value === value);
      if (selectedPlatform) {
        setFormData(prev => ({
          ...prev,
          platform: value,
          displayName: selectedPlatform.label,
          backgroundColor: selectedPlatform.color
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.url || !formData.displayName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${base_url}/api/admin/social-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Social link created:', result);
        
        // Reset form and refresh links
        resetForm();
        fetchSocialLinks();
        toast.success('Social link created successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create social link');
      }
    } catch (error) {
      console.error('Error creating social link:', error);
      toast.error('Error creating social link');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      platform: '',
      url: '',
      displayName: '',
      backgroundColor: '#1877F2',
      order: 0,
      isActive: true,
      opensInNewTab: true
    });
    setEditingLink(null);
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${base_url}/api/admin/social-links/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (response.ok) {
        fetchSocialLinks(); // Refresh the list
        toast.success('Social link status updated successfully');
      } else {
        toast.error('Failed to update social link status');
      }
    } catch (error) {
      console.error('Error updating social link status:', error);
      toast.error('Error updating social link status');
    }
  };

  const confirmDelete = (link) => {
    setLinkToDelete(link);
    setShowDeletePopup(true);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setLinkToDelete(null);
  };

  const deleteLink = async () => {
    if (!linkToDelete) return;
    
    try {
      const response = await fetch(`${base_url}/api/admin/social-links/${linkToDelete._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchSocialLinks(); // Refresh the list
        toast.success('Social link deleted successfully');
      } else {
        toast.error('Failed to delete social link');
      }
    } catch (error) {
      console.error('Error deleting social link:', error);
      toast.error('Error deleting social link');
    } finally {
      setShowDeletePopup(false);
      setLinkToDelete(null);
    }
  };

  const startEdit = (link) => {
    setEditingLink(link);
    setFormData({
      platform: link.platform,
      url: link.url,
      displayName: link.displayName,
      backgroundColor: link.backgroundColor,
      order: link.order,
      isActive: link.isActive,
      opensInNewTab: link.opensInNewTab
    });
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.url || !formData.displayName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${base_url}/api/admin/social-links/${editingLink._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Social link updated:', result);
        
        // Reset form and refresh links
        resetForm();
        fetchSocialLinks();
        toast.success('Social link updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update social link');
      }
    } catch (error) {
      console.error('Error updating social link:', error);
      toast.error('Error updating social link');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${base_url}/api/admin/social-links/initialize-defaults`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchSocialLinks();
        toast.success('Default social links initialized successfully!');
      } else {
        toast.error('Failed to initialize default social links');
      }
    } catch (error) {
      console.error('Error initializing default social links:', error);
      toast.error('Error initializing default social links');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform) => {
    const iconMap = {
      facebook: <FaFacebook />,
      instagram: <FaInstagram />,
      twitter: <FaTwitter />,
      youtube: <FaYoutube />,
      pinterest: <FaPinterest />,
      tiktok: <FaTiktok />,
      telegram: <FaTelegram />,
      whatsapp: <FaWhatsapp />,
      linkedin: <FaLinkedin />,
      discord: <FaDiscord />,
      reddit: <FaReddit />,
      medium: <FaMedium />,
      github: <FaGithub />,
      snapchat: <FaSnapchat />,
      viber: <FaViber />,
      wechat: <FaWeixin />,
      skype: <FaSkype />
    };
    return iconMap[platform] || <FaGlobe />;
  };

  // Filter and sort social links
  const filteredAndSortedLinks = () => {
    let filtered = socialLinks;
    
    // Apply search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(link =>
        link.displayName.toLowerCase().includes(query) ||
        link.platform.toLowerCase().includes(query) ||
        link.url.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(link => 
        statusFilter === 'active' ? link.isActive : !link.isActive
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
  };

  const getStatusInfo = (isActive) => {
    if (isActive) {
      return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400', label: 'Active' };
    }
    return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', dot: 'bg-rose-400', label: 'Inactive' };
  };

  const stats = {
    total: socialLinks.length,
    active: socialLinks.filter(l => l.isActive).length,
    inactive: socialLinks.filter(l => !l.isActive).length
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';

  const CloseIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Social Links Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaShareAlt className="text-amber-500" /> Manage and monitor all platform social links
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              {socialLinks.length === 0 && (
                <button
                  onClick={initializeDefaults}
                  className="bg-emerald-500/10 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
                >
                  <FaPlus /> INITIALIZE DEFAULTS
                </button>
              )}
              <button
                onClick={fetchSocialLinks}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'TOTAL LINKS', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'ACTIVE', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'INACTIVE', value: stats.inactive, color: 'border-rose-500', valueClass: 'text-rose-400' },
            ].map((card, i) => (
              <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                  <FiTrendingUp className="text-gray-700" />
                </div>
                <h2 className={`text-xl font-bold mt-1 leading-none ${card.valueClass}`}>{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Add/Edit Social Link Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-4 bg-amber-500"></div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {editingLink ? 'Edit Social Link' : 'Add New Social Link'}
              </h2>
            </div>
            <form onSubmit={editingLink ? handleEditSubmit : handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Platform Selection */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Platform <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className={selectClass}
                    required
                  >
                    <option value="">Select Platform</option>
                    {platformOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter display name"
                    required
                  />
                </div>

                {/* URL */}
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="https://example.com/your-profile"
                    required
                  />
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="backgroundColor"
                      value={formData.backgroundColor.includes('gradient') ? '#1877F2' : formData.backgroundColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-10 h-10 border border-gray-700 rounded cursor-pointer bg-[#0F111A]"
                    />
                    <input
                      type="text"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleInputChange}
                      className={`flex-1 ${inputClass}`}
                      placeholder="#1877F2 or gradient"
                    />
                  </div>
                  <p className="text-[8px] text-gray-600 mt-1">Use hex color or CSS gradient</p>
                </div>

                {/* Order */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    className={inputClass}
                    min="0"
                  />
                </div>

                {/* Checkboxes */}
                <div className="md:col-span-2">
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 accent-amber-500"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="opensInNewTab"
                        checked={formData.opensInNewTab}
                        onChange={handleInputChange}
                        className="w-3.5 h-3.5 accent-amber-500"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Open in new tab</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              {formData.platform && (
                <div className="mt-6 p-4 bg-[#0F111A] rounded-lg border border-gray-800">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">Preview:</h3>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                      style={{ 
                        background: formData.backgroundColor,
                        backgroundImage: formData.backgroundColor.includes('gradient') ? formData.backgroundColor : 'none'
                      }}
                    >
                      {getPlatformIcon(formData.platform)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{formData.displayName}</p>
                      <p className="text-[9px] text-gray-500 truncate max-w-xs">{formData.url}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Submit/Cancel Buttons */}
              <div className="flex justify-end mt-8 space-x-4">
                {editingLink && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded font-bold text-xs transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin" /> : editingLink ? <FaEdit /> : <FaPlus />}
                  {loading ? 'Processing...' : editingLink ? 'Update Link' : 'Add Social Link'}
                </button>
              </div>
            </form>
          </div>

          {/* Filters */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500"></div> Filters & Search
              </h2>
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="text-[9px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-8`}
                  placeholder="Search by name, platform or URL..."
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {filteredAndSortedLinks().length} of {socialLinks.length} social links
            </p>
          </div>

          {/* Social Links Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
              All Social Links
            </div>
            
            {loading && socialLinks.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading social links...</p>
                </div>
              </div>
            ) : socialLinks.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex flex-col items-center text-gray-600">
                  <FaShareAlt className="text-4xl mb-3 opacity-20" />
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No social links found</p>
                  <p className="text-[10px] mt-1 mb-4 text-gray-600">Click "Initialize Defaults" to add default social links</p>
                  <button
                    onClick={initializeDefaults}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition-all flex items-center gap-2"
                  >
                    <FaPlus /> Initialize Defaults
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('platform')}>
                        Platform {getSortIcon('platform')}
                      </th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('displayName')}>
                        Display Name {getSortIcon('displayName')}
                      </th>
                      <th className="px-5 py-3">URL</th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('order')}>
                        Order {getSortIcon('order')}
                      </th>
                      <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('isActive')}>
                        Status {getSortIcon('isActive')}
                      </th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredAndSortedLinks().map((link) => {
                      const statusInfo = getStatusInfo(link.isActive);
                      return (
                        <tr key={link._id} className="hover:bg-[#1F2937] transition-colors group">
                          {/* Platform */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                                style={{ 
                                  background: link.backgroundColor,
                                  backgroundImage: link.backgroundColor.includes('gradient') ? link.backgroundColor : 'none'
                                }}
                              >
                                {getPlatformIcon(link.platform)}
                              </div>
                              <span className="text-xs font-bold text-white capitalize">
                                {link.platform}
                              </span>
                            </div>
                          </td>
                          
                          {/* Display Name */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-300">{link.displayName}</div>
                          </td>
                          
                          {/* URL */}
                          <td className="px-5 py-4">
                            <div className="text-xs text-gray-400 truncate max-w-xs">
                              <a 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                {link.url}
                              </a>
                            </div>
                          </td>
                          
                          {/* Order */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs font-bold text-amber-400">{link.order}</div>
                          </td>
                          
                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={link.isActive}
                                  onChange={() => toggleStatus(link._id, link.isActive)}
                                />
                                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                              </label>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${statusInfo.badge}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <button 
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 text-amber-400 rounded text-xs transition-all"
                                onClick={() => startEdit(link)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                onClick={() => confirmDelete(link)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-5">
                Are you sure you want to delete the social link "{linkToDelete?.displayName}"? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteLink}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaTrash /> Delete Link
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Sociallink;