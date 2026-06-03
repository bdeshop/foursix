import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown, FaEye, FaDownload, FaChevronDown, FaChevronUp, FaSpinner } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { toast, Toaster } from 'react-hot-toast';
import axios from "axios";

const Allbets = () => {
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
  const token = localStorage.getItem('token');
  const itemsPerPage = 70;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  const [bets, setBets] = useState([]);
  const [originalBets, setOriginalBets] = useState([]);
  
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
          game_name: bet.game_name,
          id: bet._id?.$oid || `bet-${index}`,
          betId: bet.serial_number || `BT${String(index + 1).padStart(6, '0')}`,
          username: bet.original_username || bet.member_account,
          game: bet.game_uid || 'Unknown Game',
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
        
        setBets(transformedBets);
        setOriginalBets(transformedBets);
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

  useEffect(() => {
    fetchBettingHistory();
  }, []);

  const games = ['all', ...Array.from(new Set(bets.map(bet => bet.game_type).filter(Boolean)))];
  const statuses = ['all', 'won', 'lost', 'pending'];
  const dateRanges = ['all', 'Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Custom'];

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
                          bet.username.toLowerCase().includes(searchTerm.toLowerCase());
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
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'won': { color: 'bg-green-900/50 text-green-300 border border-green-700', text: 'Won' },
      'lost': { color: 'bg-red-900/50 text-red-300 border border-red-700', text: 'Lost' },
      'pending': { color: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700', text: 'Pending' },
      'draw': { color: 'bg-blue-900/50 text-blue-300 border border-blue-700', text: 'Draw' },
      'refunded': { color: 'bg-purple-900/50 text-purple-300 border border-purple-700', text: 'Refunded' }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || { color: 'bg-gray-800 text-gray-400 border border-gray-700', text: status };
    return (
      <div className={`w-[100%] h-[60px] flex justify-center items-center text-sm leading-5 font-[600] ${statusInfo.color} rounded`}>
        {statusInfo.text}
      </div>
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gameFilter, statusFilter, dateFilter]);

  const totalBetAmount = filteredBets.reduce((sum, bet) => sum + bet.betAmount, 0);
  const totalWinAmount = filteredBets.reduce((sum, bet) => sum + bet.winAmount, 0);
  const totalProfit = totalWinAmount - totalBetAmount;

  const handleRefresh = () => {
    fetchBettingHistory();
    toast.success('Data refreshed');
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
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
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Bet History</h1>
                <p className="text-xs font-bold text-gray-500 mt-1">View and manage all betting activities</p>
              </div>
              <button 
                onClick={handleRefresh}
                className="w-full md:w-auto mt-4 md:mt-0 bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                Refresh
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#161B22] border-l-4 border-indigo-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Total Bets</h3>
                <p className="text-xl font-bold text-white mt-2 leading-none">{filteredBets.length}</p>
              </div>
              <div className="bg-[#161B22] border-l-4 border-green-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Total Bet Amount</h3>
                <p className="text-xl font-bold text-white mt-2 leading-none">{formatCurrency(totalBetAmount)}</p>
              </div>
              <div className="bg-[#161B22] border-l-4 border-amber-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Total Payout</h3>
                <p className="text-xl font-bold text-white mt-2 leading-none">{formatCurrency(totalWinAmount)}</p>
              </div>
              <div className="bg-[#161B22] border-l-4 border-purple-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Profit/Loss</h3>
                <p className={`text-xl font-bold mt-2 leading-none ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(totalProfit)}
                </p>
              </div>
            </div>
            
            {/* Filters Section */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <div className="w-1 h-4 bg-indigo-500"></div>
                  Filters & Search
                </h3>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setGameFilter('all');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Clear All Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 placeholder-gray-500 transition-all duration-200"
                    placeholder="Search by Bet ID or Username..."
                  />
                </div>
                
                {/* Game Filter */}
                <div>
                  <select
                    value={gameFilter}
                    onChange={(e) => setGameFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                  >
                    <option value="all">All Games</option>
                    {games.filter(game => game !== 'all').map((game, index) => (
                      <option key={index} value={game}>{game}</option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                  >
                    <option value="all">All Status</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                {/* Date Filter */}
                <div>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                  >
                    {dateRanges.map((range, index) => (
                      <option key={index} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Results Count and Sort */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <p className="text-gray-500 text-xs">
                Showing {filteredBets.length} of {bets.length} bets
              </p>
              
              <div className="flex items-center text-sm">
                <span className="mr-2 text-gray-500">Sort by:</span>
                <select 
                  className="bg-[#0F111A] border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 text-sm"
                  value={sortConfig.key || ''}
                  onChange={(e) => requestSort(e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="date">Date</option>
                  <option value="betAmount">Bet Amount</option>
                  <option value="winAmount">Win Amount</option>
                  <option value="netAmount">Net Amount</option>
                </select>
              </div>
            </div>
            
            {/* Bets Table - Loader only in table */}
            <div className="bg-[#161B22] rounded-lg overflow-hidden border border-gray-800">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-[#1C2128]">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                        Serial NO
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                        Game Name
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                        Username
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-700"
                        onClick={() => requestSort('betAmount')}
                      >
                        <div className="flex items-center">
                          Bet Amount
                          {getSortIcon('betAmount')}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-700"
                        onClick={() => requestSort('winAmount')}
                      >
                        <div className="flex items-center">
                          Win Amount
                          {getSortIcon('winAmount')}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-700"
                        onClick={() => requestSort('netAmount')}
                      >
                        <div className="flex items-center">
                          Net Amount
                          {getSortIcon('netAmount')}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                        Balance
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-700"
                        onClick={() => requestSort('status')}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon('status')}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-700"
                        onClick={() => requestSort('date')}
                      >
                        <div className="flex items-center">
                          Date & Time
                          {getSortIcon('date')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#161B22] divide-y divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <FaSpinner className="animate-spin text-indigo-500 text-3xl mb-3" />
                            <p className="text-gray-500">Loading bets...</p>
                          </div>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((bet, index) => (
                        <React.Fragment key={bet.id}>
                          <tr onClick={() => toggleRow(bet.id)} className="hover:bg-[#1F2937] cursor-pointer transition-colors duration-150">
                            <td className="px-6 py-2 whitespace-nowrap border-r border-gray-800">
                              <div className="text-sm font-medium text-gray-300">{(currentPage - 1) * itemsPerPage + index + 1}</div>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap border-r border-gray-800">
                              <div className="text-sm font-medium text-gray-300">{bet.game_name || bet.game_type || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap border-r border-gray-800">
                              <div className="text-sm font-medium text-gray-300">{bet.username}</div>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap border-r border-gray-800">
                              <div className="text-sm font-medium text-gray-300">{formatCurrency(bet.betAmount)}</div>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap border-r border-gray-800">
                              <div className={`text-sm font-medium ${bet.winAmount > 0 ? 'text-green-500' : 'text-gray-300'}`}>
                                {formatCurrency(bet.winAmount)}
                              </div>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap border-r border-gray-800">
                              <div className={`text-sm font-medium ${bet.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(bet.netAmount)}
                              </div>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap border-r border-gray-800">
                              <div className="text-sm text-gray-300">{bet.balance_after} BDT</div>
                            </td>
                            <td className="whitespace-nowrap border-r border-gray-800">
                              {getStatusBadge(bet.status)}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap border-r border-gray-800">
                              <div className="text-sm text-gray-500">{formatDate(bet.date)}</div>
                            </td>
                          </tr>
                          
                          {/* Expanded Details Row */}
                          {expandedRows[bet.id] && (
                            <tr className="bg-[#1F2937]">
                              <td colSpan="9" className="px-6 py-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Balance Information */}
                                  <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700">
                                    <h4 className="font-semibold text-indigo-400 mb-3 pb-2 border-b border-gray-700">Balance Information</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Balance Before:</span>
                                        <span className="text-sm font-semibold text-gray-200">{formatCurrency(bet.balanceBefore)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Balance After:</span>
                                        <span className="text-sm font-semibold text-gray-200">{formatCurrency(bet.balanceAfter)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Balance Change:</span>
                                        <span className={`text-sm font-semibold ${bet.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                          {formatCurrency(bet.netAmount)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Transaction Details */}
                                  <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700">
                                    <h4 className="font-semibold text-indigo-400 mb-3 pb-2 border-b border-gray-700">Transaction Details</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Currency:</span>
                                        <span className="text-sm font-semibold text-gray-200">{bet.currency}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Platform:</span>
                                        <span className="text-sm font-semibold text-gray-200">{bet.platform}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Device:</span>
                                        <span className="text-sm font-semibold text-gray-200">{bet.device_info}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Game UID:</span>
                                        <span className="text-sm font-mono text-gray-200">{bet.game}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Timing Information */}
                                  <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700">
                                    <h4 className="font-semibold text-indigo-400 mb-3 pb-2 border-b border-gray-700">Timing Information</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Transaction Time:</span>
                                        <span className="text-sm text-gray-200">{formatDate(bet.transaction_time)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Processed At:</span>
                                        <span className="text-sm text-gray-200">{formatDate(bet.processed_at)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Display Time:</span>
                                        <span className="text-sm text-gray-200">{formatDate(bet.date)}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Amount Summary */}
                                  <div className="bg-[#161B22] p-4 rounded-lg border border-gray-700 lg:col-span-3">
                                    <h4 className="font-semibold text-indigo-400 mb-3 pb-2 border-b border-gray-700">Amount Summary</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className={`p-3 rounded ${bet.betAmount > 0 ? 'bg-red-900/20 border border-red-800' : 'bg-gray-800'}`}>
                                        <p className="text-xs text-gray-400 mb-1">Bet Amount</p>
                                        <p className="text-lg font-bold text-gray-200">{formatCurrency(bet.betAmount)}</p>
                                      </div>
                                      <div className={`p-3 rounded ${bet.winAmount > 0 ? 'bg-green-900/20 border border-green-800' : 'bg-gray-800'}`}>
                                        <p className="text-xs text-gray-400 mb-1">Win Amount</p>
                                        <p className="text-lg font-bold text-green-500">{formatCurrency(bet.winAmount)}</p>
                                      </div>
                                      <div className={`p-3 rounded ${bet.netAmount >= 0 ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
                                        <p className="text-xs text-gray-400 mb-1">Net Result</p>
                                        <p className={`text-lg font-bold ${bet.netAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                          {formatCurrency(bet.netAmount)}
                                        </p>
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
                        <td colSpan="9" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <FaSearch className="text-5xl mb-3 opacity-30" />
                            <p className="text-lg font-medium text-gray-400">No bets found</p>
                            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
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
              <div className="flex items-center justify-between mt-4 px-4 py-3">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Showing <span className="font-medium text-gray-300">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium text-gray-300">
                        {Math.min(currentPage * itemsPerPage, filteredBets.length)}
                      </span> of{' '}
                      <span className="font-medium text-gray-300">{filteredBets.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium ${
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
                            className={`relative cursor-pointer inline-flex items-center px-4 py-2 border text-sm font-medium ${
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
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium ${
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

export default Allbets;