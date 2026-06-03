import React, { useState, useEffect } from 'react';
import { 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaCalendarAlt, 
  FaClock, 
  FaImage, 
  FaTag, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSpinner,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaSearch,
  FaFilter,
  FaEye,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';

const Allevent = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });

  // Fetch events on component mount and when dependencies change
  useEffect(() => {
    fetchEvents();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, sortConfig]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : '',
        category: categoryFilter !== 'all' ? categoryFilter : '',
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction === 'descending' ? 'desc' : 'asc'
      });
      
      const response = await fetch(`${base_url}/api/admin/events?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setEvents(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalEvents(data.total || 0);
      } else {
        toast.error(data.error || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'completed' : 'active';
      const response = await fetch(`${base_url}/api/admin/events/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (response.ok) {
        fetchEvents();
        toast.success(data.message || 'Event status updated successfully');
      } else {
        toast.error(data.error || 'Failed to update event status');
      }
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Error updating event status');
    }
  };

  const confirmDelete = (event) => {
    setEventToDelete(event);
    setShowDeletePopup(true);
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setEventToDelete(null);
  };

  const deleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const response = await fetch(`${base_url}/api/admin/events/${eventToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        fetchEvents();
        toast.success(data.message || 'Event deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Error deleting event');
    } finally {
      setShowDeletePopup(false);
      setEventToDelete(null);
    }
  };

  const handleRefresh = () => {
    fetchEvents();
    toast.success('Events refreshed');
  };

  const requestSort = (key) => {
    let direction = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') direction = 'ascending';
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-600 inline ml-1" />;
    if (sortConfig.direction === 'ascending') return <FaSortUp className="text-amber-400 inline ml-1" />;
    return <FaSortDown className="text-amber-400 inline ml-1" />;
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', dot: 'bg-emerald-400', label: 'Active' };
      case 'completed':
        return { badge: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', dot: 'bg-blue-400', label: 'Completed' };
      case 'cancelled':
        return { badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', dot: 'bg-rose-400', label: 'Cancelled' };
      default:
        return { badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20', dot: 'bg-gray-400', label: status };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getCategoryLabel = (category) => {
    const categories = {
      sports: 'Sports',
      music: 'Music',
      conference: 'Conference',
      workshop: 'Workshop',
      webinar: 'Webinar',
      social: 'Social',
      cultural: 'Cultural',
      other: 'Other'
    };
    return categories[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getPaginationPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const stats = {
    total: totalEvents,
    active: events.filter(e => e.status === 'active').length,
    completed: events.filter(e => e.status === 'completed').length,
    categories: [...new Set(events.map(e => e.category))].length
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';

  const CloseIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Event Management</h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-amber-500" /> Manage and monitor all platform events
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={() => navigate('/event-management/create-event')}
                className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
              >
                <FaPlus /> CREATE EVENT
              </button>
              <button
                onClick={handleRefresh}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'TOTAL EVENTS', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'ACTIVE', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'COMPLETED', value: stats.completed, color: 'border-blue-500', valueClass: 'text-blue-400' },
              { label: 'CATEGORIES', value: stats.categories, color: 'border-amber-500', valueClass: 'text-amber-400' },
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

          {/* Results Info */}
          <div className="mb-3 flex justify-between items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Showing {events.length} of {totalEvents} events
            </p>
          </div>

          {/* Events Table */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 font-black text-[10px] text-amber-400 uppercase tracking-widest">
              All Events
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-[#0F111A] text-[9px] text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Image</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('title')}>
                      Title {getSortIcon('title')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('category')}>
                      Category {getSortIcon('category')}
                    </th>
                    <th className="px-5 py-3">Dates</th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('status')}>
                      Status {getSortIcon('status')}
                    </th>
                    <th className="px-5 py-3 cursor-pointer" onClick={() => requestSort('createdAt')}>
                      Created {getSortIcon('createdAt')}
                    </th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <FaSpinner className="animate-spin text-amber-400 text-2xl" />
                          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading events...</p>
                        </div>
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center text-gray-600">
                          <FaCalendarAlt className="text-4xl mb-3 opacity-20" />
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No events found</p>
                          <p className="text-[10px] mt-1 text-gray-600">Create your first event to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => {
                      const statusInfo = getStatusInfo(event.status);
                      return (
                        <tr key={event._id} className="hover:bg-[#1F2937] transition-colors group">
                          {/* Image */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {event.image ? (
                              <img
                                src={`${base_url}${event.image}`}
                                alt={event.title}
                                className="h-12 w-20 rounded object-cover border border-gray-700"
                                onError={(e) => (e.target.src = '/placeholder-image.jpg')}
                              />
                            ) : (
                              <div className="h-12 w-20 bg-[#0F111A] rounded border border-gray-700 flex items-center justify-center">
                                <FaImage className="text-gray-600 text-lg" />
                              </div>
                            )}
                          </td>
                          
                          {/* Title */}
                          <td className="px-5 py-4">
                            <div className="text-sm font-bold text-white">{event.title}</div>
                            <div className="text-[9px] text-gray-500 mt-0.5 line-clamp-1 max-w-xs">
                              {event.description?.substring(0, 60)}...
                            </div>
                          </td>
                          
                          {/* Category */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="text-xs font-bold text-amber-400">{getCategoryLabel(event.category)}</span>
                          </td>
                          
                          {/* Dates */}
                          <td className="px-5 py-4">
                            {event.eventDates?.slice(0, 2).map((date, index) => (
                              <div key={index} className="text-[10px] text-gray-400 mb-1 flex items-center gap-1">
                                <FaCalendarAlt className="text-[8px] text-amber-400" />
                                {formatDate(date.date)} at {formatTime(date.time)}
                                <span className={`text-[8px] px-1 ml-1 rounded ${
                                  date.status === 'upcoming' ? 'bg-emerald-500/20 text-emerald-400' :
                                  date.status === 'ongoing' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {date.status}
                                </span>
                              </div>
                            ))}
                            {event.eventDates?.length > 2 && (
                              <div className="text-[9px] text-gray-600">+{event.eventDates.length - 2} more</div>
                            )}
                          </td>
                          
                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={event.status === 'active'}
                                  onChange={() => toggleStatus(event._id, event.status)}
                                  disabled={event.status === 'completed' || event.status === 'cancelled'}
                                />
                                <div className={`w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${event.status === 'active' ? 'peer-checked:bg-amber-500' : ''} ${(event.status === 'completed' || event.status === 'cancelled') ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                              </label>
                              <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${statusInfo.badge}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          </td>
                          
                          {/* Created */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-400">{formatDate(event.createdAt)}</div>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => navigate(`/edit-event/${event._id}`)}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 text-amber-400 rounded text-xs transition-all"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => confirmDelete(event)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 text-rose-400 rounded text-xs transition-all"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-800 bg-[#1C2128]">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">
                    Page {currentPage} of {totalPages} &nbsp;·&nbsp; {totalEvents} total
                  </p>
                  <nav className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${currentPage === 1 ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >← Prev</button>
                    {getPaginationPages().map((page, idx) =>
                      page === '...' ? (
                        <span key={`e-${idx}`} className="px-2 py-1.5 text-[9px] text-gray-600 font-bold select-none">···</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${currentPage === page ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                        >{page}</button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded text-[9px] font-bold border transition-all ${currentPage === totalPages ? 'bg-[#1C2128] border-gray-800 text-gray-700 cursor-not-allowed' : 'bg-[#1C2128] border-gray-700 text-gray-300 hover:bg-amber-600/30 hover:border-amber-500/50'}`}
                    >Next →</button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
          <div className="bg-[#161B22] border border-gray-700 rounded-lg shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1C2128]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Confirm Delete</h3>
              <button onClick={cancelDelete} className="text-gray-500 hover:text-gray-300"><CloseIcon /></button>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-400 mb-5">
                Are you sure you want to delete the event "{eventToDelete?.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteEvent}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
              >
                <FaTrash /> Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Allevent;