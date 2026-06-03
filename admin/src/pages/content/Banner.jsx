import React, { useState, useEffect } from 'react';
import { FaUpload, FaTimes, FaEdit, FaTrash, FaPlus, FaEye, FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp, FiDownload } from 'react-icons/fi';
import { FaRegFileImage } from "react-icons/fa6";
import { toast, Toaster } from 'react-hot-toast';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { FaCalendarAlt } from "react-icons/fa";

const Banner = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    deviceCategory: 'both',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [filter, setFilter] = useState({
    deviceCategory: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Fetch banners on component mount
  useEffect(() => {
    fetchBanners();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const fetchBanners = async (filters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filters.deviceCategory) queryParams.append('deviceCategory', filters.deviceCategory);
      if (filters.status !== '') queryParams.append('status', filters.status);
      if (searchTerm) queryParams.append('search', searchTerm);
      
      const url = `${base_url}/api/admin/banners${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setBanners(data.banners || data);
      } else {
        console.error('Failed to fetch banners');
        toast.error('Failed to fetch banners');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Error fetching banners');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilter = {
      ...filter,
      [name]: value
    };
    setFilter(newFilter);
    fetchBanners(newFilter);
  };

  const clearFilters = () => {
    setFilter({ deviceCategory: '', status: '' });
    setSearchTerm('');
    fetchBanners();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + formData.images.length > 5) {
      toast.error('Maximum 5 banners allowed at once');
      return;
    }
    
    const newPreviews = [];
    const newImages = [];
    
    files.forEach(file => {
      if (file) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File ${file.name} is too large. Maximum size is 10MB`);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          newImages.push(file);
          
          // When all files are processed
          if (newPreviews.length === files.length) {
            setFormData({
              ...formData,
              images: [...formData.images, ...newImages]
            });
            setImagePreviews([...imagePreviews, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData({...formData, images: newImages});
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.images.length === 0) {
      toast.error('Please upload at least one banner image');
      return;
    }
    
    try {
      setLoading(true);
      const uploadData = new FormData();
      uploadData.append('name', formData.name);
      uploadData.append('deviceCategory', formData.deviceCategory);
      
      formData.images.forEach((image) => {
        uploadData.append('images', image);
      });
      
      const response = await fetch(`${base_url}/api/admin/banners`, {
        method: 'POST',
        body: uploadData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Banners created:', result);
        
        // Reset form and refresh banners
        setFormData({ 
          name: '', 
          deviceCategory: 'both', 
          images: [] 
        });
        setImagePreviews([]);
        fetchBanners();
        toast.success('Banners uploaded successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to upload banners');
      }
    } catch (error) {
      console.error('Error uploading banners:', error);
      toast.error('Error uploading banners');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`${base_url}/api/admin/banners/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: !currentStatus })
      });
      
      if (response.ok) {
        fetchBanners(filter); // Refresh with current filters
        toast.success('Banner status updated successfully');
      } else {
        toast.error('Failed to update banner status');
      }
    } catch (error) {
      console.error('Error updating banner status:', error);
      toast.error('Error updating banner status');
    }
  };

  const confirmDelete = (banner) => {
    setBannerToDelete(banner);
    setShowDeletePopup(true);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setBannerToDelete(null);
  };

  const deleteBanner = async () => {
    if (!bannerToDelete) return;
    
    try {
      const response = await fetch(`${base_url}/api/admin/banners/${bannerToDelete._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchBanners(filter); // Refresh with current filters
        toast.success('Banner deleted successfully');
      } else {
        toast.error('Failed to delete banner');
      }
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Error deleting banner');
    } finally {
      setShowDeletePopup(false);
      setBannerToDelete(null);
    }
  };

  const startEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({ 
      name: banner.name, 
      deviceCategory: banner.deviceCategory || 'both',
      images: [] 
    });
    setImagePreviews([]);
  };

  const cancelEdit = () => {
    setEditingBanner(null);
    setFormData({ 
      name: '', 
      deviceCategory: 'both',
      images: [] 
    });
    setImagePreviews([]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const editData = new FormData();
      editData.append('name', formData.name);
      editData.append('deviceCategory', formData.deviceCategory);
      
      if (formData.images.length > 0) {
        // Validate file size (max 10MB)
        if (formData.images[0].size > 10 * 1024 * 1024) {
          toast.error('Image is too large. Maximum size is 10MB');
          setLoading(false);
          return;
        }
        editData.append('image', formData.images[0]);
      }
      
      const response = await fetch(`${base_url}/api/admin/banners/${editingBanner._id}`, {
        method: 'PUT',
        body: editData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Banner updated:', result);
        
        // Reset form and refresh banners
        setEditingBanner(null);
        setFormData({ 
          name: '', 
          deviceCategory: 'both',
          images: [] 
        });
        setImagePreviews([]);
        fetchBanners(filter);
        toast.success('Banner updated successfully!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update banner');
      }
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Error updating banner');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  const sortedBanners = React.useMemo(() => {
    let sortableItems = [...banners];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'createdAt') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [banners, sortConfig]);

  const paginatedBanners = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedBanners.slice(startIndex, endIndex);
  }, [sortedBanners, currentPage]);

  const totalPages = Math.ceil(banners.length / itemsPerPage);

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

  const getDeviceBadge = (category) => {
    if (category === 'both') {
      return { text: 'All Devices', color: 'border-indigo-500 text-indigo-400 bg-indigo-500/10' };
    } else if (category === 'mobile') {
      return { text: 'Mobile', color: 'border-green-500 text-green-400 bg-green-500/10' };
    } else {
      return { text: 'Computer', color: 'border-purple-500 text-purple-400 bg-purple-500/10' };
    }
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500';

  if (loading && banners.length === 0) {
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
            <h3 className="text-xl font-semibold text-gray-200 mb-4">Confirm Delete</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete the banner "{bannerToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteBanner}
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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Banner Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-indigo-500" /> Manage promotional banners across devices
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => fetchBanners(filter)}
                className="bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL BANNERS', value: banners.length, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'ACTIVE', value: banners.filter(b => b.status).length, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'INACTIVE', value: banners.filter(b => !b.status).length, color: 'border-amber-500', valueClass: 'text-amber-400' },
              { label: 'DEVICES SUPPORTED', value: `${banners.filter(b => b.deviceCategory === 'both').length} both`, color: 'border-rose-500', valueClass: 'text-rose-400' },
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchBanners(filter)}
                  className={`${inputClass} pl-8`}
                  placeholder="Search banner name..."
                />
              </div>
              <select
                name="deviceCategory"
                value={filter.deviceCategory}
                onChange={handleFilterChange}
                className={selectClass}
              >
                <option value="">All Categories</option>
                <option value="mobile">Mobile</option>
                <option value="computer">Computer</option>
                <option value="both">Both</option>
              </select>
              <select
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
                className={selectClass}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Add/Edit Banner Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500"></div> {editingBanner ? 'Edit Banner' : 'Add New Banners'}
            </h2>
            <form onSubmit={editingBanner ? handleEditSubmit : handleSubmit}>
              {/* Banner Name Field */}
              <div className="mb-6">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Banner Name {!editingBanner && '(Optional)'}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Enter banner name"
                  required={!!editingBanner}
                />
              </div>
              
              {/* Device Category Field */}
              <div className="mb-6">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Device Category *</label>
                <div className="flex space-x-6">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deviceCategory"
                      value="mobile"
                      checked={formData.deviceCategory === 'mobile'}
                      onChange={handleInputChange}
                      className="form-radio h-4 w-4 text-indigo-600 bg-[#0F111A] border-gray-700 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-xs text-gray-300">Mobile</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deviceCategory"
                      value="computer"
                      checked={formData.deviceCategory === 'computer'}
                      onChange={handleInputChange}
                      className="form-radio h-4 w-4 text-indigo-600 bg-[#0F111A] border-gray-700 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-xs text-gray-300">Computer</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="deviceCategory"
                      value="both"
                      checked={formData.deviceCategory === 'both'}
                      onChange={handleInputChange}
                      className="form-radio h-4 w-4 text-indigo-600 bg-[#0F111A] border-gray-700 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-xs text-gray-300">Both</span>
                  </label>
                </div>
              </div>
              
              {/* Image Upload Section */}
              <div className="mb-8">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  {editingBanner ? 'New Banner Image (Optional)' : 'Banner Images (Max 5)'}
                </label>
                
                {/* Preview of selected images */}
                {imagePreviews.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Selected {editingBanner ? 'Image' : 'Banners'}:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative border border-gray-700 rounded-md p-2 bg-[#0F111A]">
                          <img 
                            src={preview} 
                            alt={`Banner preview ${index + 1}`} 
                            className="h-32 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-rose-500 cursor-pointer text-white p-1 rounded-full text-xs"
                          >
                            <FaTimes />
                          </button>
                          <p className="text-[10px] text-center mt-1 truncate text-gray-400">
                            {formData.images[index]?.name || `Banner ${index + 1}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Current image when editing */}
                {editingBanner && !imagePreviews.length && (
                  <div className="mb-4">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Current Image:</h3>
                    <div className="relative border border-gray-700 rounded-md p-2 inline-block bg-[#0F111A]">
                      <img 
                        src={`${base_url}/${editingBanner.image}`} 
                        alt={editingBanner.name} 
                        className="h-32 w-48 object-cover rounded-md"
                      />
                      <div className="text-[10px] text-gray-500 mt-1">
                        Device: {editingBanner.deviceCategory === 'both' ? 'All Devices' : editingBanner.deviceCategory}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Upload area */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:bg-[#1F2937] transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaRegFileImage className="w-10 h-10 mb-3 text-gray-600" />
                      <p className="mb-2 text-xs text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[10px] text-gray-600">
                        PNG, JPG, GIF up to 10MB {!editingBanner && '(Max 5 images)'}
                      </p>
                      {imagePreviews.length > 0 && (
                        <p className="text-[10px] text-indigo-400 mt-2">
                          {imagePreviews.length} image(s) selected
                        </p>
                      )}
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      multiple={!editingBanner}
                    />
                  </label>
                </div>
              </div>
              
              {/* Submit/Cancel Buttons */}
              <div className="flex justify-end mt-8 space-x-4">
                {editingBanner && (
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
                  disabled={formData.images.length === 0 && !editingBanner}
                >
                  {loading ? 'Processing...' : editingBanner ? 'Update Banner' : `Upload ${formData.images.length > 0 ? `(${formData.images.length}) Banners` : 'Banners'}`}
                </button>
              </div>
            </form>
          </div>
          
          {/* Banners Table */}
          <div className="">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500"></div> All Banners
              </h2>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {banners.length} banner(s) found
              </div>
            </div>
            
            {loading && banners.length === 0 ? (
              <div className="text-center py-8 flex justify-center">
                <FaSpinner className="animate-spin text-indigo-400 text-2xl" />
              </div>
            ) : banners.length === 0 ? (
              <div className="text-center py-16 bg-[#161B22] border border-gray-800 rounded-lg">
                <div className="flex flex-col items-center text-gray-600">
                  <FaSearch className="text-4xl mb-3 opacity-20" />
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No banners found</p>
                  <p className="text-xs mt-1">Start by adding some banners</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                  <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-indigo-400 uppercase tracking-widest">
                    Banner List
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                        <tr>
                          <th className="px-5 py-3">Preview</th>
                          <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('name')}>
                            Name {getSortIcon('name')}
                          </th>
                          <th className="px-5 py-3">Device Category</th>
                          <th className="px-5 py-3">Status</th>
                          <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>
                            Created {getSortIcon('createdAt')}
                          </th>
                          <th className="px-5 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {paginatedBanners.map((banner) => {
                          const deviceBadge = getDeviceBadge(banner.deviceCategory);
                          return (
                            <tr key={banner._id} className="hover:bg-[#1F2937] transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="h-12 w-20 flex-shrink-0">
                                  <img 
                                    className="h-12 w-20 rounded-md object-cover border border-gray-700" 
                                    src={`${base_url}/${banner.image}`} 
                                    alt={banner.name} 
                                  />
                                </div>
                               </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-xs font-medium text-gray-200">{banner.name || 'Unnamed Banner'}</div>
                               </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase border ${deviceBadge.color}`}>
                                  {deviceBadge.text}
                                </span>
                               </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={banner.status}
                                    onChange={() => toggleStatus(banner._id, banner.status)}
                                  />
                                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                  <span className="ml-2 text-[10px] font-medium">
                                    {banner.status ? (
                                      <span className="text-emerald-400">Active</span>
                                    ) : (
                                      <span className="text-rose-400">Inactive</span>
                                    )}
                                  </span>
                                </label>
                               </td>
                              <td className="px-5 py-4 whitespace-nowrap text-[10px] text-gray-400">
                                {formatDate(banner.createdAt)}
                               </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex gap-2">
                                  <button 
                                    className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                                    onClick={() => startEdit(banner)}
                                    title="Edit Banner"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button 
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                    onClick={() => confirmDelete(banner)}
                                    title="Delete Banner"
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
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                      Page {currentPage} of {totalPages} &nbsp;·&nbsp; {banners.length} total
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
              </>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Banner;