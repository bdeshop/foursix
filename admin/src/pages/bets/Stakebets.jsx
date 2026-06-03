import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown, FaEye, FaDownload, FaChevronDown, FaChevronUp, FaSpinner, FaFire, FaCrown, FaMoneyBillWave, FaTrophy, FaChartLine } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import axios from "axios";

const Stakebets = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stakeThreshold, setStakeThreshold] = useState(10000);
  const [topBettors, setTopBettors] = useState([]);
  const [biggestWins, setBiggestWins] = useState([]);
  
  const token = localStorage.getItem('token');
  const itemsPerPage = 20;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const [bets, setBets] = useState([]);
  const [allBets, setAllBets] = useState([]);
  
  const fetchBettingHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/betting-history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const transformedBets = response.data.data.map((bet, index) => ({
          id: bet._id?.$oid || `bet-${index}`,
          betId: bet.serial_number || `BT${String(index + 1).padStart(6, '0')}`,
          username: bet.original_username || bet.member_account,
          game: bet.game_uid || 'Unknown Game',
          game_name: bet.game_name || bet.game_type || 'Unknown Game',
          game_type: bet.game_type || 'Unknown',
          betAmount: bet.bet_amount || 0,
          winAmount: bet.win_amount || 0,
          netAmount: bet.net_amount || 0,
          balance_after: bet.balance_after || 0,
          balance_before: bet.balance_before || 0,
          status: bet.status ? bet.status.toLowerCase() : 'unknown',
          date: bet.transaction_time?.$date || bet.createdAt?.$date || new Date().toISOString(),
          transaction_time: bet.transaction_time?.$date || '',
          processed_at: bet.processed_at?.$date || '',
          platform: bet.platform || 'Web',
          device_info: bet.device_info || 'Unknown',
          currency: bet.currency_code || 'BDT',
          balanceBefore: bet.balance_before || 0,
          balanceAfter: bet.balance_after || 0,
          original_data: bet
        }));
        
        setAllBets(transformedBets);
        
        const highStakeBets = transformedBets.filter(bet => bet.betAmount >= stakeThreshold);
        setBets(highStakeBets);
        
        calculateTopBettors(highStakeBets);
        calculateBiggestWins(highStakeBets);
      } else {
        setError('Failed to fetch betting history');
        toast.error('Failed to fetch betting history');
      }
    } catch (err) {
      console.error('Error fetching betting history:', err);
      setError('Error loading betting history');
      toast.error('Error loading betting history');
    } finally {
      setLoading(false);
    }
  };

  const calculateTopBettors = (betData) => {
    const bettorMap = {};
    
    betData.forEach(bet => {
      if (!bettorMap[bet.username]) {
        bettorMap[bet.username] = {
          username: bet.username,
          totalBets: 0,
          totalBetAmount: 0,
          totalWinAmount: 0,
          netProfit: 0,
          highestBet: 0,
          winRate: 0
        };
      }
      
      bettorMap[bet.username].totalBets += 1;
      bettorMap[bet.username].totalBetAmount += bet.betAmount;
      bettorMap[bet.username].totalWinAmount += bet.winAmount;
      bettorMap[bet.username].netProfit += bet.netAmount;
      bettorMap[bet.username].highestBet = Math.max(bettorMap[bet.username].highestBet, bet.betAmount);
    });
    
    Object.values(bettorMap).forEach(bettor => {
      const betsByUser = betData.filter(b => b.username === bettor.username);
      const wins = betsByUser.filter(b => b.status === 'won').length;
      bettor.winRate = betsByUser.length > 0 ? (wins / betsByUser.length) * 100 : 0;
    });
    
    const sortedBettors = Object.values(bettorMap)
      .sort((a, b) => b.totalBetAmount - a.totalBetAmount)
      .slice(0, 5);
    
    setTopBettors(sortedBettors);
  };

  const calculateBiggestWins = (betData) => {
    const wins = betData
      .filter(bet => bet.status === 'won' && bet.winAmount > 0)
      .sort((a, b) => b.winAmount - a.winAmount)
      .slice(0, 5);
    
    setBiggestWins(wins);
  };

  useEffect(() => {
    fetchBettingHistory();
  }, [stakeThreshold]);

  const games = ['all', ...Array.from(new Set(bets.map(bet => bet.game_type).filter(Boolean)))];
  const statuses = ['all', 'won', 'lost', 'pending', 'draw', 'refunded'];
  const dateRanges = ['all', 'Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Custom'];
  const stakeThresholds = [5000, 10000, 25000, 50000, 100000, 250000];

  const sortedBets = React.useMemo(() => {
    let sortableItems = [...bets];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [bets, sortConfig]);

  const filteredBets = sortedBets.filter(bet => {
    const matchesSearch = bet.betId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          bet.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bet.game_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = gameFilter === 'all' || bet.game_type === gameFilter;
    const matchesStatus = statusFilter === 'all' || bet.status === statusFilter.toLowerCase();
    
    return matchesSearch && matchesGame && matchesStatus;
  });

  const totalPages = Math.ceil(filteredBets.length / itemsPerPage);
  const currentItems = filteredBets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-500" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-indigo-500" />;
    return <FaSortDown className="text-indigo-500" />;
  };

  const toggleRow = (betId) => {
    setExpandedRows(prev => ({
      ...prev,
      [betId]: !prev[betId]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactCurrency = (amount) => {
    if (amount >= 1000000) {
      return `৳${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `৳${(amount / 1000).toFixed(1)}K`;
    }
    return `৳${amount}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'won': { color: 'bg-green-900/50 text-green-300 border border-green-700', text: 'Won', icon: '🏆' },
      'lost': { color: 'bg-red-900/50 text-red-300 border border-red-700', text: 'Lost' },
      'pending': { color: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700', text: 'Pending' },
      'draw': { color: 'bg-blue-900/50 text-blue-300 border border-blue-700', text: 'Draw' },
      'refunded': { color: 'bg-purple-900/50 text-purple-300 border border-purple-700', text: 'Refunded' }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { color: 'bg-gray-800 text-gray-400 border border-gray-700', text: status };
    return (
      <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center ${statusInfo.color}`}>
        {statusInfo.icon && <span className="mr-1">{statusInfo.icon}</span>}
        {statusInfo.text}
      </div>
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gameFilter, statusFilter, dateFilter, stakeThreshold]);

  const totalBetAmount = filteredBets.reduce((sum, bet) => sum + bet.betAmount, 0);
  const totalWinAmount = filteredBets.reduce((sum, bet) => sum + bet.winAmount, 0);
  const totalNetProfit = filteredBets.reduce((sum, bet) => sum + bet.netAmount, 0);
  const averageBetSize = filteredBets.length > 0 ? totalBetAmount / filteredBets.length : 0;
  const biggestBet = filteredBets.length > 0 ? Math.max(...filteredBets.map(bet => bet.betAmount)) : 0;

  const handleRefresh = () => {
    fetchBettingHistory();
    toast.success('High stake data refreshed');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredBets, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `high-stake-bets-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Data exported successfully');
  };

  // Pagination with ellipsis
  const getPaginationItems = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="flex justify-center items-center py-8">
                  <FaSpinner className="animate-spin text-indigo-500 text-2xl" />
                </div>
                <p className="mt-4 text-gray-500">Loading high stake bets...</p>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (error && bets.length === 0) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <p className="text-red-500 text-lg mb-4">{error}</p>
                <button 
                  onClick={fetchBettingHistory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase flex items-center">
                  High Stake Bets
                </h1>
                <p className="text-xs font-bold text-gray-500 mt-1">Monitor high-value betting activities (৳{stakeThreshold.toLocaleString()}+)</p>
              </div>
              <button 
                onClick={handleRefresh}
                className="w-full md:w-auto mt-4 md:mt-0 bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <FaSpinner className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
            
            {/* Stake Threshold Control */}
            <div className="bg-[#161B22] border border-indigo-800/50 rounded-lg p-5 mb-6 shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-sm font-semibold text-indigo-400 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-indigo-500" />
                    Stake Threshold Configuration
                  </h3>
                  <p className="text-xs text-gray-500">Adjust minimum bet amount for high stake classification</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2 text-sm">Min: ৳</span>
                    <input
                      type="number"
                      value={stakeThreshold}
                      onChange={(e) => setStakeThreshold(Number(e.target.value))}
                      className="w-32 px-3 py-2 bg-[#0F111A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                      min="1000"
                      step="1000"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stakeThresholds.map((threshold) => (
                      <button
                        key={threshold}
                        onClick={() => setStakeThreshold(threshold)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          stakeThreshold === threshold
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-[#0F111A] text-gray-400 border border-gray-700 hover:bg-gray-800'
                        }`}
                      >
                        ৳{threshold.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-[#161B22] border-l-4 border-indigo-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">High Stake Bets</p>
                    <p className="text-xl font-bold text-white mt-2 leading-none">{filteredBets.length}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Total qualifying bets</p>
                  </div>
                  <div className="p-3 bg-indigo-900/30 rounded-lg">
                    <FaFire className="text-xl text-orange-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#161B22] border-l-4 border-green-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Total Staked</p>
                    <p className="text-xl font-bold text-white mt-2 leading-none">{formatCompactCurrency(totalBetAmount)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Sum of all high stakes</p>
                  </div>
                  <div className="p-3 bg-blue-900/30 rounded-lg">
                    <FaMoneyBillWave className="text-xl text-blue-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#161B22] border-l-4 border-amber-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Total Payout</p>
                    <p className="text-xl font-bold text-white mt-2 leading-none">{formatCompactCurrency(totalWinAmount)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Amount paid to players</p>
                  </div>
                  <div className="p-3 bg-green-900/30 rounded-lg">
                    <FaTrophy className="text-xl text-green-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#161B22] border-l-4 border-purple-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Net Profit</p>
                    <p className={`text-xl font-bold mt-2 leading-none ${totalNetProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCompactCurrency(Math.abs(totalNetProfit))}
                      <span className="text-xs ml-1">{totalNetProfit >= 0 ? 'Profit' : 'Loss'}</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">Platform earnings</p>
                  </div>
                  <div className={`p-3 rounded-lg ${totalNetProfit >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                    <FaChartLine className={`text-xl ${totalNetProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
              </div>
              
              <div className="bg-[#161B22] border-l-4 border-pink-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Avg. Bet Size</p>
                    <p className="text-xl font-bold text-white mt-2 leading-none">{formatCompactCurrency(averageBetSize)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Per high stake bet</p>
                  </div>
                  <div className="p-3 bg-purple-900/30 rounded-lg">
                    <FaCrown className="text-xl text-purple-500" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Bettors & Biggest Wins Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Top High Stake Bettors */}
              <div className="lg:col-span-2 bg-[#161B22] rounded-lg shadow-lg border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-indigo-400 flex items-center">
                    <FaCrown className="mr-2 text-yellow-500" />
                    Top High Stake Bettors
                  </h3>
                  <p className="text-xs text-gray-500">Players with highest total stakes (৳{stakeThreshold.toLocaleString()}+)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1C2128]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">Player</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">Total Staked</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">Bets</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">Win Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">Net Result</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#161B22] divide-y divide-gray-800">
                      {topBettors.map((bettor, index) => (
                        <tr key={bettor.username} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' :
                              index === 1 ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white' :
                              index === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white' :
                              'bg-gray-800 text-gray-400'
                            } font-bold text-sm`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-white">{bettor.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-white">{formatCompactCurrency(bettor.totalBetAmount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-400">{bettor.totalBets}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-700 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-gradient-to-r from-green-600 to-green-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min(bettor.winRate, 100)}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-gray-300">{bettor.winRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`font-bold ${bettor.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCompactCurrency(bettor.netProfit)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Biggest Wins */}
              <div className="bg-[#161B22] rounded-lg shadow-lg border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800">
                  <h3 className="text-sm font-semibold text-indigo-400 flex items-center">
                    <FaTrophy className="mr-2 text-green-500" />
                    Biggest Wins
                  </h3>
                  <p className="text-xs text-gray-500">Largest payouts from high stake bets</p>
                </div>
                <div className="p-4 space-y-4">
                  {biggestWins.map((win, index) => (
                    <div key={win.id} className="p-4 bg-gradient-to-r from-green-900/20 to-[#161B22] rounded-lg border border-green-800/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 text-xs font-bold ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' :
                              index === 1 ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white' :
                              'bg-gradient-to-r from-green-700 to-green-600 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <span className="font-semibold text-white">{win.username}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{win.game_name}</p>
                          <p className="text-xs text-gray-500">{formatDate(win.date)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-green-500">
                            {formatCompactCurrency(win.winAmount)}
                          </div>
                          <p className="text-xs text-gray-400">Stake: {formatCompactCurrency(win.betAmount)}</p>
                          <p className="text-xs text-green-500 font-semibold">
                            Profit: {formatCompactCurrency(win.netAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {biggestWins.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No big wins recorded yet</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Filters Section */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-500"></div>
                  Filters & Search
                </h3>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-500">
                    Showing <span className="font-bold text-indigo-400">{filteredBets.length}</span> high stake bets
                  </span>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setGameFilter('all');
                      setStatusFilter('all');
                      setDateFilter('all');
                    }}
                    className="px-3 py-1 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800 rounded-lg hover:bg-indigo-900/30 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 placeholder-gray-500 transition-all duration-200 text-sm"
                    placeholder="Search bet ID, username, or game..."
                  />
                </div>
                
                <div>
                  <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 text-sm"
                  >
                    <option value="all">All Games</option>
                    {games.filter(game => game !== 'all').map((game, index) => (
                      <option key={index} value={game}>{game}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="pending">Pending</option>
                    <option value="draw">Draw</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                
                <div>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 text-sm"
                  >
                    {dateRanges.map((range, index) => (
                      <option key={index} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* High Stake Bets Table */}
            <div className="bg-[#161B22] rounded-lg shadow-lg overflow-hidden border border-gray-800 mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-[#1C2128]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        Bet Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        Player
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={() => requestSort('betAmount')}
                      >
                        <div className="flex items-center">
                          Stake Amount
                          {getSortIcon('betAmount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={() => requestSort('winAmount')}
                      >
                        <div className="flex items-center">
                          Win Amount
                          {getSortIcon('winAmount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={() => requestSort('netAmount')}
                      >
                        <div className="flex items-center">
                          Net Result
                          {getSortIcon('netAmount')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={() => requestSort('date')}
                      >
                        <div className="flex items-center">
                          Date & Time
                          {getSortIcon('date')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#161B22] divide-y divide-gray-800">
                    {currentItems.length > 0 ? (
                      currentItems.map((bet, index) => (
                        <React.Fragment key={bet.id}>
                          <tr className="hover:bg-[#1F2937] transition-colors cursor-pointer" onClick={() => toggleRow(bet.id)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-300">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-semibold text-white">{bet.betId}</div>
                                <div className="text-xs text-gray-400">{bet.game_name}</div>
                                <div className="text-xs text-gray-500">{bet.game_type}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-semibold text-white">{bet.username}</div>
                                <div className="text-xs text-gray-500">{bet.platform}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-white">
                                {formatCurrency(bet.betAmount)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Balance: {formatCompactCurrency(bet.balance_after)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-lg font-bold ${bet.winAmount > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                {formatCurrency(bet.winAmount)}
                              </div>
                              {bet.winAmount > bet.betAmount && (
                                <div className="text-xs text-green-500 font-semibold">
                                  +{((bet.winAmount / bet.betAmount - 1) * 100).toFixed(1)}%
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-lg font-bold ${bet.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {bet.netAmount >= 0 ? '+' : ''}{formatCurrency(bet.netAmount)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(bet.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">{formatDate(bet.date)}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(bet.date).toLocaleTimeString('en-US', { hour12: false })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(bet.id);
                                }}
                                className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center text-xs"
                              >
                                {expandedRows[bet.id] ? (
                                  <>
                                    <FaChevronUp className="mr-1" /> Hide
                                  </>
                                ) : (
                                  <>
                                    <FaEye className="mr-1" /> View
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Details */}
                          {expandedRows[bet.id] && (
                            <tr className="bg-[#1F2937]">
                              <td colSpan="9" className="px-6 py-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700 shadow-sm">
                                    <h4 className="font-semibold text-indigo-400 mb-3 pb-2 border-b border-gray-700 text-sm">Balance Summary</h4>
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Before Bet:</span>
                                        <span className="text-sm font-bold text-white">{formatCurrency(bet.balanceBefore)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">After Bet:</span>
                                        <span className="text-sm font-bold text-white">{formatCurrency(bet.balanceAfter)}</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                        <span className="text-sm text-gray-400 font-semibold">Change:</span>
                                        <span className={`text-sm font-bold ${bet.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                          {bet.netAmount >= 0 ? '+' : ''}{formatCurrency(bet.netAmount)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700 shadow-sm">
                                    <h4 className="font-semibold text-indigo-400 mb-3 pb-2 border-b border-gray-700 text-sm">Bet Details</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Game:</span>
                                        <span className="text-sm font-semibold text-white">{bet.game_name}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Type:</span>
                                        <span className="text-sm text-gray-300">{bet.game_type}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Currency:</span>
                                        <span className="text-sm font-semibold text-white">{bet.currency}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Device:</span>
                                        <span className="text-sm text-gray-300">{bet.device_info}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700 shadow-sm">
                                    <h4 className="font-semibold text-indigo-400 mb-3 pb-2 border-b border-gray-700 text-sm">Timestamps</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Bet Placed:</span>
                                        <span className="text-xs text-gray-300">{formatDate(bet.date)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Processed:</span>
                                        <span className="text-xs text-gray-300">{formatDate(bet.processed_at) || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Transaction:</span>
                                        <span className="text-xs text-gray-300">{formatDate(bet.transaction_time)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700 shadow-sm">
                                    <h4 className="font-semibold text-indigo-400 mb-3 pb-2 border-b border-gray-700 text-sm">Amount Summary</h4>
                                    <div className="space-y-3">
                                      <div className={`p-3 rounded-lg ${bet.betAmount >= stakeThreshold * 5 ? 'bg-red-900/30 border border-red-800' : 'bg-gray-800 border border-gray-700'}`}>
                                        <div className="text-xs text-gray-400">Stake Amount</div>
                                        <div className="text-xl font-bold text-white">{formatCurrency(bet.betAmount)}</div>
                                        {bet.betAmount >= stakeThreshold * 5 && (
                                          <div className="text-xs text-red-400 font-semibold mt-1">⚠️ Ultra High Stake</div>
                                        )}
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-400">Win Amount:</div>
                                        <div className={`text-lg font-bold ${bet.winAmount > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                                          {formatCurrency(bet.winAmount)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="p-4 bg-gray-800 rounded-full mb-4">
                              <FaFire className="text-3xl text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No High Stake Bets Found</h3>
                            <p className="text-gray-400 mb-4">No bets match the current threshold (৳{stakeThreshold.toLocaleString()}+)</p>
                            <button
                              onClick={() => setStakeThreshold(5000)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm"
                            >
                              Lower Threshold to ৳5,000
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination */}
            {!loading && filteredBets.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between bg-[#161B22] px-6 py-4 rounded-lg shadow-lg border border-gray-800">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Showing <span className="font-semibold text-gray-300">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-semibold text-gray-300">
                        {Math.min(currentPage * itemsPerPage, filteredBets.length)}
                      </span> of{' '}
                      <span className="font-semibold text-gray-300">{filteredBets.length}</span> high stake bets
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 rounded-l-lg border text-sm font-medium transition-colors ${
                          currentPage === 1 
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed border-gray-700' 
                            : 'bg-[#161B22] text-gray-300 hover:bg-gray-700 border-gray-700'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {getPaginationItems().map((page, index) => (
                        page === '...' ? (
                          <span key={`dots-${index}`} className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-[#161B22] text-sm font-medium text-gray-500">
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'z-10 bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-[#161B22] border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-4 py-2 rounded-r-lg border text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed border-gray-700'
                            : 'bg-[#161B22] text-gray-300 hover:bg-gray-700 border-gray-700'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Stakebets;