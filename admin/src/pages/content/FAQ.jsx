import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaSpinner, FaExclamationTriangle, FaSearch, FaSort, FaSortUp, FaSortDown, FaCalendarAlt } from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const FAQ = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general'
  });
  const [editingId, setEditingId] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Delete confirmation popup state
  const [deletePopup, setDeletePopup] = useState({
    isOpen: false,
    faqId: null,
    faqQuestion: '',
    deleting: false
  });
  
  const categories = [
    { value: 'general', label: 'General' },
    { value: 'account', label: 'Account' },
    { value: 'payments', label: 'Payments' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'returns', label: 'Returns & Refunds' },
    { value: 'technical', label: 'Technical Support' }
  ];

  // Axios instance with base configuration
  const api = axios.create({
    baseURL: `${base_url}/api/admin`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to include auth token if needed
  api.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor for error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      setError(error.response?.data?.error || 'An error occurred');
      return Promise.reject(error);
    }
  );
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // Fetch FAQs from API
  const fetchFaqs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`${base_url}/api/admin/faqs`);
      setFaqs(response.data);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Please fill in both question and answer fields');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        // Update existing FAQ
        await api.put(`${base_url}/api/admin/faqs/${editingId}`, formData);
        setSuccess('FAQ updated successfully');
      } else {
        // Add new FAQ
        await api.post('/faqs', formData);
        setSuccess('FAQ created successfully');
      }
      
      // Refresh the FAQs list
      await fetchFaqs();
      
      // Reset form
      setFormData({
        question: '',
        answer: '',
        category: 'general'
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error saving FAQ:', error);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (faq) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category
    });
    setEditingId(faq._id);
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'general'
    });
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const toggleStatus = async (id, currentStatus) => {
    setError('');
    try {
      await api.put(`${base_url}/api/admin/faqs/${id}/status`, { status: !currentStatus });
      setSuccess('Status updated successfully');
      await fetchFaqs();
    } catch (error) {
      console.error('Error toggling FAQ status:', error);
    }
  };

  // Open delete confirmation popup
  const openDeletePopup = (id, question) => {
    setDeletePopup({
      isOpen: true,
      faqId: id,
      faqQuestion: question,
      deleting: false
    });
  };

  // Close delete confirmation popup
  const closeDeletePopup = () => {
    setDeletePopup({
      isOpen: false,
      faqId: null,
      faqQuestion: '',
      deleting: false
    });
  };

  // Handle FAQ deletion
  const handleDeleteFaq = async () => {
    if (!deletePopup.faqId) return;

    setDeletePopup(prev => ({ ...prev, deleting: true }));
    setError('');

    try {
      await api.delete(`/faqs/${deletePopup.faqId}`);
      setSuccess('FAQ deleted successfully');
      await fetchFaqs();
      closeDeletePopup();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      setDeletePopup(prev => ({ ...prev, deleting: false }));
    }
  };

  const toggleExpand = (id) => {
    if (expandedItems.includes(id)) {
      setExpandedItems(expandedItems.filter(itemId => itemId !== id));
    } else {
      setExpandedItems([...expandedItems, id]);
    }
  };

  // Sorting and filtering logic
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-indigo-400 inline ml-1" />;
    return <FaSortDown className="text-indigo-400 inline ml-1" />;
  };

  const filteredFaqs = React.useMemo(() => {
    let filtered = [...faqs];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(faq => faq.category === categoryFilter);
    }
    
    // Apply sorting
    if (sortConfig.key !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'createdAt') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [faqs, searchTerm, categoryFilter, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const paginatedFaqs = filteredFaqs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPaginationPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const getCategoryBadge = (category) => {
    const categoryMap = {
      general: { text: 'General', color: 'border-indigo-500 text-indigo-400 bg-indigo-500/10' },
      account: { text: 'Account', color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
      payments: { text: 'Payments', color: 'border-amber-500 text-amber-400 bg-amber-500/10' },
      shipping: { text: 'Shipping', color: 'border-blue-500 text-blue-400 bg-blue-500/10' },
      returns: { text: 'Returns', color: 'border-rose-500 text-rose-400 bg-rose-500/10' },
      technical: { text: 'Technical', color: 'border-purple-500 text-purple-400 bg-purple-500/10' },
    };
    return categoryMap[category] || categoryMap.general;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortConfig({ key: null, direction: 'ascending' });
    setCurrentPage(1);
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-indigo-500';

  if (loading && faqs.length === 0) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full">
              <FaSpinner className="animate-spin text-indigo-400 text-3xl" />
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%] ' : 'ml-0'
          }`}
        >
          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300 ml-4 text-lg leading-none">×</button>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded text-sm flex justify-between items-center">
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-300 ml-4 text-lg leading-none">×</button>
            </div>
          )}

          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">FAQ Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-indigo-500" /> Manage frequently asked questions and support content
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchFaqs}
                className="bg-[#1F2937] hover:bg-indigo-600 border border-gray-700 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL FAQS', value: faqs.length, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'ACTIVE', value: faqs.filter(f => f.status).length, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'INACTIVE', value: faqs.filter(f => !f.status).length, color: 'border-amber-500', valueClass: 'text-amber-400' },
              { label: 'CATEGORIES', value: categories.length, color: 'border-rose-500', valueClass: 'text-rose-400' },
            ].map((card, i) => (
              <div key={i} className={`bg-[#161B22] border-l-4 ${card.color} p-5 rounded shadow-lg border-y border-r border-gray-800`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{card.label}</p>
                  <FiTrendingUp className="text-gray-700" />
                </div>
                <h2 className={`text-xl font-bold mt-1 leading-none ${card.valueClass}`}>{card.value}</h2>
              </div>
            ))}
          </div>

          {/* Add/Edit FAQ Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500"></div> {editingId ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Category Selection */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Question Field */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Question</label>
                <input
                  type="text"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Enter question"
                />
              </div>
              
              {/* Answer Field */}
              <div className="mb-6">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Answer</label>
                <textarea
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  rows="4"
                  className={inputClass}
                  placeholder="Enter answer"
                ></textarea>
              </div>
              
              {/* Submit/Cancel Buttons */}
              <div className="flex justify-end mt-6 space-x-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-6 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 font-bold text-xs rounded-md hover:border-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!formData.question.trim() || !formData.answer.trim() || saving}
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      {editingId ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingId ? 'Update FAQ' : 'Add FAQ'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Filter Section */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500"></div> Filters & Search
              </h2>
              <button
                onClick={clearFilters}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClass} pl-8`}
                  placeholder="Search questions or answers..."
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={selectClass}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <select
                value={sortConfig.key || ''}
                onChange={(e) => requestSort(e.target.value)}
                className={selectClass}
              >
                <option value="">Sort By</option>
                <option value="question">Question</option>
                <option value="category">Category</option>
                <option value="createdAt">Date Created</option>
              </select>
            </div>
          </div>

          {/* All FAQs Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-indigo-400 uppercase tracking-widest flex justify-between items-center">
              <span>All FAQs</span>
              <span className="text-gray-500 text-[9px]">{filteredFaqs.length} item(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('question')}>
                      Question {getSortIcon('question')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('category')}>
                      Category {getSortIcon('category')}
                    </th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>
                      Created {getSortIcon('createdAt')}
                    </th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedFaqs.length > 0 ? (
                    paginatedFaqs.map((faq) => {
                      const categoryBadge = getCategoryBadge(faq.category);
                      return (
                        <tr key={faq._id} className="hover:bg-[#1F2937] transition-colors">
                          <td className="px-5 py-4">
                            <div className="text-xs font-medium text-gray-200">{faq.question}</div>
                            <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{faq.answer.substring(0, 80)}...</div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase border ${categoryBadge.color}`}>
                              {categoryBadge.text}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={faq.status}
                                onChange={() => toggleStatus(faq._id, faq.status)}
                              />
                              <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              <span className="ml-2 text-[10px] font-medium">
                                {faq.status ? (
                                  <span className="text-emerald-400">Active</span>
                                ) : (
                                  <span className="text-rose-400">Inactive</span>
                                )}
                              </span>
                            </label>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-[10px] text-gray-400">
                            {faq.createdAt ? new Date(faq.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => startEditing(faq)}
                                className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-400 rounded text-xs transition-all"
                                title="Edit FAQ"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                onClick={() => openDeletePopup(faq._id, faq.question)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                title="Delete FAQ"
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
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaSearch className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No FAQs found</p>
                          <p className="text-xs mt-1">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {filteredFaqs.length} total
              </p>
              <nav className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === 1
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600 hover:border-indigo-500'
                  }`}
                >
                  ← Prev
                </button>

                {getPaginationPages().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-xs text-gray-600 font-bold select-none">
                      ···
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                        currentPage === page
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600/30 hover:border-indigo-500/50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                    currentPage === totalPages
                      ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-indigo-600 hover:border-indigo-500'
                  }`}
                >
                  Next →
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>

      {/* Custom Delete Confirmation Popup */}
      {deletePopup.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000] p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg max-w-md w-full mx-auto transform transition-all">
            {/* Popup Header */}
            <div className="flex items-center p-4 border-b border-gray-800">
              <div className="flex items-center justify-center w-10 h-10 bg-rose-500/10 rounded-full">
                <FaExclamationTriangle className="text-rose-400 text-lg" />
              </div>
              <h3 className="ml-3 text-sm font-bold text-gray-200 uppercase tracking-wider">Delete FAQ</h3>
            </div>
            
            {/* Popup Body */}
            <div className="p-6">
              <p className="text-xs text-gray-400 mb-2">
                Are you sure you want to delete this FAQ?
              </p>
              <p className="text-sm text-gray-200 font-medium bg-[#0F111A] p-3 rounded border border-gray-700">
                "{deletePopup.faqQuestion}"
              </p>
              <p className="text-rose-400 text-[10px] mt-3 font-bold uppercase tracking-wider">
                This action cannot be undone.
              </p>
            </div>
            
            {/* Popup Footer */}
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-800">
              <button
                type="button"
                onClick={closeDeletePopup}
                className="px-4 py-2 text-gray-300 bg-[#0F111A] border border-gray-700 hover:border-gray-500 rounded-md transition-colors font-bold text-xs"
                disabled={deletePopup.deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFaq}
                className="px-4 py-2 text-white bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/30 text-rose-400 rounded-md transition-colors font-bold text-xs flex items-center justify-center"
                disabled={deletePopup.deleting}
              >
                {deletePopup.deleting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete FAQ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FAQ;