import React, { useState, useEffect } from "react";
import { FaUpload, FaTimes, FaSpinner, FaFilter, FaGamepad, FaSave } from "react-icons/fa";
import { MdCategory, MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-toastify";

const Newgames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const premium_api_key = import.meta.env.VITE_PREMIUM_API_KEY;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [games, setGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingGameId, setSavingGameId] = useState(null);
  const [showProvidersDropdown, setShowProvidersDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);

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
    label 
  }) => {
    const selectedOption = options.find(opt => opt._id === value || opt.value === value);
    
    return (
      <div className="relative w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={loading}
            className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex items-center justify-between transition-all duration-200 hover:border-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="text-gray-400 text-lg" />}
              <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
                {loading ? `Loading ${placeholder}...` : 
                 selectedOption ? selectedOption.name || selectedOption.label : 
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
          
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  {loading ? 'Loading...' : 'No options available'}
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
                        ? 'bg-orange-50 text-orange-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {value === (option._id || option.value) ? (
                      <MdCheckBox className="text-orange-500 text-lg" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="text-gray-400 text-lg" />
                    )}
                    <span>{option.name || option.label}</span>
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
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150">
      <div className="relative flex items-center h-5 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="hidden"
        />
        <label
          htmlFor={id}
          className="cursor-pointer"
        >
          <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
            checked 
              ? 'bg-orange-500 border-orange-500' 
              : 'bg-white border-gray-300 hover:border-orange-400'
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
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 cursor-pointer select-none"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  // Fetch categories from local API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch(`${base_url}/api/admin/game-categories`);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categoriesData = await response.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to fetch categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchAndMergeProviders = async () => {
      setLoadingProviders(true);
      try {
        const [localRes, externalRes] = await Promise.all([
          fetch(`${base_url}/api/admin/game-providers`),
          fetch(`https://apigames.oracleapi.net/api/providers`, {
            headers: { "x-api-key": premium_api_key },
          }),
        ]);

        if (!localRes.ok || !externalRes.ok) {
          toast.error("Failed to fetch providers from all sources.");
          return;
        }

        const localProviders = await localRes.json();
        const externalProviders = await externalRes.json();

        const localProviderIds = new Set(
          localProviders.map((p) => p.providerOracleID)
        );

        const mergedProviders = externalProviders.data.filter((p) =>
          localProviderIds.has(p._id)
        );

        setProviders(mergedProviders);
      } catch (error) {
        console.error("Error fetching and merging providers:", error);
        toast.error("An error occurred while fetching providers.");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchAndMergeProviders();
  }, []);

  useEffect(() => {
    if (!selectedProvider) {
      setGames([]);
      return;
    }

    const fetchAndMergeGames = async () => {
      setLoadingGames(true);
      try {
        const [externalGamesRes, localGamesRes] = await Promise.all([
          fetch(
            `https://apigames.oracleapi.net/api/games/pagination?limit=2000&provider=${selectedProvider}`,
            { headers: { "x-api-key": premium_api_key } }
          ),
          fetch(`${base_url}/api/admin/games/all`),
        ]);

        if (!externalGamesRes.ok || !localGamesRes.ok) {
          toast.error("Failed to fetch games from all sources.");
          return;
        }

        const externalGamesData = await externalGamesRes.json();
        const localGames = await localGamesRes.json();

        const localGamesMap = new Map(
          localGames.map((game) => [game.gameApiID, game])
        );

        const mergedGames = externalGamesData.data.map((externalGame) => {
          const localGame = localGamesMap.get(externalGame._id);
          if (localGame) {
            return {
              ...externalGame,
              isSaved: true,
              localId: localGame._id,
              localFeatured: localGame.featured,
              localStatus: localGame.status,
              localFullScreen: localGame.fullScreen || false,
              localCategory: localGame.category,
              localPortraitPreview: `${base_url}${localGame.portraitImage}`,
              localLandscapePreview: `${base_url}${localGame.landscapeImage}`,
              localPortraitImage: null,
              localLandscapeImage: null,
            };
          } else {
            return {
              ...externalGame,
              isSaved: false,
              localFeatured: false,
              localStatus: true,
              localFullScreen: false,
              localCategory: selectedCategory || "",
              localPortraitImage: null,
              localLandscapeImage: null,
              localPortraitPreview: null,
              localLandscapePreview: null,
            };
          }
        });

        setGames(mergedGames);
      } catch (error) {
        console.error("Error fetching and merging games:", error);
        toast.error("An error occurred while fetching games.");
      } finally {
        setLoadingGames(false);
      }
    };

    fetchAndMergeGames();
  }, [selectedProvider]);

  useEffect(() => {
    if (selectedCategory) {
      setGames(prevGames => 
        prevGames.map(game => ({
          ...game,
          localCategory: game.isSaved ? game.localCategory : selectedCategory
        }))
      );
    }
  }, [selectedCategory]);

  const handleGameDataChange = (gameApiID, field, value) => {
    setGames((prevGames) =>
      prevGames.map((game) =>
        game._id === gameApiID ? { ...game, [field]: value } : game
      )
    );
  };

  const handleImageUpload = (gameApiID, type, file) => {
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
          if (game._id === gameApiID) {
            if (type === "portrait") {
              return {
                ...game,
                localPortraitImage: file,
                localPortraitPreview: reader.result,
              };
            } else {
              return {
                ...game,
                localLandscapeImage: file,
                localLandscapePreview: reader.result,
              };
            }
          }
          return game;
        })
      );
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (gameApiID, type) => {
    setGames((prevGames) =>
      prevGames.map((game) => {
        if (game._id === gameApiID) {
          if (type === "portrait") {
            return {
              ...game,
              localPortraitImage: null,
              localPortraitPreview: null,
            };
          } else {
            return {
              ...game,
              localLandscapeImage: null,
              localLandscapePreview: null,
            };
          }
        }
        return game;
      })
    );
  };

  const handleSaveOrUpdateGame = async (gameApiID) => {
    const gameToSave = games.find((g) => g._id === gameApiID);
    
    // Validation for new games
    if (
      !gameToSave.isSaved &&
      (!gameToSave.localPortraitImage || !gameToSave.localLandscapeImage)
    ) {
      toast.error(
        "Please upload both portrait and landscape images for a new game."
      );
      return;
    }

    // Validate category for new games
    if (!gameToSave.isSaved && !gameToSave.localCategory) {
      toast.error("Please select a category for the game.");
      return;
    }

    setSavingGameId(gameApiID);

    try {
      const formData = new FormData();
      formData.append("gameApiID", gameToSave.game_uuid);
      formData.append("name", gameToSave.name);
      formData.append("provider", gameToSave.provider.name);
      
      const selectedCat = categories.find(cat => 
        cat._id === gameToSave.localCategory || cat.name === gameToSave.localCategory
      );
      if (selectedCat) {
        formData.append("category", selectedCat.name);
      } else {
        formData.append("category", gameToSave.localCategory || "");
      }
      
      formData.append("featured", gameToSave.localFeatured);
      formData.append("status", gameToSave.localStatus);
      formData.append("fullScreen", gameToSave.localFullScreen);
      
      if (gameToSave.localPortraitImage) {
        formData.append("portraitImage", gameToSave.localPortraitImage);
      }
      if (gameToSave.localLandscapeImage) {
        formData.append("landscapeImage", gameToSave.localLandscapeImage);
      }

      const isUpdate = gameToSave.isSaved;
      const url = isUpdate
        ? `${base_url}/api/admin/games/${gameToSave.localId}`
        : `${base_url}/api/admin/games`;
      const method = isUpdate ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(
          `Game "${gameToSave.name}" ${
            isUpdate ? "updated" : "added"
          } successfully!`
        );
        setGames((prevGames) =>
          prevGames.map((g) =>
            g._id === gameApiID
              ? {
                  ...g,
                  isSaved: true,
                  localId: result.game._id,
                  localCategory: result.game.category,
                  localFullScreen: result.game.fullScreen || false,
                  localPortraitImage: null,
                  localLandscapeImage: null,
                }
              : g
          )
        );
      } else {
        const errorMsg = result.error || "";
        
        if (response.status === 400) {
          if (errorMsg.includes("Game API ID already exists") || 
              errorMsg.includes("duplicate key error") ||
              errorMsg.includes("E11000") ||
              errorMsg.includes("already in use")) {
            toast.error(`⚠️ Game API ID "${gameToSave._id}" is already in use!`);
          } else if (errorMsg.includes("All fields are required") || 
                    errorMsg.includes("Missing required fields")) {
            toast.error(`❌ ${errorMsg}`);
          } else if (errorMsg.includes("images are required")) {
            toast.error("❌ Both portrait and landscape images are required.");
          } else {
            toast.error(`❌ ${errorMsg || `Failed to ${isUpdate ? "update" : "add"} game.`}`);
          }
        } else {
          toast.error(
            result.error ||
              `❌ Failed to ${isUpdate ? "update" : "add"} game "${
                gameToSave.name
              }".`
          );
        }
      }
    } catch (error) {
      console.error("Error saving game:", error);
      toast.error("❌ An error occurred while saving the game.");
    } finally {
      setSavingGameId(null);
    }
  };

  return (
    <section className="font-nunito min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300 flex-1 p-4 md:p-6 overflow-y-auto min-h-[90vh] ${
            isSidebarOpen ? "md:ml-[40%] lg:ml-[28%] xl:ml-[17%]" : "ml-0"
          }`}
        >
          <div className="w-full mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                Add New Games
              </h1>
              <p className="text-gray-600">
                Import games from providers and customize them for your platform
              </p>
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-2xl  border border-gray-200 p-6 mb-8">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Filter Games</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                />
                
                <CustomSelect
                  options={categories.filter(cat => cat.status)}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="category"
                  loading={loadingCategories}
                  icon={MdCategory}
                  dropdownOpen={showCategoriesDropdown}
                  setDropdownOpen={setShowCategoriesDropdown}
                  label="Default Category for New Games"
                />
              </div>
              
              {/* {selectedCategory && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-sm text-orange-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    New games will be automatically assigned to <span className="font-semibold ml-1">
                      {categories.find(c => c._id === selectedCategory)?.name}
                    </span>
                  </p>
                </div>
              )} */}
            </div>

            {/* Loading State */}
            {loadingGames && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <FaSpinner className="animate-spin text-orange-500 text-5xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent blur-xl"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading games from provider...</p>
                <p className="text-sm text-gray-500">This may take a moment</p>
              </div>
            )}

            {/* Games Grid */}
            {!loadingGames && games.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Found {games.length} {games.length === 1 ? 'game' : 'games'}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="flex items-center">
                      <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                      <span className="text-gray-600">Saved to database</span>
                    </span>
                    <span className="flex items-center ml-4">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">New game</span>
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {games.map((game) => (
                    <div
                      key={game._id}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${
                        game.isSaved 
                          ? 'border-green-400 hover:border-green-500' 
                          : 'border-orange-300 hover:border-orange-400'
                      }`}
                    >
                      {/* Game Header */}
                      <div className={`p-4 ${game.isSaved ? 'bg-gradient-to-r from-green-50 to-white' : 'bg-gradient-to-r from-orange-50 to-white'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate pr-2">
                            {game.name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${game.isSaved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                            {game.isSaved ? 'Saved' : 'New'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center">
                            <span className="font-medium mr-2">Provider:</span>
                            {game.provider.name}
                          </p>
                          <p className="flex items-center">
                            <span className="font-medium mr-2">Category:</span>
                            {game.category.name}
                          </p>
                        </div>
                      </div>

                      {/* Game Preview */}
                      <div className="p-4">
                        <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group">
                          <img
                            src={game?.localLandscapePreview}
                            alt={game.name}
                            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Custom Category Selector */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign Category
                          </label>
                          <div className="relative">
                            <div className="flex flex-wrap gap-2">
                              {categories
                                .filter(cat => cat.status)
                                .map((category) => (
                                  <button
                                    key={category._id}
                                    onClick={() => handleGameDataChange(game._id, 'localCategory', category._id)}
                                    className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                                      game.localCategory === category._id
                                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                    }`}
                                  >
                                    {category.name}
                                  </button>
                                ))}
                            </div>
                          </div>
                          {!game.isSaved && !game.localCategory && (
                            <p className="text-xs text-red-500 mt-2 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Category is required
                            </p>
                          )}
                        </div>

                        {/* Game Settings */}
                        <div className="mt-4 ">
                          <CustomCheckbox
                            id={`featured-${game._id}`}
                            checked={game.localFeatured}
                            onChange={(e) => handleGameDataChange(game._id, 'localFeatured', e.target.checked)}
                            label="Featured Game"
                            description="Show this game in featured section"
                          />
                          <CustomCheckbox
                            id={`status-${game._id}`}
                            checked={game.localStatus}
                            onChange={(e) => handleGameDataChange(game._id, 'localStatus', e.target.checked)}
                            label="Active Status"
                            description="Game will be visible to users"
                          />
                          <CustomCheckbox
                            id={`fullscreen-${game._id}`}
                            checked={game.localFullScreen}
                            onChange={(e) => handleGameDataChange(game._id, 'localFullScreen', e.target.checked)}
                            label="Full Screen Mode"
                            description="Launch game in full screen"
                          />
                        </div>

                        {/* Image Upload Section */}
                        <div className="mt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Portrait Image */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Portrait Image
                              </label>
                              {game.localPortraitPreview ? (
                                <div className="relative group">
                                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                                    <img
                                      src={game.localPortraitPreview}
                                      alt="Portrait"
                                      className="w-full h-full object-contain p-2"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(game._id, "portrait")}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <FaTimes className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="block cursor-pointer">
                                  <div className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 group">
                                    <FaUpload className="text-gray-400 text-xl mb-2 group-hover:text-orange-500 transition-colors" />
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">
                                      Upload Portrait
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(game._id, "portrait", e.target.files[0])}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Landscape Image */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Landscape Image
                              </label>
                              {game.localLandscapePreview ? (
                                <div className="relative group">
                                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                                    <img
                                      src={game.localLandscapePreview}
                                      alt="Landscape"
                                      className="w-full h-full object-contain p-2"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(game._id, "landscape")}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <FaTimes className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="block cursor-pointer">
                                  <div className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 group">
                                    <FaUpload className="text-gray-400 text-xl mb-2 group-hover:text-orange-500 transition-colors" />
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">
                                      Upload Landscape
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(game._id, "landscape", e.target.files[0])}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                          
                          {!game.isSaved && (!game.localPortraitImage || !game.localLandscapeImage) && (
                            <p className="text-xs text-amber-600 mt-3 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Both images are required for new games
                            </p>
                          )}
                        </div>

                        {/* Save Button */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleSaveOrUpdateGame(game._id)}
                            disabled={savingGameId === game._id || (!game.isSaved && !game.localCategory)}
                            className={`w-full px-4 py-3 text-white cursor-pointer font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
                              game.isSaved
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400'
                                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400'
                            } ${savingGameId === game._id ? 'opacity-80 cursor-wait' : ''}`}
                          >
                            {savingGameId === game._id ? (
                              <>
                                <FaSpinner className="animate-spin mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                {game.isSaved ? 'Update Game' : 'Save Game'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loadingGames && selectedProvider && games.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <FaGamepad className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Games Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  No games available for the selected provider. Try selecting a different provider or check if the provider has games available.
                </p>
              </div>
            )}

            {/* Initial State */}
            {!loadingGames && !selectedProvider && (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
                  <FaFilter className="text-orange-400 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a Provider</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Choose a game provider from the filter above to start importing games to your platform.
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Games already in database
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                    New games ready to import
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Newgames;