import React, { useState } from 'react';
import { 
  FaPlus, 
  FaTimes, 
  FaSave,
  FaSpinner,
  FaShieldAlt,
  FaUserShield,
  FaCheckCircle,
  FaRegCircle,
  FaArrowLeft
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Createrole = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    roleName: '',
    permissions: [],
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  // Available permissions list with categories
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
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handlePermissionToggle = (permissionId, e) => {
    // Stop event propagation to prevent any conflicts
    if (e) {
      e.stopPropagation();
    }
    setFormData(prev => {
      const newPermissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions: newPermissions };
    });
  };

  const handleSelectAllPermissions = () => {
    const allPermissions = permissionCategories.flatMap(cat => cat.permissions.map(p => p.id));
    if (formData.permissions.length === allPermissions.length) {
      setFormData({ ...formData, permissions: [] });
    } else {
      setFormData({ ...formData, permissions: allPermissions });
    }
  };

  const handleSelectCategoryPermissions = (categoryPermissions) => {
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryPermissionIds.every(id => formData.permissions.includes(id));
    
    if (allSelected) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => !categoryPermissionIds.includes(p))
      });
    } else {
      const newPermissions = [...formData.permissions];
      categoryPermissionIds.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id);
        }
      });
      setFormData({ ...formData, permissions: newPermissions });
    }
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();
    if (!formData.roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Role created successfully!');
        setFormData({
          roleName: '',
          permissions: [],
          status: 'active'
        });
        setTimeout(() => navigate('/admin-roles/role-list'), 600);
      } else {
        toast.error(data.error || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Error creating role');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500';

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase flex items-center gap-2">
                  <FaUserShield className="text-amber-500" /> Create New Role
                </h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
            Define role name and assign permissions
                </p>
              </div>
            </div>
            <button
              onClick={() => { setFormData({ roleName: '', permissions: [], status: 'active' }); }}
              className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 text-amber-400 mt-4 md:mt-0"
            >
              <FiRefreshCw /> RESET FORM
            </button>
          </div>

          {/* Create Role Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">
                Role Information
              </h2>
            </div>
            
            <form onSubmit={handleSubmitRole}>
              {/* Role Name */}
              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Role Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="roleName"
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value.toUpperCase() })}
                  className={inputClass}
                  placeholder="Enter role name"
                  required
                />
                <p className="text-[10px] text-gray-600 mt-1">Role name will be stored in uppercase</p>
              </div>

              {/* Permissions Section */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                    Permissions
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    {formData.permissions.length === permissionCategories.flatMap(cat => cat.permissions).length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                
                <div className="space-y-6">
                  {permissionCategories.map((category, catIndex) => (
                    <div key={catIndex} className="border border-gray-800 rounded-xl overflow-hidden">
                      <div className="bg-[#1C2128] px-5 py-3 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                          {category.category}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleSelectCategoryPermissions(category.permissions)}
                          className="text-[9px] text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          {category.permissions.every(p => formData.permissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {category.permissions.map(perm => (
                            <label 
                              key={perm.id} 
                              className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg transition-all"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePermissionToggle(perm.id, e);
                              }}
                            >
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={formData.permissions.includes(perm.id)}
                                  onChange={() => {}} // Empty onChange, handled by label click
                                  className="hidden"
                                />
                                <div 
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                    formData.permissions.includes(perm.id)
                                      ? 'bg-amber-500 border-amber-500'
                                      : 'border-gray-600 bg-[#0F111A] hover:border-amber-400'
                                  }`}
                                >
                                  {formData.permissions.includes(perm.id) && (
                                    <FaCheckCircle className="text-white text-xs" />
                                  )}
                                </div>
                              </div>
                              <span className={`text-sm font-medium transition-colors ${
                                formData.permissions.includes(perm.id) 
                                  ? 'text-amber-400' 
                                  : 'text-gray-400 group-hover:text-gray-300'
                              }`}>
                                {perm.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-[#0F111A] border-gray-600"
                    />
                    <span className="text-sm text-gray-300">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="inactive"
                      checked={formData.status === 'inactive'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-4 h-4 text-amber-500 focus:ring-amber-500 bg-[#0F111A] border-gray-600"
                    />
                    <span className="text-sm text-gray-300">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : ""}
                  {loading ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>

          {/* Selected Permissions Summary */}
          {formData.permissions.length > 0 && (
            <div className="mt-6 bg-[#161B22] border border-gray-800 rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
                Selected Permissions ({formData.permissions.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {formData.permissions.map(permId => {
                  const perm = permissionCategories.flatMap(c => c.permissions).find(p => p.id === permId);
                  return perm ? (
                    <span key={permId} className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full">
                      {perm.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default Createrole;