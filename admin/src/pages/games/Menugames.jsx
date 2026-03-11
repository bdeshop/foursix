import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaImage, FaUpload, FaTimes, FaEye } from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmationPopup from "../../components/modal/ConfirmationPopup"

const Menugames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    category: 'sports',
    categoryname: 'Sports',
    name: '',
    gameId: '',
    provider: ''
  });
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  
  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Fetch games on component mount
  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/menu-games`);
      setGames(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleGame = async (id) => {
    try {
      const response = await axios.get(`${base_url}/api/admin/menu-games/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching single game:', error);
      toast.error('Failed to fetch game details');
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  // Validate and set image
  const validateAndSetImage = (file) => {
    setImageError(false);
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WEBP)');
      setImageError(true);
      return;
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      setImageError(true);
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(false);
    if (document.getElementById('imageInput')) {
      document.getElementById('imageInput').value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!isEditing && !imageFile) {
      toast.error('Please select an image');
      return;
    }
    
    if (!formData.name) {
      toast.error('Game name is required');
      return;
    }
    
    if (!formData.gameId) {
      toast.error('Game ID is required');
      return;
    }

    if (!formData.provider) {
      toast.error('Provider is required');
      return;
    }

    try {
      setLoading(true);
      
      // Create FormData object for file upload
      const formDataObj = new FormData();
      formDataObj.append('category', formData.category);
      formDataObj.append('categoryname', formData.categoryname);
      formDataObj.append('name', formData.name);
      formDataObj.append('gameId', formData.gameId);
      formDataObj.append('provider', formData.provider);
      formDataObj.append('status', 'true');
      
      // Only append image if it's a new file
      if (imageFile) {
        formDataObj.append('image', imageFile);
      }

      let response;
      if (isEditing) {
        response = await axios.put(`${base_url}/api/admin/menu-games/${editingId}`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Game updated successfully');
      } else {
        response = await axios.post(`${base_url}/api/admin/menu-games`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Game created successfully');
      }

      // Reset form
      resetForm();
      
      // Refresh games list
      fetchGames();
    } catch (error) {
      console.error('Error saving game:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save game';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setFormData({
      category: 'sports',
      categoryname: 'Sports',
      name: '',
      gameId: '',
      provider: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setCurrentImage(null);
    setImageError(false);
    setIsEditing(false);
    setEditingId(null);
    if (document.getElementById('imageInput')) {
      document.getElementById('imageInput').value = '';
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await axios.put(`${base_url}/api/admin/menu-games/${id}/status`, {
        status: !currentStatus
      });
      
      setGames(games.map(game => 
        game._id === id ? { ...game, status: !currentStatus } : game
      ));
      
      toast.success(`Game ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update status';
      toast.error(errorMessage);
    }
  };

  const editGame = async (game) => {
    try {
      // Fetch fresh data from server to ensure we have all fields
      const freshGameData = await fetchSingleGame(game._id);
      if (freshGameData) {
        setFormData({
          category: 'sports',
          categoryname: 'Sports',
          name: freshGameData.name,
          gameId: freshGameData.gameId,
          provider: freshGameData.provider || ''
        });
        
        // Set current image for preview
        if (freshGameData.image) {
          setCurrentImage(`${base_url}${freshGameData.image}`);
          setImagePreview(null);
        }
        
        setIsEditing(true);
        setEditingId(game._id);
        
        // Scroll to form
        document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error preparing edit:', error);
      toast.error('Failed to load game for editing');
    }
  };

  const cancelEdit = () => {
    resetForm();
  };

  const confirmDelete = (game) => {
    setGameToDelete(game);
    setShowDeletePopup(true);
  };

  const deleteGame = async () => {
    if (!gameToDelete) return;
    
    try {
      await axios.delete(`${base_url}/api/admin/menu-games/${gameToDelete._id}`);
      
      setGames(games.filter(game => game._id !== gameToDelete._id));
      toast.success('Game deleted successfully');
    } catch (error) {
      console.error('Error deleting game:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete game';
      toast.error(errorMessage);
    } finally {
      setShowDeletePopup(false);
      setGameToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setGameToDelete(null);
  };

  // Get image URL for display
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${base_url}${imagePath}`;
  };

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Menu Games - Sports Category</h1>
            
            {/* Add Game Form */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {isEditing ? 'Edit Game' : 'Add New Game'}
              </h2>
              
              {/* Category Info Banner */}
              <div className="mb-6 bg-orange-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-orange-700 font-medium">Category: Sports</span>
                    <span className="ml-2 text-sm text-orange-600">(All games will be added to Sports category)</span>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                {/* Compact Image Upload Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Image {!isEditing && <span className="text-red-500">*</span>}
                  </label>
                  
                  <div 
                    className={`relative border-2 border-dashed rounded-lg p-4 transition-all ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : imageError 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="imageInput"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    
                    {imagePreview || currentImage ? (
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                          <img 
                            src={imagePreview || currentImage} 
                            alt={imagePreview ? "Preview" : "Current image"} 
                            className="w-full h-full object-cover"
                          />
                          {imagePreview && (
                            <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] px-1 py-0.5 rounded-br-lg">
                              New
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {imageFile ? imageFile.name : (currentImage ? 'Current image' : '')}
                          </p>
                          <p className="text-xs text-gray-500 mb-2">
                            {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : 'Existing image'}
                          </p>
                          <div className="flex gap-2">
                            <label
                              htmlFor="imageInput"
                              className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <FaUpload className="mr-1 text-gray-500 text-xs" />
                              Change
                            </label>
                            {(imagePreview || currentImage) && (
                              <button
                                type="button"
                                onClick={removeImage}
                                className="inline-flex items-center px-3 py-1.5 bg-red-50 border border-red-300 rounded text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                              >
                                <FaTimes className="mr-1" />
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            <FaImage className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Drop image or click to upload
                            </p>
                            <p className="text-xs text-gray-500">
                              JPG, PNG, GIF, WEBP (Max 5MB)
                            </p>
                          </div>
                        </div>
                        <label
                          htmlFor="imageInput"
                          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 cursor-pointer transition-colors shadow-sm"
                        >
                          <FaUpload className="mr-2 text-xs" />
                          Browse
                        </label>
                      </div>
                    )}
                    
                    {imageError && (
                      <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-600">
                        Please select a valid image file under 5MB
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Name (Read-only) */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="text"
                      value="Sports"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed text-sm"
                      disabled
                      readOnly
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Read-only</span>
                    </div>
                  </div>
                </div>

                {/* Game Name Field */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-sm"
                    placeholder="Enter game name"
                    required
                  />
                </div>

                {/* Provider Field */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="provider"
                    value={formData.provider}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-sm"
                    placeholder="Enter provider name"
                    required
                  />
                </div>

                {/* Game ID Field */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="gameId"
                    value={formData.gameId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow text-sm"
                    placeholder="Enter unique game ID"
                    required
                  />
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end mt-6 space-x-3">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-5 py-2.5 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (isEditing ? 'Update Game' : 'Add Game')}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Games Table */}
            <div className="">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Sports Games</h2>
              
              {loading && games.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : games.length === 0 ? (
                <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <FaImage className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-base mb-1">No sports games found</p>
                  <p className="text-gray-400 text-sm">Add your first game using the form above</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-orange-600">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Image
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Category
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Game Name
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Provider
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Game ID
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {games.map((game) => (
                        <tr key={game._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              {game.image ? (
                                <div className="relative group">
                                  <img 
                                    src={getImageUrl(game.image)} 
                                    alt={game.name}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        window.open(getImageUrl(game.image), '_blank');
                                      }}
                                      className="text-white text-xs bg-blue-500 p-1 rounded hover:bg-blue-600 shadow-sm"
                                    >
                                      <FaEye className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                  <FaImage className="text-gray-400 w-5 h-5" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {game.categoryname || game.category?.name || 'Sports'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {game.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                              {game.provider || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded border border-gray-200">
                              {game.gameId}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={game.status}
                                onChange={() => toggleStatus(game._id, game.status)}
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                              <span className={`ml-2 text-xs font-medium ${game.status ? 'text-green-600' : 'text-red-600'}`}>
                                {game.status ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                className="p-2 text-white bg-blue-600 cursor-pointer rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                onClick={() => editGame(game)}
                                title="Edit game"
                              >
                                <FaEdit className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-2 text-white bg-red-600 cursor-pointer rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                onClick={() => confirmDelete(game)}
                                title="Delete game"
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <ConfirmationPopup
          title="Delete Game"
          message={`Are you sure you want to delete "${gameToDelete?.name}"? This action cannot be undone.`}
          onConfirm={deleteGame}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </section>
  );
};

export default Menugames;