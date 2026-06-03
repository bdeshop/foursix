import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaTimes, 
  FaSave,
  FaSpinner,
  FaShieldAlt,
  FaUserShield,
  FaUsers,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaBan,
  FaLock,
  FaUnlockAlt,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { MdOutlineEdit } from "react-icons/md";

const Rolelist = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  
  // Role States
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [expandedPermissions, setExpandedPermissions] = useState({});
  const [editFormData, setEditFormData] = useState({
    roleName: '',
    permissions: [],
    status: 'active'
  });

  // Admin States
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showViewAdminPopup, setShowViewAdminPopup] = useState(false);
  const [showEditAdminPopup, setShowEditAdminPopup] = useState(false);
  const [showDeleteAdminPopup, setShowDeleteAdminPopup] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editAdminFormData, setEditAdminFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    is_active: true
  });

  const [activeTab, setActiveTab] = useState('roles');

  // Complete permissions list with categories
  const permissionCategories = [
    {
      category: "Dashboard",
      permissions: [
        { id: 'view_dashboard', label: 'View Dashboard' }
      ]
    },
    {
      category: "Game Management",
      permissions: [
        { id: 'create_game', label: 'Create New Game' },
        { id: 'view_games', label: 'View All Games' },
        { id: 'manage_active_games', label: 'Manage Active Games' },
        { id: 'manage_deactive_games', label: 'Manage Deactive Games' },
        { id: 'manage_menu_games', label: 'Manage Menu Games' },
        { id: 'manage_game_categories', label: 'Manage Game Categories' },
        { id: 'manage_game_providers', label: 'Manage Game Providers' }
      ]
    },
    {
      category: "Bet Logs",
      permissions: [
        { id: 'view_all_bets', label: 'View All Bets' },
        { id: 'view_high_stakes_bets', label: 'View High Stakes Bets' }
      ]
    },
    {
      category: "Deposit Management",
      permissions: [
        { id: 'view_pending_deposits', label: 'View Pending Deposits' },
        { id: 'approve_deposits', label: 'Approve Deposits' },
        { id: 'reject_deposits', label: 'Reject Deposits' },
        { id: 'view_deposit_history', label: 'View Deposit History' }
      ]
    },
    {
      category: "Withdrawal Management",
      permissions: [
        { id: 'view_pending_withdrawals', label: 'View Pending Withdrawals' },
        { id: 'approve_withdrawals', label: 'Approve Withdrawals' },
        { id: 'reject_withdrawals', label: 'Reject Withdrawals' },
        { id: 'view_withdrawal_history', label: 'View Withdrawal History' }
      ]
    },
    {
      category: "Deposit Bonus System",
      permissions: [
        { id: 'create_bonus', label: 'Create Bonus' },
        { id: 'view_bonuses', label: 'View All Bonuses' }
      ]
    },
    {
      category: "Payment Method",
      permissions: [
        { id: 'view_deposit_methods', label: 'View Deposit Methods' },
        { id: 'create_deposit_method', label: 'Create Deposit Method' },
        { id: 'view_withdraw_methods', label: 'View Withdraw Methods' },
        { id: 'create_withdraw_method', label: 'Create Withdraw Method' }
      ]
    },
    {
      category: "Opay Settings",
      permissions: [
        { id: 'manage_opay_api', label: 'Manage Opay API' },
        { id: 'view_device_monitoring', label: 'View Device Monitoring' },
        { id: 'view_opay_deposits', label: 'View Opay Deposits' }
      ]
    },
    {
      category: "User Management",
      permissions: [
        { id: 'view_all_users', label: 'View All Users' },
        { id: 'manage_active_users', label: 'Manage Active Users' },
        { id: 'manage_inactive_users', label: 'Manage Inactive Users' }
      ]
    },
     {
    category: "Bonuses",
    permissions: [
      { id: 'manage_bonuses', label: 'Manage Bonuses Menu' },
      { id: 'create_bonus', label: 'Create New Cash Bonus' },
      { id: 'view_bonuses', label: 'View Cash Bonus List' },
      { id: 'manage_recurring_bonuses', label: 'Manage Weekly & Monthly Bonus' }
    ]
  },
     {
    category: "KYC Management",
    permissions: [
      { id: 'view_kyc', label: 'View KYC List' },
      { id: 'assign_kyc', label: 'Assign KYC' },
      { id: 'approve_kyc', label: 'Approve KYC' },
      { id: 'reject_kyc', label: 'Reject KYC' },
      { id: 'view_kyc_details', label: 'View KYC Details' }
    ]
  },
    {
      category: "Affiliate Management",
      permissions: [
        { id: 'view_all_affiliates', label: 'View All Affiliates' },
        { id: 'manage_commission', label: 'Manage Commission' },
        { id: 'manage_payouts', label: 'Manage Payouts' }
      ]
    },
    {
      category: "Login Logs & Security",
      permissions: [
        { id: 'view_login_logs', label: 'View All Login Logs' },
        { id: 'view_failed_logins', label: 'View Failed Login Attempts' }
      ]
    },
    {
      category: "Admin Role Management",
      permissions: [
        { id: 'create_role', label: 'Create Role' },
        { id: 'view_roles', label: 'View Role List' }
      ]
    },
    {
      category: "Event Management",
      permissions: [
        { id: 'create_event', label: 'Create Event' },
        { id: 'view_events', label: 'View All Events' }
      ]
    },
    {
      category: "Notice Management",
      permissions: [
        { id: 'create_notice', label: 'Create Notice' }
      ]
    },
    {
      category: "Content Management",
      permissions: [
        { id: 'manage_banners', label: 'Manage Banners & Sliders' },
        { id: 'manage_promotional_content', label: 'Manage Promotional Content' },
        { id: 'manage_terms', label: 'Manage Terms & Conditions' },
        { id: 'manage_faq', label: 'Manage FAQ' },
        { id: 'manage_logo', label: 'Manage Logo & Favicon' }
      ]
    },
    {
      category: "Notification Management",
      permissions: [
        { id: 'send_notifications', label: 'Send Notifications' },
        { id: 'view_notifications', label: 'View All Notifications' }
      ]
    },
    {
      category: "Social Address",
      permissions: [
        { id: 'manage_social_links', label: 'Manage Social Links' }
      ]
    },
    {
      category: "Admin Profile",
      permissions: [
        { id: 'view_admin_profile', label: 'View Admin Profile' },
        { id: 'edit_admin_profile', label: 'Edit Admin Profile' }
      ]
    }
  ];

  // Flatten permissions for easy access
  const allPermissions = permissionCategories.flatMap(cat => cat.permissions);

  useEffect(() => {
    fetchRoles();
    fetchAdmins();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const togglePermissionExpand = (roleId) => {
    setExpandedPermissions(prev => ({
      ...prev,
      [roleId]: !prev[roleId]
    }));
  };

  // ==================== ROLE CRUD OPERATIONS ====================

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      } else {
        toast.error('Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Error fetching roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/admins`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleViewRole = (role) => {
    setSelectedRole(role);
    setShowViewPopup(true);
  };

  const handleEditRole = (role) => {
    setSelectedRole(role);
    setEditFormData({
      roleName: role.roleName,
      permissions: role.permissions || [],
      status: role.status
    });
    setShowEditPopup(true);
  };

  const handlePermissionToggle = (permissionId) => {
    setEditFormData(prev => {
      const newPermissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSelectAllPermissions = () => {
    const allPermissionIds = allPermissions.map(p => p.id);
    if (editFormData.permissions.length === allPermissionIds.length) {
      setEditFormData({ ...editFormData, permissions: [] });
    } else {
      setEditFormData({ ...editFormData, permissions: allPermissionIds });
    }
  };

  const handleSelectCategoryPermissions = (categoryPermissions) => {
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryPermissionIds.every(id => editFormData.permissions.includes(id));
    
    if (allSelected) {
      setEditFormData({
        ...editFormData,
        permissions: editFormData.permissions.filter(p => !categoryPermissionIds.includes(p))
      });
    } else {
      const newPermissions = [...editFormData.permissions];
      categoryPermissionIds.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id);
        }
      });
      setEditFormData({ ...editFormData, permissions: newPermissions });
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editFormData.roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/roles/${selectedRole._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });

      const data = await response.json();
      if (response.ok) {
        setShowEditPopup(false);
        fetchRoles();
        toast.success(data.message || 'Role updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error updating role');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteRole = (role) => {
    setRoleToDelete(role);
    setShowDeletePopup(true);
  };

  const deleteRole = async () => {
    if (!roleToDelete) return;

    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/roles/${roleToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        fetchRoles();
        toast.success(data.message || 'Role deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Error deleting role');
    } finally {
      setShowDeletePopup(false);
      setRoleToDelete(null);
    }
  };

  const toggleRoleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/roles/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (response.ok) {
        fetchRoles();
        toast.success(data.message || 'Role status updated successfully');
      } else {
        toast.error(data.error || 'Failed to update role status');
      }
    } catch (error) {
      console.error('Error updating role status:', error);
      toast.error('Error updating role status');
    }
  };

  // ==================== ADMIN CRUD OPERATIONS ====================

  const handleViewAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowViewAdminPopup(true);
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setEditAdminFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role,
      is_active: admin.is_active
    });
    setShowEditAdminPopup(true);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!editAdminFormData.name.trim() || !editAdminFormData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/admins/${selectedAdmin._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editAdminFormData)
      });

      const data = await response.json();
      if (response.ok) {
        setShowEditAdminPopup(false);
        fetchAdmins();
        toast.success(data.message || 'Admin updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Error updating admin');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteAdmin = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteAdminPopup(true);
  };

  const deleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/admins/${adminToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        fetchAdmins();
        toast.success(data.message || 'Admin deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete admin');
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Error deleting admin');
    } finally {
      setShowDeleteAdminPopup(false);
      setAdminToDelete(null);
    }
  };

  const toggleAdminStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/admins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      const data = await response.json();
      if (response.ok) {
        fetchAdmins();
        toast.success(data.message || 'Admin status updated successfully');
      } else {
        toast.error(data.error || 'Failed to update admin status');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error('Error updating admin status');
    }
  };

  const stats = {
    totalRoles: roles.length,
    activeRoles: roles.filter(r => r.status === 'active').length,
    totalAdmins: admins.length,
    activeAdmins: admins.filter(a => a.is_active).length
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase flex items-center gap-2">
                <FaUserShield className="text-amber-500" /> Role & Admin Management
              </h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaShieldAlt className="text-amber-500" /> Manage roles, permissions and admin users
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => { fetchRoles(); fetchAdmins(); }}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL ROLES', value: stats.totalRoles, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'ACTIVE ROLES', value: stats.activeRoles, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'TOTAL ADMINS', value: stats.totalAdmins, color: 'border-purple-500', valueClass: 'text-white' },
              { label: 'ACTIVE ADMINS', value: stats.activeAdmins, color: 'border-amber-500', valueClass: 'text-amber-400' },
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

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'roles' 
                  ? 'text-amber-400 border-b-2 border-amber-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FaShieldAlt /> Manage Roles
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'admins' 
                  ? 'text-amber-400 border-b-2 border-amber-400' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FaUsers /> Manage Admins
            </button>
          </div>

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 bg-[#1C2128] flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">All Roles</h3>
                <button
                  onClick={() => navigate('/admin-roles/create-role')}
                  className="text-[12px] bg-amber-600 hover:bg-amber-700 px-3 py-2.5 rounded font-bold uppercase flex items-center gap-1"
                >
                  Create Role
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1C2128] border-b border-gray-800">
                    <tr>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Role Name</th>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Permissions</th>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Status</th>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Created At</th>
                      <th className="text-right px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-gray-500 text-xs">No roles found</td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <tr key={role._id} className="border-b border-gray-800 hover:bg-[#1C2128] transition-colors">
                          <td className="px-6 py-3">
                            <span className="text-xs font-semibold text-white">{role.roleName}</span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap items-center gap-1">
                              {(role.permissions || []).slice(0, 3).map(perm => {
                                const permLabel = allPermissions.find(p => p.id === perm)?.label || perm.replace(/_/g, ' ');
                                return (
                                  <span key={perm} className="text-[8px] bg-[#0F111A] px-2 py-0.5 rounded text-gray-400">
                                    {permLabel}
                                  </span>
                                );
                              })}
                              {(role.permissions || []).length > 3 && (
                                <button
                                  onClick={() => togglePermissionExpand(role._id)}
                                  className="text-[8px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-amber-500/30 transition-colors"
                                >
                                  {expandedPermissions[role._id] ? (
                                    <>Show Less <FaChevronUp size={8} /></>
                                  ) : (
                                    <>+{(role.permissions || []).length - 3} more <FaChevronDown size={8} /></>
                                  )}
                                </button>
                              )}
                            </div>
                            {expandedPermissions[role._id] && (role.permissions || []).length > 3 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {(role.permissions || []).slice(3).map(perm => {
                                  const permLabel = allPermissions.find(p => p.id === perm)?.label || perm.replace(/_/g, ' ');
                                  return (
                                    <span key={perm} className="text-[8px] bg-[#0F111A] px-2 py-0.5 rounded text-gray-400">
                                      {permLabel}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <button
                              className={`text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                role.status === 'active' 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {role.status}
                            </button>
                          </td>
                          <td className="px-6 py-3 text-[10px] text-gray-500">
                            {new Date(role.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewRole(role)}
                                className="bg-blue-500 text-white px-[10px] py-[7px] rounded-[5px]  transition-colors"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleEditRole(role)}
                                className="bg-green-500 text-white px-[10px] py-[7px] rounded-[5px]  transition-colors"
                                title="Edit"
                              >
                                <MdOutlineEdit />
                              </button>
                              <button
                                onClick={() => confirmDeleteRole(role)}
                                className="bg-red-500 text-white px-[10px] py-[7px] rounded-[5px]  transition-colors"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 bg-[#1C2128] flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">All Admins</h3>
                <button
                  onClick={() => navigate('/admin-roles/create-admin')}
                  className="text-[12px] bg-amber-600 hover:bg-amber-700 px-3 py-2.5 rounded font-bold uppercase flex items-center gap-1"
                >
                  Create Admin
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1C2128] border-b border-gray-800">
                    <tr>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Name</th>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Email</th>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Role</th>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Status</th>
                      <th className="text-left px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Created</th>
                      <th className="text-right px-6 py-3 text-[9px] font-black uppercase tracking-wider text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-gray-500 text-xs">No admins found</td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr key={admin._id} className="border-b border-gray-800 hover:bg-[#1C2128] transition-colors">
                          <td className="px-6 py-3">
                            <span className="text-xs font-semibold text-white">{admin.name}</span>
                          </td>
                          <td className="px-6 py-3 text-xs text-gray-400">{admin.email}</td>
                          <td className="px-6 py-3">
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                              {admin.role || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => toggleAdminStatus(admin._id, admin.is_active)}
                              className={`text-[9px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                admin.is_active 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {admin.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-3 text-[10px] text-gray-500">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewAdmin(admin)}
                                className="bg-blue-500 text-white px-[10px] py-[7px] rounded-[5px] transition-colors"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleEditAdmin(admin)}
                                className="bg-green-500 text-white px-[10px] py-[7px] rounded-[5px]  transition-colors"
                                title="Edit"
                              >
                                <MdOutlineEdit />
                              </button>
                              <button
                                onClick={() => confirmDeleteAdmin(admin)}
                                className="bg-red-500 text-white px-[10px] py-[7px] rounded-[5px] transition-colors"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================== VIEW ROLE POPUP ==================== */}
      {showViewPopup && selectedRole && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128] sticky top-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaShieldAlt /> Role Details
              </h3>
              <button onClick={() => setShowViewPopup(false)} className="text-gray-500 hover:text-gray-300">
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Role Name</label>
                <p className="text-sm font-semibold text-white bg-[#0F111A] p-2 rounded border border-gray-700">{selectedRole.roleName}</p>
              </div>
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</label>
                <p className={`inline-block text-[9px] px-2 py-1 rounded font-bold uppercase ${
                  selectedRole.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {selectedRole.status}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Permissions</label>
                <div className="space-y-4">
                  {permissionCategories.map(category => {
                    const categoryPermissions = category.permissions.filter(perm => 
                      selectedRole.permissions?.includes(perm.id)
                    );
                    if (categoryPermissions.length === 0) return null;
                    return (
                      <div key={category.category} className="border-l-2 border-amber-500/30 pl-3">
                        <h4 className="text-[10px] font-bold text-amber-400 mb-2">{category.category}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {categoryPermissions.map(perm => (
                            <div key={perm.id} className="flex items-center gap-2">
                              <FaCheckCircle className="text-emerald-400 text-[10px]" />
                              <span className="text-[10px] text-gray-300">{perm.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Created At</label>
                <p className="text-xs text-gray-400">{new Date(selectedRole.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end">
              <button
                onClick={() => setShowViewPopup(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT ROLE POPUP ==================== */}
      {showEditPopup && selectedRole && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128] sticky top-0">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaEdit /> Edit Role
              </h3>
              <button onClick={() => setShowEditPopup(false)} className="text-gray-500 hover:text-gray-300">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateRole}>
              <div className="px-6 py-5">
                <div className="mb-4">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Role Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.roleName}
                    onChange={(e) => setEditFormData({ ...editFormData, roleName: e.target.value.toUpperCase() })}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500">Permissions</label>
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[8px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300"
                    >
                      {editFormData.permissions.length === allPermissions.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {permissionCategories.map((category, idx) => (
                      <div key={idx} className="border border-gray-800 rounded-lg overflow-hidden">
                        <div className="bg-[#1C2128] px-4 py-2 flex justify-between items-center">
                          <h4 className="text-[9px] font-bold text-gray-300 uppercase">{category.category}</h4>
                          <button
                            type="button"
                            onClick={() => handleSelectCategoryPermissions(category.permissions)}
                            className="text-[8px] text-amber-400 hover:text-amber-300"
                          >
                            {category.permissions.every(p => editFormData.permissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {category.permissions.map(perm => (
                              <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={editFormData.permissions.includes(perm.id)}
                                  onChange={() => handlePermissionToggle(perm.id)}
                                  className="w-3 h-3 rounded border-gray-600 bg-[#0F111A] text-amber-500 focus:ring-amber-500"
                                />
                                <span className="text-[10px] text-gray-400 group-hover:text-gray-300">{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className={selectClass}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setShowEditPopup(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {loading ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== VIEW ADMIN POPUP ==================== */}
      {showViewAdminPopup && selectedAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaUsers /> Admin Details
              </h3>
              <button onClick={() => setShowViewAdminPopup(false)} className="text-gray-500 hover:text-gray-300">
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-5">
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Full Name</label>
                <p className="text-sm font-semibold text-white bg-[#0F111A] p-2 rounded border border-gray-700">{selectedAdmin.name}</p>
              </div>
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Email</label>
                <p className="text-sm text-gray-300 bg-[#0F111A] p-2 rounded border border-gray-700">{selectedAdmin.email}</p>
              </div>
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Role</label>
                <p className="inline-block text-[9px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded">{selectedAdmin.role || 'N/A'}</p>
              </div>
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</label>
                <p className={`inline-block text-[9px] px-2 py-1 rounded font-bold uppercase ${
                  selectedAdmin.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {selectedAdmin.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Created At</label>
                <p className="text-xs text-gray-400">{new Date(selectedAdmin.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end">
              <button
                onClick={() => setShowViewAdminPopup(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== EDIT ADMIN POPUP ==================== */}
      {showEditAdminPopup && selectedAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <FaEdit /> Edit Admin
              </h3>
              <button onClick={() => setShowEditAdminPopup(false)} className="text-gray-500 hover:text-gray-300">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin}>
              <div className="px-6 py-5">
                <div className="mb-4">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editAdminFormData.name}
                    onChange={(e) => setEditAdminFormData({ ...editAdminFormData, name: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editAdminFormData.email}
                    onChange={(e) => setEditAdminFormData({ ...editAdminFormData, email: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Password <span className="text-gray-600">(Leave blank to keep current)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={editAdminFormData.password}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, password: e.target.value })}
                      className={inputClass}
                      placeholder="Enter new password (optional)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Role</label>
                  <select
                    name="role"
                    value={editAdminFormData.role}
                    onChange={(e) => setEditAdminFormData({ ...editAdminFormData, role: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select Role</option>
                    {roles.filter(r => r.status === 'active').map(role => (
                      <option key={role._id} value={role.roleName}>{role.roleName}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editAdminFormData.is_active}
                      onChange={(e) => setEditAdminFormData({ ...editAdminFormData, is_active: e.target.checked })}
                      className="w-3 h-3 rounded border-gray-600 bg-[#0F111A] text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Active Status</span>
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditAdminPopup(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {loading ? 'Saving...' : 'Update Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Role Confirmation Modal */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confirm Delete</h3>
              <button onClick={() => setShowDeletePopup(false)} className="text-gray-500 hover:text-gray-300">
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-5">
                Are you sure you want to delete the role "{roleToDelete?.roleName}"? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              <button
                onClick={() => setShowDeletePopup(false)}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteRole}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaTrash /> Delete Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin Confirmation Modal */}
      {showDeleteAdminPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confirm Delete</h3>
              <button onClick={() => setShowDeleteAdminPopup(false)} className="text-gray-500 hover:text-gray-300">
                <FaTimes />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-5">
                Are you sure you want to delete the admin "{adminToDelete?.name}"? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAdminPopup(false)}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteAdmin}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaTrash /> Delete Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Rolelist;