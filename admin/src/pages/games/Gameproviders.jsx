import React, { useState, useEffect } from "react";
import { FaUpload, FaTimes, FaEdit, FaTrash, FaGlobe } from "react-icons/fa";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { FaRegFileImage } from "react-icons/fa6";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const Gameproviders = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    providerOracleID: "",
    providercode: "",
    website: "",
    category: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [localProviders, setLocalProviders] = useState([]);
  const [premiumProviders, setPremiumProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    providerId: null,
    providerName: "",
  });

  // Fetch providers and categories on component mount
  useEffect(() => {
    fetchLocalProviders();
    fetchPremiumProviders();
    fetchCategories();
  }, []);

  const fetchLocalProviders = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${base_url}/api/admin/game-providers`);
      setLocalProviders(response.data);
    } catch (error) {
      console.error("Error fetching local providers:", error);
      toast.error("Failed to fetch local providers");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPremiumProviders = async () => {
    try {
      const response = await axios.get(
        `https://api.oraclegames.live/api/providers`,
        {
          headers: {
            "x-api-key": import.meta.env.VITE_PREMIUM_API_KEY,
          },
        }
      );
      console.log("response", response);
      setPremiumProviders(response.data.data);
    } catch (error) {
      console.error("Error fetching premium providers:", error);
      toast.error("Error fetching premium providers");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/game-categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "providerSelection") {
      const selectedProvider = premiumProviders.find((p) => p._id === value);
      setFormData({
        ...formData,
        name: selectedProvider ? selectedProvider.providerName : "",
        providerOracleID: value,
        providercode: selectedProvider ? selectedProvider.providerCode : "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: file });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("providerOracleID", formData.providerOracleID);
      formDataToSend.append("providercode", formData.providercode);
      formDataToSend.append("website", formData.website);
      formDataToSend.append("category", formData.category);
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      }

      if (editingId) {
        await axios.put(
          `${base_url}/api/admin/game-providers/${editingId}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Provider updated successfully");
      } else {
        await axios.post(
          `${base_url}/api/admin/game-providers`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        toast.success("Provider added successfully");
      }

      fetchLocalProviders();

      setFormData({
        name: "",
        providerOracleID: "",
        providercode: "",
        website: "",
        category: "",
        image: null,
      });
      setImagePreview(null);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving provider:", error);
      const errorMsg = error.response?.data?.error || "Failed to save provider";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const editProvider = (provider) => {
    setFormData({
      name: provider.name,
      providerOracleID: provider.providerOracleID || "",
      providercode: provider.providercode || "",
      website: provider.website,
      category: provider.category || "",
      image: null,
    });
    setImagePreview(provider.image);
    setEditingId(provider._id);
  };

  const cancelEdit = () => {
    setFormData({
      name: "",
      providerOracleID: "",
      providercode: "",
      website: "",
      category: "",
      image: null,
    });
    setImagePreview(null);
    setEditingId(null);
  };

  const toggleStatus = async (provider) => {
    try {
      const newStatus = !provider.status;
      await axios.put(
        `${base_url}/api/admin/game-providers/${provider._id}/status`,
        {
          status: newStatus,
        }
      );

      fetchLocalProviders();

      toast.success(
        `Provider ${newStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const confirmDelete = (provider) => {
    setDeleteConfirm({
      isOpen: true,
      providerId: provider._id,
      providerName: provider.name,
    });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({
      isOpen: false,
      providerId: null,
      providerName: "",
    });
  };

  const deleteProvider = async () => {
    try {
      setIsLoading(true);
      await axios.delete(
        `${base_url}/api/admin/game-providers/${deleteConfirm.providerId}`
      );

      fetchLocalProviders();

      if (editingId === deleteConfirm.providerId) {
        cancelEdit();
      }

      toast.success("Provider deleted successfully");
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast.error("Failed to delete provider");
    } finally {
      setIsLoading(false);
      closeDeleteConfirm();
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${base_url}${imagePath}`;
  };

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.8)] flex items-center justify-center z-[1000]">
          <div className="bg-[#161B22] rounded-lg p-6 w-full max-w-md border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete the provider "
              {deleteConfirm.providerName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={deleteProvider}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? "md:ml-[40%] lg:ml-[28%] xl:ml-[17%]" : "ml-0"
          }`}
        >
          <div className="w-full mx-auto">
            <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Game Providers</h1>
                <p className="text-xs font-bold text-gray-500 mt-1">Manage game providers for the platform</p>
              </div>
            </div>

            {/* Add/Edit Provider Form */}
            <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-6">
                <div className="w-1 h-4 bg-indigo-500"></div>
                {editingId ? "Edit Provider" : "Add New Provider"}
              </h3>
              <form onSubmit={handleSubmit}>
                {/* Provider Selection Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Provider <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="providerSelection"
                    value={formData.providerOracleID}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                    required
                    disabled={isLoading || editingId}
                  >
                    <option value="">Select a provider</option>
                    {premiumProviders.map((provider) => (
                      <option key={provider._id} value={provider._id}>
                        {provider.providerName} ({provider.providerCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Provider Code Field (Read-only) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Provider Code
                  </label>
                  <input
                    type="text"
                    name="providercode"
                    value={formData.providercode}
                    readOnly
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-[3px] text-gray-500 cursor-not-allowed"
                    placeholder="Auto-filled from selection"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provider code is automatically filled when you select a provider
                  </p>
                </div>

                {/* Website Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Website URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaGlobe className="text-gray-500" />
                    </div>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                      placeholder="https://example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Category Selection Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[#0F111A] border border-gray-700 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-200"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select a category</option>
                    {categories
                      .filter((category) => category.status)
                      .map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Image Upload Section */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Provider Logo
                  </label>
                  <div className="flex items-center justify-center w-full">
                    {imagePreview ? (
                      <div className="relative w-full">
                        <img
                          src={imagePreview.startsWith('http') || imagePreview.startsWith('data:') ? imagePreview : getImageUrl(imagePreview)}
                          alt="Provider preview"
                          className="h-48 w-full object-contain border border-gray-700 rounded-md bg-[#0F111A]"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-600 cursor-pointer text-white p-1 rounded-full hover:bg-red-700 transition-colors"
                          disabled={isLoading}
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-900/20 transition-all duration-200">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FaRegFileImage className="w-8 md:w-12 h-8 mb-3 md:h-12 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            Click to upload provider logo
                          </p>
                          <p className="text-xs text-gray-600">PNG, JPG up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isLoading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end mt-8 space-x-4">
                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-6 py-2 bg-gray-700 text-white font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors text-sm"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (editingId ? "Update Provider" : "Add Provider")}
                  </button>
                </div>
              </form>
            </div>

            {/* Providers Table */}
            <div className="">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-indigo-500"></div>
                All Providers
              </h3>

              {isLoading && localProviders.length === 0 ? (
                <div className="bg-[#161B22] rounded-lg p-12 border border-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4" viewBox="0 0 24 24"></svg>
                    <p className="text-gray-500">Loading providers...</p>
                  </div>
                </div>
              ) : localProviders.length === 0 ? (
                <div className="bg-[#161B22] p-12 rounded-lg text-center border border-gray-800">
                  <FaRegFileImage className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No providers found. Add your first provider above.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-800 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#1C2128]">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider"
                        >
                          Logo
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider"
                        >
                          Code
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider"
                        >
                          Website
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider"
                        >
                          Category
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-indigo-400 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#161B22] divide-y divide-gray-800">
                      {localProviders.map((provider) => {
                        const categoryName = provider.category;

                        return (
                          <tr key={provider._id} className="hover:bg-[#1F2937] transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-12 w-12 flex-shrink-0">
                                <img
                                  className="h-12 w-12 rounded-full object-cover border border-gray-700"
                                  src={getImageUrl(provider.image)}
                                  alt={provider.name}
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/48x48?text=No+Image';
                                  }}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white font-medium">
                                {provider.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-gray-400 bg-[#0F111A] px-2 py-1 rounded border border-gray-700">
                                {provider.providercode || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <a
                                href={provider.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-400 hover:text-indigo-300 truncate max-w-xs block"
                              >
                                {provider.website}
                              </a>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-300">
                                <span className="bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded-full text-xs font-medium border border-indigo-700">
                                  {categoryName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={provider.status}
                                  onChange={() => toggleStatus(provider)}
                                  disabled={isLoading}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className={`ml-3 text-sm font-medium ${provider.status ? 'text-green-500' : 'text-red-500'}`}>
                                  {provider.status ? "Active" : "Inactive"}
                                </span>
                              </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  className="px-[8px] py-[7px] text-white bg-blue-600 cursor-pointer rounded-[3px] text-[16px] hover:bg-blue-700 transition-colors"
                                  onClick={() => editProvider(provider)}
                                  disabled={isLoading}
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  className="px-[8px] py-[7px] text-white bg-red-600 cursor-pointer rounded-[3px] text-[16px] hover:bg-red-700 transition-colors"
                                  onClick={() => confirmDelete(provider)}
                                  disabled={isLoading}
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Gameproviders;