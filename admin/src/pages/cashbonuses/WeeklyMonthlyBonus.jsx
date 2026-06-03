import React, { useState, useEffect } from 'react';
import { 
  FaCalendarWeek, FaPercentage, FaGift, FaSpinner, 
  FaInfoCircle, FaUsers, FaMoneyBillWave, FaClock, 
  FaSearch, FaCheckCircle, FaTimesCircle, FaChartLine,
  FaAward, FaHistory, FaWallet
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { MdCalendarMonth } from "react-icons/md";

const WeeklyMonthlyBonus = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('weekly');
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [bonusHistory, setBonusHistory] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [distributionResult, setDistributionResult] = useState(null);

  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Get admin info from localStorage - FIXED
  const getAdminInfo = () => {
    try {
      // Try multiple possible storage keys
      const adminData = localStorage.getItem('adminData');
      
      if (adminData) {
        const admin = JSON.parse(adminData);
        return {
          id: admin.id,
          username: admin.name
        };
      }
      
      // Try to get from token if available
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      if (token) {
        // Decode token to get admin info
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(base64));
          return {
            id: decoded.id || decoded._id || decoded.userId,
            username: decoded.username || decoded.name || decoded.email?.split('@')[0] || 'admin'
          };
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
      
      // Default fallback
      return {
        id: 'admin',
        username: 'admin'
      };
    } catch (error) {
      console.error('Error getting admin info:', error);
      return {
        id: 'admin',
        username: 'admin'
      };
    }
  };

  // Fetch eligible users based on active tab
  const fetchEligibleUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await axios.get(`${base_url}/api/admin/bonus/eligible-users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { bonusType: activeTab }
      });
      
      if (response.data.success) {
        setEligibleUsers(response.data.users || []);
        setSummaryStats(response.data.totals);
      }
    } catch (error) {
      console.error('Error fetching eligible users:', error);
      toast.error('Failed to fetch eligible users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch bonus history
  const fetchBonusHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await axios.get(`${base_url}/api/admin/bonus/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });
      
      if (response.data.success) {
        setBonusHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching bonus history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchEligibleUsers();
    fetchBonusHistory();
  }, [activeTab]);

  // Filter users based on search term
  const getFilteredUsers = () => {
    if (!searchTerm.trim()) return eligibleUsers;
    
    const search = searchTerm.toLowerCase();
    return eligibleUsers.filter(user => 
      user.username?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.player_id?.toLowerCase().includes(search)
    );
  };

  // Distribute Weekly Bonus - FIXED
  const handleWeeklyBonus = async () => {
    setIsSubmitting(true);
    setDistributionResult(null);
    
    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const adminInfo = getAdminInfo();
      
      console.log('Admin Info being sent:', adminInfo); // Debug log
      
      const response = await axios.post(`${base_url}/api/admin/bonus/weekly`, 
        {
          processedBy: adminInfo.username,
          notes: 'Weekly bonus distribution'
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        setDistributionResult({
          success: true,
          data: response.data.data
        });
        // Refresh data
        fetchEligibleUsers();
        fetchBonusHistory();
      } else {
        toast.error(response.data.message);
        setDistributionResult({
          success: false,
          message: response.data.message
        });
      }
    } catch (error) {
      console.error('Error distributing weekly bonus:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to distribute weekly bonus';
      toast.error(errorMsg);
      setDistributionResult({
        success: false,
        message: errorMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Distribute Monthly Bonus - FIXED
  const handleMonthlyBonus = async () => {
    setIsSubmitting(true);
    setDistributionResult(null);
    
    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const adminInfo = getAdminInfo();
      
      console.log('Admin Info being sent:', adminInfo); // Debug log
      
      const response = await axios.post(`${base_url}/api/admin/bonus/monthly`, 
        {
          processedBy: adminInfo.username,
          notes: 'Monthly bonus distribution'
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        setDistributionResult({
          success: true,
          data: response.data.data
        });
        // Refresh data
        fetchEligibleUsers();
        fetchBonusHistory();
      } else {
        toast.error(response.data.message);
        setDistributionResult({
          success: false,
          message: response.data.message
        });
      }
    } catch (error) {
      console.error('Error distributing monthly bonus:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to distribute monthly bonus';
      toast.error(errorMsg);
      setDistributionResult({
        success: false,
        message: errorMsg
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = getFilteredUsers();
  const bonusRate = activeTab === 'weekly' ? '0.8%' : '0.5%';
  const totalPotentialBonus = filteredUsers.reduce((sum, user) => sum + (user.potentialBonus || 0), 0);

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>

          {/* Page Header */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Weekly & Monthly Bonus</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaAward className="text-amber-500" /> Automatically distribute bonuses based on user betting activity
              </p>
            </div>
            <button
              onClick={() => { fetchEligibleUsers(); fetchBonusHistory(); }}
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-[#1F2937] rounded-lg hover:bg-[#374151] transition-colors text-sm"
            >
              <FiRefreshCw className="text-amber-400" /> Refresh
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-800">
            <button
              onClick={() => { setActiveTab('weekly'); setDistributionResult(null); }}
              className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'weekly'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <FaCalendarWeek /> Weekly Bonus (0.8%)
            </button>
            <button
              onClick={() => { setActiveTab('monthly'); setDistributionResult(null); }}
              className={`px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'monthly'
                  ? 'text-amber-400 border-b-2 border-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <MdCalendarMonth /> Monthly Bonus (0.5%)
            </button>
          </div>

          {/* Summary Stats Cards */}
          {summaryStats && summaryStats.totalUsers > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-[9px] text-gray-500 uppercase font-black">Eligible Users</p>
                <p className="text-2xl font-bold text-amber-400">{summaryStats.totalUsers}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-[9px] text-gray-500 uppercase font-black">Total Bet Amount</p>
                <p className="text-2xl font-bold text-white">৳{summaryStats.totalBetAmount?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-[9px] text-gray-500 uppercase font-black">Bonus Rate</p>
                <p className="text-2xl font-bold text-emerald-400">{bonusRate}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-[9px] text-gray-500 uppercase font-black">Total Bonus to Distribute</p>
                <p className="text-2xl font-bold text-purple-400">৳{totalPotentialBonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column - Distribute Bonus */}
            <div className="lg:col-span-2 space-y-5">

              {/* Distribute Bonus Section */}
              <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500"></div> 
                    <FaChartLine className="text-amber-500" /> 
                    Distribute {activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Bonus
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <FaPercentage className="text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {activeTab === 'weekly' ? 'Weekly Bonus Rate: 0.8%' : 'Monthly Bonus Rate: 0.5%'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Users receive {bonusRate} of their {activeTab} bet amount directly to their balance
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center text-xs">
                      <div className="p-2 bg-[#0F111A] rounded">
                        <p className="text-gray-500">Min Bet Amount</p>
                        <p className="text-amber-400 font-bold">Any amount &gt; 0</p>
                      </div>
                      <div className="p-2 bg-[#0F111A] rounded">
                        <p className="text-gray-500">Max Bonus</p>
                        <p className="text-amber-400 font-bold">Unlimited</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={activeTab === 'weekly' ? handleWeeklyBonus : handleMonthlyBonus}
                    disabled={isSubmitting || (summaryStats?.totalUsers === 0)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <><FaSpinner className="animate-spin" /> Distributing Bonus...</>
                    ) : (
                      <><FaGift /> Distribute {activeTab === 'weekly' ? 'Weekly' : 'Monthly'} Bonus Now</>
                    )}
                  </button>

                  {summaryStats?.totalUsers === 0 && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                      No eligible users found for {activeTab} bonus
                    </p>
                  )}
                </div>
              </div>

              {/* Distribution Results */}
              {distributionResult && (
                <div className={`rounded-lg p-5 ${
                  distributionResult.success 
                    ? 'bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-rose-900/20 to-red-900/20 border border-rose-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    {distributionResult.success ? (
                      <FaCheckCircle className="text-emerald-400" />
                    ) : (
                      <FaTimesCircle className="text-rose-400" />
                    )}
                    <p className={`text-sm font-bold uppercase tracking-wider ${
                      distributionResult.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {distributionResult.success ? 'Distribution Complete' : 'Distribution Failed'}
                    </p>
                  </div>
                  
                  {distributionResult.success && distributionResult.data && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-[#0F111A] rounded">
                          <p className="text-[9px] text-gray-500 uppercase">Successful</p>
                          <p className="text-xl font-bold text-emerald-400">{distributionResult.data.successfulCount}</p>
                        </div>
                        <div className="p-3 bg-[#0F111A] rounded">
                          <p className="text-[9px] text-gray-500 uppercase">Failed</p>
                          <p className="text-xl font-bold text-rose-400">{distributionResult.data.failedCount}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded">
                        <p className="text-[9px] text-gray-500 uppercase">Total Bonus Distributed</p>
                        <p className="text-xl font-bold text-amber-400">৳{distributionResult.data.totalBonusAmount?.toLocaleString()}</p>
                      </div>
                      {distributionResult.data.weekNumber && (
                        <div className="p-3 bg-[#0F111A] rounded">
                          <p className="text-[9px] text-gray-500 uppercase">Distribution Period</p>
                          <p className="text-xs text-gray-300">Week {distributionResult.data.weekNumber}, {distributionResult.data.year}</p>
                        </div>
                      )}
                      {distributionResult.data.monthName && (
                        <div className="p-3 bg-[#0F111A] rounded">
                          <p className="text-[9px] text-gray-500 uppercase">Distribution Period</p>
                          <p className="text-xs text-gray-300">{distributionResult.data.monthName} {distributionResult.data.year}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!distributionResult.success && (
                    <p className="text-sm text-gray-300">{distributionResult.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Eligible Users Preview */}
            <div className="space-y-5">
              
              {/* Eligible Users Section */}
              <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-500"></div> 
                    <FaUsers className="text-amber-500" /> 
                    Eligible Users ({bonusRate} Bonus)
                  </p>
                </div>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                  <input
                    type="text"
                    placeholder="Search users by username, email, or player ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                
                {/* Users List */}
                {loadingUsers ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="animate-spin text-amber-500 text-2xl" />
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto border border-gray-800 rounded-lg bg-[#0F111A]">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        {searchTerm ? 'No users found matching your search' : 'No eligible users found for this period'}
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <div
                          key={user.userId}
                          className="p-3 border-b border-gray-800 hover:bg-[#1F2937] transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{user.username}</p>
                              <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                                {user.email && <span>{user.email}</span>}
                                {user.player_id && <span>{user.player_id}</span>}
                              </div>
                              <div className="flex gap-4 mt-2 text-xs">
                                <span className="text-gray-500">Bet Amount:</span>
                                <span className="text-amber-400 font-medium">৳{user.betAmount?.toLocaleString()}</span>
                              </div>
                              <div className="flex gap-4 mt-1 text-xs">
                                <span className="text-gray-500">Current Balance:</span>
                                <span className="text-white font-medium">৳{user.currentBalance?.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-500">Bonus</p>
                              <p className="text-sm font-bold text-emerald-400">+৳{user.potentialBonus?.toFixed(2)}</p>
                              <p className="text-[9px] text-gray-500 mt-1">New Balance</p>
                              <p className="text-xs font-medium text-amber-400">৳{user.newBalance?.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
              </div>
            </div>
          </div>

          {/* Bonus History Section */}
          <div className="mt-8">
            <div className="bg-[#161B22] border border-gray-800 rounded-lg">
              <div className="bg-[#1C2128] px-5 py-3 border-b border-gray-800 flex justify-between items-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                  <FaHistory className="text-amber-500" /> Recent Bonus Distribution History
                </p>
                <button
                  onClick={() => fetchBonusHistory()}
                  className="text-[10px] text-gray-500 hover:text-amber-400 transition-colors"
                >
                  <FiRefreshCw className="inline mr-1" /> Refresh
                </button>
              </div>
              <div className="overflow-x-auto p-5">
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <FaSpinner className="animate-spin text-amber-500 text-2xl" />
                  </div>
                ) : bonusHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No bonus distribution history available
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-[9px] text-gray-500 uppercase tracking-wider border-b border-gray-800">
                      <tr>
                        <th className="text-left py-3 px-2">Date</th>
                        <th className="text-left py-3 px-2">Bonus Type</th>
                        <th className="text-left py-3 px-2">User</th>
                        <th className="text-left py-3 px-2">Bet Amount</th>
                        <th className="text-left py-3 px-2">Bonus Amount</th>
                        <th className="text-left py-3 px-2">Rate</th>
                        <th className="text-left py-3 px-2">Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bonusHistory.map((bonus) => (
                        <tr key={bonus._id} className="border-b border-gray-800/50 hover:bg-[#1F2937] transition-colors">
                          <td className="py-3 px-2 text-[10px] text-gray-400">
                            {new Date(bonus.distributionDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                              bonus.bonusType === 'weekly' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {bonus.bonusType}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-xs text-white">{bonus.username}</td>
                          <td className="py-3 px-2 text-xs text-amber-400">৳{bonus.betAmount?.toLocaleString()}</td>
                          <td className="py-3 px-2 text-xs text-emerald-400">+৳{bonus.amount?.toLocaleString()}</td>
                          <td className="py-3 px-2 text-[10px] text-gray-400">
                            {bonus.bonusType === 'weekly' ? '0.8%' : '0.5%'}
                          </td>
                          <td className="py-3 px-2 text-[10px] text-gray-400">
                            {bonus.bonusType === 'weekly' 
                              ? `Week ${bonus.weekNumber}, ${bonus.year}`
                              : `${getMonthName(bonus.month)} ${bonus.year}`
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

// Helper function to get month name
const getMonthName = (month) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[month - 1];
};

export default WeeklyMonthlyBonus;