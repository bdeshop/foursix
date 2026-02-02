import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaImage } from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmationPopup from "../../components/modal/ConfirmationPopup"

const Menugames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    category: '',
    categoryname: '',
    name: '',
    gameId: ''
  });
  const [categories, setCategories] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  
  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Fetch categories and games on component mount
  useEffect(() => {
    fetchCategories();
    fetchGames();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/game-categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

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

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const selectedCategory = categories.find(cat => cat._id === categoryId);
    
    setFormData({
      ...formData,
      category: categoryId,
      categoryname: selectedCategory ? selectedCategory.name : ''
    });
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
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
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!formData.categoryname) {
      toast.error('Category name is required');
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

    try {
      setLoading(true);
      
      // Create FormData object for file upload
      const formDataObj = new FormData();
      formDataObj.append('category', formData.category);
      formDataObj.append('categoryname', formData.categoryname);
      formDataObj.append('name', formData.name);
      formDataObj.append('gameId', formData.gameId);
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
      category: '',
      categoryname: '',
      name: '',
      gameId: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setCurrentImage(null);
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
          category: freshGameData.category._id || freshGameData.category,
          categoryname: freshGameData.categoryname || freshGameData.category?.name || '',
          name: freshGameData.name,
          gameId: freshGameData.gameId
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
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Menu Games</h1>
            
            {/* Add Game Form */}
            <div className="bg-white rounded-[5px] p-6 border border-gray-200 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {isEditing ? 'Edit Game' : 'Add New Game'}
              </h2>
              <form onSubmit={handleSubmit}>
                {/* Image Upload Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Image {!isEditing && <span className="text-red-500">*</span>}
                  </label>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Image Preview */}
                    <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 overflow-hidden">
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      ) : currentImage ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={currentImage} 
                            alt="Current" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                            Current Image
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <FaImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No image selected</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1">
                      <div className="mb-4">
                        <input
                          type="file"
                          id="imageInput"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="imageInput"
                          className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 cursor-pointer transition-colors"
                        >
                          <FaImage className="mr-2" />
                          {imagePreview || currentImage ? 'Change Image' : 'Select Image'}
                        </label>
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={removeImage}
                            className="ml-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Category Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-[3px] outline-theme_color"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter(category => category.status)
                      .map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Category Name Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="categoryname"
                    value={formData.categoryname}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-[3px] outline-theme_color bg-gray-50"
                    placeholder="Category name will auto-fill"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-filled from selected category. You can edit if needed.
                  </p>
                </div>

                {/* Game Name Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Game Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-[3px] outline-theme_color"
                    placeholder="Enter game name"
                    required
                  />
                </div>

                {/* Game ID Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Game ID <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="gameId"
                    value={formData.gameId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-[3px] outline-theme_color"
                    placeholder="Enter game ID"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Unique identifier for the game</p>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end mt-8 space-x-4">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-6 py-2 bg-gray-500 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-orange-500 text-white font-medium rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">All Games</h2>
              
              {loading && games.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : games.length === 0 ? (
                <div className="bg-white p-8 rounded-lg text-center">
                  <p className="text-gray-500">No games found. Add your first game above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border-[1px] border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-theme_color">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Image
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Category Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Game Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Game ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs md:text-sm font-medium text-white uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {games.map((game) => (
                        <tr key={game._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {game.image ? (
                                <div className="relative group">
                                  <img 
                                    src={getImageUrl(game.image)} 
                                    alt={game.name}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button
                                      onClick={() => {
                                        window.open(getImageUrl(game.image), '_blank');
                                      }}
                                      className="text-white text-xs bg-blue-500 px-2 py-1 rounded hover:bg-blue-600"
                                    >
                                      View
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                  <FaImage className="text-gray-400 w-8 h-8" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {game.categoryname || game.category?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-medium">{game.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                              {game.gameId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={game.status}
                                onChange={() => toggleStatus(game._id, game.status)}
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                              <span className={`ml-3 text-sm font-medium ${game.status ? 'text-green-600' : 'text-red-600'}`}>
                                {game.status ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                className="px-3 py-2 text-white bg-blue-600 cursor-pointer rounded-md hover:bg-blue-700 transition-colors flex items-center"
                                onClick={() => editGame(game)}
                                title="Edit"
                              >
                                <FaEdit className="mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                              <button 
                                className="px-3 py-2 text-white bg-red-600 cursor-pointer rounded-md hover:bg-red-700 transition-colors flex items-center"
                                onClick={() => confirmDelete(game)}
                                title="Delete"
                              >
                                <FaTrash className="mr-1" />
                                <span className="hidden sm:inline">Delete</span>
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