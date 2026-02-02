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
  const [stakeThreshold, setStakeThreshold] = useState(10000); // Minimum bet amount to be considered high stake
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
        
        // Filter high stake bets
        const highStakeBets = transformedBets.filter(bet => bet.betAmount >= stakeThreshold);
        setBets(highStakeBets);
        
        // Calculate top bettors
        calculateTopBettors(highStakeBets);
        
        // Calculate biggest wins
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
    
    // Calculate win rate for each bettor
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
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-orange-500" />;
    return <FaSortDown className="text-orange-500" />;
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
      'won': { color: 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200', text: 'Won', icon: '🏆' },
      'lost': { color: 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200', text: 'Lost' },
      'pending': { color: 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200', text: 'Pending' },
      'draw': { color: 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200', text: 'Draw' },
      'refunded': { color: 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200', text: 'Refunded' }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { color: 'bg-gray-100 text-gray-800', text: status };
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

  if (loading) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="flex justify-center items-center py-8">
                  <FaSpinner className="animate-spin text-orange-500 text-2xl" />
                </div>
                <p className="mt-4 text-gray-600">Loading high stake bets...</p>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                  <FaCrown className="mr-2 text-yellow-500" />
                  High Stake Bets
                  <span className="ml-3 text-sm px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full">
                    VIP Zone
                  </span>
                </h1>
                <p className="text-gray-600 mt-1">Monitor high-value betting activities (৳{stakeThreshold.toLocaleString()}+)</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleRefresh}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all shadow-sm"
                >
                  <FaSpinner className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Stake Threshold Control */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 mb-6 border border-orange-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-orange-500" />
                    Stake Threshold Configuration
                  </h3>
                  <p className="text-sm text-gray-600">Adjust minimum bet amount for high stake classification</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-gray-700 mr-2">Min: ৳</span>
                    <input
                      type="number"
                      value={stakeThreshold}
                      onChange={(e) => setStakeThreshold(Number(e.target.value))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      min="1000"
                      step="1000"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {stakeThresholds.map((threshold) => (
                      <button
                        key={threshold}
                        onClick={() => setStakeThreshold(threshold)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                          stakeThreshold === threshold
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">High Stake Bets</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">{filteredBets.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Total qualifying bets</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-50 rounded-lg">
                    <FaFire className="text-2xl text-orange-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Staked</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">{formatCompactCurrency(totalBetAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">Sum of all high stakes</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg">
                    <FaMoneyBillWave className="text-2xl text-blue-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payout</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">{formatCompactCurrency(totalWinAmount)}</p>
                    <p className="text-xs text-gray-500 mt-1">Amount paid to players</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-100 to-green-50 rounded-lg">
                    <FaTrophy className="text-2xl text-green-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl shadow-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Profit</p>
                    <p className={`text-2xl md:text-3xl font-bold mt-1 ${totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCompactCurrency(Math.abs(totalNetProfit))}
                      <span className="text-sm ml-1">{totalNetProfit >= 0 ? 'Profit' : 'Loss'}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
                  </div>
                  <div className={`p-3 rounded-lg ${totalNetProfit >= 0 ? 'bg-gradient-to-r from-green-100 to-green-50' : 'bg-gradient-to-r from-red-100 to-red-50'}`}>
                    <FaChartLine className={`text-2xl ${totalNetProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Bet Size</p>
                    <p className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">{formatCompactCurrency(averageBetSize)}</p>
                    <p className="text-xs text-gray-500 mt-1">Per high stake bet</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
                    <FaCrown className="text-2xl text-purple-500" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top Bettors & Biggest Wins Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Top High Stake Bettors */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaCrown className="mr-2 text-yellow-500" />
                    Top High Stake Bettors
                  </h3>
                  <p className="text-sm text-gray-600">Players with highest total stakes (৳{stakeThreshold.toLocaleString()}+)</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Player</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Staked</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bets</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Win Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Net Result</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {topBettors.map((bettor, index) => (
                        <tr key={bettor.username} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
                              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-white' :
                              index === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white' :
                              'bg-gray-100 text-gray-700'
                            } font-bold`}>
                              {index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{bettor.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900">{formatCompactCurrency(bettor.totalBetAmount)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-700">{bettor.totalBets}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full" 
                                  style={{ width: `${Math.min(bettor.winRate, 100)}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-gray-700">{bettor.winRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`font-bold ${bettor.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <FaTrophy className="mr-2 text-green-500" />
                    Biggest Wins
                  </h3>
                  <p className="text-sm text-gray-600">Largest payouts from high stake bets</p>
                </div>
                <div className="p-4 space-y-4">
                  {biggestWins.map((win, index) => (
                    <div key={win.id} className="p-4 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                              index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                              'bg-gradient-to-r from-green-400 to-green-500'
                            } text-white text-xs font-bold`}>
                              {index + 1}
                            </div>
                            <span className="font-semibold text-gray-800">{win.username}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{win.game_name}</p>
                          <p className="text-xs text-gray-500">{formatDate(win.date)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg md:text-xl font-bold text-green-600">
                            {formatCompactCurrency(win.winAmount)}
                          </div>
                          <p className="text-xs text-gray-600">Stake: {formatCompactCurrency(win.betAmount)}</p>
                          <p className="text-xs text-green-500 font-semibold">
                            Profit: {formatCompactCurrency(win.netAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Filters Section */}
            <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                  <FaFilter className="mr-2 text-orange-500" />
                  Filters & Search
                </h2>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    Showing <span className="font-bold text-orange-500">{filteredBets.length}</span> high stake bets
                  </span>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setGameFilter('all');
                      setStatusFilter('all');
                      setDateFilter('all');
                    }}
                    className="px-3 py-1 text-sm text-orange-500 hover:text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Search bet ID, username, or game..."
                  />
                </div>
                
                <div>
                  <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {dateRanges.map((range, index) => (
                      <option key={index} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* High Stake Bets Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Bet Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Player
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-orange-700 transition-colors"
                        onClick={() => requestSort('betAmount')}
                      >
                        <div className="flex items-center">
                          Stake Amount
                          {getSortIcon('betAmount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-orange-700 transition-colors"
                        onClick={() => requestSort('winAmount')}
                      >
                        <div className="flex items-center">
                          Win Amount
                          {getSortIcon('winAmount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-orange-700 transition-colors"
                        onClick={() => requestSort('netAmount')}
                      >
                        <div className="flex items-center">
                          Net Result
                          {getSortIcon('netAmount')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-orange-700 transition-colors"
                        onClick={() => requestSort('date')}
                      >
                        <div className="flex items-center">
                          Date & Time
                          {getSortIcon('date')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.length > 0 ? (
                      currentItems.map((bet, index) => (
                        <React.Fragment key={bet.id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-gray-900">
                                {(currentPage - 1) * itemsPerPage + index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{bet.betId}</div>
                                <div className="text-xs text-gray-600">{bet.game_name}</div>
                                <div className="text-xs text-gray-500">{bet.game_type}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-2">
                                  <div className="text-sm font-semibold text-gray-900">{bet.username}</div>
                                  <div className="text-xs text-gray-600">{bet.platform}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(bet.betAmount)}
                              </div>
                              <div className="text-xs text-gray-600">
                                Balance: {formatCompactCurrency(bet.balance_after)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-lg font-bold ${bet.winAmount > 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                {formatCurrency(bet.winAmount)}
                              </div>
                              {bet.winAmount > bet.betAmount && (
                                <div className="text-xs text-green-500 font-semibold">
                                  +{((bet.winAmount / bet.betAmount - 1) * 100).toFixed(1)}%
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-lg font-bold ${bet.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {bet.netAmount >= 0 ? '+' : ''}{formatCurrency(bet.netAmount)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(bet.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(bet.date)}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(bet.date).toLocaleTimeString('en-US', { hour12: false })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => toggleRow(bet.id)}
                                className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center"
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
                            <tr className="bg-gradient-to-r from-gray-50 to-white">
                              <td colSpan="9" className="px-6 py-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Balance Summary</h4>
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Before Bet:</span>
                                        <span className="text-sm font-bold text-gray-800">{formatCurrency(bet.balanceBefore)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">After Bet:</span>
                                        <span className="text-sm font-bold text-gray-800">{formatCurrency(bet.balanceAfter)}</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="text-sm text-gray-700 font-semibold">Change:</span>
                                        <span className={`text-sm font-bold ${bet.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {bet.netAmount >= 0 ? '+' : ''}{formatCurrency(bet.netAmount)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Bet Details</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Game:</span>
                                        <span className="text-sm font-semibold text-gray-800">{bet.game_name}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Type:</span>
                                        <span className="text-sm text-gray-800">{bet.game_type}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Currency:</span>
                                        <span className="text-sm font-semibold text-gray-800">{bet.currency}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Device:</span>
                                        <span className="text-sm text-gray-800">{bet.device_info}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Timestamps</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Bet Placed:</span>
                                        <span className="text-xs text-gray-800">{formatDate(bet.date)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Processed:</span>
                                        <span className="text-xs text-gray-800">{formatDate(bet.processed_at) || 'N/A'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Transaction:</span>
                                        <span className="text-xs text-gray-800">{formatDate(bet.transaction_time)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h4 className="font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Amount Summary</h4>
                                    <div className="space-y-3">
                                      <div className={`p-3 rounded-lg ${bet.betAmount >= stakeThreshold * 5 ? 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200' : 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200'}`}>
                                        <div className="text-xs text-gray-600">Stake Amount</div>
                                        <div className="text-xl font-bold text-gray-900">{formatCurrency(bet.betAmount)}</div>
                                        {bet.betAmount >= stakeThreshold * 5 && (
                                          <div className="text-xs text-red-600 font-semibold mt-1">⚠️ Ultra High Stake</div>
                                        )}
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-600">Win Amount:</div>
                                        <div className={`text-lg font-bold ${bet.winAmount > 0 ? 'text-green-600' : 'text-gray-700'}`}>
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
                            <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full mb-4">
                              <FaFire className="text-4xl text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No High Stake Bets Found</h3>
                            <p className="text-gray-500 mb-4">No bets match the current threshold (৳{stakeThreshold.toLocaleString()}+)</p>
                            <button
                              onClick={() => setStakeThreshold(5000)}
                              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
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
            {filteredBets.length > 0 && (
              <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-semibold">
                        {Math.min(currentPage * itemsPerPage, filteredBets.length)}
                      </span> of{' '}
                      <span className="font-semibold">{filteredBets.length}</span> high stake bets
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 rounded-l-lg border border-gray-300 text-sm font-medium transition-colors ${
                          currentPage === 1 
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'z-10 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-4 py-2 rounded-r-lg border border-gray-300 text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
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