import React, { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaPaperPlane, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaUser, 
  FaUsers, 
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaClock,
  FaGift,
  FaCalendarAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheck,
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import { IoIosSend } from "react-icons/io";

const Sendnotification = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewNotification, setPreviewNotification] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Notification form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetUsers: [],
    userRoles: [],
    scheduledFor: '',
    expiresAt: '',
    status: 'draft',
    actionUrl: '',
    priority: 'medium'
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, userSearchTerm]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/notifications/users/list`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const filterUsers = () => {
    const filtered = users.filter(user => 
      user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.player_id?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUserSelection = (user) => {
    if (selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleUserRoleChange = (e) => {
    const options = e.target.options;
    const selectedRoles = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedRoles.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      userRoles: selectedRoles
    });
  };

  const openUserModal = () => {
    setShowUserModal(true);
    setUserSearchTerm('');
  };

  const confirmUserSelection = () => {
    setFormData({
      ...formData,
      targetUsers: selectedUsers.map(user => user._id)
    });
    setShowUserModal(false);
  };

  const sendTestNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${base_url}/api/admin/notifications/test`, {
        title: formData.title,
        message: formData.message,
        type: formData.type
      });
      toast.success('Test notification sent successfully!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    if (formData.targetType === 'specific' && formData.targetUsers.length === 0) {
      toast.error('Please select at least one user for specific notifications');
      return;
    }

    if (formData.targetType === 'role_based' && formData.userRoles.length === 0) {
      toast.error('Please select at least one role for role-based notifications');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${base_url}/api/admin/notifications`, formData);
      
      toast.success('Notification sent successfully!');
      setFormData({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetUsers: [],
        userRoles: [],
        scheduledFor: '',
        expiresAt: '',
        status: 'draft',
        actionUrl: '',
        priority: 'medium'
      });
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required to preview');
      return;
    }
    setPreviewNotification(formData);
    setShowPreviewModal(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'info': return <FaInfoCircle className="text-blue-400 text-[10px]" />;
      case 'warning': return <FaExclamationTriangle className="text-amber-400 text-[10px]" />;
      case 'success': return <FaCheckCircle className="text-emerald-400 text-[10px]" />;
      case 'error': return <FaTimesCircle className="text-rose-400 text-[10px]" />;
      case 'promotional': return <FaGift className="text-purple-400 text-[10px]" />;
      default: return <FaBell className="text-gray-400 text-[10px]" />;
    }
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';
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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Send Notification</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaBell className="text-amber-500" /> Create and send push notifications to your users
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={handlePreview}
                className="bg-indigo-500/10 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FaEye /> PREVIEW
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL USERS', value: users.length, color: 'border-indigo-500', valueClass: 'text-white', icon: <FaUsers className="text-indigo-400" /> },
              { label: 'NOTIFICATION TYPES', value: '5', color: 'border-emerald-500', valueClass: 'text-emerald-400', icon: <FaBell className="text-emerald-400" /> },
              { label: 'PRIORITY LEVELS', value: '3', color: 'border-amber-500', valueClass: 'text-amber-400', icon: <FaExclamationTriangle className="text-amber-400" /> },
              { label: 'TARGET OPTIONS', value: '3', color: 'border-purple-500', valueClass: 'text-purple-400', icon: <FaUsers className="text-purple-400" /> },
            ].map((card, i) => (
              <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                  {card.icon}
                </div>
                <h2 className={`text-xl font-bold mt-1 leading-none ${card.valueClass}`}>{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Send Notification Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-4 bg-amber-500"></div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Create New Notification</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter notification title"
                    required
                  />
                </div>
                
                {/* Message */}
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={textareaClass}
                    placeholder="Enter notification message content"
                    required
                  />
                </div>
                
                {/* Type */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Notification Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="info">Information</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="promotional">Promotional</option>
                  </select>
                </div>
                
                {/* Priority */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                {/* Target Type */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Target Audience
                  </label>
                  <select
                    name="targetType"
                    value={formData.targetType}
                    onChange={handleInputChange}
                    className={selectClass}
                  >
                    <option value="all">All Users</option>
                    <option value="specific">Specific Users</option>
                    <option value="role_based">By User Role</option>
                  </select>
                </div>
                
                {/* Action URL */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Action URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="actionUrl"
                    value={formData.actionUrl}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="https://example.com"
                  />
                </div>
                
                {/* User Selection (if targetType is specific) */}
                {formData.targetType === 'specific' && (
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                      Select Users
                    </label>
                    <button
                      type="button"
                      onClick={openUserModal}
                      className="w-full bg-[#0F111A] border border-gray-700 rounded px-4 py-2 text-xs text-gray-400 hover:border-amber-500/50 transition-all flex items-center justify-between"
                    >
                      <span>
                        {selectedUsers.length > 0 
                          ? `${selectedUsers.length} user(s) selected` 
                          : 'Click to select users'
                        }
                      </span>
                      <FaUser className="text-amber-400 text-[10px]" />
                    </button>
                    {selectedUsers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedUsers.slice(0, 5).map(user => (
                          <span key={user._id} className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">
                            {user.username}
                          </span>
                        ))}
                        {selectedUsers.length > 5 && (
                          <span className="text-[9px] text-gray-500">+{selectedUsers.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Role Selection (if targetType is role_based) */}
                {formData.targetType === 'role_based' && (
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                      Select User Roles
                    </label>
                    <select
                      multiple
                      value={formData.userRoles}
                      onChange={handleUserRoleChange}
                      className="w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 h-32"
                    >
                      <option value="user">Regular Users</option>
                      <option value="vip">VIP Users</option>
                      <option value="agent">Agents</option>
                      <option value="admin">Admins</option>
                    </select>
                    <p className="text-[8px] text-gray-600 mt-1">Hold Ctrl/Cmd to select multiple roles</p>
                  </div>
                )}
                
                {/* Scheduled For */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                    <FaCalendarAlt className="text-[9px]" /> Schedule For (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledFor"
                    value={formData.scheduledFor}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </div>
                
                {/* Expires At */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                    <FaClock className="text-[9px]" /> Expires At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </div>
              </div>
              
              {/* Preview Section */}
              {formData.title && formData.message && (
                <div className="mt-6 p-4 bg-[#0F111A] rounded-lg border border-gray-800">
                  <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                    <FaEye /> Live Preview
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      {getTypeIcon(formData.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white">{formData.title}</h4>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          formData.priority === 'high' ? 'bg-rose-500/20 text-rose-400' :
                          formData.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {formData.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{formData.message}</p>
                      {formData.actionUrl && (
                        <div className="mt-2 pt-2 border-t border-gray-800">
                          <span className="text-[9px] text-amber-400">{formData.actionUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Buttons */}
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={sendTestNotification}
                  className="px-5 py-2 bg-indigo-500/10 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 rounded font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  disabled={!formData.title || !formData.message || loading}
                >
                  <FaPaperPlane /> Send Test
                </button>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        title: '',
                        message: '',
                        type: 'info',
                        targetType: 'all',
                        targetUsers: [],
                        userRoles: [],
                        scheduledFor: '',
                        expiresAt: '',
                        status: 'draft',
                        actionUrl: '',
                        priority: 'medium'
                      });
                      setSelectedUsers([]);
                    }}
                    className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded font-bold text-xs transition-all"
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <IoIosSend  />}
                    {loading ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>
              </div>
            </form>
          </div>

        </main>
      </div>

      {/* User Selection Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128] sticky top-0 z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaUsers /> Select Users
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  className={inputClass}
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto mb-4 space-y-2">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div
                      key={user._id}
                      className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                        selectedUsers.some(u => u._id === user._id) 
                          ? 'bg-amber-500/10 border-amber-500/30' 
                          : 'border-gray-700 hover:bg-[#1F2937]'
                      }`}
                      onClick={() => handleUserSelection(user)}
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{user.username}</div>
                        <div className="text-[10px] text-gray-500">{user.email || user.player_id}</div>
                      </div>
                      {selectedUsers.some(u => u._id === user._id) && (
                        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                          <FaCheck className="text-white text-[9px]" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 text-[10px] uppercase tracking-wider">No users found</div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                  {selectedUsers.length} user(s) selected
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUserSelection}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all"
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewNotification && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaEye /> Notification Preview
              </h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    {getTypeIcon(previewNotification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{previewNotification.title}</h4>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        previewNotification.priority === 'high' ? 'bg-rose-500/20 text-rose-400' :
                        previewNotification.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {previewNotification.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{previewNotification.message}</p>
                    {previewNotification.actionUrl && (
                      <div className="mt-2 pt-2 border-t border-gray-800">
                        <span className="text-[9px] text-amber-400">{previewNotification.actionUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Sendnotification;