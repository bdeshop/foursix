import React, { useState, useEffect } from 'react';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaClock,
  FaCheck,
  FaIdCard,
  FaUserCheck,
  FaUsers,
  FaSearch,
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import axios from 'axios';
import { FaUserPlus } from "react-icons/fa";
import { FaInfoCircle } from "react-icons/fa";

const AssignKYC = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, userSearchTerm]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admintoken');
      const response = await axios.get(`${base_url}/api/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter users who don't have KYC assigned or completed
      const allUsers = response.data.data || [];
      const eligibleUsers = allUsers.filter(user => {
        // Check if user already has KYC assigned/completed
        const hasKyc = user.assignkyc === 'assigned' || 
                       user.assignkyc === 'completed' ||
                       user.kycStatus === 'pending' ||
                       user.kycStatus === 'approved' ||
                       user.kycStatus === 'assigned';
        return !hasKyc;
      });
      
      setUsers(eligibleUsers);
      setFilteredUsers(eligibleUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!userSearchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.player_id?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleUserSelection = (user) => {
    if (selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...filteredUsers]);
    }
  };

  const assignKycToSelectedUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setAssigning(true);
    let successCount = 0;
    let failCount = 0;

    for (const user of selectedUsers) {
      try {
        const token = localStorage.getItem('admintoken');

        await axios.post(`${base_url}/api/admin/kyc/submit`, {
          userId: user._id,
          fullName: user.fullName || user.username,
          documents: []
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        successCount++;
      } catch (error) {
        console.error(`Error assigning KYC to ${user.username}:`, error);
        failCount++;
      }
    }

    setAssigning(false);
    setSelectedUsers([]);
    setUserSearchTerm('');
    
    if (successCount > 0) {
      toast.success(`KYC assigned to ${successCount} user(s) successfully`);
      fetchUsers(); // Refresh the user list
    }
    if (failCount > 0) {
      toast.error(`Failed to assign KYC to ${failCount} user(s)`);
    }
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 placeholder-gray-600';

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Assign KYC to Users</h1>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <FaIdCard className="text-amber-500" /> Select users from the list below to assign KYC verification
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-[#161B22] border border-gray-800 rounded-lg overflow-hidden">
            {/* Header with actions */}
            <div className="px-6 py-4 border-b border-gray-800 bg-[#1C2128] flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs" />
                  <input
                    type="text"
                    placeholder="Search by username, player ID, email, or phone..."
                    className={`${inputClass} pl-9`}
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  className="bg-indigo-500/10 hover:bg-indigo-600/30 border border-indigo-500/20 text-indigo-400 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                >
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {filteredUsers.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-all"
                  >
                    {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
                <button
                  onClick={assignKycToSelectedUsers}
                  disabled={assigning || selectedUsers.length === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {assigning ? <FaSpinner className="animate-spin" /> : ''}
                  Assign KYC ({selectedUsers.length})
                </button>
              </div>
            </div>

            {/* Users List */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <FaSpinner className="animate-spin text-amber-500 text-3xl" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <FaUsers className="text-gray-600 text-3xl" />
                </div>
                <p className="text-gray-500 text-sm">
                  {userSearchTerm ? 'No users match your search' : 'No eligible users found'}
                </p>
                <p className="text-gray-600 text-xs mt-2">
                  {!userSearchTerm && 'All users already have KYC assigned or completed'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {/* List Header */}
                <div className="px-6 py-3 bg-[#0F111A] text-[10px] font-black uppercase tracking-widest text-gray-500 grid grid-cols-12 gap-4">
                  <div className="col-span-1">Select</div>
                  <div className="col-span-3">Username / Player ID</div>
                  <div className="col-span-3">Full Name</div>
                  <div className="col-span-3">Contact Info</div>
                  <div className="col-span-2">Status</div>
                </div>

                {/* User Rows */}
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserSelection(user)}
                    className={`px-6 py-4 grid grid-cols-12 gap-4 items-center cursor-pointer transition-all ${
                      selectedUsers.some(u => u._id === user._id) 
                        ? 'bg-amber-500/5 border-l-4 border-l-amber-500' 
                        : 'hover:bg-[#1F2937]'
                    }`}
                  >
                    <div className="col-span-1">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        selectedUsers.some(u => u._id === user._id)
                          ? 'bg-amber-500 border-amber-500'
                          : 'border-gray-600 hover:border-amber-500'
                      }`}>
                        {selectedUsers.some(u => u._id === user._id) && (
                          <FaCheck className="text-white text-[9px]" />
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="font-bold text-white text-sm">{user.username}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{user.player_id}</div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="text-sm text-gray-300">{user.fullName || '-'}</div>
                    </div>
                    
                    <div className="col-span-3">
                      <div className="text-xs text-gray-400">{user.email || user.phone || '-'}</div>
                    </div>
                    
                    <div className="col-span-2">
                      <span className="text-[9px] px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        Eligible
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer with selection count */}
            {filteredUsers.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-800 bg-[#1C2128] flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  Showing {filteredUsers.length} of {users.length} eligible users
                </div>
                <div className="text-xs font-bold text-amber-400">
                  {selectedUsers.length} user(s) selected
                </div>
              </div>
            )}
          </div>

        </main>
      </div>
    </section>
  );
};

export default AssignKYC;