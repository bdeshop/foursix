import React, { useState, useEffect } from 'react';
import { FaUpload, FaTimes, FaEdit, FaTrash, FaPlus, FaCalendarAlt, FaLink, FaSearch, FaSort, FaSortUp, FaSortDown, FaSpinner } from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import { FaRegFileImage } from "react-icons/fa6";
import { toast, Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const Promotional = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetUrl: '',
    startDate: '',
    endDate: '',
    status: true,
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Fetch promotions on component mount
  useEffect(() => {
    fetchPromotions();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${base_url}/api/admin/promotionals`);
      if (response.ok) {
        const data = await response.json();
        setPromotions(data);
      } else {
        console.error('Failed to fetch promotions');
        toast.error('Failed to fetch promotions');
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast.error('Error fetching promotions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 1) {
      toast.error('Only one image allowed for promotional content');
      return;
    }
    
    const newPreviews = [];
    const newImages = [];
    
    files.forEach(file => {
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          newImages.push(file);
          
          // When all files are processed
          if (newPreviews.length === files.length) {
            setFormData({
              ...formData,
              images: [...newImages]
            });
            setImagePreviews([...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = () => {
    setFormData({...formData, images: []});
    setImagePreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      toast.error('Please upload a promotional image');
      return;
    }
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('targetUrl', formData.targetUrl);
      uploadData.append('startDate', formData.startDate);
      uploadData.append('endDate', formData.endDate);
      uploadData.append('status', formData.status);
      uploadData.append('image', formData.images[0]);
      
      const response = await fetch(`${base_url}/api/admin/promotionals`, {
        method: 'POST',
        body: uploadData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Promotion created:', result);
        
        // Reset form and refresh promotions
        setFormData({
          title: '',
          description: '',
          targetUrl: '',
          startDate: '',
          endDate: '',
          status: true,
          images: []
        });
        setImagePreviews([]);
        fetchPromotions();
        toast.success('Promotion created successfully!');
      } else {
        toast.error('Failed to create promotion');
      }
    } catch (error) {
      console.error('Error creating promotion:', error);
      toast.error('Error creating promotion');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${base_url}/api/admin/promotionals/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: !currentStatus })
      });
      
      if (response.ok) {
        fetchPromotions(); // Refresh the list
        toast.success('Promotion status updated successfully');
      } else {
        toast.error('Failed to update promotion status');
      }
    } catch (error) {
      console.error('Error updating promotion status:', error);
      toast.error('Error updating promotion status');
    }
  };

  const confirmDelete = (promotion) => {
    setPromotionToDelete(promotion);
    setShowDeletePopup(true);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setPromotionToDelete(null);
  };

  const deletePromotion = async () => {
    if (!promotionToDelete) return;
    
    try {
      const response = await fetch(`${base_url}/api/admin/promotionals/${promotionToDelete._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchPromotions(); // Refresh the list
        toast.success('Promotion deleted successfully');
      } else {
        toast.error('Failed to delete promotion');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast.error('Error deleting promotion');
    } finally {
      setShowDeletePopup(false);
      setPromotionToDelete(null);
    }
  };

  const startEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      title: promotion.title,
      description: promotion.description,
      targetUrl: promotion.targetUrl,
      startDate: promotion.startDate ? new Date(promotion.startDate).toISOString().split('T')[0] : '',
      endDate: promotion.endDate ? new Date(promotion.endDate).toISOString().split('T')[0] : '',
      status: promotion.status,
      images: []
    });
    setImagePreviews([]);
  };

  const cancelEdit = () => {
    setEditingPromotion(null);
    setFormData({
      title: '',
      description: '',
      targetUrl: '',
      startDate: '',
      endDate: '',
      status: true,
      images: []
    });
    setImagePreviews([]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const editData = new FormData();
      editData.append('title', formData.title);
      editData.append('description', formData.description);
      editData.append('targetUrl', formData.targetUrl);
      editData.append('startDate', formData.startDate);
      editData.append('endDate', formData.endDate);
      editData.append('status', formData.status);
      
      if (formData.images.length > 0) {
        editData.append('image', formData.images[0]);
      }
      
      const response = await fetch(`${base_url}/api/admin/promotionals/${editingPromotion._id}`, {
        method: 'PUT',
        body: editData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Promotion updated:', result);
        
        // Reset form and refresh promotions
        setEditingPromotion(null);
        setFormData({
          title: '',
          description: '',
          targetUrl: '',
          startDate: '',
          endDate: '',
          status: true,
          images: []
        });
        setImagePreviews([]);
        fetchPromotions();
        toast.success('Promotion updated successfully!');
      } else {
        toast.error('Failed to update promotion');
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast.error('Error updating promotion');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Sorting logic
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-indigo-400 inline ml-1" />;
    return <FaSortDown className="text-indigo-400 inline ml-1" />;
  };

  // Filter and sort promotions
  const filteredPromotions = React.useMemo(() => {
    let filtered = [...promotions];
    
    if (searchTerm) {
      filtered = filtered.filter(promo => 
        promo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [promotions, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);
  const paginatedPromotions = filteredPromotions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPaginationPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortConfig({ key: null, direction: 'ascending' });
    setCurrentPage(1);
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500';

  if (loading && promotions.length === 0) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="animate-spin text-indigo-400 text-3xl" />
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4">Confirm Delete</h3>
            <p className="text-xs text-gray-400 mb-6">
              Are you sure you want to delete the promotion "{promotionToDelete?.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deletePromotion}
                className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded text-xs font-bold hover:bg-rose-500/30 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Promotional Content</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-indigo-500" /> Manage promotional banners and campaigns
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchPromotions}
                className="bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL PROMOTIONS', value: promotions.length, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'ACTIVE', value: promotions.filter(p => p.status).length, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'INACTIVE', value: promotions.filter(p => !p.status).length, color: 'border-amber-500', valueClass: 'text-amber-400' },
              { label: 'ONGOING', value: promotions.filter(p => p.status && (!p.endDate || new Date(p.endDate) > new Date())).length, color: 'border-rose-500', valueClass: 'text-rose-400' },
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

          {/* Add/Edit Promotion Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500"></div> {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
            </h2>
            <form onSubmit={editingPromotion ? handleEditSubmit : handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Title Field */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter promotion title"
                    required
                  />
                </div>
                
                {/* Target URL Field */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Target URL</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLink className="text-gray-500 text-xs" />
                    </div>
                    <input
                      type="text"
                      name="targetUrl"
                      value={formData.targetUrl}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-8`}
                      placeholder="/promotion-path or https://..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Description Field */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className={inputClass}
                  placeholder="Enter promotion description"
                  required
                ></textarea>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Start Date Field */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Start Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="text-gray-500 text-xs" />
                    </div>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
                
                {/* End Date Field */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">End Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="text-gray-500 text-xs" />
                    </div>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Status Field */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                    className="rounded border-gray-700 bg-[#0F111A] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                  <span className="ml-2 text-xs text-gray-300 font-medium">Active Promotion</span>
                </label>
              </div>
              
              {/* Image Upload Section */}
              <div className="mb-6">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  {editingPromotion ? 'New Promotional Image (Optional)' : 'Promotional Image *'}
                </label>
                
                {/* Preview of selected image */}
                {imagePreviews.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Selected Image:</h3>
                    <div className="relative w-full max-w-md">
                      <img 
                        src={imagePreviews[0]} 
                        alt="Promotional preview" 
                        className="h-40 w-full object-contain border border-gray-700 rounded-lg bg-[#0F111A]"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-rose-500 cursor-pointer text-white p-1.5 rounded-full text-xs"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Current image when editing */}
                {editingPromotion && !imagePreviews.length && (
                  <div className="mb-4">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Current Image:</h3>
                    <div className="relative w-full max-w-md">
                      <img 
                        src={`${base_url}/${editingPromotion.image}`} 
                        alt={editingPromotion.title} 
                        className="h-40 w-full object-contain border border-gray-700 rounded-lg bg-[#0F111A]"
                      />
                    </div>
                  </div>
                )}
                
                {/* Upload area */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-[#1F2937] transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaRegFileImage className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-1 text-[10px] text-gray-500">
                        <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[9px] text-gray-600">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>
              
              {/* Submit/Cancel Buttons */}
              <div className="flex justify-end mt-6 space-x-3">
                {editingPromotion && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 font-bold text-xs rounded-md hover:border-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={formData.images.length === 0 && !editingPromotion}
                >
                  {loading ? 'Processing...' : editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                </button>
              </div>
            </form>
          </div>

          {/* Filter Section */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500"></div> Filters & Search
              </h2>
              <button
                onClick={clearFilters}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
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
                  placeholder="Search by title or description..."
                />
              </div>
              <select
                value={sortConfig.key || ''}
                onChange={(e) => requestSort(e.target.value)}
                className={selectClass}
              >
                <option value="">Sort By</option>
                <option value="title">Title</option>
                <option value="startDate">Start Date</option>
                <option value="endDate">End Date</option>
              </select>
            </div>
          </div>

          {/* Promotions Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-indigo-400 uppercase tracking-widest flex justify-between items-center">
              <span>All Promotions</span>
              <span className="text-gray-500 text-[9px]">{filteredPromotions.length} item(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Preview</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('title')}>
                      Title {getSortIcon('title')}
                    </th>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('startDate')}>
                      Period {getSortIcon('startDate')}
                    </th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedPromotions.length > 0 ? (
                    paginatedPromotions.map((promotion) => (
                      <tr key={promotion._id} className="hover:bg-[#1F2937] transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="h-12 w-20 flex-shrink-0">
                            <img 
                              className="h-12 w-20 rounded-md object-cover border border-gray-700" 
                              src={`${base_url}/${promotion.image}`} 
                              alt={promotion.title} 
                            />
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-200">{promotion.title}</div>
                          {promotion.targetUrl && (
                            <div className="text-[9px] text-gray-500 truncate max-w-[150px]">{promotion.targetUrl}</div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-[10px] text-gray-400 max-w-xs line-clamp-2">{promotion.description}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-[10px] text-gray-400">
                            {formatDate(promotion.startDate)}
                          </div>
                          <div className="text-[9px] text-gray-500">
                            to {formatDate(promotion.endDate)}
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={promotion.status}
                              onChange={() => toggleStatus(promotion._id, promotion.status)}
                            />
                            <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ml-2 text-[10px] font-medium">
                              {promotion.status ? (
                                <span className="text-emerald-400">Active</span>
                              ) : (
                                <span className="text-rose-400">Inactive</span>
                              )}
                            </span>
                          </label>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button 
                              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                              onClick={() => startEdit(promotion)}
                              title="Edit Promotion"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                              onClick={() => confirmDelete(promotion)}
                              title="Delete Promotion"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaSearch className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No promotions found</p>
                          <p className="text-xs mt-1">Try adjusting your search or create a new promotion</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {filteredPromotions.length} total
              </p>
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === 1
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600 hover:border-indigo-500'
                  }`}
                >
                  ← Prev
                </button>

                {getPaginationPages().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-xs text-gray-600 font-bold select-none">
                      ···
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                        currentPage === page
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600/30 hover:border-indigo-500/50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === totalPages
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600 hover:border-indigo-500'
                  }`}
                >
                  Next →
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default Promotional;