import React, { useState, useEffect } from 'react';
import { 
  FaEdit, 
  FaTrash, 
  FaSave, 
  FaTimes, 
  FaBell,
  FaSpinner,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Notice = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    title: ''
  });
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  
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
        setFormData({ title: response.data?.title || '' });
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
    // Critical fix: Ensure we're setting the form data with current notice title
    if (notice && notice.title) {
      setFormData({ title: notice.title });
    }
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

  const confirmDelete = () => {
    setShowDeletePopup(true);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
  };

  const deleteNotice = async () => {
    if (!notice || !notice._id) return;
    
    try {
      setLoading(true);
      await axios.delete(`${base_url}/api/admin/notice`);
      
      setNotice(null);
      setFormData({ title: '' });
      setIsEditing(false);
      toast.success('Notice deleted successfully');
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('Failed to delete notice');
    } finally {
      setLoading(false);
      setShowDeletePopup(false);
    }
  };

  const handleRefresh = () => {
    fetchNotice();
    toast.success('Notice refreshed');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const textareaClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600 min-h-[100px]';

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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Notice Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaBell className="text-amber-500" /> Manage and update website notices
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'NOTICE STATUS', value: notice && notice._id ? 'ACTIVE' : 'INACTIVE', color: notice && notice._id ? 'border-emerald-500' : 'border-rose-500', valueClass: notice && notice._id ? 'text-emerald-400' : 'text-rose-400' },
              { label: 'LAST UPDATED', value: notice?.updatedAt ? formatDate(notice.updatedAt).split(',')[0] : 'NEVER', color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'CHARACTERS', value: notice?.title?.length || 0, color: 'border-amber-500', valueClass: 'text-amber-400' },
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

          {/* Notice Form Card */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-4 bg-amber-500"></div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                {notice && notice._id ? 'Current Notice' : 'Create Notice'}
              </h2>
            </div>
            
            {loading && !notice ? (
              <div className="flex justify-center items-center h-40">
                <div className="flex flex-col items-center gap-3">
                  <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading notice...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Notice Title Field */}
                <div className="mb-6">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Notice Title <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={textareaClass}
                    placeholder="Enter notice title or announcement..."
                    disabled={!isEditing && notice && notice._id}
                    rows={3}
                  />
                  <p className="mt-2 text-[8px] text-gray-600">
                    This notice will be displayed prominently on the website.
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-800">
                  {isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded font-bold text-xs transition-all flex items-center gap-2"
                      >
                        <FaTimes /> Cancel
                      </button>
                      
                      {notice && notice._id && (
                        <button
                          type="button"
                          onClick={confirmDelete}
                          className="px-5 py-2 bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/20 text-rose-400 rounded font-bold text-xs transition-all flex items-center gap-2"
                        >
                          <FaTrash /> Delete
                        </button>
                      )}
                    </>
                  )}
                  
                  {/* FIXED: Always show Edit button when NOT editing AND there is a notice */}
                  {!isEditing && notice && notice._id && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition-all flex items-center gap-2"
                    >
                      <FaEdit /> Edit Notice
                    </button>
                  )}
                  
                  {/* Show Save button when editing OR no notice exists */}
                  {(isEditing || (!notice || !notice._id)) && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                      {loading ? 'Saving...' : (notice && notice._id ? 'Update Notice' : 'Create Notice')}
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
          
          {/* Current Notice Preview */}
          {notice && notice._id && (
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1 h-4 bg-amber-500"></div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Notice Preview</h3>
              </div>
              
              <div className="bg-[#0F111A] p-6 rounded-lg border border-gray-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <FaBell className="text-amber-400 text-sm" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="text-sm font-bold text-white">Notice</h4>
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {notice.title}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[9px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-[8px]" />
                        Created: {formatDate(notice.createdAt)}
                      </span>
                      {notice.updatedAt !== notice.createdAt && (
                        <span className="flex items-center gap-1">
                          <FaClock className="text-[8px]" />
                          Updated: {formatDate(notice.updatedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {(!notice || !notice._id) && !loading && (
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0F111A] border border-gray-800 flex items-center justify-center">
                <FaBell className="text-gray-600 text-2xl" />
              </div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">No Notice Created</h3>
              <p className="text-[10px] text-gray-600 mb-4">
                There is no notice currently set. Create your first notice above.
              </p>
            </div>
          )}
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
                Are you sure you want to delete this notice? This action cannot be undone. The notice will be removed from the website.
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
                onClick={deleteNotice}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaTrash /> Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Notice;