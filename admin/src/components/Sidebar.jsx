import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiChevronRight, FiHome, FiUsers, FiSettings, FiBell, FiActivity, FiTrendingUp, 
  FiBarChart2, FiLayers, FiCreditCard, FiCalendar, FiBox, FiMessageSquare, 
  FiLogIn, FiFileText, FiShare2, FiGift, FiUserPlus, FiDollarSign, FiCheckCircle, FiXCircle,
  FiShield, FiUserCheck,FiAward
} from 'react-icons/fi';
import { RiCoinsLine, RiRefund2Line } from 'react-icons/ri';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const base_url = import.meta.env.VITE_API_KEY_Base_URL;

const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [notifications, setNotifications] = useState(5);
  const navigate = useNavigate();
  
  const sidebarRef = useRef(null);
  const activeMenuItemRef = useRef(null);
  
  const [withdrawalCounts, setWithdrawalCounts] = useState({ pending: 0, approved: 0, rejected: 0, history: 0 });
  const [depositCounts, setDepositCounts] = useState({ pending: 0, approved: 0, rejected: 0, history: 0 });
  const [affiliateCounts, setAffiliateCounts] = useState({ pendingRegistrations: 0, total: 0, active: 0, pendingPayouts: 0, masterAffiliates: 0, superAffiliates: 0 });
  const [kycCounts, setKycCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  
  // State for admin permissions - array of permission strings
  const [adminPermissions, setAdminPermissions] = useState([]);
  const [adminRole, setAdminRole] = useState('');

  const logout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admintoken");
    navigate("/login");
  };

  // Fetch current admin's permissions
  useEffect(() => {
    const fetchAdminPermissions = async () => {
      try {
        const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
        const response = await axios.get(`${base_url}/api/admin/current-admin/permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // response.data.permissions is an array of permission strings
          setAdminPermissions(response.data.permissions || []);
          setAdminRole(response.data.role || '');
        }
      } catch (error) {
        console.error('Error fetching admin permissions:', error);
        setAdminPermissions([]);
      }
    };
    
    fetchAdminPermissions();
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const withdrawalResponse = await axios.get(`${base_url}/api/admin/withdrawals/counts`);
        if (withdrawalResponse.data.success) setWithdrawalCounts(withdrawalResponse.data.counts);
        const depositResponse = await axios.get(`${base_url}/api/admin/deposits/counts`);
        if (depositResponse.data.success) setDepositCounts(depositResponse.data.counts);
        const affiliateResponse = await axios.get(`${base_url}/api/admin/affiliates/counts`);
        if (affiliateResponse.data.success) setAffiliateCounts(affiliateResponse.data.counts);
        
        // Fetch KYC counts
        const kycResponse = await axios.get(`${base_url}/api/admin/kyc/counts`);
        if (kycResponse.data.success) setKycCounts(kycResponse.data.counts);
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };
    fetchCounts();
    const intervalId = setInterval(fetchCounts, 30000);
    return () => clearInterval(intervalId);
  }, [location]);

  useEffect(() => {
    const path = location.pathname;
    const menuMapping = {
      '/deposit-bonus': 'depositBonus',
      '/users': 'users',
      '/withdraw': 'withdraw',
      '/deposit': 'deposit',
      '/bet-logs': 'betLogs',
      '/games-management': 'games',
      '/affiliate': 'affiliate',
      '/login-logs': 'loginLogs',
      '/content': 'content',
      '/notifications': 'notifications',
      '/opay': 'opay',
      '/event-management': 'event',
      '/notice-management': 'notice',
      '/social-address': 'social',
      '/payment-method': 'method',
      '/admin-roles': 'adminRoles',
      '/kyc': 'kyc',
      '/bonuses': 'bonuses'
    };
    const matchedKey = Object.keys(menuMapping).find(key => path.startsWith(key));
    const newOpenMenu = matchedKey ? menuMapping[matchedKey] : null;
    if (newOpenMenu !== openMenu) {
      setOpenMenu(newOpenMenu);
    }
  }, [location.pathname]);

  // Auto-scroll to active menu item when location changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeMenuItemRef.current && sidebarRef.current) {
        const sidebarContainer = sidebarRef.current;
        const activeElement = activeMenuItemRef.current;
        const scrollTop = activeElement.offsetTop - (sidebarContainer.clientHeight / 2) + (activeElement.clientHeight / 2);
        sidebarContainer.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, openMenu]);

  const handleToggle = (menu) => {
    setOpenMenu(prev => (prev === menu ? null : menu));
  };
  
  const formatCount = (count) => (count > 99 ? '99+' : count);

  const getBadgeColor = (count, type = 'default') => {
    if (count === 0) return 'bg-gray-700';
    switch(type) {
      case 'pending': return 'bg-yellow-600 animate-pulse';
      case 'success': return 'bg-green-600';
      case 'danger': return 'bg-red-600';
      default: return 'bg-[#d4af37] text-[#1a1c23]';
    }
  };

  // Helper to render Category Titles
  const SectionTitle = ({ title }) => (
    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-3 mt-6 px-3">
      {title}
    </p>
  );

  // Check if user has permission - since permissions is an array of strings
  const hasPermission = (permissionString) => {
    // If no permissions array or empty, deny access
    if (!adminPermissions || adminPermissions.length === 0) return false;
    // Check if the permission string exists in the array
    return adminPermissions.includes(permissionString);
  };

  // Function to render each menu item
  function renderMenuItem({ label, icon, key, links, count: menuCount, requiredPermission }) {
    // Check if user has permission to see this menu
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return null;
    }
    
    const isMenuOpen = openMenu === key;
    
    // Filter submenu links based on permissions
    const visibleLinks = links.filter(link => {
      if (link.requiredPermission) {
        return hasPermission(link.requiredPermission);
      }
      return true;
    });
    
    if (visibleLinks.length === 0) return null;
    
    return (
      <div key={key} className="mb-2">
        <div 
          onClick={() => handleToggle(key)} 
          className={`flex items-center justify-between w-full px-3 py-2.5 text-[14px] cursor-pointer transition-all duration-300 ${isMenuOpen ? 'bg-[#252831] text-[#d4af37] border-l-4 border-[#d4af37]' : 'text-gray-400 hover:bg-[#1a1c23] hover:text-gray-200'}`}
        >
          <span className="flex items-center gap-3">{icon} {label}</span>
          <div className="flex items-center gap-2">
            {menuCount > 0 && <span className="bg-[#d4af37] text-[#1a1c23] text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">{formatCount(menuCount)}</span>}
            <FiChevronRight className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`} />
          </div>
        </div>
        <div className={`ml-6 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 mt-2' : 'max-h-0'}`}>
          {visibleLinks.map(({ to, text, count, type }) => (
            <NavLink 
              key={text} 
              to={to} 
              ref={(el) => {
                if (el && location.pathname === to) {
                  activeMenuItemRef.current = el;
                }
              }}
              className={({ isActive }) => `flex items-center px-3 py-2 text-[13px] rounded-md transition-colors ${isActive ? 'text-[#d4af37] font-bold' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <div className={`w-1 h-1 rounded-full mr-3 ${location.pathname === to ? 'bg-[#d4af37]' : 'bg-gray-700'}`}></div>
              {text}
              {count > 0 && <span className={`ml-auto text-[10px] px-1.5 rounded-full text-white ${getBadgeColor(count, type)}`}>{formatCount(count)}</span>}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside ref={sidebarRef} className={`transition-all no-scrollbar duration-300 overflow-y-auto fixed w-[70%] md:w-[40%] lg:w-[28%] xl:w-[17%] h-full z-[999] border-r border-gray-800 text-sm shadow-2xl pt-[12vh] p-4 ${isOpen ? 'left-0 top-0' : 'left-[-120%] top-0'} bg-[#161B22] text-white`}>
      
      {/* Dashboard - Always visible (requires view_dashboard permission) */}
      {hasPermission('view_dashboard') && (
        <div className="mb-3">
          <NavLink 
            to="/dashboard" 
            ref={(el) => {
              if (el && location.pathname === '/dashboard') {
                activeMenuItemRef.current = el;
              }
            }}
            className={({ isActive }) => `flex items-center justify-between w-full px-3 py-2.5 text-[15px] cursor-pointer rounded-lg transition-all duration-300 ${isActive ? 'bg-[#d4af37] text-[#1a1c23] font-bold shadow-lg' : 'hover:bg-[#252831] text-gray-400 hover:text-[#d4af37]'}`}
          >
            <span className="flex items-center gap-3"><FiHome className="text-[18px]" /> Dashboard</span>
          </NavLink>
        </div>
      )}

      {/* Gaming & Logs Section */}
      <SectionTitle title="Gaming & Logs" />
      {[
        {
          label: 'Games Management', icon: <FiBox />, key: 'games',
          requiredPermission: 'view_games',
          links: [
            { to: '/games-management/new-game', text: 'New Game', requiredPermission: 'create_game' },
            { to: '/games-management/all-games', text: 'All Games', requiredPermission: 'view_games' },
            { to: '/games-management/active-games', text: 'Active Games', requiredPermission: 'manage_active_games' },
            { to: '/games-management/deactive-games', text: 'Deactive Games', requiredPermission: 'manage_deactive_games' },
            { to: '/games-management/menu-games', text: 'Menu Games', requiredPermission: 'manage_menu_games' },
            { to: '/games-management/game-categories', text: 'Game Categories', requiredPermission: 'manage_game_categories' },
            { to: '/games-management/game-providers', text: 'Game Providers', requiredPermission: 'manage_game_providers' },
          ],
        },
        {
          label: 'Bet Logs', icon: <FiActivity />, key: 'betLogs',
          requiredPermission: 'view_all_bets',
          links: [
            { to: '/bet-logs/bet-logs', text: 'All Bets', requiredPermission: 'view_all_bets' },
            { to: '/bet-logs/hight-stakes-bet-logs', text: 'High Stakes Bets', requiredPermission: 'view_high_stakes_bets' },
          ],
        },
      ].map((item) => renderMenuItem(item))}

      {/* Finance Section */}
      <SectionTitle title="Finance" />
      {[
        {
          label: 'Deposit Management', icon: <RiCoinsLine />, key: 'deposit',
          requiredPermission: 'view_deposit_methods',
          links: [
            { to: '/deposit/pending', text: 'Pending Deposits', count: depositCounts.pending, type: 'pending', requiredPermission: 'view_deposit_methods' },
            { to: '/deposit/approved', text: 'Approved Deposits', count: depositCounts.approved, type: 'success', requiredPermission: 'view_deposit_methods' },
            { to: '/deposit/rejected', text: 'Rejected Deposits', count: depositCounts.rejected, type: 'danger', requiredPermission: 'view_deposit_methods' },
            { to: '/deposit/history', text: 'Deposit History', count: depositCounts.history, requiredPermission: 'view_deposit_methods' },
          ],
        },
        {
          label: 'Withdrawal Management', icon: <RiRefund2Line />, key: 'withdraw',
          requiredPermission: 'view_withdraw_methods',
          links: [
            { to: '/withdraw/pending', text: 'Pending Withdrawals', count: withdrawalCounts.pending, type: 'pending', requiredPermission: 'view_withdraw_methods' },
            { to: '/withdraw/approved', text: 'Approved Withdrawals', count: withdrawalCounts.approved, type: 'success', requiredPermission: 'view_withdraw_methods' },
            { to: '/withdraw/rejected', text: 'Rejected Withdrawals', count: withdrawalCounts.rejected, type: 'danger', requiredPermission: 'view_withdraw_methods' },
            { to: '/withdraw/history', text: 'Withdraw History', count: withdrawalCounts.history, requiredPermission: 'view_withdraw_methods' },
          ],
        },
        {
          label: 'Deposit Bonus System', icon: <FiGift />, key: 'depositBonus',
          requiredPermission: 'manage_promotional_content',
          links: [
            { to: '/deposit-bonus/create-bonus', text: 'Create Bonus', requiredPermission: 'manage_promotional_content' },
            { to: '/deposit-bonus/all-bonuses', text: 'All Bonuses', requiredPermission: 'manage_promotional_content' },
          ],
        },
            {
          label: 'Bonuses', icon: <FiAward />, key: 'bonuses',
          requiredPermission: 'manage_bonuses',
          links: [
            { to: '/bonuses/new-cash-bonus', text: 'New Cash Bonus', requiredPermission: 'create_bonus' },
            { to: '/bonuses/cash-bonus-list', text: 'Cash Bonus List', requiredPermission: 'view_bonuses' },
            { to: '/bonuses/weekly-monthly-bonus', text: 'Weekly and Monthly Bonus', requiredPermission: 'manage_recurring_bonuses' },
          ],
        },
        
        {
          label: 'Payment Method', icon: <FiCreditCard />, key: 'method',
          requiredPermission: 'view_deposit_methods',
          links: [
            { to: '/payment-method/all-deposit-method', text: 'Deposit Method', requiredPermission: 'view_deposit_methods' },
            { to: '/payment-method/new-deposit-method', text: 'New Deposit Method', requiredPermission: 'create_deposit_method' },
            { to: '/payment-method/all-withdraw-method', text: 'Withdraw Method', requiredPermission: 'view_withdraw_methods' },
            { to: '/payment-method/new-withdraw-method', text: 'New Withdraw Method', requiredPermission: 'create_withdraw_method' },
          ],
        },
        {
          label: 'Opay Setting', icon: <FiSettings />, key: 'opay',
          requiredPermission: 'manage_opay_api',
          links: [
            { to: '/opay/api-settings', text: 'Opay Api', requiredPermission: 'manage_opay_api' },
            { to: '/opay/device-monitoring', text: 'Device Monitoring', requiredPermission: 'view_device_monitoring' },
            { to: '/opay/deposit', text: 'Opay Deposit', requiredPermission: 'view_opay_deposits' },
          ],
        },
      ].map((item) => renderMenuItem(item))}

      {/* User & Access Section */}
      <SectionTitle title="User & Access" />
      {[
        {
          label: 'User Management', icon: <FiUsers />, key: 'users',
          requiredPermission: 'view_all_users',
          links: [
            { to: '/users/all-users', text: 'All Users', requiredPermission: 'view_all_users' },
            { to: '/users/active-users', text: 'Active Users', requiredPermission: 'manage_active_users' },
            { to: '/users/inactive-users', text: 'Inactive Users', requiredPermission: 'manage_inactive_users' },
          ],
        },
        {
          label: 'KYC Management', icon: <FiUserCheck />, key: 'kyc',
          requiredPermission: 'view_kyc',
          count: kycCounts.pending,
          links: [
            { to: '/kyc/kyc-assign', text: 'KYC Assign', count: kycCounts.pending, type: 'pending', requiredPermission: 'assign_kyc' },
            { to: '/kyc/kyc-list', text: 'KYC List', count: kycCounts.pending, type: 'pending', requiredPermission: 'view_kyc' },
          ],
        },
        {
          label: 'Affiliate Management', icon: <FiTrendingUp />, key: 'affiliate',
          requiredPermission: 'view_all_users',
          count: affiliateCounts.pendingRegistrations,
          links: [
            { to: '/affiliates/all-affiliates', text: 'All Affiliates', count: affiliateCounts.total, requiredPermission: 'view_all_users' },
            { to: '/affiliates/manage-commission', text: 'Manage Commission', requiredPermission: 'manage_promotional_content' },
            { to: '/affiliates/payout', text: 'Payouts', count: affiliateCounts.pendingPayouts, type: 'pending', requiredPermission: 'manage_promotional_content' },
          ],
        },
        {
          label: 'Login Logs & Security', icon: <FiLogIn />, key: 'loginLogs',
          requiredPermission: 'view_admin_profile',
          links: [
            { to: '/login-logs/all-logs', text: 'All Login Logs', requiredPermission: 'view_admin_profile' },
            { to: '/login-logs/failed-logins', text: 'Failed Login Attempts', requiredPermission: 'view_admin_profile' },
          ],
        },
        {
          label: 'Admin Role Management', icon: <FiShield />, key: 'adminRoles',
          requiredPermission: 'view_admin_profile',
          links: [
            { to: '/admin-roles/create-role', text: 'Create Role', requiredPermission: 'edit_admin_profile' },
            { to: '/admin-roles/role-list', text: 'Role List', requiredPermission: 'view_admin_profile' },
            { to: '/admin-roles/create-admin', text: 'Create Admin', requiredPermission: 'edit_admin_profile' },
          ],
        },
      ].map((item) => renderMenuItem(item))}

      {/* App Settings Section */}
      <SectionTitle title="App Settings" />
      {[
        {
          label: 'Event Management', icon: <FiCalendar />, key: 'event',
          requiredPermission: 'view_events',
          links: [
            { to: '/event-management/create-event', text: 'Create Event', requiredPermission: 'create_event' },
            { to: '/event-management/all-events', text: 'All Events', requiredPermission: 'view_events' },
          ],
        },
        {
          label: 'Notice Management', icon: <FiFileText />, key: 'notice',
          requiredPermission: 'create_notice',
          links: [{ to: '/notice-management/create-notice', text: 'Create Notice', requiredPermission: 'create_notice' }],
        },
        {
          label: 'Content Management', icon: <FiLayers />, key: 'content',
          requiredPermission: 'manage_banners',
          links: [
            { to: '/content/banner-and-sliders', text: 'Banners & Sliders', requiredPermission: 'manage_banners' },
            { to: '/content/promotional-content', text: 'Promotional Content', requiredPermission: 'manage_promotional_content' },
            { to: '/content/terms-and-conditions', text: 'Terms & Conditions', requiredPermission: 'manage_terms' },
            { to: '/content/faq', text: 'FAQ Management', requiredPermission: 'manage_faq' },
            { to: '/content/logo-and-favicon', text: 'Logo And Favicon', requiredPermission: 'manage_logo' },
          ],
        },
        {
          label: 'Notification Management', icon: <FiBell />, key: 'notifications',
          requiredPermission: 'view_notifications',
          links: [
            { to: '/notifications/send-notification', text: 'Send Notification', requiredPermission: 'send_notifications' },
            { to: '/notifications/all-notifications', text: 'All Notifications', requiredPermission: 'view_notifications' },
          ],
        },
        {
          label: 'Social Address', icon: <FiShare2 />, key: 'social',
          requiredPermission: 'manage_social_links',
          links: [{ to: '/social-address/social-links', text: 'All Social Links', requiredPermission: 'manage_social_links' }],
        },
      ].map((item) => renderMenuItem(item))}

      {/* Profile & Support Section */}
      {hasPermission('view_admin_profile') && (
        <>
          <SectionTitle title="Support" />
          <div className="mb-3">
            <NavLink 
              to="/admin-profile" 
              ref={(el) => {
                if (el && location.pathname === '/admin-profile') {
                  activeMenuItemRef.current = el;
                }
              }}
              className={({ isActive }) => `flex items-center justify-between w-full px-3 py-2.5 text-[15px] cursor-pointer rounded-lg transition-all ${isActive ? 'bg-[#d4af37] text-[#1a1c23] font-bold' : 'text-gray-400 hover:text-[#d4af37]'}`}
            >
              <span className="flex items-center gap-3"><FiUserCheck /> Admin Profile</span>
            </NavLink>
          </div>
        </>
      )}

      <div className="mt-4 pt-4 border-t border-gray-800">
        <button onClick={logout} className="flex items-center w-full px-3 py-2.5 text-gray-400 hover:text-red-500 transition-colors">
          <FiSettings className="mr-3" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;