import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaEye, FaHistory, FaSpinner, FaCalendarAlt } from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';

const Terms = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [termsContent, setTermsContent] = useState({
    title: 'Terms and Conditions',
    lastUpdated: 'January 1, 2023',
    content: `Please replace this with your actual terms and conditions content. You can edit this section by clicking the edit button.`
  });
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(termsContent);
  const [versionHistory, setVersionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showVersionPopup, setShowVersionPopup] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showRestorePopup, setShowRestorePopup] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Fetch terms and version history
  useEffect(() => {
    fetchTerms();
    fetchVersionHistory();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/terms`);
      setTermsContent(response.data);
      setEditContent(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to fetch terms:', error);
      setError('Failed to load terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionHistory = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/terms/history`);
      setVersionHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch version history:', error);
    }
  };

  const handleEdit = () => {
    setEditContent(termsContent);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(`${base_url}/api/admin/terms`, editContent);
      setTermsContent(editContent);
      setIsEditing(false);
      fetchVersionHistory(); // Refresh history after update
      setError('');
    } catch (error) {
      console.error('Failed to save terms:', error);
      setError('Failed to save terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(termsContent);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditContent({
      ...editContent,
      [name]: value
    });
  };

  const handleViewVersion = async (versionId) => {
    try {
      const response = await axios.get(`${base_url}/api/admin/terms/version/${versionId}`);
      setSelectedVersion(response.data);
      setShowVersionPopup(true);
    } catch (error) {
      console.error('Failed to fetch version:', error);
      setError('Failed to load version details');
    }
  };

  const handleRestoreClick = (version) => {
    setVersionToRestore(version);
    setShowRestorePopup(true);
  };

  const handleRestoreConfirm = async () => {
    if (!versionToRestore) return;

    try {
      setRestoreLoading(true);
      await axios.post(`${base_url}/api/admin/terms/restore/${versionToRestore._id}`);
      fetchTerms(); // Refresh current terms
      fetchVersionHistory(); // Refresh history
      setError('');
      setShowRestorePopup(false);
      setVersionToRestore(null);
    } catch (error) {
      console.error('Failed to restore version:', error);
      setError('Failed to restore version');
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleRestoreCancel = () => {
    setShowRestorePopup(false);
    setVersionToRestore(null);
  };

  const closeVersionPopup = () => {
    setShowVersionPopup(false);
    setSelectedVersion(null);
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded px-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-gray-600';
  const textareaClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded px-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-gray-600 resize-vertical';

  if (loading && !termsContent.title) {
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
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300 ml-4 text-lg leading-none">×</button>
            </div>
          )}

          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Terms & Conditions</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-indigo-500" /> Manage legal terms and version history
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchTerms}
                className="bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'CURRENT VERSION', value: versionHistory.length > 0 ? `v${versionHistory[0]?.version || 1}` : 'v1', color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'TOTAL VERSIONS', value: versionHistory.length, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'LAST UPDATED', value: termsContent.lastUpdated || 'N/A', color: 'border-amber-500', valueClass: 'text-amber-400' },
              { label: 'WORD COUNT', value: termsContent.content.split(/\s+/).filter(w => w.length > 0).length, color: 'border-rose-500', valueClass: 'text-rose-400' },
            ].map((card, i) => (
              <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                  <FiTrendingUp className="text-gray-700" />
                </div>
                <h2 className={`text-sm font-bold mt-1 leading-none ${card.valueClass}`}>{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Terms Content Card */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden mb-8">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  {isEditing ? 'Edit Terms & Conditions' : 'Terms & Conditions'}
                </span>
              </div>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-md flex items-center gap-2 transition-all"
                  disabled={loading}
                >
                  <FaEdit className="text-xs" /> Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md flex items-center gap-2 transition-all"
                    disabled={loading}
                  >
                    <FaSave className="text-xs" /> {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs rounded-md flex items-center gap-2 transition-all"
                    disabled={loading}
                  >
                    <FaTimes className="text-xs" /> Cancel
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editContent.title}
                      onChange={handleInputChange}
                      className={inputClass}
                      disabled={loading}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Last Updated</label>
                    <input
                      type="text"
                      name="lastUpdated"
                      value={editContent.lastUpdated}
                      onChange={handleInputChange}
                      className={inputClass}
                      disabled={loading}
                      placeholder="e.g., January 1, 2023"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Content</label>
                    <textarea
                      name="content"
                      value={editContent.content}
                      onChange={handleInputChange}
                      rows="20"
                      className={textareaClass}
                      disabled={loading}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 pb-4 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white">{termsContent.title}</h2>
                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-600 text-[10px]" />
                      Last updated: {termsContent.lastUpdated}
                    </p>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    {termsContent.content.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 text-sm text-gray-300 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Version History */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Version History</span>
                <span className="text-[9px] text-gray-500 ml-2">{versionHistory.length} version(s)</span>
              </div>
            </div>
            
            {versionHistory.length === 0 ? (
              <div className="p-12 text-center">
                <FaHistory className="text-4xl text-gray-700 mx-auto mb-3" />
                <p className="text-xs text-gray-500">No version history available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Version</th>
                      <th className="px-6 py-3">Updated On</th>
                      <th className="px-6 py-3">Updated By</th>
                      <th className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {versionHistory.map((version) => (
                      <tr key={version._id} className="hover:bg-[#1F2937] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            v{version.version}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                          {new Date(version.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-300">
                          {version.updatedBy?.name || 'Admin User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewVersion(version._id)}
                              className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded transition-all"
                              title="View Version"
                              disabled={loading}
                            >
                              <FaEye className="text-xs" />
                            </button>
                            <button 
                              onClick={() => handleRestoreClick(version)}
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 text-amber-400 rounded transition-all"
                              title="Restore Version"
                              disabled={loading}
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Version Details Popup */}
      {showVersionPopup && selectedVersion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-[#1C2128]">
              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">
                Version {selectedVersion.version}
              </h3>
              <button
                onClick={closeVersionPopup}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4 pb-4 border-b border-gray-800">
                <h4 className="text-lg font-bold text-white">{selectedVersion.title}</h4>
                <p className="text-[10px] text-gray-500 mt-1">
                  Last updated: {selectedVersion.lastUpdated}
                </p>
              </div>
              
              <div className="bg-[#0F111A] p-5 rounded-lg border border-gray-800">
                <div className="prose prose-invert max-w-none">
                  {selectedVersion.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 text-sm text-gray-300 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end px-6 py-4 border-t border-gray-800 bg-[#1C2128]">
              <button
                onClick={closeVersionPopup}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Popup */}
      {showRestorePopup && versionToRestore && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-800 bg-[#1C2128]">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Restore Version</h3>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-300 mb-4">
                Are you sure you want to restore this version?
              </p>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <p className="text-xs font-bold text-amber-400 mb-1">
                  Version {versionToRestore.version}
                </p>
                <p className="text-[10px] text-gray-400">
                  This will replace your current terms and conditions with this version.
                </p>
              </div>
              
              <div className="bg-[#0F111A] p-3 rounded-lg border border-gray-700">
                <p className="text-[10px] text-gray-500 font-medium mb-1">Preview:</p>
                <p className="text-[11px] text-gray-400 line-clamp-2">
                  {versionToRestore.content.substring(0, 150)}...
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-800 bg-[#1C2128]">
              <button
                onClick={handleRestoreCancel}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-colors"
                disabled={restoreLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRestoreConfirm}
                className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded text-xs font-bold hover:bg-amber-500/30 flex items-center gap-2 transition-colors"
                disabled={restoreLoading}
              >
                {restoreLoading ? (
                  <>
                    <FaSpinner className="animate-spin text-xs" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <FaTrash className="text-xs" />
                    Restore Version
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Terms;