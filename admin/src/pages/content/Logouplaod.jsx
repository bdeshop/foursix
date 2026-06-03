import React, { useState, useRef, useEffect } from 'react';
import { FaUpload, FaTrash, FaSpinner, FaEye, FaTimes } from 'react-icons/fa';
import { FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { FiRefreshCw } from "react-icons/fi";
import { FiTrendingUp } from "react-icons/fi";

const Logoupload = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentBranding, setCurrentBranding] = useState({
    logo: null,
    favicon: null,
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);
  const [deletePopup, setDeletePopup] = useState({
    isOpen: false,
    type: null, // 'logo' or 'favicon'
    title: '',
    message: ''
  });
  
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  // Axios instance with base configuration
  const api = axios.create({
    baseURL: `${base_url}/api/admin`,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // Add request interceptor to include auth token if needed
  api.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      setError(error.response?.data?.error || 'An error occurred');
      setUploading(false);
      return Promise.reject(error);
    }
  );
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch current branding on component mount
  useEffect(() => {
    fetchCurrentBranding();
  }, []);

  const fetchCurrentBranding = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branding');
      setCurrentBranding(response.data);
    } catch (error) {
      console.error('Error fetching branding:', error);
      setError('Failed to fetch current branding');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError('Please select an image file for logo');
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo file size must be less than 5MB');
      return;
    }
    
    setLogoFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setError('Please select an image file for favicon');
      return;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Favicon file size must be less than 5MB');
      return;
    }
    
    setFaviconFile(file);
    setError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFaviconPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const removeFavicon = () => {
    setFaviconFile(null);
    setFaviconPreview(null);
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!logoFile && !faviconFile) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      
      if (faviconFile) {
        formData.append('favicon', faviconFile);
      }

      const response = await api.post('/upload-branding', formData);
      
      setSuccess('Files uploaded successfully');
      
      // Reset form after successful upload
      removeLogo();
      removeFavicon();
      
      // Refresh current branding
      await fetchCurrentBranding();
      
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
    }
  };

  const openDeletePopup = (type) => {
    setDeletePopup({
      isOpen: true,
      type,
      title: `Delete ${type === 'logo' ? 'Logo' : 'Favicon'}`,
      message: `Are you sure you want to delete the ${type === 'logo' ? 'logo' : 'favicon'}? This action cannot be undone.`
    });
  };

  const closeDeletePopup = () => {
    setDeletePopup({
      isOpen: false,
      type: null,
      title: '',
      message: ''
    });
  };

  const confirmDelete = async () => {
    try {
      if (deletePopup.type === 'logo') {
        await api.delete('/branding/logo');
        setSuccess('Logo deleted successfully');
      } else {
        await api.delete('/branding/favicon');
        setSuccess('Favicon deleted successfully');
      }
      
      await fetchCurrentBranding();
      closeDeletePopup();
    } catch (error) {
      console.error(`Error deleting ${deletePopup.type}:`, error);
      setError(`Failed to delete ${deletePopup.type}`);
      closeDeletePopup();
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (loading && !currentBranding.logo && !currentBranding.favicon) {
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

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          {/* Error and Success Messages */}
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300 ml-4 text-lg leading-none">×</button>
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-300 ml-4 text-lg leading-none">×</button>
            </div>
          )}

          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Branding Settings</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-indigo-500" /> Manage your logo and favicon
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchCurrentBranding}
                className="bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'LOGO STATUS', value: currentBranding.logo ? 'Active' : 'Not Set', color: currentBranding.logo ? 'border-emerald-500' : 'border-amber-500', valueClass: currentBranding.logo ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'FAVICON STATUS', value: currentBranding.favicon ? 'Active' : 'Not Set', color: currentBranding.favicon ? 'border-emerald-500' : 'border-amber-500', valueClass: currentBranding.favicon ? 'text-emerald-400' : 'text-amber-400' },
              { label: 'BRANDING COMPLETE', value: currentBranding.logo && currentBranding.favicon ? 'Complete' : 'Incomplete', color: currentBranding.logo && currentBranding.favicon ? 'border-indigo-500' : 'border-rose-500', valueClass: currentBranding.logo && currentBranding.favicon ? 'text-indigo-400' : 'text-rose-400' },
              { label: 'LAST UPDATE', value: currentBranding.lastUpdated ? new Date(currentBranding.lastUpdated).toLocaleDateString() : 'Never', color: 'border-gray-500', valueClass: 'text-gray-400' },
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

          {/* Upload Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500"></div> Upload New Assets
            </h2>
            <p className="text-[10px] text-gray-500 mb-6">Upload new logo or favicon files (max 5MB each)</p>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Logo Upload Section */}
                <div className="border border-gray-700 rounded-lg p-5 bg-[#0F111A]">
                  <h3 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <div className="w-1 h-3 bg-indigo-500 rounded"></div>
                    Logo
                  </h3>
                  
                  <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-[#1F2937] transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaUpload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-[10px] text-gray-500">
                          <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-[9px] text-gray-600 mt-1">PNG, JPG, SVG (MAX. 5MB)</p>
                      </div>
                      <input 
                        ref={logoInputRef}
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Preview</label>
                    <div className="w-full h-32 border border-gray-700 rounded-lg flex items-center justify-center bg-[#0F111A] p-3">
                      {logoPreview ? (
                        <div className="relative group">
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="max-h-24 max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 transition-colors"
                          >
                            <FaTimes className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-600 flex flex-col items-center">
                          <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <span className="text-[10px]">No logo selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Favicon Upload Section */}
                <div className="border border-gray-700 rounded-lg p-5 bg-[#0F111A]">
                  <h3 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <div className="w-1 h-3 bg-indigo-500 rounded"></div>
                    Favicon
                  </h3>
                  
                  <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-[#1F2937] transition-all">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaUpload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-[10px] text-gray-500">
                          <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-[9px] text-gray-600 mt-1">PNG, ICO (MAX. 5MB)</p>
                      </div>
                      <input 
                        ref={faviconInputRef}
                        type="file" 
                        className="hidden" 
                        accept="image/*,.ico"
                        onChange={handleFaviconChange}
                      />
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Preview</label>
                    <div className="w-full h-32 border border-gray-700 rounded-lg flex items-center justify-center bg-[#0F111A] p-3">
                      {faviconPreview ? (
                        <div className="relative group">
                          <img 
                            src={faviconPreview} 
                            alt="Favicon preview" 
                            className="max-h-16 max-w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={removeFavicon}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 transition-colors"
                          >
                            <FaTimes className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-600 flex flex-col items-center">
                          <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <span className="text-[10px]">No favicon selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={(!logoFile && !faviconFile) || uploading}
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload className="mr-2" />
                      Upload Files
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Current Branding Display */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500"></div> Current Branding
            </h2>
            <p className="text-[10px] text-gray-500 mb-6">Your currently active logo and favicon</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-700 rounded-lg p-5 bg-[#0F111A]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Current Logo</h3>
                  {currentBranding.logo && (
                    <button
                      onClick={() => openDeletePopup('logo')}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[10px] font-bold transition-colors"
                    >
                      <FaTrash className="text-[10px]" /> Delete
                    </button>
                  )}
                </div>
                <div className="w-full h-40 border border-gray-700 rounded-lg flex items-center justify-center bg-[#0F111A] p-4">
                  {currentBranding.logo ? (
                    <img 
                      src={`${base_url}${currentBranding.logo}`} 
                      alt="Current logo" 
                      className="max-h-28 max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-gray-600 flex flex-col items-center">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span className="text-[10px]">No logo currently set</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border border-gray-700 rounded-lg p-5 bg-[#0F111A]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Current Favicon</h3>
                  {currentBranding.favicon && (
                    <button
                      onClick={() => openDeletePopup('favicon')}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[10px] font-bold transition-colors"
                    >
                      <FaTrash className="text-[10px]" /> Delete
                    </button>
                  )}
                </div>
                <div className="w-full h-40 border border-gray-700 rounded-lg flex items-center justify-center bg-[#0F111A] p-4">
                  {currentBranding.favicon ? (
                    <img 
                      src={`${base_url}${currentBranding.favicon}`} 
                      alt="Current favicon" 
                      className="max-h-16 max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-gray-600 flex flex-col items-center">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span className="text-[10px]">No favicon currently set</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {currentBranding.lastUpdated && (
              <div className="mt-5 text-[9px] text-gray-500 bg-[#0F111A] p-3 rounded-lg inline-block border border-gray-700">
                Last updated: {new Date(currentBranding.lastUpdated).toLocaleString()}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Custom Delete Confirmation Popup */}
      {deletePopup.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg max-w-md w-full p-6 transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">{deletePopup.title}</h3>
              <button
                onClick={closeDeletePopup}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-xs text-gray-400">{deletePopup.message}</p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeletePopup}
                className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-[#1F2937] transition-colors text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-md hover:bg-rose-500/30 transition-colors flex items-center gap-2 text-xs font-bold"
              >
                <FaTrash />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Logoupload;