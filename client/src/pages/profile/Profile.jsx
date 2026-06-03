// Profile.js
import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { 
  FiChevronRight, 
  FiAlertCircle, 
  FiCopy, 
  FiCheck, 
  FiX, 
  FiEdit, 
  FiEye, 
  FiEyeOff, 
  FiMail, 
  FiPhone, 
  FiCalendar, 
  FiUser, 
  FiShield, 
  FiLock,
  FiKey,
  FiRefreshCw,
  FiSend,
  FiSave,
  FiXCircle,
  FiHome,
  FiUpload,
  FiFileText,
  FiMapPin,
  FiCreditCard,
  FiClock
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LanguageContext } from "../../context/LanguageContext";
import toast from "react-hot-toast";

const Profile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  const { language, t } = useContext(LanguageContext);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [personalInfoForm, setPersonalInfoForm] = useState({
    fullName: "",
    dateOfBirth: "",
    phone: ""
  });
  
  // Separate edit states for each field
  const [editingFields, setEditingFields] = useState({
    fullName: false,
    dateOfBirth: false
  });
  
  // Track if fields have been updated before
  const [isFullNameUpdated, setIsFullNameUpdated] = useState(false);
  const [isDOBUpdated, setIsDOBUpdated] = useState(false);
  const [isEmailUpdated, setIsEmailUpdated] = useState(false);
  
  const [emailUpdateForm, setEmailUpdateForm] = useState({
    newEmail: "",
    otp: "",
    step: "request",
    showForm: false
  });
  
  const [verificationStatus, setVerificationStatus] = useState({
    email: "not_started",
    phone: "not_started",
    identity: "not_started",
    address: "not_started"
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  
  // Address verification state
  const [addressForm, setAddressForm] = useState({
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Bangladesh",
    documentType: "utility_bill",
    documentFile: null
  });
  const [addressDocuments, setAddressDocuments] = useState([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [addressVerificationStep, setAddressVerificationStep] = useState("form"); // form, document, review, submitted
  
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  useEffect(() => {
    if (userData) {
      setPersonalInfoForm({
        fullName: userData.fullName || '',
        dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
        phone: userData.phone || ''
      });
      
      // Check if fields have been updated before
      setIsFullNameUpdated(!!userData.fullName);
      setIsDOBUpdated(!!userData.dateOfBirth);
      setIsEmailUpdated(!!userData.email);
      
      // Load address verification data if available
      if (userData.addressVerification) {
        setAddressForm({
          streetAddress: userData.addressVerification.streetAddress || "",
          city: userData.addressVerification.city || "",
          state: userData.addressVerification.state || "",
          postalCode: userData.addressVerification.postalCode || "",
          country: userData.addressVerification.country || "Bangladesh",
          documentType: userData.addressVerification.documentType || "utility_bill",
          documentFile: null
        });
        setAddressDocuments(userData.addressVerification.documents || []);
        setAddressVerificationStep(userData.addressVerification.status === "verified" ? "submitted" : "form");
      }
      
      setVerificationStatus({
        email: userData.isEmailVerified ? "verified" : "not_started",
        phone: userData.isPhoneVerified ? "verified" : "not_started",
        identity: userData.kycStatus || "not_started",
        address: userData.addressVerification?.status || "not_started"
      });
    }
  }, [userData]);

  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem('usertoken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get(`${API_BASE_URL}/api/user/my-information`);
      if (response.data.success) {
        setUserData(response.data.data);
      } else {
        throw new Error('Failed to fetch user data');
      }
      
      const verificationResponse = await axios.get(`${API_BASE_URL}/api/user/verification-status`);
      if (verificationResponse.data.success) {
        setVerificationStatus(verificationResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('usertoken');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setPersonalInfoForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailUpdateChange = (e) => {
    const { name, value } = e.target;
    setEmailUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t?.passwordsDontMatch || "New passwords don't match!");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error(t?.passwordMinLength || "New password must be at least 6 characters long!");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmPassword
      });

      if (response.data.success) {
        toast.success(t?.passwordChangedSuccess || "Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        toast.error(response.data.message || (t?.failedToChangePassword || "Failed to change password"));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || (t?.failedToChangePassword || "Failed to change password"));
    } finally {
      setIsUpdating(false);
    }
  };

  // Update full name (can only be done once)
  const handleUpdateFullName = async () => {
    if (isFullNameUpdated) {
      toast.error(t?.fullNameAlreadyUpdated || "Full name can only be updated once. Contact support for changes.");
      setEditingFields(prev => ({ ...prev, fullName: false }));
      return false;
    }
    
    if (!personalInfoForm.fullName || personalInfoForm.fullName.trim().length < 2) {
      toast.error(t?.fullNameRequired || "Full name must be at least 2 characters long");
      return false;
    }

    setIsUpdating(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/user/update-fullname`, {
        fullName: personalInfoForm.fullName.trim()
      });

      if (response.data.success) {
        toast.success(t?.fullNameUpdated || "Full name updated successfully!");
        setUserData(prev => ({ ...prev, fullName: personalInfoForm.fullName.trim() }));
        setIsFullNameUpdated(true);
        setEditingFields(prev => ({ ...prev, fullName: false }));
        return true;
      } else {
        toast.error(response.data.message || (t?.failedToUpdateFullName || "Failed to update full name"));
        return false;
      }
    } catch (error) {
      console.error('Error updating full name:', error);
      toast.error(error.response?.data?.message || (t?.failedToUpdateFullName || "Failed to update full name"));
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  // Update date of birth (can only be done once)
  const handleUpdateDOB = async () => {
    if (isDOBUpdated) {
      toast.error(t?.dobAlreadyUpdated || "Date of birth can only be updated once. Contact support for changes.");
      setEditingFields(prev => ({ ...prev, dateOfBirth: false }));
      return false;
    }
    
    if (!personalInfoForm.dateOfBirth) {
      toast.error(t?.dobRequired || "Date of birth is required");
      return false;
    }

    setIsUpdating(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/user/update-dob`, {
        dateOfBirth: personalInfoForm.dateOfBirth
      });

      if (response.data.success) {
        toast.success(t?.dobUpdated || "Date of birth updated successfully!");
        setUserData(prev => ({ ...prev, dateOfBirth: response.data.data.dateOfBirth }));
        setIsDOBUpdated(true);
        setEditingFields(prev => ({ ...prev, dateOfBirth: false }));
        return true;
      } else {
        toast.error(response.data.message || (t?.failedToUpdateDOB || "Failed to update date of birth"));
        return false;
      }
    } catch (error) {
      console.error('Error updating DOB:', error);
      toast.error(error.response?.data?.message || (t?.failedToUpdateDOB || "Failed to update date of birth"));
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = (field) => {
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setPersonalInfoForm({
      fullName: userData?.fullName || '',
      dateOfBirth: userData?.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
      phone: userData?.phone || ''
    });
  };

  const handleSendEmailOTP = async () => {
    // Check if email already updated
    if (isEmailUpdated && userData?.email) {
      toast.error(t?.emailAlreadyUpdated || "Email can only be set once. Contact support for changes.");
      return;
    }

    if (!emailUpdateForm.newEmail) {
      toast.error(t?.pleaseEnterEmail || "Please enter your new email address");
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(emailUpdateForm.newEmail)) {
      toast.error(t?.invalidEmail || "Please enter a valid email address");
      return;
    }

    setIsSendingOTP(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/request-email-update`, {
        newEmail: emailUpdateForm.newEmail
      });

      if (response.data.success) {
        toast.success(t?.verificationEmailSent || "Verification code sent to your new email address!");
        setEmailUpdateForm(prev => ({ ...prev, step: "verify" }));
      } else {
        toast.error(response.data.message || (t?.failedToSendOTP || "Failed to send verification code"));
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast.error(error.response?.data?.message || (t?.failedToSendOTP || "Failed to send verification code"));
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!emailUpdateForm.otp) {
      toast.error(t?.pleaseEnterOTP || "Please enter the verification code");
      return;
    }

    setIsVerifyingOTP(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/verify-email-update`, {
        otp: emailUpdateForm.otp
      });

      if (response.data.success) {
        toast.success(t?.emailUpdatedSuccessfully || "Email updated successfully!");
        setUserData(prev => ({ ...prev, email: response.data.data.email, isEmailVerified: true }));
        setIsEmailUpdated(true);
        setVerificationStatus(prev => ({ ...prev, email: "verified" }));
        setEmailUpdateForm({
          newEmail: "",
          otp: "",
          step: "request",
          showForm: false
        });
      } else {
        toast.error(response.data.message || (t?.failedToVerifyOTP || "Failed to verify OTP"));
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error(error.response?.data?.message || (t?.failedToVerifyOTP || "Failed to verify OTP"));
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleEmailVerificationRequest = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/request-email-verification`);
      if (response.data.success) {
        toast.success(t?.verificationEmailSent || "Verification email sent. Please check your inbox.");
        setVerificationStatus(prev => ({ ...prev, email: "pending" }));
        
        const otp = prompt(t?.enterVerificationCode || "Enter the verification code sent to your email:");
        if (otp) {
          await handleEmailVerification(otp);
        }
      } else {
        toast.error(response.data.message || (t?.failedToSendVerification || "Failed to send verification email"));
      }
    } catch (error) {
      console.error('Error requesting email verification:', error);
      toast.error(error.response?.data?.message || (t?.failedToSendVerification || "Failed to send verification email"));
    }
  };

  const handleEmailVerification = async (otp) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/verify-email`, { otp });
      if (response.data.success) {
        toast.success(t?.emailVerifiedSuccessfully || "Email verified successfully!");
        setVerificationStatus(prev => ({ ...prev, email: "verified" }));
        setUserData(prev => ({ ...prev, isEmailVerified: true }));
      } else {
        toast.error(response.data.message || (t?.failedToVerifyEmail || "Failed to verify email"));
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      toast.error(error.response?.data?.message || (t?.failedToVerifyEmail || "Failed to verify email"));
    }
  };

  const handleResendVerificationEmail = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/resend-verification-email`);
      if (response.data.success) {
        toast.success(t?.verificationEmailSent || "Verification email resent. Please check your inbox.");
      } else {
        toast.error(response.data.message || (t?.failedToSendVerification || "Failed to send verification email"));
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast.error(error.response?.data?.message || (t?.failedToSendVerification || "Failed to send verification email"));
    }
  };

  const handlePhoneVerificationRequest = async () => {
    if (!userData?.phone) {
      toast.error(t?.addPhoneFirst || "Please add your phone number in Personal Info first.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/request-phone-verification`);
      if (response.data.success) {
        toast.success(t?.verificationSmsSent || "Verification SMS sent. Please check your phone.");
        setVerificationStatus(prev => ({ ...prev, phone: "pending" }));
        
        const otp = prompt(t?.enterVerificationCode || "Enter the verification code sent to your phone:");
        if (otp) {
          await handlePhoneVerification(otp);
        }
      } else {
        toast.error(response.data.message || (t?.failedToSendSMS || "Failed to send verification SMS"));
      }
    } catch (error) {
      console.error('Error requesting phone verification:', error);
      toast.error(error.response?.data?.message || (t?.failedToSendSMS || "Failed to send verification SMS"));
    }
  };

  const handlePhoneVerification = async (otp) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/verify-phone`, { otp });
      if (response.data.success) {
        toast.success(t?.phoneVerifiedSuccessfully || "Phone verified successfully!");
        setVerificationStatus(prev => ({ ...prev, phone: "verified" }));
        setUserData(prev => ({ ...prev, isPhoneVerified: true }));
      } else {
        toast.error(response.data.message || (t?.failedToVerifyPhone || "Failed to verify phone"));
      }
    } catch (error) {
      console.error('Error verifying phone:', error);
      toast.error(error.response?.data?.message || (t?.failedToVerifyPhone || "Failed to verify phone"));
    }
  };

  // Address Verification Handlers
  const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image or PDF file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setAddressForm(prev => ({
        ...prev,
        documentFile: file
      }));
      
      // Preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedDocument(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setSelectedDocument(null);
      }
    }
  };

  const handleAddressVerificationSubmit = async () => {
    // Validate address form
    if (!addressForm.streetAddress || !addressForm.city || !addressForm.postalCode) {
      toast.error('Please fill in all required address fields');
      return;
    }
    
    if (!addressForm.documentFile) {
      toast.error('Please upload a proof of address document');
      return;
    }
    
    setUploadingDocument(true);
    
    try {
      // Upload document first
      const formData = new FormData();
      formData.append('document', addressForm.documentFile);
      formData.append('documentType', addressForm.documentType);
      formData.append('streetAddress', addressForm.streetAddress);
      formData.append('city', addressForm.city);
      formData.append('state', addressForm.state);
      formData.append('postalCode', addressForm.postalCode);
      formData.append('country', addressForm.country);
      
      const response = await axios.post(`${API_BASE_URL}/api/user/verify-address`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Address verification submitted successfully! Our team will review your documents.');
        setAddressVerificationStep('submitted');
        setVerificationStatus(prev => ({ ...prev, address: "pending" }));
        setAddressDocuments(response.data.data.documents || []);
        setUserData(prev => ({ ...prev, addressVerification: response.data.data }));
      } else {
        toast.error(response.data.message || 'Failed to submit address verification');
      }
    } catch (error) {
      console.error('Address verification error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit address verification');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!userData?.email) {
      toast.error(t?.noEmailFound || "No email address found. Please update your email first.");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/user/forgot-password`, {
        email: userData.email
      });
      
      if (response.data.success) {
        toast.success(t?.passwordResetEmailSent || "Password reset instructions sent to your email!");
      } else {
        toast.error(response.data.message || (t?.failedToSendResetEmail || "Failed to send reset email"));
      }
    } catch (error) {
      console.error('Error sending forgot password:', error);
      toast.error(error.response?.data?.message || (t?.failedToSendResetEmail || "Failed to send reset email"));
    }
  };

  const handleToggle2FA = async () => {
    try {
      const isCurrentlyEnabled = userData?.twoFactorEnabled || false;
      const response = await axios.post(`${API_BASE_URL}/api/user/toggle-2fa`, {
        enable: !isCurrentlyEnabled
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        setUserData(prev => ({ ...prev, twoFactorEnabled: !isCurrentlyEnabled }));
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      toast.error(error.response?.data?.message || (t?.failedToUpdate2FA || "Failed to update 2FA settings"));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { color: "bg-green-500", text: t?.verified || "Verified", icon: <FiCheck className="inline mr-1" /> },
      pending: { color: "bg-yellow-500", text: t?.pending || "Pending", icon: <FiAlertCircle className="inline mr-1" /> },
      not_started: { color: "bg-gray-500", text: t?.notStarted || "Not Started", icon: <FiX className="inline mr-1" /> },
      rejected: { color: "bg-red-500", text: t?.rejected || "Rejected", icon: <FiX className="inline mr-1" /> }
    };
    
    const config = statusConfig[status] || statusConfig.not_started;
    
    return (
      <span className={`px-2 py-1 rounded text-xs ${config.color} text-white flex items-center`}>
        {config.icon} {config.text}
      </span>
    );
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success(t?.copiedToClipboard || 'Copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex h-[calc(100vh-56px)]">
          <Sidebar sidebarOpen={sidebarOpen} />
          <div className="w-full flex items-center justify-center">
            <div className='w-full p-[20px] flex justify-center items-center'>
              <div className="relative w-24 h-24 flex justify-center items-center">
                <div className="absolute w-full h-full rounded-full border-4 border-transparent border-t-green-500 border-r-green-500 animate-spin"></div>
                <div className="w-20 h-20 rounded-full flex justify-center items-center font-bold text-lg">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className={`flex-1 overflow-auto transition-all duration-300`}>
          <div className="mx-auto w-full min-h-screen max-w-screen-xl md:px-[50px] px-[10px] pt-[60px] py-4"> 
            <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-64 bg-[#161616] h-auto rounded-[5px] border border-gray-800">
                <h2 className="text-lg font-semibold px-4 py-3 border-b border-gray-800">{t?.profile || "Profile"}</h2>
                <div className="flex flex-col">
                  <button 
                    onClick={() => setActiveTab("personal-info")}
                    className={`px-4 py-3 text-left cursor-pointer transition-colors ${
                      activeTab === "personal-info" 
                        ? "bg-[#1f1f1f] font-medium text-white" 
                        : "text-gray-300 hover:bg-[#1f1f1f]"
                    }`}
                  >
                    {t?.personalInfo || "Personal info"}
                  </button>
                  <button 
                    onClick={() => setActiveTab("login-security")}
                    className={`px-4 py-3 text-left cursor-pointer transition-colors ${
                      activeTab === "login-security" 
                        ? "bg-[#1f1f1f] font-medium text-white" 
                        : "text-gray-300 hover:bg-[#1f1f1f]"
                    }`}
                  >
                    {t?.loginSecurity || "Login & Security"}
                  </button>
                  <button 
                    onClick={() => setActiveTab("verification")}
                    className={`px-4 py-3 text-left cursor-pointer transition-colors ${
                      activeTab === "verification" 
                        ? "bg-[#1f1f1f] font-medium text-white" 
                        : "text-gray-300 hover:bg-[#1f1f1f]"
                    }`}
                  >
                    {t?.verification || "Verification"}
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-[#161616] border border-gray-800 rounded-md p-6">
                
                {/* Personal Info Tab */}
                {activeTab === "personal-info" && (
                  <>
                    <h2 className="text-xl font-semibold mb-6">{t?.personalInfo || "Personal info"}</h2>

                    {/* Username - Read Only */}
                    <div className="flex justify-between items-center py-4 border-b border-gray-800">
                      <div>
                        <p className="text-sm text-gray-400">{t?.username || "Username"}</p>
                        <p className="text-white flex items-center gap-2">
                          {userData?.username || 'N/A'} 
                          <FiCopy 
                            className="text-gray-400 cursor-pointer hover:text-white" 
                            onClick={() => copyToClipboard(userData?.username)}
                          />
                        </p>
                      </div>
                    </div>

                    {/* Player ID - Read Only */}
                    <div className="flex justify-between items-center py-4 border-b border-gray-800">
                      <div>
                        <p className="text-sm text-gray-400">{t?.playerId || "Player ID"}</p>
                        <p className="text-white flex items-center gap-2">
                          {userData?.player_id || 'N/A'}
                          <FiCopy 
                            className="text-gray-400 cursor-pointer hover:text-white" 
                            onClick={() => copyToClipboard(userData?.player_id)}
                          />
                        </p>
                      </div>
                    </div>

                    {/* Full Legal Name - Can only be updated once */}
                    <div className="py-4 border-b border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FiUser className="text-gray-400" />
                          <p className="text-sm text-gray-400">{t?.fullLegalName || "Full legal name"}</p>
                        </div>
                        {!isFullNameUpdated && !editingFields.fullName && (
                          <button 
                            onClick={() => setEditingFields(prev => ({ ...prev, fullName: true }))}
                            className="text-theme_color hover:text-theme_color/80 text-sm flex items-center gap-1"
                          >
                            <FiEdit className="text-sm" /> {t?.update || "Update"}
                          </button>
                        )}
                        {isFullNameUpdated && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FiLock className="text-xs" /> {t?.locked || "Locked"}
                          </span>
                        )}
                      </div>
                      
                      {editingFields.fullName ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            name="fullName"
                            value={personalInfoForm.fullName}
                            onChange={handlePersonalInfoChange}
                            className="w-full bg-[#222] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-theme_color"
                            placeholder={t?.enterFullName || "Enter your full name"}
                            disabled={isUpdating}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateFullName}
                              disabled={isUpdating}
                              className="bg-theme_color text-white px-3 py-1 rounded text-sm disabled:opacity-50 flex items-center gap-1"
                            >
                              <FiSave className="text-sm" /> {isUpdating ? (t?.saving || 'Saving...') : (t?.save || 'Save')}
                            </button>
                            <button
                              onClick={() => handleCancelEdit('fullName')}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <FiXCircle className="text-sm" /> {t?.cancel || "Cancel"}
                            </button>
                          </div>
                          <p className="text-xs text-yellow-500">{t?.updateOnceWarning || "⚠️ You can only update this once. Please ensure the name is correct."}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-white">{userData?.fullName || (t?.notSet || 'Not set')}</p>
                          {isFullNameUpdated && <FiLock className="text-gray-500 text-xs" />}
                        </div>
                      )}
                    </div>

                    {/* Date of Birth - Can only be updated once */}
                    <div className="py-4 border-b border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-gray-400" />
                          <p className="text-sm text-gray-400">{t?.dateOfBirth || "Date of birth"}</p>
                        </div>
                        {!isDOBUpdated && !editingFields.dateOfBirth && (
                          <button 
                            onClick={() => setEditingFields(prev => ({ ...prev, dateOfBirth: true }))}
                            className="text-theme_color hover:text-theme_color/80 text-sm flex items-center gap-1"
                          >
                            <FiEdit className="text-sm" /> {t?.update || "Update"}
                          </button>
                        )}
                        {isDOBUpdated && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FiLock className="text-xs" /> {t?.locked || "Locked"}
                          </span>
                        )}
                      </div>
                      
                      {editingFields.dateOfBirth ? (
                        <div className="space-y-2">
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={personalInfoForm.dateOfBirth}
                            onChange={handlePersonalInfoChange}
                            className="w-full bg-[#222] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-theme_color"
                            disabled={isUpdating}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateDOB}
                              disabled={isUpdating}
                              className="bg-theme_color text-white px-3 py-1 rounded text-sm disabled:opacity-50 flex items-center gap-1"
                            >
                              <FiSave className="text-sm" /> {isUpdating ? (t?.saving || 'Saving...') : (t?.save || 'Save')}
                            </button>
                            <button
                              onClick={() => handleCancelEdit('dateOfBirth')}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              <FiXCircle className="text-sm" /> {t?.cancel || "Cancel"}
                            </button>
                          </div>
                          <p className="text-xs text-yellow-500">{t?.updateOnceWarning || "⚠️ You can only update this once. Please ensure the date is correct."}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-white">{userData?.dateOfBirth ? new Date(userData.dateOfBirth).toLocaleDateString() : (t?.notSet || 'Not set')}</p>
                          {isDOBUpdated && <FiLock className="text-gray-500 text-xs" />}
                        </div>
                      )}
                    </div>

                    {/* Phone - Permanently Locked */}
                    <div className="py-4 border-b border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FiPhone className="text-gray-400" />
                        <p className="text-sm text-gray-400">{t?.phone || "Phone"}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-white flex items-center gap-2">
                          {userData?.phone || (t?.notSet || 'Not set')}
                          {userData?.phone && !userData?.isPhoneVerified && <FiAlertCircle className="text-orange-400" />}
                        </p>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FiLock className="text-xs" /> {t?.locked || "Locked"}
                        </span>
                      </div>
                      {!userData?.phone && (
                        <p className="text-xs text-gray-500 mt-1">{t?.phoneLockedPermanent || "Phone number cannot be changed once set."}</p>
                      )}
                    </div>

                    {/* Email with Separate Update - Can only be set once */}
                    <div className="py-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FiMail className="text-gray-400" />
                          <p className="text-sm text-gray-400">{t?.email || "Email"}</p>
                        </div>
                        {!emailUpdateForm.showForm && !isEmailUpdated ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-white mb-3">{userData?.email || (t?.notSet || 'Not set')}</p>
                            </div>
                            <button 
                              onClick={() => setEmailUpdateForm(prev => ({ ...prev, showForm: true, newEmail: userData?.email || '' }))}
                              className="text-theme_color hover:text-theme_color/80 text-sm flex items-center gap-1"
                            >
                              <FiEdit className="text-sm" /> {t?.addEmail || "Add Email"}
                            </button>
                            <p className="text-xs text-yellow-500 mt-1">{t?.emailOnceWarning || "⚠️ Email can only be set once. Please ensure it's correct."}</p>
                          </>
                        ) : !isEmailUpdated && emailUpdateForm.showForm ? (
                          <div className="mt-2 space-y-3">
                            <input
                              type="email"
                              name="newEmail"
                              value={emailUpdateForm.newEmail}
                              onChange={handleEmailUpdateChange}
                              className="w-full bg-[#222] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-theme_color"
                              placeholder={t?.enterEmail || "Enter email address"}
                            />
                            {emailUpdateForm.step === "verify" && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  name="otp"
                                  value={emailUpdateForm.otp}
                                  onChange={handleEmailUpdateChange}
                                  className="flex-1 bg-[#222] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-theme_color"
                                  placeholder={t?.enterOTP || "Enter verification code"}
                                />
                                <button
                                  onClick={handleVerifyEmailOTP}
                                  disabled={isVerifyingOTP}
                                  className="bg-theme_color text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                                >
                                  {isVerifyingOTP ? (t?.verifying || "Verifying...") : (t?.verify || "Verify")}
                                </button>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={handleSendEmailOTP}
                                disabled={isSendingOTP}
                                className="bg-theme_color text-white px-4 py-2 rounded text-sm disabled:opacity-50 flex items-center gap-1"
                              >
                                {isSendingOTP ? (t?.sending || "Sending...") : (t?.sendOTP || "Send OTP")}
                                <FiSend />
                              </button>
                              <button
                                onClick={() => setEmailUpdateForm({ newEmail: "", otp: "", step: "request", showForm: false })}
                                className="bg-gray-600 text-white px-4 py-2 rounded text-sm"
                              >
                                {t?.cancel || "Cancel"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Email already set - locked view
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="text-white flex items-center gap-2">
                                {userData?.email || (t?.notSet || 'Not set')}
                                {userData?.email && !userData?.isEmailVerified && <FiAlertCircle className="text-orange-400" />}
                              </p>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <FiLock className="text-xs" /> {t?.locked || "Locked"}
                              </span>
                            </div>
                            {userData?.email && !userData?.isEmailVerified && (
                              <>
                                <button 
                                  onClick={handleEmailVerificationRequest}
                                  className="mt-2 text-yellow-500 hover:text-yellow-400 text-sm flex items-center gap-1"
                                >
                                  <FiMail /> {t?.verifyEmailNow || "Verify Email Now"}
                                </button>
                                <button 
                                  onClick={handleResendVerificationEmail}
                                  className="mt-2 text-blue-500 hover:text-blue-400 text-sm flex items-center gap-1 ml-4"
                                >
                                  <FiRefreshCw /> {t?.resendCode || "Resend Code"}
                                </button>
                              </>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{t?.emailLockedPermanent || "Email cannot be changed once set."}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Login & Security Tab */}
                {activeTab === "login-security" && (
                  <>
                    <h2 className="text-xl font-semibold mb-6">{t?.loginSecurity || "Login & Security"}</h2>

                    <div className="mb-8">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <FiKey className="text-theme_color" /> {t?.changePassword || "Change Password"}
                      </h3>
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="relative">
                          <label className="block text-sm text-gray-400 mb-2">{t?.currentPassword || "Current Password"}</label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordChange}
                              className="w-full bg-[#222] border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-theme_color"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-white"
                            >
                              {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-sm text-gray-400 mb-2">{t?.newPassword || "New Password"}</label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              className="w-full bg-[#222] border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-theme_color"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-white"
                            >
                              {showNewPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-sm text-gray-400 mb-2">{t?.confirmNewPassword || "Confirm New Password"}</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              className="w-full bg-[#222] border border-gray-700 rounded px-4 py-3 text-white focus:outline-none focus:border-theme_color"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-gray-400 hover:text-white"
                            >
                              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="bg-theme_color text-white px-6 py-3 rounded hover:bg-theme_color/80 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? (t?.updating || "Updating...") : (t?.changePassword || "Change Password")}
                        </button>
                      </form>
                    </div>
                  </>
                )}

                {/* Verification Tab */}
                {activeTab === "verification" && (
                  <>
                    <h2 className="text-xl font-semibold mb-6">{t?.verification || "Verification"}</h2>
                    <p className="text-gray-400 mb-6">
                      {t?.verificationDescription || "Complete your verification to access all features and increase your limits."}
                    </p>

                    <div className="space-y-4">
                      {/* Email Verification */}
                      <div className="bg-[#222] rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <FiMail className="text-gray-400 text-lg" />
                            <span className="text-white">{t?.emailVerification || "Email Verification"}</span>
                          </div>
                          {getStatusBadge(verificationStatus.email)}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {t?.emailVerificationDesc || "Verify your email address to receive important notifications and updates."}
                        </p>
                        {verificationStatus.email === "not_started" && userData?.email && (
                          <button 
                            onClick={handleEmailVerificationRequest}
                            className="bg-theme_color text-white px-4 py-2 rounded text-sm hover:bg-theme_color/80"
                          >
                            {t?.verifyEmail || "Verify Email"}
                          </button>
                        )}
                        {verificationStatus.email === "pending" && (
                          <div>
                            <p className="text-yellow-400 text-sm mb-2">{t?.verificationEmailSent || "Verification email sent. Please check your inbox."}</p>
                            <button 
                              onClick={handleResendVerificationEmail}
                              className="bg-theme_color text-white px-4 py-2 rounded text-sm hover:bg-theme_color/80"
                            >
                              {t?.resendCode || "Resend Code"}
                            </button>
                          </div>
                        )}
                        {verificationStatus.email === "verified" && (
                          <p className="text-green-400 text-sm">{t?.emailVerified || "Your email has been verified!"}</p>
                        )}
                        {!userData?.email && (
                          <p className="text-orange-400 text-sm">{t?.addEmailFirst || "Please add your email address in Personal Info first."}</p>
                        )}
                      </div>

                      {/* Phone Verification */}
                      <div className="bg-[#222] rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-3">
                            <FiPhone className="text-gray-400 text-lg" />
                            <span className="text-white">{t?.phoneVerification || "Phone Verification"}</span>
                          </div>
                          {getStatusBadge(verificationStatus.phone)}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">
                          {t?.phoneVerificationDesc || "Verify your phone number for additional security and faster withdrawals."}
                        </p>
                        {!userData?.phone ? (
                          <p className="text-orange-400 text-sm mb-2">{t?.addPhoneFirst || "Please add your phone number in Personal Info first."}</p>
                        ) : verificationStatus.phone === "not_started" ? (
                          <button 
                            onClick={handlePhoneVerificationRequest}
                            className="bg-theme_color text-white px-4 py-2 rounded text-sm hover:bg-theme_color/80"
                          >
                            {t?.verifyPhone || "Verify Phone"}
                          </button>
                        ) : verificationStatus.phone === "pending" ? (
                          <div>
                            <p className="text-yellow-400 text-sm mb-2">{t?.verificationSmsSent || "Verification SMS sent. Please check your phone."}</p>
                            <button 
                              onClick={handlePhoneVerificationRequest}
                              className="bg-theme_color text-white px-4 py-2 rounded text-sm hover:bg-theme_color/80"
                            >
                              {t?.resendCode || "Resend Code"}
                            </button>
                          </div>
                        ) : (
                          <p className="text-green-400 text-sm">{t?.phoneVerified || "Your phone number has been verified!"}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Profile;