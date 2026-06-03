import React, { useState, useEffect } from "react";
import { FaUpload, FaTimes, FaSpinner, FaFilter, FaGamepad, FaSearch, FaImage, FaEdit, FaCheck, FaPlusCircle, FaList, FaCheckCircle, FaRegCircle, FaChevronLeft, FaChevronRight, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import { MdCategory, MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import toast,{Toaster} from "react-hot-toast";
import axios from "axios";
import Swal from 'sweetalert2';

const Newgames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const premium_api_key = import.meta.env.VITE_PREMIUM_API_KEY;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [localProviders, setLocalProviders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage] = useState(30);
  const [paginatedGames, setPaginatedGames] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [useDefaultImage, setUseDefaultImage] = useState({});
  const [localGames, setLocalGames] = useState([]);
  const [editingGame, setEditingGame] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState("");

  // Selection states
  const [selectedGames, setSelectedGames] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionMode, setBulkActionMode] = useState(false);

  // Bulk add states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkGames, setBulkGames] = useState([]);
  const [bulkCategories, setBulkCategories] = useState([]);
  const [bulkFeatured, setBulkFeatured] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(true);
  const [bulkFullScreen, setBulkFullScreen] = useState(false);
  const [bulkUseDefaultImage, setBulkUseDefaultImage] = useState(true);
  const [bulkImage, setBulkImage] = useState(null);
  const [bulkImagePreview, setBulkImagePreview] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [currentAddingGame, setCurrentAddingGame] = useState("");

  // Delete states
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingGameId, setDeletingGameId] = useState(null);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [deletingSelected, setDeletingSelected] = useState(false);

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingGameId, setSavingGameId] = useState(null);
  const [updatingGameId, setUpdatingGameId] = useState(null);
  const [showProvidersDropdown, setShowProvidersDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);

  // Create axios instances
  const api = axios.create({
    baseURL: base_url,
    timeout: 30000,
    headers: { 'Content-Type': 'multipart/form-data', "Authorization": localStorage.getItem("adminToken") }
  });

  const oracleApi = axios.create({
    baseURL: "https://api.oraclegames.live/api",
    timeout: 30000,
    headers: {
      "x-api-key": "20afffdf-98c4-4de3-a16f-7d3f29cbd90e",
      "Content-Type": "application/json"
    }
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Custom Select Component
  const CustomSelect = ({ 
    options, 
    value, 
    onChange, 
    placeholder, 
    loading, 
    icon: Icon, 
    dropdownOpen, 
    setDropdownOpen,
    label,
    disabled = false
  }) => {
    const selectedOption = options.find(opt => opt._id === value || opt.value === value);
    
    const getDisplayName = (option) => {
      return option.providerName || option.name || option.label || option.providerCode || 'Unknown';
    };
    
    return (
      <div className="relative w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setDropdownOpen(!dropdownOpen)}
            disabled={loading || disabled}
            className={`w-full px-4 py-3 text-left bg-[#161B22] border border-gray-700 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between transition-all duration-200 hover:border-indigo-400 ${
              disabled ? 'bg-gray-800 cursor-not-allowed opacity-60' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="text-gray-400 text-lg" />}
              <span className={selectedOption ? "text-gray-200" : "text-gray-500"}>
                {loading ? `Loading ${placeholder}...` : 
                 selectedOption ? getDisplayName(selectedOption) : 
                 disabled ? 'Select a category first' : 
                 `Select ${placeholder}`}
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-[#1F2937] border border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  {loading ? 'Loading...' : 'No providers available for this category'}
                </div>
              ) : (
                options.map((option) => (
                  <div
                    key={option._id || option.value}
                    onClick={() => {
                      onChange(option._id || option.value);
                      setDropdownOpen(false);
                    }}
                    className={`px-4 py-3 cursor-pointer flex items-center space-x-3 transition-colors duration-150 ${
                      value === (option._id || option.value)
                        ? 'bg-indigo-900 text-indigo-300'
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    {value === (option._id || option.value) ? (
                      <MdCheckBox className="text-indigo-400 text-lg" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="text-gray-500 text-lg" />
                    )}
                    <span>{getDisplayName(option)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom Multi-Select Component for Categories
  const MultiCategorySelect = ({ options, value, onChange, label }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    const toggleCategory = (categoryId) => {
      if (value.includes(categoryId)) {
        onChange(value.filter(id => id !== categoryId));
      } else {
        onChange([...value, categoryId]);
      }
    };
    
    const getSelectedNames = () => {
      const selected = options.filter(opt => value.includes(opt._id));
      return selected.map(opt => opt.name).join(', ');
    };
    
    return (
      <div className="relative w-full">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label} <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 ml-2">(Select multiple)</span>
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full px-4 py-3 text-left bg-[#161B22] border border-gray-700 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between transition-all duration-200 hover:border-indigo-400"
          >
            <div className="flex items-center space-x-3">
              <MdCategory className="text-gray-400 text-lg" />
              <span className={value.length > 0 ? "text-gray-200" : "text-gray-500"}>
                {value.length > 0 ? getSelectedNames() : "Select categories"}
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-[#1F2937] border border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No categories available
                </div>
              ) : (
                options.filter(cat => cat.status).map((category) => (
                  <div
                    key={category._id}
                    onClick={() => toggleCategory(category._id)}
                    className="px-4 py-3 cursor-pointer flex items-center space-x-3 transition-colors duration-150 hover:bg-gray-700"
                  >
                    {value.includes(category._id) ? (
                      <MdCheckBox className="text-indigo-400 text-lg" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="text-gray-500 text-lg" />
                    )}
                    <div>
                      <span className="text-gray-200">{category.name}</span>
                      {category.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom Checkbox Component
  const CustomCheckbox = ({ id, checked, onChange, label, description }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-800 rounded-lg transition-colors duration-150">
      <div className="relative flex items-center h-5 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="hidden"
        />
        <label htmlFor={id} className="cursor-pointer">
          <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
            checked 
              ? 'bg-indigo-500 border-indigo-500' 
              : 'bg-[#161B22] border-gray-600 hover:border-indigo-400'
          }`}>
            {checked && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
      </div>
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-300 cursor-pointer select-none">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  // Search Component
  const SearchBar = () => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaSearch className="h-5 w-5 text-gray-500" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search games by name..."
        className="w-full pl-10 pr-4 py-3 bg-[#161B22] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 placeholder-gray-500 transition-all duration-200"
      />
      {searchTerm && (
        <button
          onClick={() => {
            setSearchTerm("");
            setCurrentPage(1);
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <FaTimes className="h-5 w-5 text-gray-500 hover:text-gray-300" />
        </button>
      )}
    </div>
  );

  // Pagination Component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
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

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-all duration-200 ${
            currentPage === 1
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed border-gray-700'
              : 'bg-[#161B22] text-gray-300 hover:bg-indigo-900 hover:border-indigo-500 hover:text-indigo-300 border-gray-700'
          }`}
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all duration-200 ${
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-md'
                  : page === '...'
                  ? 'cursor-default text-gray-500'
                  : 'bg-[#161B22] text-gray-300 hover:bg-indigo-900 hover:text-indigo-300 border border-gray-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border transition-all duration-200 ${
            currentPage === totalPages
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed border-gray-700'
              : 'bg-[#161B22] text-gray-300 hover:bg-indigo-900 hover:border-indigo-500 hover:text-indigo-300 border-gray-700'
          }`}
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Function to filter games based on search term
  const filterGamesBySearch = (gamesList, term) => {
    if (!term.trim()) return gamesList;
    
    const searchTermLower = term.toLowerCase();
    return gamesList.filter(game => 
      game.gameName?.toLowerCase().includes(searchTermLower) ||
      game.name?.toLowerCase().includes(searchTermLower) ||
      (game.provider?.providerName?.toLowerCase().includes(searchTermLower) || false)
    );
  };

  // Update paginated games when filtered games or current page changes
  useEffect(() => {
    const indexOfLastGame = currentPage * gamesPerPage;
    const indexOfFirstGame = indexOfLastGame - gamesPerPage;
    const currentGames = filteredGames.slice(indexOfFirstGame, indexOfLastGame);
    setPaginatedGames(currentGames);
    setTotalPages(Math.ceil(filteredGames.length / gamesPerPage));
  }, [filteredGames, currentPage, gamesPerPage]);

  // Reset select all when page changes
  useEffect(() => {
    const currentPageUnsavedGames = paginatedGames.filter(game => !game.isSavedInSelectedCategory);
    const currentPageSelectedCount = currentPageUnsavedGames.filter(game => selectedGames.has(game.uniqueId)).length;
    
    if (currentPageUnsavedGames.length > 0) {
      setSelectAll(currentPageSelectedCount === currentPageUnsavedGames.length);
    } else {
      setSelectAll(false);
    }
  }, [paginatedGames, selectedGames]);

  // Fetch categories from local API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await api.get('/api/admin/game-categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to fetch categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Update selected category name when selectedCategory changes
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const categoryObj = categories.find(c => c._id === selectedCategory);
      setSelectedCategoryName(categoryObj?.name || "");
    } else {
      setSelectedCategoryName("");
    }
  }, [selectedCategory, categories]);

  // Fetch local providers
  useEffect(() => {
    const fetchLocalProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await api.get('/api/admin/game-providers');
        setLocalProviders(response.data);
      } catch (error) {
        console.error("Error fetching local providers:", error);
        toast.error("Failed to fetch local providers");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchLocalProviders();
  }, []);

  // Filter local providers based on selected category
  useEffect(() => {
    if (selectedCategory && localProviders.length > 0 && categories.length > 0) {
      const selectedCategoryObj = categories.find(c => c._id === selectedCategory);
      
      if (selectedCategoryObj) {
        const categoryName = selectedCategoryObj.name?.toLowerCase();
        const filtered = localProviders.filter(provider => {
          const providerCategory = provider.category?.toLowerCase();
          return providerCategory === categoryName;
        });
        setFilteredProviders(filtered);
        
        if (selectedProvider) {
          const selectedProviderObj = filtered.find(p => p._id === selectedProvider);
          if (!selectedProviderObj) {
            setSelectedProvider("");
          }
        }
      }
    } else {
      setFilteredProviders([]);
      setSelectedProvider("");
    }
  }, [selectedCategory, localProviders, categories]);

  // Fetch and merge providers from Oracle API
  useEffect(() => {
    const fetchAndMergeProviders = async () => {
      if (filteredProviders.length === 0) {
        setProviders([]);
        return;
      }
      
      setLoadingProviders(true);
      try {
        const externalRes = await oracleApi.get('/providers');
        const externalProviders = externalRes.data.data || [];
        
        const localProviderMap = new Map();
        filteredProviders.forEach(p => {
          if (p.providercode) localProviderMap.set(p.providercode.toLowerCase(), p);
          if (p.name) localProviderMap.set(p.name.toLowerCase(), p);
          if (p.providerOracleID) localProviderMap.set(p.providerOracleID, p);
        });

        const mergedProviders = externalProviders.filter((p) => {
          const providerCode = p.providerCode?.toLowerCase();
          const providerName = p.providerName?.toLowerCase();
          const code = p.code?.toLowerCase();
          const id = p._id;
          
          return localProviderMap.has(providerCode) || 
                 localProviderMap.has(providerName) ||
                 localProviderMap.has(code) ||
                 localProviderMap.has(id);
        });

        setProviders(mergedProviders);
      } catch (error) {
        console.error("Error fetching and merging providers:", error);
        toast.error('Failed to fetch providers');
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchAndMergeProviders();
  }, [filteredProviders]);

  // Function to fetch all games from local database
  const fetchAllLocalGames = async () => {
    try {
      const response = await api.get('/api/admin/games/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching local games:', error);
      toast.error('Failed to fetch local games');
      return [];
    }
  };

  // Fetch local games on component mount
  useEffect(() => {
    const fetchLocalGames = async () => {
      const games = await fetchAllLocalGames();
      setLocalGames(games);
    };
    fetchLocalGames();
  }, []);

  // Fetch games based on selected provider
  useEffect(() => {
    if (!selectedProvider) {
      setGames([]);
      setFilteredGames([]);
      setSearchTerm("");
      setCurrentPage(1);
      return;
    }

    const fetchAndFilterGames = async () => {
      setLoadingGames(true);
      setSearchTerm("");
      setUseDefaultImage({});
      setEditingGame(null);
      setSelectedGames(new Set());
      setSelectAll(false);
      
      const currentPageBeforeLoad = currentPage;
      
      try {
        const selectedProviderObj = providers.find(p => p._id === selectedProvider || p.value === selectedProvider);
        const providerCode = selectedProviderObj?.providerCode || selectedProviderObj?.code;
        
        if (!providerCode) {
          toast.error("Invalid provider selection");
          return;
        }

        const oracleGamesRes = await oracleApi.get('/games?page=1&limit=5000');
        const oracleGamesData = oracleGamesRes.data;
        
        const localGamesList = await fetchAllLocalGames();
        setLocalGames(localGamesList);
        
        // Create maps for existing games
        const existingGamesMap = new Map();
        const existingGamesByGameId = new Map();
        const existingGamesByUniqueId = new Map();
        
        localGamesList.forEach(game => {
          const compositeKey = `${game.gameApiID}-${game.provider}`;
          existingGamesMap.set(compositeKey, game);
          
          if (game.gameApiID) {
            existingGamesByGameId.set(game.gameApiID, game);
          }
          
          if (game._id) {
            existingGamesMap.set(`id-${game._id}`, game);
          }
          
          if (game.uniqueId) {
            existingGamesByUniqueId.set(game.uniqueId, game);
          }
        });

        const providerGames = oracleGamesData.data.filter(
          (game) => {
            const gameProviderCode = game.provider?.provider_code || game.provider?.code;
            return gameProviderCode === providerCode;
          }
        );

        const transformedGames = providerGames.map((externalGame) => {
          const gameApiID = externalGame.game_code || externalGame.code;
          const provider = externalGame.provider?.provider_code || externalGame.provider?.code;
          const gameUuid = externalGame._id || externalGame.game_uuid;
          
          const compositeKey = `${gameApiID}-${provider}`;
          let existingGame = null;
          
          // Try multiple matching strategies
          existingGame = existingGamesMap.get(compositeKey);
          
          if (!existingGame) {
            existingGame = existingGamesByGameId.get(gameApiID);
          }
          
          if (!existingGame && gameUuid) {
            existingGame = existingGamesByUniqueId.get(gameUuid);
            if (!existingGame) {
              existingGame = existingGamesMap.get(`id-${gameUuid}`);
            }
          }
          
          if (!existingGame) {
            existingGame = localGamesList.find(g => 
              (g.name === (externalGame.gameName || externalGame.name)) && 
              g.provider === provider
            );
          }
          
          const uniqueId = gameUuid || compositeKey;
          
          // Parse existing categories
          let existingCategories = [];
          if (existingGame?.category) {
            if (Array.isArray(existingGame.category)) {
              existingCategories = existingGame.category;
            } else if (typeof existingGame.category === 'string') {
              existingCategories = [existingGame.category];
            }
          }
          
          // CRITICAL FIX: Determine if game should show "Edit Game" based on current selected category
          // A game is considered "saved for this category" ONLY if it already has the selected category in its categories
          const isSavedInSelectedCategory = existingGame && selectedCategoryName && 
            existingCategories.some(cat => cat.toLowerCase() === selectedCategoryName.toLowerCase());
          
          // For cases where no category is selected, default to existing game existence
          const defaultIsSaved = !!existingGame;
          
          return {
            ...externalGame,
            _id: uniqueId,
            uniqueId: uniqueId,
            game_uuid: gameUuid,
            name: externalGame.gameName || externalGame.name,
            game_code: gameApiID,
            provider: externalGame.provider,
            coverImage: externalGame.image,
            image: externalGame.image,
            isSaved: !!existingGame, // Overall saved status
            isSavedInSelectedCategory: selectedCategoryName ? isSavedInSelectedCategory : defaultIsSaved, // Category-specific saved status
            existingGameData: existingGame,
            existingCategories: existingCategories, // Store existing categories for reference
            localFeatured: existingGame?.featured || false,
            localStatus: existingGame?.status ?? true,
            localFullScreen: existingGame?.fullScreen || false,
            localCategories: existingCategories.length > 0 ? existingCategories : (selectedCategoryName ? [selectedCategoryName] : []),
            localPortraitImage: null,
            localPortraitPreview: null,
            localLandscapeImage: null,
            localLandscapePreview: null,
            useDefaultImage: true,
          };
        });
        
        console.log("Transformed games:", transformedGames.map(g => ({ 
          name: g.name, 
          isSaved: g.isSaved, 
          isSavedInSelectedCategory: g.isSavedInSelectedCategory,
          existingCategories: g.existingCategories,
          selectedCategoryName: selectedCategoryName
        })));
        
        setGames(transformedGames);
        setFilteredGames(transformedGames);
        
        const defaultImageState = {};
        transformedGames.forEach(game => {
          defaultImageState[game.uniqueId] = true;
        });
        setUseDefaultImage(defaultImageState);
        
        setCurrentPage(currentPageBeforeLoad);
        
      } catch (error) {
        console.error("Error fetching and filtering games:", error);
        toast.error('Failed to fetch games');
      } finally {
        setLoadingGames(false);
      }
    };

    if (selectedProvider) {
      fetchAndFilterGames();
    }
  }, [selectedProvider, providers, selectedCategoryName]);

  // Apply search filter whenever games or search term changes
  useEffect(() => {
    const searchFiltered = filterGamesBySearch(games, searchTerm);
    setFilteredGames(searchFiltered);
    setSelectedGames(new Set());
    setSelectAll(false);
  }, [games, searchTerm]);

  // Selection handlers
  const toggleGameSelection = (gameId) => {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
    
    const currentPageUnsavedGames = paginatedGames.filter(game => !game.isSavedInSelectedCategory);
    const currentPageSelectedCount = currentPageUnsavedGames.filter(game => newSelected.has(game.uniqueId)).length;
    setSelectAll(currentPageSelectedCount === currentPageUnsavedGames.length && currentPageUnsavedGames.length > 0);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      const newSelected = new Set(selectedGames);
      paginatedGames.forEach(game => {
        if (!game.isSavedInSelectedCategory) {
          newSelected.delete(game.uniqueId);
        }
      });
      setSelectedGames(newSelected);
      setSelectAll(false);
    } else {
      const newSelected = new Set(selectedGames);
      paginatedGames.forEach(game => {
        if (!game.isSavedInSelectedCategory) {
          newSelected.add(game.uniqueId);
        }
      });
      setSelectedGames(newSelected);
      setSelectAll(true);
    }
  };

  const clearSelections = () => {
    setSelectedGames(new Set());
    setSelectAll(false);
  };

  const handleBulkAction = () => {
    if (selectedGames.size === 0) {
      toast.error("Please select at least one game to add");
      return;
    }

    const selectedGamesList = filteredGames.filter(game => selectedGames.has(game.uniqueId) && !game.isSavedInSelectedCategory);
    
    if (selectedGamesList.length === 0) {
      toast.error("Selected games are already saved for this category");
      clearSelections();
      return;
    }

    setBulkGames(selectedGamesList);
    setBulkCategories([selectedCategory]);
    setShowBulkModal(true);
    setBulkImage(null);
    setBulkImagePreview(null);
    setBulkUseDefaultImage(true);
    setBulkActionMode(true);
  };

  const handleSingleGameAdd = (game) => {
    setBulkGames([game]);
    // Use existing categories plus current selected category
    const existingCats = game.existingCategories || [];
    const mergedCats = [...new Set([...existingCats, selectedCategoryName])];
    setBulkCategories(mergedCats.map(catName => {
      const catObj = categories.find(c => c.name === catName);
      return catObj ? catObj._id : null;
    }).filter(id => id));
    setShowBulkModal(true);
    setBulkImage(null);
    setBulkImagePreview(null);
    setBulkUseDefaultImage(true);
    setBulkActionMode(false);
  };

  const handleGameDataChange = (gameId, field, value) => {
    setGames((prevGames) =>
      prevGames.map((game) =>
        game.uniqueId === gameId ? { ...game, [field]: value } : game
      )
    );
  };

  const handleCategoryToggle = (gameId, categoryId) => {
    setGames((prevGames) =>
      prevGames.map((game) => {
        if (game.uniqueId === gameId) {
          let newCategories = [...(game.localCategories || [])];
          if (newCategories.includes(categoryId)) {
            newCategories = newCategories.filter(c => c !== categoryId);
          } else {
            newCategories.push(categoryId);
          }
          return { ...game, localCategories: newCategories };
        }
        return game;
      })
    );
  };

  const handleImageUpload = (gameId, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGames((prevGames) =>
        prevGames.map((game) => {
          if (game.uniqueId === gameId) {
            return {
              ...game,
              localPortraitImage: file,
              localPortraitPreview: reader.result,
              localLandscapeImage: file,
              localLandscapePreview: reader.result,
            };
          }
          return game;
        })
      );
      
      setUseDefaultImage(prev => ({
        ...prev,
        [gameId]: false
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (gameId) => {
    setGames((prevGames) =>
      prevGames.map((game) => {
        if (game.uniqueId === gameId) {
          return {
            ...game,
            localPortraitImage: null,
            localPortraitPreview: null,
            localLandscapeImage: null,
            localLandscapePreview: null,
          };
        }
        return game;
      })
    );
    
    setUseDefaultImage(prev => ({
      ...prev,
      [gameId]: true
    }));
  };

  const toggleUseDefaultImage = (gameId) => {
    setUseDefaultImage(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
    
    if (!useDefaultImage[gameId]) {
      setGames((prevGames) =>
        prevGames.map((game) => {
          if (game.uniqueId === gameId) {
            return {
              ...game,
              localPortraitImage: null,
              localPortraitPreview: null,
              localLandscapeImage: null,
              localLandscapePreview: null,
            };
          }
          return game;
        })
      );
    }
  };

  const handleEditGame = (game) => {
    setEditingGame(game.uniqueId);
    setTimeout(() => {
      document.getElementById(`game-${game.uniqueId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
  };

  // handleSaveOrUpdateGame function
  const handleSaveOrUpdateGame = async (gameId) => {
    const gameToSave = games.find((g) => g.uniqueId === gameId);
    
    // Get category names from IDs
    const categoryNames = gameToSave.localCategories
      .map(catId => {
        const cat = categories.find(c => c._id === catId);
        return cat ? cat.name : null;
      })
      .filter(name => name !== null);
    
    if (categoryNames.length === 0) {
      toast.error("Please select at least one category for the game.");
      return;
    }
    
    const isUsingDefaultImage = useDefaultImage[gameId];
    
    if (!isUsingDefaultImage && !gameToSave.localPortraitImage) {
      toast.error("Please upload an image or use the default image.");
      return;
    }

    const isUpdate = gameToSave.isSaved;
    
    if (isUpdate) {
      setUpdatingGameId(gameId);
    } else {
      setSavingGameId(gameId);
    }

    try {
      const formData = new FormData();
      formData.append("gameApiID", gameToSave.game_code);
      formData.append("name", gameToSave.gameName || gameToSave.name);
      formData.append("provider", gameToSave.provider?.provider_code);
      formData.append("uniqueId", gameToSave.uniqueId);
      
      // Send categories as comma-separated string
      formData.append("category", categoryNames.join(','));
      
      formData.append("featured", gameToSave.localFeatured ? "true" : "false");
      formData.append("status", gameToSave.localStatus ? "true" : "false");
      formData.append("fullScreen", gameToSave.localFullScreen ? "true" : "false");
      
      if (isUsingDefaultImage) {
        const defaultImageUrl = gameToSave.image || gameToSave.coverImage;
        if (defaultImageUrl) {
          formData.append("defaultImage", defaultImageUrl);
        } else {
          toast.error("No default image available for this game.");
          if (isUpdate) {
            setUpdatingGameId(null);
          } else {
            setSavingGameId(null);
          }
          return;
        }
      } else {
        if (gameToSave.localPortraitImage) {
          formData.append("portraitImage", gameToSave.localPortraitImage);
          formData.append("landscapeImage", gameToSave.localPortraitImage);
        }
      }

      const url = isUpdate 
        ? `/api/admin/games/${gameToSave.existingGameData?._id || gameId}`
        : '/api/admin/games';
      
      let response;
      if (isUpdate) {
        response = await api.put(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await api.post(url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      if (response.status === 200 || response.status === 201) {
        const updatedGameData = response.data.game || response.data;
        
        // Refresh local games list
        const refreshedLocalGames = await fetchAllLocalGames();
        setLocalGames(refreshedLocalGames);
        
        // Create a map for quick lookup
        const refreshedGamesMap = new Map();
        refreshedLocalGames.forEach(game => {
          const compositeKey = `${game.gameApiID}-${game.provider}`;
          refreshedGamesMap.set(compositeKey, game);
        });
        
        // Update the games state with refreshed data
        setGames(prevGames => 
          prevGames.map(game => {
            if (game.uniqueId === gameId) {
              const compositeKey = `${game.game_code}-${game.provider?.provider_code}`;
              const refreshedGame = refreshedGamesMap.get(compositeKey);
              
              let updatedCategories = categoryNames;
              if (refreshedGame?.category) {
                updatedCategories = refreshedGame.category;
              } else if (updatedGameData?.category) {
                updatedCategories = updatedGameData.category;
              }
              
              // Update isSavedInSelectedCategory based on whether selected category is in updated categories
              const isSavedInSelectedCategory = selectedCategoryName && 
                updatedCategories.some(cat => cat.toLowerCase() === selectedCategoryName.toLowerCase());
              
              return {
                ...game,
                isSaved: true,
                existingGameData: refreshedGame || updatedGameData,
                existingCategories: updatedCategories,
                isSavedInSelectedCategory: isSavedInSelectedCategory,
                localCategories: updatedCategories,
                localPortraitImage: null,
                localPortraitPreview: null,
                localLandscapeImage: null,
                localLandscapePreview: null,
              };
            }
            return game;
          })
        );
        
        toast.success(response.data.message || `Game ${isUpdate ? 'updated' : 'added'} successfully`);
        setEditingGame(null);
      } else {
        toast.error(`Failed to ${isUpdate ? 'update' : 'add'} game.`);
      }
    } catch (error) {
      console.error(`Error ${isUpdate ? 'updating' : 'saving'} game:`, error);
      if (error.response) {
        toast.error(`❌ ${error.response.data.error || error.response.data.message || `Failed to ${isUpdate ? 'update' : 'add'} game.`}`);
      } else {
        toast.error(`❌ ${error.message}`);
      }
    } finally {
      setSavingGameId(null);
      setUpdatingGameId(null);
    }
  };

  // Bulk Add Functions
  const openBulkModal = () => {
    if (!selectedProvider) {
      toast.error("Please select a provider first");
      return;
    }
    
    if (!selectedCategory) {
      toast.error("Please select a default category first");
      return;
    }

    const unsavedGames = filteredGames.filter(game => !game.isSavedInSelectedCategory);
    
    if (unsavedGames.length === 0) {
      toast.info("No unsaved games available for bulk add");
      return;
    }

    setBulkGames(unsavedGames);
    setBulkCategories([selectedCategory]);
    setShowBulkModal(true);
    setBulkImage(null);
    setBulkImagePreview(null);
    setBulkUseDefaultImage(true);
    setBulkActionMode(false);
  };

  const handleBulkImageUpload = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBulkImage(file);
      setBulkImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeBulkImage = () => {
    setBulkImage(null);
    setBulkImagePreview(null);
  };

  const handleBulkAdd = async () => {
    if (bulkCategories.length === 0) {
      toast.error("Please select at least one category for bulk add");
      return;
    }

    if (!bulkUseDefaultImage && !bulkImage) {
      toast.error("Please upload an image or use default images");
      return;
    }

    setBulkSaving(true);
    setBulkProgress({ current: 0, total: bulkGames.length });
    setCurrentAddingGame("");

    const results = {
      successful: [],
      failed: []
    };

    try {
      let validGames = bulkGames;
      if (bulkUseDefaultImage) {
        validGames = bulkGames.filter(game => game.image || game.coverImage);
        if (validGames.length === 0) {
          toast.error("No valid games to add. Selected games are missing default images.");
          setBulkSaving(false);
          return;
        }
        setBulkProgress({ current: 0, total: validGames.length });
      }

      const categoryNames = bulkCategories
        .map(catId => {
          const cat = categories.find(c => c._id === catId);
          return cat ? cat.name : null;
        })
        .filter(name => name !== null);

      for (let i = 0; i < validGames.length; i++) {
        const game = validGames[i];
        setCurrentAddingGame(game.gameName || game.name || `Game ${i + 1}`);
        
        try {
          const formData = new FormData();
          
          formData.append("gameApiID", game.game_code);
          formData.append("name", game.gameName || game.name);
          formData.append("provider", game.provider?.provider_code);
          formData.append("uniqueId", game.uniqueId);
          
          // Merge existing categories with new categories
          const existingCatNames = game.existingCategories || [];
          const mergedCategoryNames = [...new Set([...existingCatNames, ...categoryNames])];
          formData.append("category", mergedCategoryNames.join(','));
          
          formData.append("featured", bulkFeatured ? "true" : "false");
          formData.append("status", bulkStatus ? "true" : "false");
          formData.append("fullScreen", bulkFullScreen ? "true" : "false");
          
          if (bulkUseDefaultImage) {
            const defaultImageUrl = game.image || game.coverImage;
            if (defaultImageUrl) {
              formData.append("defaultImage", defaultImageUrl);
            }
          } else {
            if (bulkImage) {
              formData.append("portraitImage", bulkImage);
              formData.append("landscapeImage", bulkImage);
            }
          }

          const response = await api.post('/api/admin/games', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

          if (response.status === 200 || response.status === 201) {
            results.successful.push(game);
          } else {
            results.failed.push({ game, error: "Failed to add game" });
          }
        } catch (error) {
          console.error(`Error adding game ${game.gameName || game.name}:`, error);
          results.failed.push({ 
            game, 
            error: error.response?.data?.message || error.message || "Unknown error" 
          });
        }

        setBulkProgress({ current: i + 1, total: validGames.length });
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (results.failed.length > 0) {
        toast.error(
          <div>
            <strong>Bulk Add Completed with Errors</strong>
            <p className="text-sm mt-1">✅ {results.successful.length} games added successfully</p>
            <p className="text-sm">❌ {results.failed.length} games failed</p>
          </div>
        );
      } else {
        toast.success(`All ${results.successful.length} games have been added successfully.`);
      }

      const updatedLocalGames = await fetchAllLocalGames();
      setLocalGames(updatedLocalGames);

      // Refresh the games list
      const refreshedGamesMap = new Map();
      updatedLocalGames.forEach(game => {
        const compositeKey = `${game.gameApiID}-${game.provider}`;
        refreshedGamesMap.set(compositeKey, game);
      });

      setGames(prevGames => 
        prevGames.map(game => {
          const compositeKey = `${game.game_code}-${game.provider?.provider_code}`;
          const refreshedGame = refreshedGamesMap.get(compositeKey);
          
          if (refreshedGame) {
            const updatedCategories = refreshedGame.category || [];
            const isSavedInSelectedCategory = selectedCategoryName && 
              updatedCategories.some(cat => cat.toLowerCase() === selectedCategoryName.toLowerCase());
            
            return {
              ...game,
              isSaved: true,
              existingGameData: refreshedGame,
              existingCategories: updatedCategories,
              isSavedInSelectedCategory: isSavedInSelectedCategory,
              localCategories: updatedCategories,
            };
          }
          return game;
        })
      );

      clearSelections();

      setTimeout(() => {
        setShowBulkModal(false);
        resetBulkState();
      }, 300);

    } catch (error) {
      console.error("Error in bulk add:", error);
      toast.error(`❌ ${error.message || "Failed to add games in bulk"}`);
    } finally {
      setBulkSaving(false);
      setCurrentAddingGame("");
    }
  };

  const resetBulkState = () => {
    setBulkGames([]);
    setBulkCategories([]);
    setBulkFeatured(false);
    setBulkStatus(true);
    setBulkFullScreen(false);
    setBulkUseDefaultImage(true);
    setBulkImage(null);
    setBulkImagePreview(null);
    setBulkProgress({ current: 0, total: 0 });
    setCurrentAddingGame("");
  };

  // Delete Single Game Function with SweetAlert
  const handleDeleteGame = async (gameId) => {
    const gameToDelete = games.find(g => g.uniqueId === gameId);
    
    if (!gameToDelete?.existingGameData?._id) {
      toast.error("Cannot delete game: Game not found in database");
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Game?',
      html: `Are you sure you want to delete "<strong>${gameToDelete.gameName || gameToDelete.name}</strong>"?<br/>This action cannot be undone.`,
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
    });

    if (result.isConfirmed) {
      setDeletingGameId(gameId);
      
      try {
        const response = await api.delete(`/api/admin/games/${gameToDelete.existingGameData._id}`);
        
        if (response.status === 200) {
          Swal.fire({
            title: 'Deleted!',
            text: `"${gameToDelete.gameName || gameToDelete.name}" has been removed successfully.`,
            icon: 'success',
            confirmButtonColor: '#6366f1',
            background: '#1F2937',
            customClass: {
              popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
              confirmButton: 'px-6 py-2 rounded-lg font-medium'
            }
          });
          
          const updatedLocalGames = await fetchAllLocalGames();
          setLocalGames(updatedLocalGames);
          
          setGames(prevGames => 
            prevGames.map(game => {
              if (game.uniqueId === gameId) {
                return {
                  ...game,
                  isSaved: false,
                  existingGameData: null,
                  existingCategories: [],
                  isSavedInSelectedCategory: false,
                  localFeatured: false,
                  localStatus: true,
                  localFullScreen: false,
                  localCategories: [selectedCategoryName],
                };
              }
              return game;
            })
          );
          
          if (selectedGames.has(gameId)) {
            const newSelected = new Set(selectedGames);
            newSelected.delete(gameId);
            setSelectedGames(newSelected);
          }
          
          setEditingGame(null);
        }
      } catch (error) {
        console.error("Error deleting game:", error);
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
      } finally {
        setDeletingGameId(null);
      }
    }
  };

  // Delete Selected Games Function
  const handleDeleteSelectedGames = async () => {
    const selectedSavedGames = Array.from(selectedGames)
      .map(id => games.find(g => g.uniqueId === id))
      .filter(game => game?.isSaved && game?.existingGameData?._id);

    if (selectedSavedGames.length === 0) {
      toast.error("No saved games selected for deletion");
      setShowDeleteSelectedModal(false);
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Selected Games?',
      html: `Are you sure you want to delete <strong>${selectedSavedGames.length}</strong> selected game${selectedSavedGames.length !== 1 ? 's' : ''}?<br/><br/>This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Yes, delete ${selectedSavedGames.length} game${selectedSavedGames.length !== 1 ? 's' : ''}!`,
      cancelButtonText: 'Cancel',
      background: '#1F2937',
      customClass: {
        popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
        title: 'text-xl font-bold text-gray-200',
        confirmButton: 'px-6 py-2 rounded-lg font-medium',
        cancelButton: 'px-6 py-2 rounded-lg font-medium'
      }
    });

    if (result.isConfirmed) {
      setDeletingSelected(true);
      
      const results = {
        successful: [],
        failed: []
      };

      for (const game of selectedSavedGames) {
        try {
          const response = await api.delete(`/api/admin/games/${game.existingGameData._id}`);
          
          if (response.status === 200) {
            results.successful.push(game);
            
            setGames(prevGames => 
              prevGames.map(g => {
                if (g.uniqueId === game.uniqueId) {
                  return {
                    ...g,
                    isSaved: false,
                    existingGameData: null,
                    existingCategories: [],
                    isSavedInSelectedCategory: false,
                    localFeatured: false,
                    localStatus: true,
                    localFullScreen: false,
                    localCategories: [selectedCategoryName],
                  };
                }
                return g;
              })
            );
          } else {
            results.failed.push({ game, error: "Failed to delete" });
          }
        } catch (error) {
          console.error(`Error deleting game ${game.gameName || game.name}:`, error);
          results.failed.push({ 
            game, 
            error: error.response?.data?.message || error.message || "Unknown error" 
          });
        }
      }

      const updatedLocalGames = await fetchAllLocalGames();
      setLocalGames(updatedLocalGames);

      if (results.failed.length > 0) {
        Swal.fire({
          title: 'Partial Success!',
          html: `✅ ${results.successful.length} games deleted successfully<br/>❌ ${results.failed.length} games failed to delete`,
          icon: 'warning',
          confirmButtonColor: '#6366f1',
          background: '#1F2937',
          customClass: {
            popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
            confirmButton: 'px-6 py-2 rounded-lg font-medium'
          }
        });
      } else {
        Swal.fire({
          title: 'Deleted!',
          text: `${results.successful.length} game${results.successful.length !== 1 ? 's' : ''} have been removed successfully.`,
          icon: 'success',
          confirmButtonColor: '#6366f1',
          background: '#1F2937',
          customClass: {
            popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
            confirmButton: 'px-6 py-2 rounded-lg font-medium'
          }
        });
      }

      setSelectedGames(new Set());
      setSelectAll(false);
      setShowDeleteSelectedModal(false);
      setDeletingSelected(false);
      setEditingGame(null);
    } else {
      setShowDeleteSelectedModal(false);
    }
  };

  // Delete All Added Games Function
  const handleDeleteAllAddedGames = async () => {
    if (deleteConfirmText !== "DELETE ALL ADDED GAMES") {
      Swal.fire({
        title: 'Confirmation Required',
        text: 'Please type "DELETE ALL ADDED GAMES" to confirm deletion',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
        background: '#1F2937',
        customClass: {
          popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
          confirmButton: 'px-6 py-2 rounded-lg font-medium'
        }
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete All Added Games?',
      html: `Are you absolutely sure you want to delete <strong>ALL ${savedGamesCount} games</strong> that have been added to your platform?<br/><br/><span class="text-red-400">This action cannot be undone!</span>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete all!',
      cancelButtonText: 'Cancel',
      background: '#1F2937',
      customClass: {
        popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
        title: 'text-xl font-bold text-gray-200',
        confirmButton: 'px-6 py-2 rounded-lg font-medium',
        cancelButton: 'px-6 py-2 rounded-lg font-medium'
      }
    });

    if (result.isConfirmed) {
      setDeletingAll(true);
      
      try {
        const response = await api.delete('/api/admin/games/all?confirm=true');
        
        if (response.status === 200) {
          Swal.fire({
            title: 'Deleted!',
            text: `${response.data.details.gamesDeleted} games have been removed successfully.`,
            icon: 'success',
            confirmButtonColor: '#6366f1',
            background: '#1F2937',
            customClass: {
              popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
              confirmButton: 'px-6 py-2 rounded-lg font-medium'
            }
          });
          
          const updatedLocalGames = await fetchAllLocalGames();
          setLocalGames(updatedLocalGames);
          
          setGames(prevGames => 
            prevGames.map(game => ({
              ...game,
              isSaved: false,
              existingGameData: null,
              existingCategories: [],
              isSavedInSelectedCategory: false,
              localFeatured: false,
              localStatus: true,
              localFullScreen: false,
              localCategories: [selectedCategoryName],
            }))
          );
          
          setShowDeleteAllModal(false);
          setDeleteConfirmText("");
          setEditingGame(null);
          setSelectedGames(new Set());
          setSelectAll(false);
        }
      } catch (error) {
        console.error("Error deleting all added games:", error);
        Swal.fire({
          title: 'Error!',
          text: error.response?.data?.error || error.response?.data?.message || 'Failed to delete games',
          icon: 'error',
          confirmButtonColor: '#6366f1',
          background: '#1F2937',
          customClass: {
            popup: 'rounded-2xl bg-[#1F2937] text-gray-200',
            confirmButton: 'px-6 py-2 rounded-lg font-medium'
          }
        });
      } finally {
        setDeletingAll(false);
      }
    } else {
      setShowDeleteAllModal(false);
      setDeleteConfirmText("");
    }
  };

  const selectedProviderObj = providers.find(p => p._id === selectedProvider || p.value === selectedProvider);
  const selectedProviderName = selectedProviderObj?.providerName || selectedProviderObj?.name || "";

  const unsavedGamesCount = filteredGames.filter(g => !g.isSavedInSelectedCategory).length;
  const savedGamesCount = filteredGames.filter(g => g.isSavedInSelectedCategory).length;
  const selectedSavedCount = Array.from(selectedGames).filter(id => {
    const game = filteredGames.find(g => g.uniqueId === id);
    return game && game.isSavedInSelectedCategory;
  }).length;
  const selectedUnsavedCount = Array.from(selectedGames).filter(id => {
    const game = filteredGames.find(g => g.uniqueId === id);
    return game && !game.isSavedInSelectedCategory;
  }).length;

  const currentPageUnsavedGames = paginatedGames.filter(game => !game.isSavedInSelectedCategory);
  const currentPageSavedGames = paginatedGames.filter(game => game.isSavedInSelectedCategory);
  const currentPageSelectedCount = currentPageUnsavedGames.filter(game => selectedGames.has(game.uniqueId)).length;
  const currentPageSelectedSavedCount = currentPageSavedGames.filter(game => selectedGames.has(game.uniqueId)).length;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setTimeout(() => {
      document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />

      <Toaster/>
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300 flex-1 p-4 md:p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? "md:ml-[40%] lg:ml-[28%] xl:ml-[17%]" : "ml-0"
          }`}
        >
          <div className="w-full mx-auto">
            {/* Header Section */}
            <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Manage Games</h1>
                <p className="text-xs font-bold text-gray-500 mt-1">Add new games or update existing games from providers</p>
              </div>
              
              {savedGamesCount > 0 && (
                <button
                  onClick={() => setShowDeleteAllModal(true)}
                  className="w-full md:w-auto mt-4 md:mt-0 bg-[#1F2937] hover:bg-red-600 border border-gray-700 px-6 py-3 cursor-pointer rounded font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <FaTrash /> Delete All Added Games ({savedGamesCount})
                </button>
              )}
            </div>

            {/* Filter Card */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  Filter Games
                </h3>
                {selectedProvider && (
                  <div className="px-3 py-1 bg-indigo-900 text-indigo-300 rounded-full text-xs font-medium">
                    Provider: {selectedProviderName}
                  </div>
                )}
              </div>
              
              <div>
                <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaSearch className="h-5 w-5 text-gray-500" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search games by name..."
        className="w-full pl-10 pr-4 py-3 bg-[#161B22] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200 placeholder-gray-500 transition-all duration-200"
      />
      {searchTerm && (
        <button
          onClick={() => {
            setSearchTerm("");
            setCurrentPage(1);
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <FaTimes className="h-5 w-5 text-gray-500 hover:text-gray-300" />
        </button>
      )}
    </div>
              </div>
              
              <div className="flex mt-[20px] justify-center w-full gap-[20px]">
                <CustomSelect
                  options={categories.filter(cat => cat.status)}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="category"
                  loading={loadingCategories}
                  icon={MdCategory}
                  dropdownOpen={showCategoriesDropdown}
                  setDropdownOpen={setShowCategoriesDropdown}
                  label="Select Game Category"
                />
                <CustomSelect
                  options={providers}
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                  placeholder="provider"
                  loading={loadingProviders}
                  icon={FaGamepad}
                  dropdownOpen={showProvidersDropdown}
                  setDropdownOpen={setShowProvidersDropdown}
                  label="Select Game Provider"
                  disabled={!selectedCategory}
                />
              </div>
            </div>

            {/* Selection and Action Bar */}
            {!loadingGames && filteredGames.length > 0 && (
              <div className="mb-6 bg-[#161B22] rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 bg-[#1C2128] border-b border-gray-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center space-x-2 text-gray-400 hover:text-indigo-400 transition-colors"
                        disabled={currentPageUnsavedGames.length === 0 && currentPageSavedGames.length === 0}
                      >
                        {selectAll ? (
                          <FaCheckCircle className="text-indigo-500 text-xl" />
                        ) : (
                          <FaRegCircle className="text-gray-500 text-xl" />
                        )}
                        <span className="font-medium text-sm">
                          {selectAll ? 'Deselect All on Page' : 'Select All on Page'}
                        </span>
                      </button>
                      {selectedGames.size > 0 && (
                        <>
                          <span className="text-sm text-gray-500">
                            {currentPageSelectedCount + currentPageSelectedSavedCount} of {paginatedGames.length} on this page • 
                            {selectedUnsavedCount > 0 && <span className="text-indigo-400 ml-1">{selectedUnsavedCount} new</span>}
                            {selectedSavedCount > 0 && <span className="text-green-500 ml-1">{selectedSavedCount} saved</span>}
                          </span>
                          <button
                            onClick={clearSelections}
                            className="text-sm text-red-400 hover:text-red-300 transition-colors"
                          >
                            Clear All
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {selectedSavedCount > 0 && (
                        <button
                          onClick={() => setShowDeleteSelectedModal(true)}
                          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center shadow-md text-sm"
                        >
                          <FaTrash className="mr-2" />
                          Delete Selected ({selectedSavedCount})
                        </button>
                      )}
                      
                      {selectedUnsavedCount > 0 && (
                        <button
                          onClick={handleBulkAction}
                          className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center shadow-md text-sm"
                        >
                          <FaPlusCircle className="mr-2" />
                          Add Selected ({selectedUnsavedCount})
                        </button>
                      )}
                      
                      <button
                        onClick={openBulkModal}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center shadow-md text-sm"
                        disabled={unsavedGamesCount === 0}
                      >
                        <FaList className="mr-2" />
                        Add All Unsaved ({unsavedGamesCount})
                      </button>
                    </div>
                  </div>
                </div>
                
                {selectedGames.size > 0 && (
                  <div className="px-4 py-2 bg-indigo-900/30 text-sm text-indigo-300 flex items-center">
                    <FaCheckCircle className="mr-2 text-indigo-400" />
                    {selectedUnsavedCount} unsaved • {selectedSavedCount} saved games selected
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loadingGames && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <FaSpinner className="animate-spin text-indigo-500 text-5xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-transparent blur-xl"></div>
                </div>
                <p className="mt-4 text-gray-400 font-medium">Loading games from provider...</p>
                <p className="text-sm text-gray-500">Fetching all available games</p>
              </div>
            )}

            {/* Games Grid */}
            {!loadingGames && filteredGames.length > 0 && (
              <div id="games-grid">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {searchTerm ? 'Search Results' : 'Available Games'}
                    </h3>
                    <p className="text-gray-400 mt-1 text-sm">
                      {searchTerm ? (
                        <>
                          Found <span className="font-semibold text-indigo-400">{filteredGames.length}</span> game{filteredGames.length === 1 ? '' : 's'} matching "{searchTerm}"
                        </>
                      ) : (
                        <>
                          Showing <span className="font-semibold text-indigo-400">{paginatedGames.length}</span> of <span className="font-semibold">{filteredGames.length}</span> games from {selectedProviderName}
                          <span className="ml-2 text-sm">
                            (<span className="text-green-500">{filteredGames.filter(g => g.isSavedInSelectedCategory).length} saved in {selectedCategoryName || 'this category'}</span> • 
                            <span className="text-indigo-400"> {unsavedGamesCount} new</span>)
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#1F2937] hover:bg-gray-700 rounded-lg transition-colors duration-200"
                      >
                        Clear Search
                      </button>
                    )}
                    
                    {!searchTerm && (
                      <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedGames.map((game) => {
                    let imageSource;
                    
                    if (useDefaultImage[game.uniqueId]) {
                      imageSource = game.image || game.coverImage;
                      
                      if (game.isSaved && game.existingGameData) {
                        if (game.existingGameData.portraitImage) {
                          if (game.existingGameData.portraitImage.startsWith('http')) {
                            imageSource = game.existingGameData.portraitImage;
                          } else {
                            imageSource = `${base_url}${game.existingGameData.portraitImage}`;
                          }
                        } else if (game.existingGameData.defaultImage) {
                          imageSource = game.existingGameData.defaultImage;
                        }
                      }
                    } else {
                      if (game.localPortraitPreview) {
                        imageSource = game.localPortraitPreview;
                      } else if (game.isSaved && game.existingGameData) {
                        if (game.existingGameData.portraitImage) {
                          if (game.existingGameData.portraitImage.startsWith('http')) {
                            imageSource = game.existingGameData.portraitImage;
                          } else {
                            imageSource = `${base_url}${game.existingGameData.portraitImage}`;
                          }
                        } else if (game.existingGameData.defaultImage) {
                          imageSource = game.existingGameData.defaultImage;
                        } else {
                          imageSource = game.image || game.coverImage;
                        }
                      } else {
                        imageSource = game.image || game.coverImage;
                      }
                    }
                    
                    return (
                      <div
                        id={`game-${game.uniqueId}`}
                        key={game.uniqueId}
                        className={`bg-[#161B22] rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl relative ${
                          game.isSavedInSelectedCategory 
                            ? 'border-green-700 hover:border-green-600' 
                            : 'border-indigo-700 hover:border-indigo-600'
                        } ${editingGame === game.uniqueId ? 'ring-4 ring-indigo-500' : ''} ${
                          selectedGames.has(game.uniqueId) && !game.isSavedInSelectedCategory ? 'ring-2 ring-blue-500' : ''
                        } ${selectedGames.has(game.uniqueId) && game.isSavedInSelectedCategory ? 'ring-2 ring-red-500' : ''}`}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                          <button
                            onClick={() => toggleGameSelection(game.uniqueId)}
                            className={`w-8 h-8 rounded-[5px] flex items-center justify-center transition-all duration-200 ${
                              selectedGames.has(game.uniqueId)
                                ? game.isSavedInSelectedCategory
                                  ? 'bg-red-600 text-white shadow-lg'
                                  : 'bg-blue-600 text-white shadow-lg'
                                : 'bg-[#0F111A] text-gray-500 border-2 border-gray-600 hover:border-blue-500'
                            }`}
                          >
                            {selectedGames.has(game.uniqueId) ? (
                              <FaCheck className="w-4 h-4" />
                            ) : (
                              <FaCheck className="w-4 h-4 opacity-0" />
                            )}
                          </button>
                        </div>

                        {/* Delete Button for Saved Games (only show if saved in this category) */}
                        {game.isSavedInSelectedCategory && editingGame !== game.uniqueId && (
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              onClick={() => handleDeleteGame(game.uniqueId)}
                              disabled={deletingGameId === game.uniqueId}
                              className={`w-8 h-8 rounded-[5px] flex items-center justify-center transition-all duration-200 bg-red-600 text-white hover:bg-red-700 shadow-lg ${
                                deletingGameId === game.uniqueId ? 'opacity-50 cursor-wait' : ''
                              }`}
                            >
                              {deletingGameId === game.uniqueId ? (
                                <FaSpinner className="animate-spin w-4 h-4" />
                              ) : (
                                <FaTrash className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Game Header */}
                        <div className={`p-4 bg-gradient-to-r ${
                          game.isSavedInSelectedCategory 
                            ? 'from-green-900/30 to-[#161B22]' 
                            : 'from-indigo-900/30 to-[#161B22]'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-white truncate pr-2">
                              {game.gameName || game.name}
                            </h3>
                            {game.isSavedInSelectedCategory ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300 flex items-center">
                                <FaCheck className="mr-1 text-xs" /> Added to {selectedCategoryName}
                              </span>
                            ) : game.isSaved ? (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-900 text-yellow-300">
                                In Other Categories
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-900 text-indigo-300">
                                New Game
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 space-y-1">
                            <p className="flex items-center">
                              <span className="font-medium mr-2">Provider:</span>
                              {game.provider?.providerName || game.provider?.name}
                            </p>
                            <p className="flex items-center">
                              <span className="font-medium mr-2">Game Code:</span>
                              <span className="text-xs bg-[#0F111A] px-2 py-1 rounded text-gray-400">
                                {game.game_code || game.code}
                              </span>
                            </p>
                            {game.isSaved && game.existingGameData && (
                              <p className="flex items-center text-xs text-green-500 mt-1">
                                <span className="font-medium mr-2">Categories:</span>
                                <span className="text-xs">
                                  {game.existingCategories?.join(', ') || 'None'}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Game Preview */}
                        <div className="p-4">
                          <div className="relative h-40 bg-gradient-to-br from-[#0F111A] to-[#1A1F2E] rounded-xl overflow-hidden group">
                            <img
                              src={imageSource || 'https://via.placeholder.com/300x200?text=No+Image'}
                              alt={game.gameName || game.name}
                              className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {useDefaultImage[game.uniqueId] && (
                              <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                <FaImage className="mr-1" /> Default
                              </div>
                            )}
                            
                            {!useDefaultImage[game.uniqueId] && game.localPortraitPreview && (
                              <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                <FaImage className="mr-1" /> New Image
                              </div>
                            )}
                          </div>

                          {/* Show Edit Game button for games saved in this category */}
                          {game.isSavedInSelectedCategory && editingGame !== game.uniqueId && (
                            <div className="mt-3">
                              <button
                                onClick={() => handleEditGame(game)}
                                className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                              >
                                <FaEdit className="mr-2" /> Edit Game
                              </button>
                            </div>
                          )}

                          {editingGame === game.uniqueId && (
                            <>
                              <div className="mt-3 flex items-center justify-between">
                                <span className="text-sm text-gray-400">Use Default Image:</span>
                                <button
                                  onClick={() => toggleUseDefaultImage(game.uniqueId)}
                                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                                    useDefaultImage[game.uniqueId] ? 'bg-indigo-600' : 'bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                                      useDefaultImage[game.uniqueId] ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                  Assign Categories <span className="text-red-500">*</span>
                                  <span className="text-xs text-gray-500 ml-2">(Select multiple)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2">
                                  {categories
                                    .filter(cat => cat.status)
                                    .map((category) => (
                                      <button
                                        key={category._id}
                                        onClick={() => handleCategoryToggle(game.uniqueId, category._id)}
                                        className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 ${
                                          (game.localCategories || []).includes(category._id)
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-[#161B22] text-gray-400 border-gray-700 hover:border-indigo-500'
                                        }`}
                                      >
                                        {category.name}
                                      </button>
                                    ))}
                                </div>
                                {(game.localCategories || []).length === 0 && (
                                  <p className="text-xs text-red-500 mt-1">Please select at least one category</p>
                                )}
                              </div>

                              <div className="mt-4">
                                <CustomCheckbox
                                  id={`featured-${game.uniqueId}`}
                                  checked={game.localFeatured}
                                  onChange={(e) => handleGameDataChange(game.uniqueId, 'localFeatured', e.target.checked)}
                                  label="Featured Game"
                                  description="Show this game in featured section"
                                />
                                <CustomCheckbox
                                  id={`status-${game.uniqueId}`}
                                  checked={game.localStatus}
                                  onChange={(e) => handleGameDataChange(game.uniqueId, 'localStatus', e.target.checked)}
                                  label="Active Status"
                                  description="Game will be visible to users"
                                />
                                <CustomCheckbox
                                  id={`fullscreen-${game.uniqueId}`}
                                  checked={game.localFullScreen}
                                  onChange={(e) => handleGameDataChange(game.uniqueId, 'localFullScreen', e.target.checked)}
                                  label="Full Screen Mode"
                                  description="Launch game in full screen"
                                />
                              </div>

                              {!useDefaultImage[game.uniqueId] && (
                                <div className="mt-6">
                                  <div>
                                    {game.localPortraitPreview ? (
                                      <div className="relative group">
                                        <div className="h-32 bg-gradient-to-br from-[#0F111A] to-[#1A1F2E] rounded-xl overflow-hidden">
                                          <img
                                            src={game.localPortraitPreview}
                                            alt="Game Image"
                                            className="w-full h-full object-contain p-2"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => removeImage(game.uniqueId)}
                                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                          <FaTimes className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <label className="block cursor-pointer">
                                        <div className="h-32 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-900/20 group">
                                          <FaUpload className="text-gray-500 text-xl mb-2 group-hover:text-indigo-400 transition-colors" />
                                          <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-400 transition-colors">
                                            Upload Game Image
                                          </span>
                                          <span className="text-xs text-gray-600 mt-1">PNG, JPG up to 10MB</span>
                                        </div>
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) => handleImageUpload(game.uniqueId, e.target.files[0])}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              )}
                              <div className="mt-6 pt-4 border-t border-gray-800 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCancelEdit()}
                                  className="flex-1 px-4 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors duration-200"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveOrUpdateGame(game.uniqueId)}
                                  disabled={
                                    (updatingGameId === game.uniqueId || savingGameId === game.uniqueId) || 
                                    !game.localCategories || 
                                    game.localCategories.length === 0 ||
                                    (!useDefaultImage[game.uniqueId] && !game.localPortraitImage)
                                  }
                                  className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
                                    updatingGameId === game.uniqueId || savingGameId === game.uniqueId
                                      ? 'bg-gray-600 cursor-wait' 
                                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                  } ${
                                    (!game.localCategories || game.localCategories.length === 0 || (!useDefaultImage[game.uniqueId] && !game.localPortraitImage)) 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'cursor-pointer'
                                  }`}
                                >
                                  {updatingGameId === game.uniqueId || savingGameId === game.uniqueId ? (
                                    <>
                                      <FaSpinner className="animate-spin mr-2" />
                                      {updatingGameId === game.uniqueId ? 'Updating...' : 'Adding...'}
                                    </>
                                  ) : (
                                    <>
                                      Update Game
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          )}

                          {/* Show Add Game button only if game is not saved in this category */}
                          {!game.isSavedInSelectedCategory && editingGame !== game.uniqueId && (
                            <div className="mt-3">
                              <button
                                onClick={() => handleSingleGameAdd(game)}
                                className="w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center"
                              >
                                <FaPlusCircle className="mr-2" /> Add to {selectedCategoryName || 'Category'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            {/* Empty states */}
            {!loadingGames && selectedProvider && searchTerm && filteredGames.length === 0 && (
              <div className="text-center py-16 bg-[#161B22] rounded-2xl shadow-lg border border-gray-800">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                  <FaSearch className="text-gray-500 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Search Results</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  No games found matching "<span className="font-semibold">{searchTerm}</span>" in {selectedProviderName}.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors duration-200"
                >
                  Clear Search
                </button>
              </div>
            )}

            {!loadingGames && selectedProvider && !searchTerm && filteredGames.length === 0 && (
              <div className="text-center py-16 bg-[#161B22] rounded-2xl shadow-lg border border-gray-800">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                  <FaGamepad className="text-gray-500 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Games Found</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-6">
                  No games available from <span className="font-semibold">{selectedProviderName}</span> at this time.
                </p>
                <button
                  onClick={() => setSelectedProvider("")}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors duration-200"
                >
                  Select Different Provider
                </button>
              </div>
            )}

            {!loadingGames && selectedCategory && providers.length === 0 && (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-yellow-900/30 to-yellow-800/10 rounded-full flex items-center justify-center">
                  <FaGamepad className="text-yellow-500 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No Providers Found</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-8">
                  No providers available for the selected category. Please select a different category or add providers to this category.
                </p>
                <button
                  onClick={() => setSelectedCategory("")}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors duration-200"
                >
                  Select Different Category
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-[rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-[#161B22] rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-800">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {bulkActionMode ? 'Add Selected Games' : 'Add Games'}
                      </h3>
                      <p className="text-indigo-200 text-sm mt-1">
                        Adding {bulkGames.length} game{bulkGames.length !== 1 ? 's' : ''} to {selectedCategoryName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      resetBulkState();
                    }}
                    className="text-white hover:text-indigo-200 transition-colors"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <MultiCategorySelect
                      options={categories}
                      value={bulkCategories}
                      onChange={setBulkCategories}
                      label="Categories for All Games"
                    />
                    {bulkCategories.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Please select at least one category</p>
                    )}
                  </div>

                  <div className="bg-[#0F111A] p-4 rounded-xl border border-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-300">Image Source</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {bulkUseDefaultImage 
                            ? "Using default images from provider for all games" 
                            : "Using a single custom image for all games"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setBulkUseDefaultImage(!bulkUseDefaultImage);
                          if (!bulkUseDefaultImage) {
                            setBulkImage(null);
                            setBulkImagePreview(null);
                          }
                        }}
                        className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none ${
                          bulkUseDefaultImage ? 'bg-indigo-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block w-6 h-6 transform transition-transform bg-white rounded-full shadow-md ${
                            bulkUseDefaultImage ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {!bulkUseDefaultImage && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Upload Custom Image (Will be used for all games) <span className="text-red-500">*</span>
                      </label>
                      {bulkImagePreview ? (
                        <div className="relative group">
                          <div className="h-48 bg-gradient-to-br from-[#0F111A] to-[#1A1F2E] rounded-xl overflow-hidden border-2 border-dashed border-gray-700">
                            <img
                              src={bulkImagePreview}
                              alt="Bulk Game Image"
                              className="w-full h-full object-contain p-4"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={removeBulkImage}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="block cursor-pointer">
                          <div className="h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:border-indigo-500 hover:bg-indigo-900/20 group">
                            <FaUpload className="text-gray-500 text-3xl mb-3 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-400 transition-colors">
                              Click to upload image
                            </span>
                            <span className="text-xs text-gray-600 mt-2">PNG, JPG up to 10MB</span>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleBulkImageUpload(e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  <div className="bg-[#0F111A] rounded-xl p-4 border border-gray-800">
                    <h4 className="font-medium text-gray-300 mb-3">Game Settings</h4>
                    <CustomCheckbox
                      id="bulk-featured"
                      checked={bulkFeatured}
                      onChange={(e) => setBulkFeatured(e.target.checked)}
                      label="Mark as Featured"
                      description="Show these games in featured section"
                    />
                    <CustomCheckbox
                      id="bulk-status"
                      checked={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.checked)}
                      label="Active Status"
                      description="Games will be visible to users"
                    />
                    <CustomCheckbox
                      id="bulk-fullscreen"
                      checked={bulkFullScreen}
                      onChange={(e) => setBulkFullScreen(e.target.checked)}
                      label="Full Screen Mode"
                      description="Launch games in full screen"
                    />
                  </div>

                  {bulkSaving && (
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span className="font-medium">Adding games...</span>
                        <span className="text-indigo-400 font-semibold">{bulkProgress.current} / {bulkProgress.total}</span>
                      </div>
                      
                      {currentAddingGame && (
                        <div className="bg-indigo-900/30 p-3 rounded-lg border border-indigo-700">
                          <p className="text-sm text-indigo-300 flex items-center">
                            <FaSpinner className="animate-spin mr-2 text-indigo-400" />
                            Currently adding: <span className="font-semibold ml-1 truncate">{currentAddingGame}</span>
                          </p>
                        </div>
                      )}
                      
                      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-300 relative"
                          style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        {Math.round((bulkProgress.current / bulkProgress.total) * 100)}% complete
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#0F111A] px-6 py-4 flex justify-end space-x-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    resetBulkState();
                  }}
                  disabled={bulkSaving}
                  className="px-4 py-2 bg-gray-700 text-gray-300 text-[14px] font-medium rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={
                    bulkSaving ||
                    bulkCategories.length === 0 ||
                    (!bulkUseDefaultImage && !bulkImage) ||
                    (bulkUseDefaultImage && bulkGames.filter(g => g.image || g.coverImage).length === 0)
                  }
                  className={`px-6 py-2 text-[14px] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 flex items-center ${
                    bulkSaving || bulkCategories.length === 0 || (!bulkUseDefaultImage && !bulkImage) || (bulkUseDefaultImage && bulkGames.filter(g => g.image || g.coverImage).length === 0)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:from-indigo-700 hover:to-indigo-800'
                  }`}
                >
                  {bulkSaving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Adding {bulkProgress.current}/{bulkProgress.total}...
                    </>
                  ) : (
                    <>
                      Add {bulkGames.length} Game{bulkGames.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Games Modal */}
      {showDeleteSelectedModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.4)] bg-opacity-50">
          {(() => {
            handleDeleteSelectedGames();
            return null;
          })()}
        </div>
      )}

      {/* Delete All Added Games Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-[rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-[#161B22] rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-800">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-white text-2xl mr-3" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Delete All Added Games</h3>
                      <p className="text-red-200 text-sm mt-1">This action cannot be undone</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDeleteAllModal(false);
                      setDeleteConfirmText("");
                    }}
                    className="text-white hover:text-red-200 transition-colors"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="space-y-4">
                  <div className="bg-red-900/30 p-4 rounded-lg border border-red-700">
                    <p className="text-red-300 font-medium mb-2">⚠️ Warning</p>
                    <p className="text-sm text-red-300">
                      You are about to delete all <span className="font-bold">{savedGamesCount}</span> games that have been added to your platform. 
                      This will permanently remove these games from your database including any custom images. 
                      This action cannot be reversed.
                    </p>
                    <p className="text-sm text-red-300 mt-2">
                      <strong>Note:</strong> This will only delete games that have been added to your platform. 
                      Games from the Oracle API that haven't been added yet will remain visible.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type "DELETE ALL ADDED GAMES" to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE ALL ADDED GAMES"
                      className="w-full px-4 py-3 bg-[#0F111A] border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-200 placeholder-gray-600 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#0F111A] px-6 py-4 flex justify-end space-x-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteAllModal(false);
                    setDeleteConfirmText("");
                  }}
                  disabled={deletingAll}
                  className="px-4 py-2 bg-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAllAddedGames}
                  disabled={deletingAll || deleteConfirmText !== "DELETE ALL ADDED GAMES"}
                  className={`px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg shadow-lg transition-all duration-300 flex items-center ${
                    deletingAll || deleteConfirmText !== "DELETE ALL ADDED GAMES"
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:from-red-700 hover:to-red-800'
                  }`}
                >
                  {deletingAll ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash className="mr-2" />
                      Delete All Added Games
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Newgames;