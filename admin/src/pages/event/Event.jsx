import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaTimes, 
  FaRegFileImage, 
  FaCalendarAlt, 
  FaClock, 
  FaTag, 
  FaInfoCircle,
  FaSpinner,
  FaImage,
  FaSave,
  FaUndo
} from 'react-icons/fa';
import { FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';

const Event = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDates: [{ date: '', time: '', status: 'scheduled' }],
    category: 'sports',
    status: 'active',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, [currentPage]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${base_url}/api/admin/events?page=${currentPage}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotalEvents(data.total || 0);
      } else {
        toast.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        toast.error('Only JPEG, JPG, PNG, or GIF images are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size must be less than 10MB');
        return;
      }
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDateChange = (index, field, value) => {
    const newDates = [...formData.eventDates];
    newDates[index][field] = value;
    setFormData({ ...formData, eventDates: newDates });
  };

  const addDateField = () => {
    setFormData({
      ...formData,
      eventDates: [...formData.eventDates, { date: '', time: '', status: 'scheduled' }]
    });
  };

  const removeDateField = (index) => {
    const newDates = formData.eventDates.filter((_, i) => i !== index);
    setFormData({ ...formData, eventDates: newDates });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (formData.eventDates.some(date => !date.date || !date.time)) {
      toast.error('Please fill all date and time fields');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description);
      formDataToSend.append('eventDates', JSON.stringify(formData.eventDates));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('status', formData.status);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch(`${base_url}/api/admin/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      if (response.ok) {
        setFormData({
          title: '',
          description: '',
          eventDates: [{ date: '', time: '', status: 'scheduled' }],
          category: 'sports',
          status: 'active',
          image: null
        });
        setImagePreview(null);
        fetchEvents();
        toast.success(data.message || 'Event created successfully!');
      } else {
        toast.error(data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Error creating event');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    if (formData.eventDates.some(date => !date.date || !date.time)) {
      toast.error('Please fill all date and time fields');
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('description', formData.description);
      formDataToSend.append('eventDates', JSON.stringify(formData.eventDates));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('status', formData.status);
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      const response = await fetch(`${base_url}/api/admin/events/${editingEvent._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });

      const data = await response.json();
      if (response.ok) {
        setEditingEvent(null);
        setFormData({
          title: '',
          description: '',
          eventDates: [{ date: '', time: '', status: 'scheduled' }],
          category: 'sports',
          status: 'active',
          image: null
        });
        setImagePreview(null);
        fetchEvents();
        toast.success(data.message || 'Event updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Error updating event');
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

  const toggleDateStatus = async (eventId, dateIndex, currentStatus) => {
    const newStatus = {
      scheduled: 'live',
      live: 'completed',
      completed: 'cancelled',
      cancelled: 'scheduled'
    }[currentStatus] || 'scheduled';

    try {
      const response = await fetch(`${base_url}/api/admin/events/${eventId}/dates/${dateIndex}/status`, {
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
        toast.success(data.message || 'Event date status updated successfully');
      } else {
        toast.error(data.error || 'Failed to update event date status');
      }
    } catch (error) {
      console.error('Error updating event date status:', error);
      toast.error('Error updating event date status');
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

  const startEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      eventDates: event.eventDates.map(date => ({
        date: date.date.split('T')[0],
        time: date.time,
        status: date.status
      })),
      category: event.category,
      status: event.status,
      image: null
    });
    setImagePreview(event.image ? `${base_url}${event.image}` : null);
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      eventDates: [{ date: '', time: '', status: 'scheduled' }],
      category: 'sports',
      status: 'active',
      image: null
    });
    setImagePreview(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-BD', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'scheduled':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'live':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const stats = {
    total: totalEvents,
    active: events.filter(e => e.status === 'active').length,
    completed: events.filter(e => e.status === 'completed').length
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500';
  const textareaClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-xs rounded px-3 py-2 focus:outline-none focus:border-amber-500 placeholder-gray-600 min-h-[100px]';

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
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h1>
              <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                <FaCalendarAlt className="text-amber-500" /> Create and manage platform events
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              {editingEvent && (
                <button
                  onClick={cancelEdit}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2"
                >
                  <FaUndo /> CANCEL EDIT
                </button>
              )}
              <button
                onClick={() => fetchEvents()}
                className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> REFRESH
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'TOTAL EVENTS', value: stats.total, color: 'border-indigo-500', valueClass: 'text-white' },
              { label: 'ACTIVE', value: stats.active, color: 'border-emerald-500', valueClass: 'text-emerald-400' },
              { label: 'COMPLETED', value: stats.completed, color: 'border-blue-500', valueClass: 'text-blue-400' },
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

          {/* Create/Edit Event Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-4 bg-amber-500"></div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                {editingEvent ? 'Edit Event Information' : 'Event Information'}
              </h2>
            </div>
            <form onSubmit={editingEvent ? handleEditSubmit : handleSubmit}>
              {/* Event Title */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Event Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={inputClass}
                  placeholder="Enter event title"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Description <span className="text-gray-600">(Optional)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={textareaClass}
                  placeholder="Enter event description"
                />
              </div>

              {/* Event Image */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Event Image <span className="text-gray-600">(Optional)</span>
                </label>
                {imagePreview && (
                  <div className="mb-3">
                    <img src={imagePreview} alt="Preview" className="h-24 w-36 object-cover rounded-lg border border-gray-700" />
                  </div>
                )}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-amber-500/50 hover:bg-[#1F2937] transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaImage className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-1 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                        <span className="font-semibold text-amber-400">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-[8px] text-gray-600">PNG, JPG, GIF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="sports">Sports</option>
                  <option value="music">Music</option>
                  <option value="conference">Conference</option>
                  <option value="workshop">Workshop</option>
                  <option value="webinar">Webinar</option>
                  <option value="social">Social</option>
                  <option value="cultural">Cultural</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Event Status */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">
                  Event Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={selectClass}
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Event Dates */}
              <div className="mb-5">
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">
                  Event Dates & Times <span className="text-rose-400">*</span>
                </label>
                {formData.eventDates.map((date, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-3 mb-3">
                    <input
                      type="date"
                      value={date.date}
                      onChange={(e) => handleDateChange(index, 'date', e.target.value)}
                      className={`${inputClass} flex-1 min-w-[120px]`}
                      required
                    />
                    <input
                      type="time"
                      value={date.time}
                      onChange={(e) => handleDateChange(index, 'time', e.target.value)}
                      className={`${inputClass} flex-1 min-w-[100px]`}
                      required
                    />
                    <select
                      value={date.status}
                      onChange={(e) => handleDateChange(index, 'status', e.target.value)}
                      className={`${selectClass} flex-1 min-w-[110px]`}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {formData.eventDates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDateField(index)}
                        className="text-rose-400 hover:text-rose-300 transition-colors p-2"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDateField}
                  className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors mt-2"
                >
                  <FaPlus /> Add Another Date
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-800">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded font-bold text-xs transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin" /> : editingEvent ? <FaSave /> : <FaPlus />}
                  {loading ? 'Processing...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
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

export default Event;