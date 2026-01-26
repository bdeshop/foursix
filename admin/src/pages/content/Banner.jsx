import React, { useState, useEffect } from 'react';
import { FaUpload, FaTimes, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { FaRegFileImage } from "react-icons/fa6";
import { toast, Toaster } from 'react-hot-toast';

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

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] backdrop-blur-md">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the banner "{bannerToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteBanner}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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
          <div className="w-full mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Banner Management</h1>
            
            {/* Filter Section */}
            <div className="bg-white rounded-[5px] p-4 border border-gray-200 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Filter Banners</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Category</label>
                  <select
                    name="deviceCategory"
                    value={filter.deviceCategory}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Categories</option>
                    <option value="mobile">Mobile</option>
                    <option value="computer">Computer</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={filter.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-[3px] hover:bg-gray-300 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            
            {/* Add/Edit Banner Form */}
            <div className="bg-white rounded-[5px] p-6 border border-gray-200 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {editingBanner ? 'Edit Banner' : 'Add New Banners'}
              </h2>
              <form onSubmit={editingBanner ? handleEditSubmit : handleSubmit}>
                {/* Banner Name Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner Name {!editingBanner && '(Optional)'}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-[3px] outline-theme_color"
                    placeholder="Enter banner name"
                    required={!!editingBanner}
                  />
                </div>
                
                {/* Device Category Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Device Category *</label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="deviceCategory"
                        value="mobile"
                        checked={formData.deviceCategory === 'mobile'}
                        onChange={handleInputChange}
                        className="form-radio h-4 w-4 text-orange-600"
                      />
                      <span className="ml-2 text-gray-700">Mobile</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="deviceCategory"
                        value="computer"
                        checked={formData.deviceCategory === 'computer'}
                        onChange={handleInputChange}
                        className="form-radio h-4 w-4 text-orange-600"
                      />
                      <span className="ml-2 text-gray-700">Computer</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="deviceCategory"
                        value="both"
                        checked={formData.deviceCategory === 'both'}
                        onChange={handleInputChange}
                        className="form-radio h-4 w-4 text-orange-600"
                      />
                      <span className="ml-2 text-gray-700">Both</span>
                    </label>
                  </div>
                </div>
                
                {/* Image Upload Section */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editingBanner ? 'New Banner Image (Optional)' : 'Banner Images (Max 5)'}
                  </label>
                  
                  {/* Preview of selected images */}
                  {imagePreviews.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Selected {editingBanner ? 'Image' : 'Banners'}:</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative border border-gray-300 rounded-md p-2">
                            <img 
                              src={preview} 
                              alt={`Banner preview ${index + 1}`} 
                              className="h-32 w-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 cursor-pointer text-white p-1 rounded-full"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                            <p className="text-xs text-center mt-1 truncate">
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
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Current Image:</h3>
                      <div className="relative border border-gray-300 rounded-md p-2 inline-block">
                        <img 
                          src={`${base_url}/${editingBanner.image}`} 
                          alt={editingBanner.name} 
                          className="h-32 w-48 object-cover rounded-md"
                        />
                        <div className="text-xs text-gray-600 mt-1">
                          Device: {editingBanner.deviceCategory === 'both' ? 'All Devices' : editingBanner.deviceCategory}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Upload area */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaRegFileImage className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB {!editingBanner && '(Max 5 images)'}
                        </p>
                        {imagePreviews.length > 0 && (
                          <p className="text-xs text-orange-500 mt-2">
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
                      className="px-6 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
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
                <h2 className="text-xl font-semibold text-gray-800">All Banners</h2>
                <div className="text-sm text-gray-600">
                  {banners.length} banner(s) found
                </div>
              </div>
              
              {loading && banners.length === 0 ? (
                <div className="text-center py-8">Loading banners...</div>
              ) : banners.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No banners found. {filter.deviceCategory || filter.status ? 'Try changing your filters.' : 'Start by adding some banners.'}</div>
              ) : (
                <div className="overflow-x-auto border-[1px] border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-theme_color">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Preview
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Device Category
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {banners.map((banner) => (
                        <tr key={banner._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-16 w-24 flex-shrink-0">
                              <img 
                                className="h-16 w-24 rounded-md object-cover border border-gray-200" 
                                src={`${base_url}/${banner.image}`} 
                                alt={banner.name} 
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{banner.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {banner.deviceCategory === 'both' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  All Devices
                                </span>
                              ) : banner.deviceCategory === 'mobile' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Mobile
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Computer
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={banner.status}
                                onChange={() => toggleStatus(banner._id, banner.status)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                              <span className="ml-3 text-sm font-medium">
                                {banner.status ? (
                                  <span className="text-green-600">Active</span>
                                ) : (
                                  <span className="text-red-600">Inactive</span>
                                )}
                              </span>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(banner.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              className="px-[8px] py-[7px] text-white bg-blue-600 cursor-pointer rounded-[3px] text-[16px] mr-3 hover:bg-blue-700 transition-colors"
                              onClick={() => startEdit(banner)}
                              title="Edit Banner"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="px-[8px] py-[7px] text-white bg-red-600 cursor-pointer rounded-[3px] text-[16px] hover:bg-red-700 transition-colors"
                              onClick={() => confirmDelete(banner)}
                              title="Delete Banner"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Banner;