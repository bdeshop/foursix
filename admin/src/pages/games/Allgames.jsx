import React, { useState, useEffect, useMemo } from 'react';
import { FaEdit, FaTrash, FaSearch, FaFilter, FaEye, FaPlus, FaSort, FaSortUp, FaSortDown, FaSpinner, FaImage } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Allgames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [portraitFile, setPortraitFile] = useState(null);
  const [landscapeFile, setLandscapeFile] = useState(null);
  const [portraitPreview, setPortraitPreview] = useState(null);
  const [landscapePreview, setLandscapePreview] = useState(null);
  const [useDefaultImages, setUseDefaultImages] = useState(false);
  
  const itemsPerPage = 10;
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Fetch categories and providers once
  useEffect(() => {
    fetchCategories();
    fetchProviders();
  }, []);

  // Fetch games when dependencies change
  useEffect(() => {
    fetchGames();
  }, [currentPage, searchTerm, categoryFilter, providerFilter, statusFilter]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      
      // Build params object - only include filters that are not 'all'
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      if (providerFilter !== 'all') {
        params.provider = providerFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      console.log("Fetching games with params:", params); // Debug log
      
      const response = await axios.get(`${base_url}/api/admin/games`, { params });
      
      // Handle both response formats
      if (response.data.games) {
        setGames(response.data.games);
        setTotalGames(response.data.total);
        setTotalPages(response.data.totalPages);
      } else if (response.data.docs) {
        setGames(response.data.docs);
        setTotalGames(response.data.total);
        setTotalPages(response.data.totalPages);
      } else {
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
      const response = await axios.get(`${base_url}/api/admin/game-categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/game-providers`);
      console.log("Providers response:", response.data); // Debug log to check structure
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
  const sortedGames = useMemo(() => {
    if (!sortConfig.key) return games;
    
    return [...games].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Handle boolean values
      if (typeof aVal === 'boolean') {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }
      
      // Handle date strings
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (aVal < bVal) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [games, sortConfig]);

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-orange-500" />;
    return <FaSortDown className="text-orange-500" />;
  };

  // Handle game deletion
  const handleDelete = (id) => {
    setGameToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${base_url}/api/admin/games/${gameToDelete}`);
      fetchGames();
      setShowDeleteConfirm(false);
      setGameToDelete(null);
      toast.success('Game deleted successfully');
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Failed to delete game');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setGameToDelete(null);
  };

  // Handle game status toggle
  const toggleStatus = async (id) => {
    try {
      const game = games.find(g => g._id === id);
      const newStatus = !game.status;
      
      await axios.put(`${base_url}/api/admin/games/${id}`, {
        status: newStatus
      });
      
      fetchGames();
      toast.success(`${game.name} is now ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (error) {
      console.error('Error updating game status:', error);
      toast.error('Failed to update game status');
    }
  };

  // Handle game featured toggle
  const toggleFeatured = async (id) => {
    try {
      const game = games.find(g => g._id === id);
      const newFeatured = !game.featured;
      
      await axios.put(`${base_url}/api/admin/games/${id}`, {
        featured: newFeatured
      });
      
      fetchGames();
      toast.success(`${game.name} is now ${newFeatured ? 'Featured' : 'Not Featured'}`);
    } catch (error) {
      console.error('Error updating game featured status:', error);
      toast.error('Failed to update game featured status');
    }
  };

  // Get image URL helper
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300x200?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath; // Default image URL
    return `${base_url}${imagePath}`; // Uploaded image path
  };

  // Open view modal
  const openView = (game) => {
    setSelectedGame(game);
    setShowViewModal(true);
  };

  // Open edit modal
  const openEdit = (game) => {
    setSelectedGame(game);
    const hasDefaultImage = game.portraitImage?.startsWith('http') || game.landscapeImage?.startsWith('http');
    
    setEditForm({
      name: game.name || '',
      gameId: game.gameId || '',
      provider: game.provider || '',
      category: game.category || '',
      featured: game.featured || false,
      status: game.status !== undefined ? game.status : true,
      fullScreen: game.fullScreen || false,
      order: game.order || 0,
      portraitImage: game.portraitImage || '',
      landscapeImage: game.landscapeImage || '',
      defaultImage: game.defaultImage || (hasDefaultImage ? game.portraitImage : '')
    });
    
    setUseDefaultImages(hasDefaultImage);
    setPortraitFile(null);
    setLandscapeFile(null);
    setPortraitPreview(null);
    setLandscapePreview(null);
    setShowEditModal(true);
  };

  // Handle image file selection
  const handlePortraitChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPortraitFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortraitPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setUseDefaultImages(false);
    }
  };

  const handleLandscapeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLandscapeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLandscapePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setUseDefaultImages(false);
    }
  };

  // Toggle default images
  const toggleDefaultImages = () => {
    setUseDefaultImages(!useDefaultImages);
    if (!useDefaultImages) {
      // Switching to default images - clear file inputs
      setPortraitFile(null);
      setLandscapeFile(null);
      setPortraitPreview(null);
      setLandscapePreview(null);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!editForm.category) {
      toast.error("Please select a category");
      return;
    }

    const formData = new FormData();
    
    // Append all form fields
    Object.keys(editForm).forEach(key => {
      if (key !== 'portraitImage' && key !== 'landscapeImage' && key !== 'defaultImage') {
        formData.append(key, editForm[key]);
      }
    });
    
    // Handle images
    if (useDefaultImages && editForm.defaultImage) {
      formData.append('defaultImage', editForm.defaultImage);
      formData.append('portraitImage', editForm.defaultImage);
      formData.append('landscapeImage', editForm.defaultImage);
    } else {
      if (portraitFile) formData.append('portraitImage', portraitFile);
      if (landscapeFile) formData.append('landscapeImage', landscapeFile);
    }

    try {
      await axios.put(`${base_url}/api/admin/games/${selectedGame._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      fetchGames();
      setShowEditModal(false);
      toast.success('Game updated successfully');
    } catch (error) {
      console.error('Error updating game:', error);
      toast.error(error.response?.data?.error || 'Failed to update game');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setProviderFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Generate pagination items with ellipsis
  const getPaginationItems = () => {
    const delta = 2; // Number of pages to show on each side of current page
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

  return (
    <section className="font-nunito h-screen ">
      <Header toggleSidebar={toggleSidebar} />

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
                <h1 className="text-2xl font-bold text-gray-800">Game Management</h1>
                <p className="text-sm text-gray-600 mt-1">Manage all casino games in one place</p>
              </div>
              <NavLink to="/games-management/new-game" className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-[5px] hover:from-orange-600 hover:to-orange-700 transition-all">
                <FaPlus className="mr-2" />
                Add New Game
              </NavLink>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-[5px] shadow-sm border-[1px] border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Total Games</h3>
                <p className="text-2xl font-bold text-gray-800">{totalGames}</p>
              </div>
              <div className="bg-white p-4 rounded-[5px] shadow-sm border-[1px] border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Active Games</h3>
                <p className="text-2xl font-bold text-gray-800">{games.filter(g => g.status).length}</p>
              </div>
              <div className="bg-white p-4 rounded-[5px] shadow-sm border-[1px] border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Inactive Games</h3>
                <p className="text-2xl font-bold text-gray-800">{games.filter(g => !g.status).length}</p>
              </div>
              <div className="bg-white p-4 rounded-[5px] shadow-sm border-[1px] border-gray-200">
                <h3 className="text-sm font-medium text-gray-600">Featured Games</h3>
                <p className="text-2xl font-bold text-gray-800">{games.filter(g => g.featured).length}</p>
              </div>
            </div>
            
            {/* Filters Section */}
            <div className="bg-white rounded-[5px] p-4 mb-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                  <FaFilter className="mr-2 text-orange-500" />
                  Filters & Search
                </h2>
                <button 
                  onClick={resetFilters}
                  className="text-sm text-orange-500 hover:text-orange-600 flex items-center"
                >
                  Clear All Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Search games or ID..."
                  />
                </div>
                
                {/* Category Filter */}
                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Provider Filter - FIXED */}
                <div>
                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Providers</option>
                    {providers.map((provider) => {
                      // Determine the correct value to use based on provider data structure
                      const providerValue = provider.providercode;
                      return (
                        <option key={provider._id || providerValue} value={providerValue}>
                          {provider.name || providerValue}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Results Count and Sort */}
            <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <p className="text-gray-600">
                Showing {games.length} of {totalGames} games
              </p>
              
              <div className="flex items-center text-sm">
                <span className="mr-2 text-gray-600">Sort by:</span>
                <select 
                  className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  value={sortConfig.key || ''}
                  onChange={(e) => requestSort(e.target.value)}
                >
                  <option value="">Default</option>
                  <option value="name">Name</option>
                  <option value="provider">Provider</option>
                  <option value="category">Category</option>
                  <option value="featured">Featured</option>
                  <option value="createdAt">Date Added</option>
                </select>
              </div>
            </div>
            
            {/* Games Table */}
            {loading ? (
              <div className="bg-white rounded-lg p-12 border border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-4xl text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-600">Loading games...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors hover:bg-orange-700"
                          onClick={() => requestSort('name')}
                        >
                          <div className="flex items-center">
                            Game
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                          ID
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors hover:bg-orange-700"
                          onClick={() => requestSort('provider')}
                        >
                          <div className="flex items-center">
                            Provider
                            {getSortIcon('provider')}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors hover:bg-orange-700"
                          onClick={() => requestSort('category')}
                        >
                          <div className="flex items-center">
                            Category
                            {getSortIcon('category')}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors hover:bg-orange-700"
                          onClick={() => requestSort('status')}
                        >
                          <div className="flex items-center">
                            Status
                            {getSortIcon('status')}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors hover:bg-orange-700"
                          onClick={() => requestSort('featured')}
                        >
                          <div className="flex items-center">
                            Featured
                            {getSortIcon('featured')}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedGames.length > 0 ? (
                        sortedGames.map((game) => {
                          const hasDefaultImage = game.portraitImage?.startsWith('http');
                          return (
                            <tr key={game._id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-12 w-12 relative">
                                    <img 
                                      className="h-12 w-12 rounded-md object-cover shadow-sm border border-gray-200" 
                                      src={getImageUrl(game.portraitImage)} 
                                      alt={game.name} 
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                                      }}
                                    />
                                    {hasDefaultImage && (
                                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
                                        <FaImage className="text-[8px]" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-semibold text-gray-900">{game.name}</div>
                                    <div className="text-xs text-gray-500">{new Date(game.createdAt).toLocaleDateString()}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-700 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">{game.gameId || game.gameApiID}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-700">{game.provider}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                  {game.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <label className="inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={game.status} 
                                    onChange={() => toggleStatus(game._id)} 
                                    className="sr-only peer" 
                                  />
                                  <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                </label>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <label className="inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={game.featured} 
                                    onChange={() => toggleFeatured(game._id)} 
                                    className="sr-only peer" 
                                  />
                                  <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                                </label>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => openView(game)}
                                    className="p-2 px-[8px] py-[7px] bg-blue-600 text-white rounded-[3px] text-[16px] hover:bg-blue-700"
                                    title="View details"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => openEdit(game)}
                                    className="p-2 px-[8px] py-[7px] bg-orange-600 text-white rounded-[3px] text-[16px] hover:bg-orange-700"
                                    title="Edit game"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button 
                                    className="p-2 px-[8px] py-[7px] bg-red-600 text-white rounded-[3px] text-[16px] hover:bg-red-700"
                                    onClick={() => handleDelete(game._id)}
                                    title="Delete game"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <FaSearch className="text-5xl mb-3 opacity-30" />
                              <p className="text-lg font-medium text-gray-500">No games found</p>
                              <p className="text-sm">Try adjusting your search or filters</p>
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
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalGames)}
                      </span> of{' '}
                      <span className="font-medium">{totalGames}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1 
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {getPaginationItems().map((page, index) => (
                        page === '...' ? (
                          <span
                            key={`dots-${index}`}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative cursor-pointer inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-orange-500 border-orange-500 text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative cursor-pointer inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] backdrop-blur-md p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this game? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedGame && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-[2px] shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Game Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="mb-2"><strong>Name:</strong> {selectedGame.name}</p>
                <p className="mb-2"><strong>Game ID:</strong> {selectedGame.gameId || selectedGame.gameApiID}</p>
                <p className="mb-2"><strong>Provider:</strong> {selectedGame.provider}</p>
                <p className="mb-2"><strong>Category:</strong> {selectedGame.category}</p>
                <p className="mb-2"><strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${selectedGame.status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedGame.status ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <p className="mb-2"><strong>Featured:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${selectedGame.featured ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedGame.featured ? 'Yes' : 'No'}
                  </span>
                </p>
                <p className="mb-2"><strong>Full Screen:</strong> {selectedGame.fullScreen ? 'Yes' : 'No'}</p>
                <p className="mb-2"><strong>Order:</strong> {selectedGame.order || 0}</p>
                <p className="mb-2"><strong>Created At:</strong> {new Date(selectedGame.createdAt).toLocaleString()}</p>
                <p className="mb-2"><strong>Last Updated:</strong> {new Date(selectedGame.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="mb-2"><strong>Portrait Image:</strong></p>
                <img 
                  src={getImageUrl(selectedGame.portraitImage)} 
                  alt="Portrait" 
                  className="max-w-full h-auto rounded mb-4 border border-gray-200" 
                  onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'} 
                />
                <p className="mb-2"><strong>Landscape Image:</strong></p>
                <img 
                  src={getImageUrl(selectedGame.landscapeImage)} 
                  alt="Landscape" 
                  className="max-w-full h-auto rounded border border-gray-200" 
                  onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'} 
                />
                {selectedGame.portraitImage?.startsWith('http') && (
                  <p className="mt-2 text-xs text-blue-600 flex items-center">
                    <FaImage className="mr-1" /> Using default image from provider
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 cursor-pointer bg-gray-300 text-gray-800 rounded hover:bg-gray-400">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedGame && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-[2px] shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Game</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Default Image Toggle */}
            {editForm.defaultImage && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaImage className="text-blue-500 mr-2" />
                    <span className="text-sm text-blue-700">Use default image from provider</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useDefaultImages} 
                      onChange={toggleDefaultImages} 
                      className="sr-only peer" 
                    />
                    <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md outline-theme_color" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Game ID</label>
                  <input 
                    type="text" 
                    value={editForm.gameId} 
                    onChange={(e) => setEditForm({...editForm, gameId: e.target.value})} 
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md outline-theme_color" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Provider</label>
                  <select 
                    value={editForm.provider} 
                    onChange={(e) => setEditForm({...editForm, provider: e.target.value})} 
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md outline-theme_color"
                    required
                  >
                    <option value="">Select Provider</option>
                    {providers.map((provider) => (
                      <option key={provider._id} value={provider.name || provider}>
                        {provider.name || provider}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select 
                    value={editForm.category} 
                    onChange={(e) => setEditForm({...editForm, category: e.target.value})} 
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md outline-theme_color"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order</label>
                  <input 
                    type="number" 
                    value={editForm.order || 0} 
                    onChange={(e) => setEditForm({...editForm, order: parseInt(e.target.value)})} 
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md outline-theme_color"
                  />
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={editForm.status} 
                      onChange={(e) => setEditForm({...editForm, status: e.target.checked})} 
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded outline-theme_color" 
                    />
                    <label className="ml-2 block text-sm text-gray-900">Active</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={editForm.featured} 
                      onChange={(e) => setEditForm({...editForm, featured: e.target.checked})} 
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded" 
                    />
                    <label className="ml-2 block text-sm text-gray-900">Featured</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={editForm.fullScreen} 
                      onChange={(e) => setEditForm({...editForm, fullScreen: e.target.checked})} 
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded" 
                    />
                    <label className="ml-2 block text-sm text-gray-900">Full Screen</label>
                  </div>
                </div>

                {/* Portrait Image Section */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portrait Image</label>
                  
                  {!useDefaultImages && (
                    <>
                      {/* Current Portrait */}
                      {editForm.portraitImage && !portraitPreview && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Current Image:</p>
                          <img 
                            src={getImageUrl(editForm.portraitImage)} 
                            alt="Current Portrait" 
                            className="w-32 h-auto rounded border border-gray-200" 
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=No+Image'} 
                          />
                        </div>
                      )}
                      
                      {/* Preview new image */}
                      {portraitPreview && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">New Image Preview:</p>
                          <img 
                            src={portraitPreview} 
                            alt="New Portrait" 
                            className="w-32 h-auto rounded border border-green-200" 
                          />
                        </div>
                      )}
                      
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePortraitChange} 
                        className="mt-1 w-full text-sm" 
                      />
                    </>
                  )}
                  
                  {useDefaultImages && editForm.defaultImage && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 mb-2">Using default image:</p>
                      <img 
                        src={editForm.defaultImage} 
                        alt="Default Portrait" 
                        className="w-32 h-auto rounded border border-blue-200" 
                      />
                    </div>
                  )}
                </div>

                {/* Landscape Image Section */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Landscape Image</label>
                  
                  {!useDefaultImages && (
                    <>
                      {/* Current Landscape */}
                      {editForm.landscapeImage && !landscapePreview && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">Current Image:</p>
                          <img 
                            src={getImageUrl(editForm.landscapeImage)} 
                            alt="Current Landscape" 
                            className="w-32 h-auto rounded border border-gray-200" 
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=No+Image'} 
                          />
                        </div>
                      )}
                      
                      {/* Preview new image */}
                      {landscapePreview && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1">New Image Preview:</p>
                          <img 
                            src={landscapePreview} 
                            alt="New Landscape" 
                            className="w-32 h-auto rounded border border-green-200" 
                          />
                        </div>
                      )}
                      
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLandscapeChange} 
                        className="mt-1 w-full text-sm" 
                      />
                    </>
                  )}
                  
                  {useDefaultImages && editForm.defaultImage && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 mb-2">Using default image:</p>
                      <img 
                        src={editForm.defaultImage} 
                        alt="Default Landscape" 
                        className="w-32 h-auto rounded border border-blue-200" 
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)} 
                  className="px-4 py-2 border border-gray-300 cursor-pointer rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-orange-600 cursor-pointer text-white rounded-md text-sm font-medium hover:bg-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Allgames;