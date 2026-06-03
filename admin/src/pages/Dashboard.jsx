import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { 
  FaUsers, 
  FaMoneyCheckAlt, 
  FaClock, 
  FaChartLine,
  FaHourglassHalf,
  FaUserTie,
  FaCalendarAlt,
  FaGift,
  FaWallet
} from 'react-icons/fa';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { FiRefreshCw, FiTrendingUp } from "react-icons/fi";
import { MdAccountBalanceWallet } from "react-icons/md";
import axios from "axios";
import group_img from "../assets/dashboard/group.png"
import wallet_img from "../assets/dashboard/wallet.png"
import credit_img from "../assets/dashboard/credit.png"
import taka_img from "../assets/dashboard/taka.png"
import bet_img from "../assets/dashboard/casino-chips.png"
import payment_img from "../assets/dashboard/payment.png"
import crypto_wallet from "../assets/dashboard/crypto-wallet.png"
import affilaite_img from "../assets/dashboard/referral.png"
import bonus_img from "../assets/dashboard/bonus.png"
import atm_wallet from "../assets/dashboard/atm.png"


const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const formatBangladeshDate = (dateString) => {
    const date = dateString ? new Date(dateString) : new Date();
    return date.toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${base_url}/api/admin/dashboard`);
      setDashboardData(response.data || {});
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setDashboardData({});
    } finally {
      setLoading(false);
    }
  };

  const getData = (path, defaultValue = 0) => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return defaultValue;
    const paths = path.split('.');
    let value = dashboardData;
    for (const p of paths) {
      if (value && typeof value === 'object' && p in value) {
        value = value[p];
      } else {
        return defaultValue;
      }
    }
    return value !== null && value !== undefined ? value : defaultValue;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const stats = {
    totalUsers: getData('data.users.totalUsers', 0),
    activeUsers: getData('data.users.activeUsers', 0),
    totalUserBalance: getData('data.users.totalBalance', 0),
    totalBonusBalance: getData('data.users.totalBonusBalance', 0),
    totalDeposits: getData('data.financial.totalDeposits', 0),
    totalWithdrawals: getData('data.financial.totalWithdrawals', 0),
    pendingDeposits: getData('data.pendingApprovals.deposits', 0),
    pendingWithdrawals: getData('data.pendingApprovals.withdrawals', 0),
    totalBetAmount: getData('data.gaming.totalBetAmount', 0),
    totalNetProfit: getData('data.gaming.totalNetProfit', 0),
    affiliateTotalEarnings: getData('data.affiliate.totalEarnings', 0),
    totalBonusGiven: getData('data.bonus.totalBonusGiven', 0),
    monthlyDeposits: getData('data.monthly.deposits', 0),
    recentUsers: getData('recentActivities.users', []),
    recentDeposits: getData('recentActivities.deposits', [])
  };

  // Full 10 Box Configuration
  const statusCards = [
    { title: 'Total Users', value: formatCurrency(stats.totalUsers), icon: group_img, color: 'border-indigo-500', iconColor: 'text-indigo-500' },
    { title: 'Platform Balance', value: `৳${formatCurrency(stats.totalUserBalance)}`, icon: wallet_img, color: 'border-green-500', iconColor: 'text-emerald-500' },
    { title: 'Total Deposits', value: `৳${formatCurrency(stats.totalDeposits)}`, icon: credit_img, color: 'border-indigo-500', iconColor: 'text-indigo-500' },
    { title: 'Total Withdraw', value: `৳${formatCurrency(stats.totalWithdrawals)}`, icon: taka_img, color: 'border-rose-500', iconColor: 'text-rose-500' },
    { title: 'Total Bets', value: `৳${formatCurrency(stats.totalBetAmount)}`, icon:bet_img, color: 'border-yellow-500', iconColor: 'text-amber-500' },
    { title: 'Pending Deposit', value: `৳${formatCurrency(stats.pendingDeposits)}`, icon: payment_img, color: 'border-sky-500', iconColor: 'text-cyan-500' },
    { title: 'Pending Withdraw', value: `৳${formatCurrency(stats.pendingWithdrawals)}`, icon:atm_wallet, color: 'border-orange-500', iconColor: 'text-orange-500' },
    { title: 'Affiliate', value: `৳${formatCurrency(stats.affiliateTotalEarnings)}`, icon:affilaite_img, color: 'border-purple-500', iconColor: 'text-purple-500' },
    { title: 'Total Bonus', value: `৳${formatCurrency(stats.totalBonusGiven)}`, icon: bonus_img, color: 'border-pink-500', iconColor: 'text-pink-500' },
    { title: 'Monthly In', value: `৳${formatCurrency(stats.monthlyDeposits)}`, icon: crypto_wallet, color: 'border-teal-500', iconColor: 'text-teal-500' }
  ];

  const chartData = [
    { name: 'Sat', dep: 4000, wit: 2400 },
    { name: 'Sun', dep: 3000, wit: 1398 },
    { name: 'Mon', dep: 2000, wit: 9800 },
    { name: 'Tue', dep: 2780, wit: 3908 },
    { name: 'Wed', dep: 1890, wit: 4800 },
    { name: 'Thu', dep: 2390, wit: 3800 },
    { name: 'Fri', dep: 3490, wit: 4300 },
  ];

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Header Box */}
          <div className=" rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Admin Dashboard</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-indigo-500" /> BD TIME: {formatBangladeshDate()}
              </p>
            </div>
            <button onClick={fetchDashboardData} className="w-full md:w-auto mt-4 md:mt-0 bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center justify-center gap-2">
              <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH SYSTEM
            </button>
          </div>

          {/* Metric Grid - Exactly 10 Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statusCards.map((card, index) => (
              <div key={index} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <div className={` ${card.iconColor}`}>
                    <img className='w-[40px]' src={card.icon} alt="" />
                  </div>
                  <FiTrendingUp className="text-gray-700" />
                </div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">{card.title}</p>
                <h2 className="text-xl font-bold text-white mt-2 leading-none">{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Chart Section Box */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500"></div> System Performance Flow
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorWit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                  <XAxis dataKey="name" stroke="#718096" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="#718096" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #2D3748' }} />
                  <Area type="monotone" dataKey="dep" stroke="#6366f1" strokeWidth={3} fill="url(#colorDep)" />
                  <Area type="monotone" dataKey="wit" stroke="#f43f5e" strokeWidth={3} fill="url(#colorWit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table Boxes Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Registrations Table Box */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-blue-400 uppercase tracking-widest">
                Latest Registrations
              </div>
              <table className="w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Player ID</th>
                    <th className="px-6 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {stats.recentUsers.slice(0, 5).map((user, i) => (
                    <tr key={i} className="hover:bg-[#1F2937] transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-white">{user.username}</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">#{user.player_id}</td>
                      <td className="px-6 py-4 text-right text-[10px] text-gray-400">{formatBangladeshDate(user.createdAt).split(',')[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Deposits Table Box */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-emerald-400 uppercase tracking-widest">
                Recent Deposits
              </div>
              <table className="w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {stats.recentDeposits.slice(0, 5).map((dep, i) => (
                    <tr key={i} className="hover:bg-[#1F2937] transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-white">{dep.userId?.username || 'Guest'}</td>
                      <td className="px-6 py-4 text-sm font-black text-emerald-500">৳{formatCurrency(dep.amount)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[9px] px-2 py-1 rounded ${dep.status === 'completed' ? 'bg-emerald-500/10' : 'bg-amber-500/10'} ${dep.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'} font-bold border border-emerald-500/20 uppercase`}>
                          {dep.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </section>
  );
};

export default Dashboard;