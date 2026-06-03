import React, { useState, useEffect } from 'react';
import { FaUpload, FaTimes, FaEdit, FaTrash } from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { FaRegFileImage } from "react-icons/fa6";
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmationPopup from "../../components/modal/ConfirmationPopup"

const Gamecategory = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/game-categories`);
      console.log(response)
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({...formData, image: file});
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({...formData, image: null});
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('Category name is required');
      return;
    }
    
    if (!formData.image && !isEditing) {
      toast.error('Category image is required');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      let response;
      if (isEditing) {
        response = await axios.put(`${base_url}/api/admin/game-categories/${editingId}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Category updated successfully');
      } else {
        response = await axios.post(`${base_url}/api/admin/game-categories`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Category created successfully');
      }

      // Reset form
      setFormData({
        name: '',
        image: null
      });
      setImagePreview(null);
      setIsEditing(false);
      setEditingId(null);
      
      // Refresh categories list
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save category';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.put(`${base_url}/api/admin/game-categories/${id}/status`, {
        status: !currentStatus
      });
      
      setCategories(categories.map(category => 
        category._id === id ? { ...category, status: !currentStatus } : category
      ));
      
      toast.success(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const editCategory = (category) => {
    setFormData({
      name: category.name,
      image: null
    });
    setImagePreview(category.image);
    setIsEditing(true);
    setEditingId(category._id);
  };

  const cancelEdit = () => {
    setFormData({
      name: '',
      image: null
    });
    setImagePreview(null);
    setIsEditing(false);
    setEditingId(null);
  };

  const confirmDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeletePopup(true);
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      await axios.delete(`${base_url}/api/admin/game-categories/${categoryToDelete._id}`);
      
      setCategories(categories.filter(category => category._id !== categoryToDelete._id));
      toast.success('Category deleted successfully');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setShowDeletePopup(false);
      setCategoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setCategoryToDelete(null);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${base_url}${imagePath}`;
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
            <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Game Categories</h1>
                <p className="text-xs font-bold text-gray-500 mt-1">Manage game categories for the platform</p>
              </div>
            </div>
            
            {/* Add Category Form */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-indigo-500"></div>
                {isEditing ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleSubmit}>
                {/* Category Name Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                    placeholder="Enter category name"
                    required
                  />
                </div>
                
                {/* Image Upload Section */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category Image {!isEditing && <span className="text-red-500">*</span>}</label>
                  <div className="flex items-center justify-center w-full">
                    {imagePreview ? (
                      <div className="relative w-full">
                        <img 
                          src={imagePreview.startsWith('http') || imagePreview.startsWith('data:') ? imagePreview : getImageUrl(imagePreview)} 
                          alt="Category preview" 
                          className="h-48 w-full object-contain border border-gray-700 rounded-md bg-[#0F111A]"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-600 cursor-pointer text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-900/20 transition-all duration-200">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FaRegFileImage className="w-8 md:w-12 h-8 mb-3 md:h-12 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">Click to upload category image</p>
                          <p className="text-xs text-gray-600">PNG, JPG up to 10MB</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end mt-8 space-x-4">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-6 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (isEditing ? 'Update Category' : 'Add Category')}
                  </button>
                </div>
              </form>
            </div>
            
            {/* Categories Table */}
            <div className="">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-indigo-500"></div>
                All Categories
              </h3>
              
              {loading && categories.length === 0 ? (
                <div className="bg-[#161B22] rounded-lg p-12 border border-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4" viewBox="0 0 24 24"></svg>
                    <p className="text-gray-500">Loading categories...</p>
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <div className="bg-[#161B22] p-12 rounded-lg text-center border border-gray-800">
                  <FaRegFileImage className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No categories found. Add your first category above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-800 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1C2128]">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                          Image
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider">
                          Name
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
                      {categories.map((category) => (
                        <tr key={category._id} className="hover:bg-[#1F2937] transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-12 w-12 flex-shrink-0">
                              <img 
                                className="h-12 w-12 rounded-full object-cover border border-gray-700" 
                                src={getImageUrl(category.image)} 
                                alt={category.name}
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                                }}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white font-medium">{category.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={category.status}
                                onChange={() => toggleStatus(category._id, category.status)}
                              />
                              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              <span className={`ml-3 text-sm font-medium ${category.status ? 'text-green-500' : 'text-red-500'}`}>
                                {category.status ? 'Active' : 'Inactive'}
                              </span>
                            </label>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                className="px-[8px] py-[7px] text-white bg-blue-600 cursor-pointer rounded-[3px] text-[16px] hover:bg-blue-700 transition-colors"
                                onClick={() => editCategory(category)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="px-[8px] py-[7px] text-white bg-red-600 cursor-pointer rounded-[3px] text-[16px] hover:bg-red-700 transition-colors"
                                onClick={() => confirmDelete(category)}
                                title="Delete"
                              >
                                <FaTrash />
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
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`}
          onConfirm={deleteCategory}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </section>
  );
};

export default Gamecategory;