import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FiHome, 
  FiUser, 
  FiDollarSign, 
  FiCreditCard, 
  FiShield, 
  FiTrendingUp,
  FiUsers,
  FiShare2,
  FiBarChart2,
  FiLogOut 
} from 'react-icons/fi';
import { GiTakeMyMoney } from "react-icons/gi";

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("admintoken");
    localStorage.removeItem("affiliate");
    localStorage.removeItem("affiliatetoken");
    navigate("/login");
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <FiHome className="text-[18px]" />,
      to: '/affiliate/dashboard',
      description: 'Overview of your performance'
    },
    {
      label: 'My Profile',
      icon: <FiUser className="text-[18px]" />,
      to: '/affiliate/profile',
      description: 'Manage your account details'
    },
    {
      label: 'Earnings',
      icon: <FiDollarSign className="text-[18px]" />,
      to: '/affiliate/earnings',
      description: 'Track your commissions'
    },
    // {
    //   label: 'Payment Methods',
    //   icon: <FiCreditCard className="text-[18px]" />,
    //   to: '/affiliate/payment-methods',
    //   description: 'Configure payout options'
    // },
    {
      label: 'Referral Links',
      icon: <FiShare2 className="text-[18px]" />,
      to: '/affiliate/referral-links',
      description: 'Your affiliate links and codes'
    },
    {
      label: 'Referrals',
      icon: <FiUsers className="text-[18px]" />,
      to: '/affiliate/referrals',
      description: 'View your referral network'
    },
    // {
    //   label: 'Performance',
    //   icon: <FiBarChart2 className="text-[18px]" />,
    //   to: '/affiliate/performance',
    //   description: 'Analytics and reports'
    // },
    {
      label: 'Payout History',
      icon: <FiTrendingUp className="text-[18px]" />,
      to: '/affiliate/payout-history',
      description: 'View past payments'
    },
  ];

  return (
    <>
      <aside
        className={`transition-all no-scrollbar duration-300 fixed w-[70%] md:w-[40%] lg:w-[28%] xl:w-[17%] h-full z-[999] border-r border-white/10 text-sm shadow-2xl pt-[12vh] p-4 ${
          isOpen ? 'left-0 top-0' : 'left-[-120%] top-0'
        } bg-[#000514] text-white overflow-y-auto`}
      >
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        
        <div className="space-y-1">
          {menuItems.map(({ label, icon, to, description }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `flex items-center w-full px-3 py-3 text-[15px] lg:text-[16px] cursor-pointer transition-all duration-300 group ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-white font-semibold shadow-lg shadow-cyan-900/30 border-l-4 border-cyan-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1 hover:border-l-4 hover:border-cyan-500/50'
                }`
              }
            >
              <div className="flex items-center gap-3 w-full justify-start">
                <span className="group-hover:scale-110 group-hover:text-cyan-400 transition-all duration-300">
                  {icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{label}</div>
                </div>
              </div>
            </NavLink>
          ))}
        </div>
        <button
          onClick={() => setShowLogoutPopup(true)}
          className="flex items-center w-full px-3 py-3 text-[15px] lg:text-[16px] cursor-pointer rounded-lg transition-all duration-300 text-gray-400 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-600/10 hover:text-white hover:translate-x-1 mt-6 group border-white/10 hover:border-cyan-500/30"
        >
          <span className="flex items-center gap-3">
            <FiLogOut className="text-[18px] group-hover:scale-110 group-hover:text-cyan-400 transition-all duration-300" />
            <span className="font-medium">Logout</span>
          </span>
        </button>
      </aside>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-[#000514] rounded-lg p-6 w-[90%] max-w-md shadow-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Confirm Logout</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to log out? You will be redirected to the login page.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutPopup(false)}
                className="px-4 py-2 bg-white/10 text-white cursor-pointer rounded-md hover:bg-white/20 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-md cursor-pointer hover:brightness-110 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;