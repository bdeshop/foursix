import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSearch, FaFilter, FaEye, FaPlus, FaSort, FaSortUp, FaSortDown, FaSpinner } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const Activegames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [games, setGames] = useState([]);
  const [totalGames, setTotalGames] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const itemsPerPage = 10;
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Fetch games, categories, and providers on component mount
  useEffect(() => {
    fetchGames();
    fetchCategories();
    fetchProviders();
  }, [currentPage, searchTerm, categoryFilter, providerFilter]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/games`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: 'true', // Only fetch active games
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          provider: providerFilter !== 'all' ? providerFilter : undefined,
          search: searchTerm || undefined
        }
      });
      
      // Handle both response formats (with pagination plugin and without)
      if (response.data.games) {
        // Response from our custom pagination
        setGames(response.data.games);
        setTotalGames(response.data.total);
        setTotalPages(response.data.totalPages);
      } else if (response.data.docs) {
        // Response from mongoose-paginate-v2
        setGames(response.data.docs);
        setTotalGames(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
        // Fallback if response format is different
        setGames(response.data);
        setTotalGames(response.data.length);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to fetch games');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/games/categories/list`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/games/providers/list`);
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to fetch providers');
    }
  };

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sort games based on sortConfig
  const sortedGames = React.useMemo(() => {
    if (!sortConfig.key) return games;
    
    return [...games].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [games, sortConfig]);

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-500" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-indigo-500" />;
    return <FaSortDown className="text-indigo-500" />;
  };

  // Handle game deletion with SweetAlert
  const handleDelete = (game) => {
    Swal.fire({
      title: 'Delete Game?',
      html: `Are you sure you want to delete "<strong>${game.name}</strong>"?<br/>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#1F2937',
      customClass: {
        popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
        title: 'text-xl font-bold text-gray-200',
        confirmButton: 'px-6 py-2 rounded-lg font-medium',
        cancelButton: 'px-6 py-2 rounded-lg font-medium'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${base_url}/api/admin/games/${game._id}`);
          fetchGames();
          Swal.fire({
            title: 'Deleted!',
            text: `"${game.name}" has been removed successfully.`,
            icon: 'success',
            confirmButtonColor: '#6366f1',
            background: '#1F2937',
            customClass: {
              popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
              confirmButton: 'px-6 py-2 rounded-lg font-medium'
            }
          });
        } catch (error) {
          Swal.fire({
            title: 'Error!',
            text: error.response?.data?.error || error.response?.data?.message || 'Failed to delete game',
            icon: 'error',
            confirmButtonColor: '#6366f1',
            background: '#1F2937',
            customClass: {
              popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
              confirmButton: 'px-6 py-2 rounded-lg font-medium'
            }
          });
        }
      }
    });
  };

  // Handle game status toggle (deactivate game)
  const deactivateGame = async (id) => {
    try {
      await axios.put(`${base_url}/api/admin/games/${id}/status`, {
        status: false
      });
      
      // Refresh the games list
      fetchGames();
      toast.success('Game deactivated successfully');
    } catch (error) {
      console.error('Error deactivating game:', error);
      toast.error('Failed to deactivate game');
    }
  };

  // Apply filters and refresh data
  const applyFilters = () => {
    setCurrentPage(1);
    fetchGames();
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setProviderFilter('all');
    setCurrentPage(1);
    // Don't call fetchGames here as useEffect will trigger it
  };

  // Get unique categories from games for stats
  const uniqueCategories = new Set(games.map(g => g.category)).size;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/48x48?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `${base_url}${imagePath}`;
  };

  // Generate pagination buttons with ellipsis
  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    const halfVisible = Math.floor(maxVisible / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    // Always show first page
    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className={`relative cursor-pointer inline-flex items-center px-4 py-2 border text-sm font-medium ${
            currentPage === 1
              ? 'z-10 bg-indigo-600 border-indigo-600 text-white'
              : 'bg-[#161B22] border-gray-700 text-gray-300 hover:bg-gray-700'
          }`}
        >
          1
        </button>
      );
      
      // Show ellipsis if there's a gap
      if (startPage > 2) {
        buttons.push(
          <span
            key="ellipsis-start"
            className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-[#161B22] text-gray-400 text-sm"
          >
            ...
          </span>
        );
      }
    }
    
    // Generate visible page buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`relative cursor-pointer inline-flex items-center px-4 py-2 border text-sm font-medium ${
            currentPage === i
              ? 'z-10 bg-indigo-600 border-indigo-600 text-white'
              : 'bg-[#161B22] border-gray-700 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Always show last page
    if (endPage < totalPages) {
      // Show ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        buttons.push(
          <span
            key="ellipsis-end"
            className="relative inline-flex items-center px-4 py-2 border border-gray-700 bg-[#161B22] text-gray-400 text-sm"
          >
            ...
          </span>
        );
      }
      
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={`relative cursor-pointer inline-flex items-center px-4 py-2 border text-sm font-medium ${
            currentPage === totalPages
              ? 'z-10 bg-indigo-600 border-indigo-600 text-white'
              : 'bg-[#161B22] border-gray-700 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {totalPages}
        </button>
      );
    }
    
    return buttons;
  };

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Active Game Management</h1>
                <p className="text-xs font-bold text-gray-500 mt-1">Manage all active casino games</p>
              </div>
              <NavLink to="/games-management/new-game" className="w-full md:w-auto mt-4 md:mt-0 bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center justify-center gap-2">
                <FaPlus />
                Add New Game
              </NavLink>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#161B22] border-l-4 border-indigo-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Total Active Games</h3>
                <p className="text-xl font-bold text-white mt-2 leading-none">{totalGames}</p>
              </div>
              <div className="bg-[#161B22] border-l-4 border-green-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Categories</h3>
                <p className="text-xl font-bold text-white mt-2 leading-none">{uniqueCategories}</p>
              </div>
              <div className="bg-[#161B22] border-l-4 border-amber-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Providers</h3>
                <p className="text-xl font-bold text-white mt-2 leading-none">{new Set(games.map(g => g.provider)).size}</p>
              </div>
              <div className="bg-[#161B22] border-l-4 border-purple-500 p-5 rounded shadow-lg border-y border-r border-gray-800">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Recently Added</h3>
                <p className="text-xl font-bold text-white mt-2 leading-none">
                  {games.length > 0 ? new Date(games[0]?.createdAt).toLocaleDateString() : 'N/A'}
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
                  onClick={resetFilters}
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
                    placeholder="Search games or ID..."
                  />
                </div>
                
                {/* Category Filter */}
                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                {/* Provider Filter */}
                <div>
                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                  >
                    <option value="all">All Providers</option>
                    {providers.map((provider, index) => (
                      <option key={index} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
                
                {/* Status is fixed to active for this page */}
                <div>
                  <select
                    value="Active"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-500 cursor-not-allowed"
                    disabled
                  >
                    <option value="Active">Active</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                >
                  Apply Filters
                </button>
              </div>
            </div>
            
            {/* Results Count and Sort */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <p className="text-gray-500 text-xs">
                Showing {games.length} of {totalGames} active games
              </p>
              
              <div className="flex items-center text-sm">
                <span className="mr-2 text-gray-500">Sort by:</span>
                <select 
                  className="bg-[#0F111A] border border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-200 text-sm"
                  value={sortConfig.key || ''}
                  onChange={(e) => requestSort(e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="name">Name</option>
                  <option value="provider">Provider</option>
                  <option value="category">Category</option>
                  <option value="createdAt">Date Added</option>
                </select>
              </div>
            </div>
            
            {/* Games Table */}
            {loading ? (
              <div className="bg-[#161B22] rounded-lg p-12 border border-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-4xl text-indigo-500 mx-auto mb-4" />
                  <p className="text-gray-500">Loading active games...</p>
                </div>
              </div>
            ) : (
              <div className="bg-[#161B22] rounded-lg overflow-hidden border border-gray-800">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1C2128]">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-700"
                          onClick={() => requestSort('name')}
                        >
                          <div className="flex items-center">
                            Game
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                          ID
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-700"
                          onClick={() => requestSort('provider')}
                        >
                          <div className="flex items-center">
                            Provider
                            {getSortIcon('provider')}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider cursor-pointer transition-colors hover:bg-gray-700"
                          onClick={() => requestSort('category')}
                        >
                          <div className="flex items-center">
                            Category
                            {getSortIcon('category')}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#161B22] divide-y divide-gray-800">
                      {sortedGames.length > 0 ? (
                        sortedGames.map((game) => (
                          <tr key={game._id} className="hover:bg-[#1F2937] transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  <img 
                                    className="h-12 w-12 rounded-md object-cover shadow-sm border border-gray-700" 
                                    src={getImageUrl(game.portraitImage)} 
                                    alt={game.name} 
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                                    }}
                                  />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-semibold text-white">{game.name}</div>
                                  <div className="text-xs text-gray-500">{new Date(game.createdAt).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-400 font-mono bg-[#0F111A] px-2 py-1 rounded border border-gray-700">{game.gameId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-300">{game.provider}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700">
                                {game.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span 
                                className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer transition-colors duration-200 ${
                                  game.status 
                                    ? 'bg-green-600 text-white hover:bg-green-700 border border-green-600' 
                                    : 'bg-red-600 text-white hover:bg-red-700 border border-red-600'
                                }`}
                                onClick={() => deactivateGame(game._id)}
                              >
                                {game.status ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <NavLink
                                  to={`/games-management/view-game/${game._id}`}
                                  className="p-2 px-[8px] py-[7px] bg-blue-600 text-white rounded-[3px] text-[16px] hover:bg-blue-700"
                                  title="View details"
                                >
                                  <FaEye />
                                </NavLink>
                                <NavLink
                                  to={`/games-management/edit-game/${game._id}`}
                                  className="p-2 px-[8px] py-[7px] bg-indigo-600 text-white rounded-[3px] text-[16px] hover:bg-indigo-700"
                                  title="Edit game"
                                >
                                  <FaEdit />
                                </NavLink>
                                <button 
                                  className="p-2 px-[8px] py-[7px] bg-red-600 text-white rounded-[3px] text-[16px] hover:bg-red-700"
                                  onClick={() => handleDelete(game)}
                                  title="Delete game"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <FaSearch className="text-5xl mb-3 opacity-30" />
                              <p className="text-lg font-medium text-gray-400">No active games found</p>
                              <p className="text-sm text-gray-500">Try adding some games or check your filters</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Pagination with Ellipsis */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-4 py-3">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Showing <span className="font-medium text-gray-300">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium text-gray-300">
                        {Math.min(currentPage * itemsPerPage, totalGames)}
                      </span> of{' '}
                      <span className="font-medium text-gray-300">{totalGames}</span> results
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
                      
                      {getPaginationButtons()}
                      
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

export default Activegames;