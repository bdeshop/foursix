import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Notice = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    title: ''
  });
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Fetch notice on component mount
  useEffect(() => {
    fetchNotice();
  }, []);

  const fetchNotice = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/notice`);
      
      // The endpoint returns a single notice object
      if (response.data && response.data._id) {
        setNotice(response.data);
        setFormData({ title: response.data.title });
      } else {
        // No notice found or default notice
        setNotice(response.data);
        setFormData({ title: response.data.title || '' });
      }
    } catch (error) {
      console.error('Error fetching notice:', error);
      toast.error('Failed to fetch notice');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || formData.title.trim() === '') {
      toast.error('Notice title is required');
      return;
    }

    try {
      setLoading(true);
      
      if (notice && notice._id) {
        // Update existing notice - use singular endpoint without ID
        const response = await axios.put(`${base_url}/api/admin/notice`, {
          title: formData.title.trim()
        });
        
        setNotice(response.data.notice);
        toast.success('Notice updated successfully');
      } else {
        // Create new notice - use singular endpoint
        const response = await axios.post(`${base_url}/api/admin/notice`, {
          title: formData.title.trim()
        });
        
        setNotice(response.data.notice);
        toast.success('Notice created successfully');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notice:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save notice';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (notice) {
      setFormData({ title: notice.title });
    } else {
      setFormData({ title: '' });
    }
    setIsEditing(false);
  };

  const deleteNotice = async () => {
    if (!notice || !notice._id) return;
    
    try {
      // Use singular endpoint without ID
      await axios.delete(`${base_url}/api/admin/notice`);
      
      setNotice(null);
      setFormData({ title: '' });
      toast.success('Notice deleted successfully');
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('Failed to delete notice');
    }
  };

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          <div className="w-full">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Notice Management</h1>
            
            {/* Notice Form Card */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {notice && notice._id ? 'Current Notice' : 'Create Notice'}
                </h2>
                
                {notice && notice._id && !isEditing && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-theme_color text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                 Edit Notice
                  </button>
                )}
              </div>
              
              {loading && !notice ? (
                <div className="flex justify-center items-center h-40">
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 bg-orange-500 rounded-full animate-bounce"></div>
                    <div className="h-3 w-3 bg-orange-500 rounded-full animate-bounce animation-delay-200"></div>
                    <div className="h-3 w-3 bg-orange-500 rounded-full animate-bounce animation-delay-400"></div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Notice Title Field */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notice Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter notice title"
                      required
                      disabled={!isEditing && notice && notice._id}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      This notice will be displayed on the website.
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end mt-8 space-x-4">
                    {isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                          Cancel
                        </button>
                        
                        {notice && notice._id && (
                          <button
                            type="button"
                            onClick={deleteNotice}
                            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                          >
                            Delete Notice
                          </button>
                        )}
                      </>
                    )}
                    
                    {(isEditing || !notice || !notice._id) && (
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            {notice && notice._id ? 'Update Notice' : 'Create Notice'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
            
            {/* Current Notice Preview */}
            {notice && notice._id && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notice Preview</h3>
                
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 rounded-full border-[1px] border-orange-500 bg-orange-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{notice.title}</h4>
                      <div className="mt-2 text-xs text-gray-500">
                        Created: {new Date(notice.createdAt).toLocaleDateString()}
                        {notice.updatedAt !== notice.createdAt && 
                          ` • Updated: ${new Date(notice.updatedAt).toLocaleDateString()}`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {(!notice || !notice._id) && !loading && (
              <div className="bg-white rounded-lg p-8 border border-dashed border-gray-300 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Notice Created</h3>
                <p className="text-gray-500 mb-4">
                  There is no notice currently set. Create your first notice above.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Notice;