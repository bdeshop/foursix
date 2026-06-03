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
  FaChevronLeft, 
  FaChevronRight,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaGift,
  FaCalendarAlt,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheck,
  FaBan,
} from 'react-icons/fa';
import { IoIosSend } from "react-icons/io";

import { FiRefreshCw, FiTrendingUp, FiUser, FiUsers } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';

const Allnotification = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewNotification, setPreviewNotification] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    targetType: 'all',
    search: ''
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  // Fetch users and notifications on component mount
  useEffect(() => {
    fetchUsers();
    fetchNotifications();
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

  const fetchNotifications = async (page = 1, filtersObj = filters) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction === 'descending' ? 'desc' : 'asc',
        ...filtersObj
      };

      const response = await axios.get(`${base_url}/api/admin/notifications`, { params });
      setNotifications(response.data.notifications);
      setPagination({
        ...pagination,
        page,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
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
      const response = await axios.post(`${base_url}/api/admin/notifications`, formData);
      
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
      setShowCreateForm(false);
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

 

  const deleteNotification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await axios.delete(`${base_url}/api/admin/notifications/${id}`);
      toast.success('Notification deleted successfully');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const updateNotificationStatus = async (id, status) => {
    try {
      await axios.put(`${base_url}/api/admin/notifications/${id}/status`, { status });
      toast.success('Notification status updated successfully');
      fetchNotifications();
    } catch (error) {
      console.error('Error updating notification status:', error);
      toast.error('Failed to update notification status');
    }
  };

  const applyFilters = () => {
    fetchNotifications(1, filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      status: 'all',
      type: 'all',
      targetType: 'all',
      search: ''
    };
    setFilters(defaultFilters);
    fetchNotifications(1, defaultFilters);
  };

  const requestSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending';
    setSortConfig({ key, direction });
    fetchNotifications(pagination.page, filters);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'sent': return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: <FaCheckCircle className="text-emerald-400 text-[10px]" />, label: 'Sent' };
      case 'scheduled': return { badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', icon: <FaClock className="text-amber-400 text-[10px]" />, label: 'Scheduled' };
      case 'draft': return { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', icon: <FaEdit className="text-gray-400 text-[10px]" />, label: 'Draft' };
      case 'cancelled': return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', icon: <FaTimesCircle className="text-rose-400 text-[10px]" />, label: 'Cancelled' };
      default: return { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', icon: <FaInfoCircle className="text-gray-400 text-[10px]" />, label: status };
    }
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case 'info': return { badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', icon: <FaInfoCircle className="text-blue-400 text-[10px]" /> };
      case 'warning': return { badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', icon: <FaExclamationTriangle className="text-amber-400 text-[10px]" /> };
      case 'success': return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', icon: <FaCheckCircle className="text-emerald-400 text-[10px]" /> };
      case 'error': return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', icon: <FaTimesCircle className="text-rose-400 text-[10px]" /> };
      case 'promotional': return { badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20', icon: <FaGift className="text-purple-400 text-[10px]" /> };
      default: return { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', icon: <FaBell className="text-gray-400 text-[10px]" /> };
    }
  };

  const getPaginationPages = () => {
    if (pagination.totalPages <= 7) return Array.from({ length: pagination.totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (pagination.page > 3) pages.push('...');
    for (let i = Math.max(2, pagination.page - 1); i <= Math.min(pagination.totalPages - 1, pagination.page + 1); i++) pages.push(i);
    if (pagination.page < pagination.totalPages - 2) pages.push('...');
    pages.push(pagination.totalPages);
    return pages;
  };

  const stats = {
    total: pagination.total,
    sent: notifications.filter(n => n.status === 'sent').length,
    scheduled: notifications.filter(n => n.status === 'scheduled').length,
    draft: notifications.filter(n => n.status === 'draft').length
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';
  const textareaClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600 min-h-[80px]';

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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Notification Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaBell className="text-amber-500" /> Send and manage push notifications to users
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FaPaperPlane /> {showCreateForm ? 'HIDE FORM' : 'CREATE NOTIFICATION'}
              </button>
              <button
                onClick={() => fetchNotifications()}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL NOTIFICATIONS', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'SENT', value: stats.sent, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'SCHEDULED', value: stats.scheduled, color: 'border-amber-500', valueClass: 'text-amber-400' },
              { label: 'DRAFT', value: stats.draft, color: 'border-rose-500', valueClass: 'text-rose-400' },
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

          {/* Create Notification Form */}
          {showCreateForm && (
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
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
                      placeholder="Notification title"
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
                      placeholder="Notification message content"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                      Notification Type
                    </label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className={selectClass}>
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
                    <select name="priority" value={formData.priority} onChange={handleInputChange} className={selectClass}>
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
                    <select name="targetType" value={formData.targetType} onChange={handleInputChange} className={selectClass}>
                      <option value="all">All Users</option>
                      <option value="specific">Specific Users</option>
                      <option value="role_based">Role Based</option>
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

                  {/* Specific Users */}
                  {formData.targetType === 'specific' && (
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                        Select Users
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[#0F111A] border border-gray-700 rounded px-3 py-2 text-xs text-gray-400">
                          {formData.targetUsers.length} user(s) selected
                        </div>
                        <button
                          type="button"
                          onClick={openUserModal}
                          className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded font-bold text-[9px] uppercase tracking-wider hover:bg-amber-600/30 transition-all"
                        >
                          <FaUser className="inline mr-1" /> Select Users
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Role Based */}
                  {formData.targetType === 'role_based' && (
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                        Select Roles
                      </label>
                      <select multiple className={selectClass} onChange={handleUserRoleChange} value={formData.userRoles} size={3}>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="vip">VIP User</option>
                      </select>
                      <p className="text-[8px] text-gray-600 mt-1">Hold Ctrl/Cmd to select multiple roles</p>
                    </div>
                  )}

                  {/* Scheduled For */}
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                      Schedule For (Optional)
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
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                      Expires At (Optional)
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={sendTestNotification}
                    className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded font-bold text-xs transition-all flex items-center gap-2 hover:bg-indigo-600/30"
                  >
                    <FaEye /> Test
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <FaSpinner className="animate-spin" /> : <IoIosSend  />}
                    {loading ? 'Sending...' : 'Send Notification'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-amber-500"></div> Filters & Search
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={resetFilters}
                  className="text-[9px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider"
                >
                  Clear All
                </button>
                <button
                  onClick={applyFilters}
                  className="bg-amber-500/10 hover:bg-amber-600/30 border border-amber-500/20 text-amber-400 px-4 py-1.5 rounded font-bold text-[9px] transition-all flex items-center gap-2"
                >
                  <FaFilter /> Apply Filters
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  className={`${inputClass} pl-8`}
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
              </div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className={selectClass}
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className={selectClass}
              >
                <option value="all">All Types</option>
                <option value="info">Information</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="promotional">Promotional</option>
              </select>
              <select
                value={filters.targetType}
                onChange={(e) => setFilters({...filters, targetType: e.target.value})}
                className={selectClass}
              >
                <option value="all">All Targets</option>
                <option value="all">All Users</option>
                <option value="specific">Specific Users</option>
                <option value="role_based">Role Based</option>
              </select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {notifications.length} of {pagination.total} notifications
            </p>
          </div>

          {/* Notifications Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <FaBell /> Sent Notifications
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('title')}>
                      Title {getSortIcon('title')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('type')}>
                      Type {getSortIcon('type')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('targetType')}>
                      Target {getSortIcon('targetType')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                      Status {getSortIcon('status')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>
                      Created {getSortIcon('createdAt')}
                    </th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading notifications...</p>
                        </div>
                      </td>
                    </tr>
                  ) : notifications.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaBell className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No notifications found</p>
                          <p className="text-[10px] mt-1 text-gray-600">Create your first notification to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    notifications.map((notification) => {
                      const statusInfo = getStatusInfo(notification.status);
                      const typeInfo = getTypeInfo(notification.type);
                      return (
                        <tr key={notification._id} className="hover:bg-[#1F2937] transition-colors group">
                          {/* Title */}
                          <td className="px-5 py-4">
                            <div className="text-sm font-bold text-white">{notification.title}</div>
                            <div className="text-[10px] text-gray-500 truncate max-w-xs mt-1">{notification.message}</div>
                          </td>
                          
                          {/* Type */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1 w-fit ${typeInfo.badge}`}>
                              {typeInfo.icon} {notification.type}
                            </span>
                          </td>
                          
                          {/* Target */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs font-medium text-gray-300 capitalize">{notification.targetType}</div>
                            {notification.targetType === 'specific' && notification.targetUsers && (
                              <div className="text-[9px] text-gray-500 mt-0.5">
                                {notification.targetUsers.length} user(s)
                              </div>
                            )}
                          </td>
                          
                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={notification.status === 'sent'}
                                  onChange={() => {
                                    if (notification.status === 'scheduled') {
                                      updateNotificationStatus(notification._id, 'sent');
                                    } else if (notification.status === 'sent') {
                                      updateNotificationStatus(notification._id, 'cancelled');
                                    }
                                  }}
                                  disabled={notification.status !== 'scheduled' && notification.status !== 'sent'}
                                />
                                <div className={`w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${notification.status === 'sent' ? 'peer-checked:bg-amber-500' : ''}`}></div>
                              </label>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase flex items-center gap-1 ${statusInfo.badge}`}>
                                {statusInfo.icon} {statusInfo.label}
                              </span>
                            </div>
                          </td>
                          
                          {/* Created At */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleString()}
                            </div>
                            {notification.scheduledFor && (
                              <div className="text-[9px] text-amber-400/70 flex items-center gap-1 mt-0.5">
                                <FaCalendarAlt className="text-[9px]" /> Scheduled
                              </div>
                            )}
                          </td>
                          
                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => previewNotification(notification)}
                                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                                title="Preview"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => deleteNotification(notification._id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                              {notification.status === 'scheduled' && (
                                <button
                                  onClick={() => updateNotificationStatus(notification._id, 'sent')}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/20 text-emerald-400 rounded text-xs transition-all"
                                  title="Send Now"
                                >
                                  <IoIosSend  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-800 bg-[#1C2128]">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">
                    Page {pagination.page} of {pagination.totalPages} &nbsp;·&nbsp; {pagination.total} total
                  </p>
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => fetchNotifications(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${pagination.page <= 1 ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >← Prev</button>
                    {getPaginationPages().map((page, idx) =>
                      page === '...' ? (
                        <span key={`e-${idx}`} className="px-2 py-1.5 text-[9px] text-gray-600 font-bold select-none">···</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => fetchNotifications(page)}
                          className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${pagination.page === page ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                        >{page}</button>
                      )
                    )}
                    <button
                      onClick={() => fetchNotifications(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${pagination.page >= pagination.totalPages ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >Next →</button>
                  </nav>
                </div>
              </div>
            )}
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
                <h4 className="text-sm font-bold text-white mb-2">{previewNotification.title}</h4>
                <p className="text-xs text-gray-400">{previewNotification.message}</p>
                {previewNotification.actionUrl && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <a 
                      href={previewNotification.actionUrl} 
                      className="text-[9px] text-amber-400 hover:text-amber-300 uppercase tracking-wider"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {previewNotification.actionUrl}
                    </a>
                  </div>
                )}
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

export default Allnotification;