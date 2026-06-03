import React, { useState, useEffect, useContext, useRef } from "react";
import { Header } from "../../components/header/Header";
import Sidebar from "../../components/sidebar/Sidebar";
import Footer from "../../components/footer/Footer";
import axios from "axios";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { LanguageContext } from "../../context/LanguageContext";

// ── Defined OUTSIDE Withdraw so React never remounts them on parent re-render ──

const FileUploadField = ({ label, required, fieldKey, progress, fileName, onFileChange, languageCode }) => (
  <div>
    <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
      {label}
      {required && <span className="text-[#ff6b6b] ml-1">*</span>}
    </label>
    <div className="relative">
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
        className="w-full bg-[#1f2525] border border-[#2a2f2f] rounded-lg p-2 md:p-3 text-sm md:text-base text-[#8a9ba8] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#2a5c45] file:text-white hover:file:bg-[#3a6c55] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3a8a6f]"
        onChange={(e) => onFileChange(fieldKey, e.target.files[0])}
      />
    </div>

    {fileName && (
      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#8a9ba8] truncate max-w-[70%]" title={fileName}>
           {fileName}
          </span>
          <span className={`text-xs font-semibold ${progress === 100 ? "text-[#4ecdc4]" : "text-[#e6db74]"}`}>
            {progress === 100 ? (languageCode === 'bn' ? " সম্পন্ন" : "✓ Done") : `${progress}%`}
          </span>
        </div>
        <div className="w-full bg-[#1a1f1f] rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-out ${
              progress === 100
                ? "bg-gradient-to-r from-[#3a8a6f] to-[#4ecdc4]"
                : "bg-gradient-to-r from-[#2a5c45] to-[#e6db74]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )}

    {fieldKey === "documentFront" && (
      <p className="text-xs text-[#8a9ba8] mt-1">
        {languageCode === 'bn'
          ? "অনুমোদিত ফরম্যাট: JPEG, PNG, GIF, PDF (সর্বোচ্চ 5MB)"
          : "Allowed formats: JPEG, PNG, GIF, PDF (Max 5MB)"}
      </p>
    )}
  </div>
);

const KycFormBody = ({
  isResubmit,
  kycError,
  kycSuccess,
  kycUploading,
  overallUploadProgress,
  kycFormData,
  uploadProgressFront,
  frontFileName,
  uploadProgressBack,
  backFileName,
  onInputChange,
  onFileChange,
  onSubmit,
  languageCode,
}) => (
  <div className="p-4 md:p-6">
    {kycError && (
      <div className="bg-[#2a1f1f] border border-[#ff6b6b] text-[#ff6b6b] p-3 rounded-lg text-sm mb-4">
        {kycError}
      </div>
    )}
    {kycSuccess && (
      <div className="bg-[#1a2525] border border-[#4ecdc4] text-[#4ecdc4] p-3 rounded-lg text-sm mb-4">
        {kycSuccess}
      </div>
    )}

    {kycUploading && (
      <div className="mb-4 p-3 bg-[#1f2525] rounded-lg border border-[#2a3535]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#8a9ba8]">
            {languageCode === 'bn' ? "আপলোড হচ্ছে..." : "Uploading to server..."}
          </span>
          <span className="text-xs font-semibold text-[#4ecdc4]">{overallUploadProgress}%</span>
        </div>
        <div className="w-full bg-[#1a1f1f] rounded-full h-2.5 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-[#2a5c45] via-[#3a8a6f] to-[#4ecdc4] transition-all duration-300 ease-out"
            style={{ width: `${overallUploadProgress}%` }}
          />
        </div>
        <p className="text-xs text-[#5a6b78] mt-1">
          {languageCode === 'bn' ? "অনুগ্রহ করে পেজ বন্ধ করবেন না" : "Please do not close this page"}
        </p>
      </div>
    )}

    <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
          {languageCode === 'bn' ? "পূর্ণ নাম" : "Full Name"}
          <span className="text-[#ff6b6b] ml-1">*</span>
        </label>
        <input
          type="text"
          className="w-full bg-[#1f2525] border border-[#2a2f2f] rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f]"
          placeholder={languageCode === 'bn' ? "আপনার পূর্ণ নাম লিখুন" : "Enter your full name"}
          value={kycFormData.fullName}
          onChange={(e) => onInputChange("fullName", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
          {languageCode === 'bn' ? "ডকুমেন্ট টাইপ" : "Document Type"}
          <span className="text-[#ff6b6b] ml-1">*</span>
        </label>
        <select
          className="w-full bg-[#1f2525] border border-[#2a2f2f] rounded-lg p-3 md:p-4 text-sm md:text-base text-white focus:outline-none focus:ring-2 focus:ring-[#3a8a6f]"
          value={kycFormData.documentType}
          onChange={(e) => onInputChange("documentType", e.target.value)}
        >
          <option value="nid">{languageCode === 'bn' ? "জাতীয় পরিচয় পত্র" : "National ID Card"}</option>
          <option value="passport">{languageCode === 'bn' ? "পাসপোর্ট" : "Passport"}</option>
          <option value="driving_license">{languageCode === 'bn' ? "ড্রাইভিং লাইসেন্স" : "Driving License"}</option>
          <option value="birth_certificate">{languageCode === 'bn' ? "জন্ম নিবন্ধন" : "Birth Certificate"}</option>
        </select>
      </div>

      <FileUploadField
        label={languageCode === 'bn' ? "ডকুমেন্টের সামনের অংশ" : "Document Front"}
        required={true}
        fieldKey="documentFront"
        progress={uploadProgressFront}
        fileName={frontFileName}
        onFileChange={onFileChange}
        languageCode={languageCode}
      />

      <FileUploadField
        label={languageCode === 'bn' ? "ডকুমেন্টের পিছনের অংশ" : "Document Back (Optional)"}
        required={false}
        fieldKey="documentBack"
        progress={uploadProgressBack}
        fileName={backFileName}
        onFileChange={onFileChange}
        languageCode={languageCode}
      />

      <button
        type="submit"
        disabled={kycUploading}
        className="w-full bg-gradient-to-r from-[#2a5c45] to-[#3a6c55] hover:from-[#3a6c55] hover:to-[#4a7c65] py-3 md:py-4 rounded-lg text-sm md:text-base text-white font-medium flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {kycUploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {languageCode === 'bn' ? "জমা দেওয়া হচ্ছে..." : "Submitting..."}
          </>
        ) : (
          isResubmit
            ? (languageCode === 'bn' ? "পুনরায় KYC জমা দিন" : "Resubmit KYC")
            : (languageCode === 'bn' ? "KYC জমা দিন" : "Submit KYC")
        )}
      </button>
    </form>
  </div>
);

const Withdraw = () => {
  const { t, language } = useContext(LanguageContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMethod, setActiveMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [withdrawMethods, setWithdrawMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [wageringInfo, setWageringInfo] = useState({
    required: 0,
    completed: 0,
    remaining: 0,
    isCompleted: true
  });
 console.log("userData",userData)
  // KYC Related States
  const [kycStatus, setKycStatus] = useState(null);
  const [kycData, setKycData] = useState(null);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycFormData, setKycFormData] = useState({
    fullName: "",
    documentType: "nid",
    documentFront: null,
    documentBack: null
  });
  const [kycUploading, setKycUploading] = useState(false);
  const [kycError, setKycError] = useState(null);
  const [kycSuccess, setKycSuccess] = useState(null);

  // ── NEW: upload progress states ──
  const [uploadProgressFront, setUploadProgressFront] = useState(0);
  const [uploadProgressBack, setUploadProgressBack] = useState(0);
  const [frontFileName, setFrontFileName] = useState("");
  const [backFileName, setBackFileName] = useState("");
  const [overallUploadProgress, setOverallUploadProgress] = useState(0);

  // Method-specific form fields
  const [formData, setFormData] = useState({
    // bKash fields
    bkashPhoneNumber: "",
    
    // Rocket fields
    rocketPhoneNumber: "",
    
    // Nagad fields
    nagadPhoneNumber: "",
    
    // Bank fields
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    branchName: "",
    district: "",
    routingNumber: "",
    accountType:"personal"
  });

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const quickAmounts = [300, 500, 1000, 2000, 5000];
  const MIN_WITHDRAW_AMOUNT = 300;

  // Check if KYC is required (assignkyc is "assigned" and kycStatus is "pending" or "rejected" or "processing")
  const isKycRequired = () => {
    if (!userData) return false;
    return (
      userData.assignkyc === "assigned" &&
      (userData.kycStatus === "pending" ||
        userData.kycStatus === "rejected" ||
        userData.kycStatus === "processing")
    );
  };

  // Check if KYC is in processing state (submitted, waiting admin approval)
  const isKycProcessing = () => {
    if (!userData) return false;
    return userData.assignkyc === "assigned" && userData.kycStatus === "processing";
  };

  // Get KYC status message
  const getKycStatusMessage = () => {
    if (!userData) return "";
    if (userData.kycStatus === "pending") {
      return language.code === 'bn' 
        ? "আপনার KYC আবেদন প্রক্রিয়াধীন রয়েছে। অনুগ্রহ করে অনুমোদনের জন্য অপেক্ষা করুন।"
        : "Your KYC application is pending. Please wait for approval.";
    }
    if (userData.kycStatus === "rejected") {
      return language.code === 'bn'
        ? "আপনার KYC আবেদন প্রত্যাখ্যান করা হয়েছে। অনুগ্রহ করে সঠিক তথ্য সহ পুনরায় জমা দিন।"
        : "Your KYC application has been rejected. Please resubmit with correct information.";
    }
    return "";
  };

  // Fetch user's KYC status
  const fetchKycStatus = async () => {
    try {
      const token = localStorage.getItem("usertoken");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/user/kyc/my-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setKycStatus(response.data.data);
        if (response.data.data.status === 'rejected' && response.data.data.canResubmit) {
          setShowKycForm(true);
        }
      }
    } catch (err) {
      console.error("Error fetching KYC status:", err);
    }
  };

  // Fetch KYC details for resubmission
  const fetchKycDetails = async () => {
    try {
      const token = localStorage.getItem("usertoken");
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/api/user/kyc/my-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setKycData(response.data.data);
        setKycFormData(prev => ({
          ...prev,
          fullName: response.data.data.fullName || "",
          documentType: response.data.data.documentType || "nid"
        }));
      }
    } catch (err) {
      console.error("Error fetching KYC details:", err);
    }
  };

  // Handle KYC form input changes
  const handleKycInputChange = (field, value) => {
    setKycFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setKycError(null);
  };

  // ── UPDATED: Handle KYC file upload with fake progress simulation ──
  const handleKycFileChange = (field, file) => {
    if (!file) return;
    setKycFormData(prev => ({ ...prev, [field]: file }));
    setKycError(null);

    const isFront = field === "documentFront";
    const setProgress = isFront ? setUploadProgressFront : setUploadProgressBack;
    const setName = isFront ? setFrontFileName : setBackFileName;

    setName(file.name);
    setProgress(0);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setProgress(progress);
    }, 120);
  };

  // Submit KYC application
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!kycFormData.fullName.trim()) {
      setKycError(language.code === 'bn' ? "পূর্ণ নাম প্রয়োজন" : "Full name is required");
      return;
    }
    if (!kycFormData.documentFront) {
      setKycError(language.code === 'bn' ? "ডকুমেন্টের সামনের অংশ প্রয়োজন" : "Document front is required");
      return;
    }
    
    setKycUploading(true);
    setKycError(null);
    setKycSuccess(null);
    setOverallUploadProgress(0);
    
    try {
      const token = localStorage.getItem("usertoken");
      const formDataToSend = new FormData();
      formDataToSend.append("fullName", kycFormData.fullName);
      formDataToSend.append("documentType", kycFormData.documentType);
      formDataToSend.append("documentFront", kycFormData.documentFront);
      if (kycFormData.documentBack) {
        formDataToSend.append("documentBack", kycFormData.documentBack);
      }
      
      let response;
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setOverallUploadProgress(percent);
        }
      };

      // If kycStatus is "rejected" → use resubmit route, otherwise use submit route
      if (userData?.kycStatus === 'rejected') {
        response = await axios.post(`${API_BASE_URL}/api/user/kyc/resubmit`, formDataToSend, config);
      } else {
        response = await axios.post(`${API_BASE_URL}/api/user/kyc/submit`, formDataToSend, config);
      }
      
      if (response.data.success) {
        setOverallUploadProgress(100);
        setKycSuccess(response.data.message);
        setShowKycForm(false);
        
        // Refresh user data
        const user = JSON.parse(localStorage.getItem("user"));
        const userResponse = await axios.get(
          `${API_BASE_URL}/api/user/all-information/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (userResponse.data.success) {
          setUserData(userResponse.data.data);
        }
        
        // Refresh KYC status
        await fetchKycStatus();
        
        // Reset form
        setKycFormData({
          fullName: "",
          documentType: "nid",
          documentFront: null,
          documentBack: null
        });
        setUploadProgressFront(0);
        setUploadProgressBack(0);
        setFrontFileName("");
        setBackFileName("");
        setOverallUploadProgress(0);
      } else {
        setKycError(response.data.message);
      }
    } catch (err) {
      console.error("KYC submission error:", err);
      setKycError(err.response?.data?.message || (language.code === 'bn' ? "KYC জমা দিতে ব্যর্থ হয়েছে" : "Failed to submit KYC"));
    } finally {
      setKycUploading(false);
    }
  };

  // Get translated labels based on language
  const getMethodLabels = (methodName) => {
    const labels = {
      bkash: {
        phoneLabel: language.code === 'bn' ? "আপনার বিকাশ নাম্বার লিখুন" : "Enter your bKash number",
        phonePlaceholder: "01XXXXXXXXX"
      },
      rocket: {
        phoneLabel: language.code === 'bn' ? "আপনার রকেট নাম্বার লিখুন" : "Enter your Rocket number",
        phonePlaceholder: "01XXXXXXXXX"
      },
      nagad: {
        phoneLabel: language.code === 'bn' ? "আপনার নগদ নাম্বার লিখুন" : "Enter your Nagad number",
        phonePlaceholder: "01XXXXXXXXX"
      },
      bank: {
        bankName: language.code === 'bn' ? "ব্যাংক নাম লিখুন" : "Bank Name",
        bankPlaceholder: language.code === 'bn' ? "যেমন: Sonali Bank, Dutch-Bangla Bank" : "e.g., Sonali Bank, Dutch-Bangla Bank",
        accountHolder: language.code === 'bn' ? "একাউন্ট হোল্ডার নাম লিখুন" : "Account Holder Name",
        accountHolderPlaceholder: language.code === 'bn' ? "আপনার একাউন্টের নাম" : "Your account name",
        accountNumber: language.code === 'bn' ? "একাউন্ট নাম্বার লিখুন" : "Account Number",
        accountNumberPlaceholder: language.code === 'bn' ? "আপনার ব্যাংক একাউন্ট নাম্বার" : "Your bank account number",
        branchName: language.code === 'bn' ? "ব্রাঞ্চ নাম লিখুন" : "Branch Name",
        branchPlaceholder: language.code === 'bn' ? "ব্যাংকের শাখার নাম" : "Bank branch name",
        district: language.code === 'bn' ? "জেলা লিখুন" : "District",
        districtPlaceholder: language.code === 'bn' ? "আপনার জেলার নাম" : "Your district",
        routingNumber: language.code === 'bn' ? "রাউটিং নাম্বার দিন" : "Routing Number",
        routingPlaceholder: language.code === 'bn' ? "৯ ডিজিটের রাউটিং নাম্বার" : "9-digit routing number"
      }
    };
    return labels[methodName] || {};
  };

  // Fetch withdraw methods
  useEffect(() => {
    const fetchWithdrawMethods = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/withdraw-methods`);
        if (response.data.success && response.data.method) {
          setWithdrawMethods(response.data.method);
          if (response.data.method.length > 0) {
            setActiveMethod(response.data.method[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching withdraw methods:", err);
        setError(t.failedToFetchTransactions || "Failed to load withdraw methods");
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchWithdrawMethods();
  }, [API_BASE_URL, t]);

  // Calculate wagering requirements
  const calculateWageringRequirements = (userData) => {
    if (!userData) return { required: 0, completed: 0, remaining: 0, isCompleted: true };
    
    const depositAmount = parseFloat(userData.depositamount) || 0;
    const wageringNeed = parseFloat(userData.waigeringneed) || 0;
    const totalBet = parseFloat(userData.total_bet) || 0;
    
    if (depositAmount > 0 && wageringNeed === 0) {
      const requiredWager = depositAmount * 1.1;
      const remainingWager = Math.max(0, requiredWager - totalBet);
      const isCompleted = remainingWager <= 0;
      
      return {
        required: requiredWager,
        completed: totalBet,
        remaining: remainingWager,
        isCompleted: isCompleted,
        isSpecialCase: true
      };
    }
    
    const requiredWager = depositAmount * wageringNeed;
    const remainingWager = Math.max(0, requiredWager - totalBet);
    const isCompleted = remainingWager <= 0;
    
    return {
      required: requiredWager,
      completed: totalBet,
      remaining: remainingWager,
      isCompleted: isCompleted,
      isSpecialCase: false
    };
  };

  // Check if user has active bonus wagering requirements
  const checkBonusWagering = (userData) => {
    if (!userData?.bonusInfo?.activeBonuses || userData.bonusInfo.activeBonuses.length === 0) {
      return { hasActiveBonus: false, totalWagerRequired: 0, totalWagered: 0, remaining: 0 };
    }
    
    let totalWagerRequired = 0;
    let totalWagered = 0;
    
    userData.bonusInfo.activeBonuses.forEach(bonus => {
      const bonusAmount = parseFloat(bonus.originalAmount || bonus.amount) || 0;
      const wageringRequirement = parseFloat(bonus.wageringRequirement) || 0;
      const amountWagered = parseFloat(bonus.amountWagered) || 0;
      
      totalWagerRequired += bonusAmount * wageringRequirement;
      totalWagered += amountWagered;
    });
    
    return {
      hasActiveBonus: true,
      totalWagerRequired: totalWagerRequired,
      totalWagered: totalWagered,
      remaining: Math.max(0, totalWagerRequired - totalWagered)
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("usertoken");

        if (!token) {
          setError(t.authenticationRequired || "Authentication token not found");
          setLoading(false);
          return;
        }

        const userResponse = await axios.get(
          `${API_BASE_URL}/api/user/all-information/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (userResponse.data.success) {
          const userData = userResponse.data.data;
          setUserData(userData);
          
          const wageringReq = calculateWageringRequirements(userData);
          setWageringInfo(wageringReq);
        } else {
          setError(userResponse.data.message);
        }

        try {
          const historyResponse = await axios.get(
            `${API_BASE_URL}/api/user/withdraw/history/${user.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (historyResponse.data.success) {
            setWithdrawalHistory(historyResponse.data.data);
          }
        } catch (historyError) {
          console.error("Error fetching withdrawal history:", historyError);
          setWithdrawalHistory([]);
        }

        // Fetch KYC status
        await fetchKycStatus();
        await fetchKycDetails();
        
      } catch (err) {
        setError(t.failedToFetchUserData || "Failed to fetch user data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, t]);

  const getPaymentInstructions = (method) => {
    if (!method) return [];
    
    const baseInstructions = [
      {
        step: language.code === 'bn' ? "অ্যাকাউন্ট প্রস্তুত করুন" : "Prepare Account",
        description: language.code === 'bn' 
          ? `আপনার ${method.gatewayName} অ্যাকাউন্ট সক্রিয় এবং যাচাইকৃত আছে কিনা নিশ্চিত করুন।`
          : `Ensure your ${method.gatewayName} account is active and verified.`,
      },
      {
        step: language.code === 'bn' ? "তথ্য প্রদান করুন" : "Enter Details",
        description: language.code === 'bn'
          ? `আপনার ${method.gatewayName} অ্যাকাউন্টের তথ্য সঠিকভাবে প্রদান করুন।`
          : `Provide your ${method.gatewayName} account details correctly.`,
      },
      { 
        step: language.code === 'bn' ? "পরিমাণ লিখুন" : "Enter Amount", 
        description: language.code === 'bn'
          ? `উত্তোলনের পরিমাণ লিখুন (ন্যূনতম: ৳${MIN_WITHDRAW_AMOUNT}, সর্বোচ্চ: ৳${method.maxAmount})`
          : `Input the withdrawal amount (Min: ৳${MIN_WITHDRAW_AMOUNT}, Max: ৳${method.maxAmount}).`
      },
      {
        step: language.code === 'bn' ? "চার্জ যাচাই করুন" : "Review Charges",
        description: language.code === 'bn'
          ? `নোট: ${method.fixedCharge}৳ নির্ধারিত + ${method.percentCharge}% চার্জ প্রযোজ্য হবে।`
          : `Note: ${method.fixedCharge}৳ fixed + ${method.percentCharge}% charge will be applied.`,
      },
      {
        step: language.code === 'bn' ? "অনুরোধ জমা দিন" : "Submit Request",
        description: language.code === 'bn'
          ? "আপনার উত্তোলন অনুরোধ প্রক্রিয়াকরণের জন্য জমা দিন।"
          : "Submit your withdrawal request for processing.",
      },
    ];

    return baseInstructions;
  };

  // Calculate charges and final amount
  const calculateCharges = () => {
    if (!amount || !activeMethod) return { charge: 0, finalAmount: 0, youWillGet: 0 };
    
    const amountNum = parseFloat(amount);
    const fixedCharge = parseFloat(activeMethod.fixedCharge) || 0;
    const percentCharge = parseFloat(activeMethod.percentCharge) || 0;
    
    const percentAmount = (amountNum * percentCharge) / 100;
    const totalCharge = fixedCharge + percentAmount;
    const finalAmount = amountNum - totalCharge;
    const youWillGet = amountNum - totalCharge;
    
    return {
      charge: totalCharge,
      finalAmount: finalAmount,
      youWillGet: youWillGet,
      fixedCharge,
      percentCharge: percentAmount
    };
  };

  const charges = calculateCharges();

  // Get current method's form data
  const getCurrentMethodData = () => {
    if (!activeMethod) return {};
    
    switch(activeMethod.gatewayName?.toLowerCase()) {
      case "bkash":
        return {
          phoneNumber: formData.bkashPhoneNumber
        };
      case "rocket":
        return {
          phoneNumber: formData.rocketPhoneNumber
        };
      case "nagad":
        return {
          phoneNumber: formData.nagadPhoneNumber
        };
      case "bank":
        return {
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          branchName: formData.branchName,
          district: formData.district,
          routingNumber: formData.routingNumber
        };
      default:
        return {};
    }
  };

  const validateForm = () => {
    const errors = {};
    const currentData = getCurrentMethodData();

    if (!activeMethod) {
      errors.method = language.code === 'bn' ? "পেমেন্ট মেথড নির্বাচন করুন" : "Please select a payment method";
    }

    // Check wagering requirements
    if (userData?.depositamount && userData?.depositamount > 0) {
      const wageringReq = calculateWageringRequirements(userData);
      if (!wageringReq.isCompleted) {
        if (wageringReq.isSpecialCase) {
          errors.wagering = language.code === 'bn'
            ? `উত্তোলনের আগে আরও ৳${wageringReq.remaining.toLocaleString()} বাজি রাখতে হবে। প্রয়োজন: ১.১x ডিপোজিট (৳${wageringReq.required.toLocaleString()}), বাজি রাখা হয়েছে: ৳${wageringReq.completed.toLocaleString()}`
            : `You need to wager ৳${wageringReq.remaining.toLocaleString()} more before withdrawing. Required: 1.1x deposit (৳${wageringReq.required.toLocaleString()}), Wagered: ৳${wageringReq.completed.toLocaleString()}`;
        } else {
          errors.wagering = language.code === 'bn'
            ? `উত্তোলনের আগে আরও ৳${wageringReq.remaining.toLocaleString()} বাজি রাখতে হবে। প্রয়োজন: ৳${wageringReq.required.toLocaleString()}, বাজি রাখা হয়েছে: ৳${wageringReq.completed.toLocaleString()}`
            : `You need to wager ৳${wageringReq.remaining.toLocaleString()} more before withdrawing. Required: ৳${wageringReq.required.toLocaleString()}, Wagered: ৳${wageringReq.completed.toLocaleString()}`;
        }
      }
    }

    // Check bonus wagering requirements
    const bonusWagering = checkBonusWagering(userData);
    if (bonusWagering.hasActiveBonus && bonusWagering.remaining > 0) {
      errors.bonusWagering = language.code === 'bn'
        ? `আপনার সক্রিয় বোনাস ওয়েজারিং প্রয়োজনীয়তা রয়েছে। আরও ৳${bonusWagering.remaining.toLocaleString()} বাজি রাখতে হবে (৳${bonusWagering.totalWagered.toLocaleString()}/${bonusWagering.totalWagerRequired.toLocaleString()})`
        : `You have active bonus wagering requirements. Need to wager ৳${bonusWagering.remaining.toLocaleString()} more (৳${bonusWagering.totalWagered.toLocaleString()}/${bonusWagering.totalWagerRequired.toLocaleString()})`;
    }

    // Validate based on method
    if (activeMethod) {
      const methodName = activeMethod.gatewayName?.toLowerCase();
      
      if (methodName === "bkash") {
        if (!currentData.phoneNumber) {
          errors.phoneNumber = language.code === 'bn' ? "বিকাশ নাম্বার প্রয়োজন" : "bKash number is required";
        } else if (!/^(01[3-9]\d{8})$/.test(currentData.phoneNumber)) {
          errors.phoneNumber = language.code === 'bn' ? "সঠিক বিকাশ নাম্বার দিন (01XXXXXXXXX)" : "Enter valid bKash number (01XXXXXXXXX)";
        }
      } else if (methodName === "rocket") {
        if (!currentData.phoneNumber) {
          errors.phoneNumber = language.code === 'bn' ? "রকেট নাম্বার প্রয়োজন" : "Rocket number is required";
        } else if (!/^(01[3-9]\d{8})$/.test(currentData.phoneNumber)) {
          errors.phoneNumber = language.code === 'bn' ? "সঠিক রকেট নাম্বার দিন (01XXXXXXXXX)" : "Enter valid Rocket number (01XXXXXXXXX)";
        }
      } else if (methodName === "nagad") {
        if (!currentData.phoneNumber) {
          errors.phoneNumber = language.code === 'bn' ? "নগদ নাম্বার প্রয়োজন" : "Nagad number is required";
        } else if (!/^(01[3-9]\d{8})$/.test(currentData.phoneNumber)) {
          errors.phoneNumber = language.code === 'bn' ? "সঠিক নগদ নাম্বার দিন (01XXXXXXXXX)" : "Enter valid Nagad number (01XXXXXXXXX)";
        }
      } else if (methodName === "bank") {
        if (!currentData.bankName) errors.bankName = language.code === 'bn' ? "ব্যাংকের নাম প্রয়োজন" : "Bank name is required";
        if (!currentData.accountHolderName) errors.accountHolderName = language.code === 'bn' ? "একাউন্ট হোল্ডারের নাম প্রয়োজন" : "Account holder name is required";
        if (!currentData.accountNumber) errors.accountNumber = language.code === 'bn' ? "একাউন্ট নাম্বার প্রয়োজন" : "Account number is required";
        if (!currentData.branchName) errors.branchName = language.code === 'bn' ? "ব্রাঞ্চের নাম প্রয়োজন" : "Branch name is required";
        if (!currentData.district) errors.district = language.code === 'bn' ? "জেলা প্রয়োজন" : "District is required";
        if (!currentData.routingNumber) errors.routingNumber = language.code === 'bn' ? "রাউটিং নাম্বার প্রয়োজন" : "Routing number is required";
        if (currentData.routingNumber && !/^\d{9}$/.test(currentData.routingNumber)) {
          errors.routingNumber = language.code === 'bn' ? "রাউটিং নাম্বার ৯ ডিজিট হতে হবে" : "Routing number must be 9 digits";
        }
      }
    }

    // Amount validation
    if (!amount) {
      errors.amount = language.code === 'bn' ? "পরিমাণ প্রয়োজন" : "Amount is required";
    } else if (parseFloat(amount) < MIN_WITHDRAW_AMOUNT) {
      errors.amount = language.code === 'bn'
        ? `ন্যূনতম উত্তোলনের পরিমাণ ৳${MIN_WITHDRAW_AMOUNT}`
        : `Minimum withdrawal amount is ৳${MIN_WITHDRAW_AMOUNT}`;
    } else if (parseFloat(amount) > parseFloat(activeMethod?.maxAmount || 30000)) {
      errors.amount = language.code === 'bn'
        ? `সর্বোচ্চ উত্তোলনের পরিমাণ ৳${activeMethod?.maxAmount || 30000}`
        : `Maximum withdrawal amount is ৳${activeMethod?.maxAmount || 30000}`;
    } else if (parseFloat(amount) > (userData?.balance || 0)) {
      errors.amount = language.code === 'bn'
        ? "পর্যাপ্ত ব্যালেন্স নেই"
        : "Insufficient balance for this withdrawal";
    } else if (!/^\d+$/.test(amount)) {
      errors.amount = language.code === 'bn'
        ? "পরিমাণ অবশ্যই পূর্ণ সংখ্যা হতে হবে"
        : "Amount must be a whole number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsProcessing(true);
    setTransactionStatus(null);

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("usertoken");
      const currentData = getCurrentMethodData();
      const methodName = activeMethod.gatewayName?.toLowerCase();

      let payload = {
        method: methodName,
        amount: parseFloat(amount)
      };

      if (methodName === "bkash") {
        payload.phoneNumber = currentData.phoneNumber;
      } else if (methodName === "rocket" || methodName === "nagad") {
        payload.phoneNumber = currentData.phoneNumber;
      } else if (methodName === "bank") {
        payload.bankName = currentData.bankName;
        payload.accountHolderName = currentData.accountHolderName;
        payload.accountNumber = currentData.accountNumber;
        payload.branchName = currentData.branchName;
        payload.district = currentData.district;
        payload.routingNumber = currentData.routingNumber;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/user/withdraw`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setTransactionStatus({
          success: true,
          message: response.data.message || (language.code === 'bn'
            ? "উত্তোলন অনুরোধ সফলভাবে জমা দেওয়া হয়েছে! শীঘ্রই প্রক্রিয়া করা হবে।"
            : "Withdrawal request submitted successfully! It will be processed shortly."),
        });

        setUserData({
          ...userData,
          balance: userData.balance - parseFloat(amount),
        });

        setAmount("");
        if (methodName === "bkash") {
          handleInputChange("bkashPhoneNumber", "");
        } else if (methodName === "rocket") {
          handleInputChange("rocketPhoneNumber", "");
        } else if (methodName === "nagad") {
          handleInputChange("nagadPhoneNumber", "");
        } else if (methodName === "bank") {
          handleInputChange("bankName", "");
          handleInputChange("accountHolderName", "");
          handleInputChange("accountNumber", "");
          handleInputChange("branchName", "");
          handleInputChange("district", "");
          handleInputChange("routingNumber", "");
        }

        const historyResponse = await axios.get(
          `${API_BASE_URL}/api/user/withdraw/history/${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (historyResponse.data.success) {
          setWithdrawalHistory(historyResponse.data.data);
        }
      } else {
        setTransactionStatus({
          success: false,
          message: response.data.message || (language.code === 'bn'
            ? "উত্তোলন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
            : "Withdrawal failed. Please try again."),
        });
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      let errorMessage = language.code === 'bn'
        ? "উত্তোলন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।"
        : "Withdrawal failed. Please try again.";

      if (err.response?.status === 401) {
        errorMessage = language.code === 'bn'
          ? "অনুগ্রহ করে পুনরায় লগইন করুন।"
          : "Please login again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setTransactionStatus({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("usertoken");

      if (!token) {
        setError(t.authenticationRequired || "Authentication token not found");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/user/all-information/${user.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const userData = response.data.data;
        setUserData(userData);
        
        const wageringReq = calculateWageringRequirements(userData);
        setWageringInfo(wageringReq);
      }
    } catch (err) {
      console.error("Error refreshing balance:", err);
      setError(t.failedRefreshBalance || "Failed to refresh balance");
    }
  };

  // ── UPDATED: Render KYC Required Message and Form ──
  const renderKycBlock = () => {
    if (!userData || userData.assignkyc !== "assigned") return null;

    // ── CASE 1: kycStatus === "processing" → improved waiting UI ──
    if (userData.kycStatus === "processing") {
      return (
        <div className="mb-6 md:mb-8 overflow-hidden rounded-[2px] border border-[#2a3a35]">
          {/* Animated top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-[#2a5c45] via-[#4ecdc4] to-[#2a5c45] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" style={{backgroundSize:'200% 100%', animation:'shimmer 2.5s linear infinite'}} />

          <style>{`
            @keyframes shimmer {
              0% { background-position: 200% center; }
              100% { background-position: -200% center; }
            }
            @keyframes pulse-ring {
              0%, 100% { transform: scale(1); opacity: 0.6; }
              50% { transform: scale(1.12); opacity: 0.2; }
            }
            @keyframes float-dots {
              0%, 100% { transform: translateY(0px); opacity: 1; }
              50% { transform: translateY(-4px); opacity: 0.5; }
            }
          `}</style>

          <div className="bg-[#111918] p-5 md:p-8">
            {/* Icon + heading row */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Animated shield icon */}
              <div className="relative flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-full bg-[#4ecdc4] opacity-20"
                  style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
                />
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#1a3a30] to-[#0d2520] border-2 border-[#3a8a6f] flex items-center justify-center shadow-lg shadow-[#4ecdc4]/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-[#4ecdc4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>

              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#4ecdc4]">
                    {language.code === 'bn' ? "KYC যাচাইকরণ পর্যালোচনাধীন" : "KYC Verification Under Review"}
                  </h3>
                  {/* Animated dots */}
                  <span className="flex gap-0.5 items-end pb-0.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#4ecdc4]"
                        style={{ animation: `float-dots 1.4s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-[#a8b9c6]">
                  {language.code === 'bn'
                    ? "আপনার নথিপত্র সফলভাবে জমা দেওয়া হয়েছে। আমাদের যাচাইকরণ দল পর্যালোচনা করছে।"
                    : "Your documents have been submitted successfully. Our verification team is reviewing them."}
                </p>
              </div>
            </div>

            {/* Status steps */}
            <div className="mt-6 grid grid-cols-3 gap-2 md:gap-4 relative">
              {/* connector line */}
              <div className="absolute top-5 left-[16.66%] right-[16.66%] h-px bg-[#2a3a35] z-0" />
              {[
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ),
                  label: language.code === 'bn' ? "জমা দেওয়া হয়েছে" : "Submitted",
                  done: true,
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  label: language.code === 'bn' ? "পর্যালোচনাধীন" : "Under Review",
                  active: true,
                },
                {
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  label: language.code === 'bn' ? "অনুমোদিত" : "Approved",
                  pending: true,
                },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.done
                        ? "bg-[#2a5c45] border-[#3a8a6f] text-[#4ecdc4]"
                        : step.active
                        ? "bg-[#1a3a30] border-[#4ecdc4] text-[#4ecdc4] shadow-[0_0_12px_rgba(78,205,196,0.3)]"
                        : "bg-[#1a1f1f] border-[#2a2f2f] text-[#4a5b68]"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <p
                    className={`text-xs mt-2 text-center font-medium ${
                      step.done ? "text-[#3a8a6f]" : step.active ? "text-[#4ecdc4]" : "text-[#4a5b68]"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Info footer */}
            <div className="mt-5 flex items-start gap-3 bg-[#0d2520] border border-[#1a3a30] rounded-lg p-3 md:p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4ecdc4] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs md:text-sm text-[#a8b9c6]">
                {language.code === 'bn'
                  ? "সাধারণত ১–২ কার্যদিবসের মধ্যে যাচাইকরণ সম্পন্ন হয়। অনুমোদনের পরে আপনি উত্তোলন করতে পারবেন।"
                  : "Verification is usually completed within 1–2 business days. You will be able to withdraw once approved."}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // ── CASE 2: kycStatus === "pending" → show KYC submit form ──
    if (userData.kycStatus === "pending") {
      return (
        <div className="bg-[#1a1f1f] rounded-[2px] mb-6 md:mb-8 border border-[#2a2f2f] overflow-hidden">
          <div className="bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f] p-4 md:p-6 border-b border-[#3a2f2f]">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 md:h-8 md:w-8 text-[#e6db74] mr-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[#e6db74]">
                  {language.code === 'bn' ? "KYC যাচাইকরণ প্রয়োজন" : "KYC Verification Required"}
                </h3>
                <p className="text-xs md:text-sm text-[#a8b9c6] mt-1">
                  {language.code === 'bn'
                    ? "উত্তোলন করতে হলে আপনাকে প্রথমে KYC যাচাইকরণ সম্পন্ন করতে হবে।"
                    : "You need to complete KYC verification before you can withdraw."}
                </p>
              </div>
            </div>
          </div>
          <KycFormBody
            isResubmit={false}
            kycError={kycError}
            kycSuccess={kycSuccess}
            kycUploading={kycUploading}
            overallUploadProgress={overallUploadProgress}
            kycFormData={kycFormData}
            uploadProgressFront={uploadProgressFront}
            frontFileName={frontFileName}
            uploadProgressBack={uploadProgressBack}
            backFileName={backFileName}
            onInputChange={handleKycInputChange}
            onFileChange={handleKycFileChange}
            onSubmit={handleKycSubmit}
            languageCode={language.code}
          />
        </div>
      );
    }

    // ── CASE 3: kycStatus === "rejected" → show KYC resubmit form ──
    if (userData.kycStatus === "rejected") {
      return (
        <div className="bg-[#1a1f1f] rounded-[2px] mb-6 md:mb-8 border border-[#2a2f2f] overflow-hidden">
          <div className="bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f] p-4 md:p-6 border-b border-[#3a2f2f]">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 md:h-8 md:w-8 text-[#ff6b6b] mr-3 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-[#ff6b6b]">
                  {language.code === 'bn' ? "KYC আবেদন প্রত্যাখ্যাত" : "KYC Application Rejected"}
                </h3>
                <p className="text-xs md:text-sm text-[#a8b9c6] mt-1">
                  {language.code === 'bn'
                    ? "আপনার KYC আবেদন প্রত্যাখ্যান করা হয়েছে। অনুগ্রহ করে সঠিক তথ্য সহ পুনরায় জমা দিন।"
                    : "Your KYC application has been rejected. Please resubmit with correct information."}
                </p>
              </div>
            </div>
          </div>
          <KycFormBody
            isResubmit={true}
            kycError={kycError}
            kycSuccess={kycSuccess}
            kycUploading={kycUploading}
            overallUploadProgress={overallUploadProgress}
            kycFormData={kycFormData}
            uploadProgressFront={uploadProgressFront}
            frontFileName={frontFileName}
            uploadProgressBack={uploadProgressBack}
            backFileName={backFileName}
            onInputChange={handleKycInputChange}
            onFileChange={handleKycFileChange}
            onSubmit={handleKycSubmit}
            languageCode={language.code}
          />
        </div>
      );
    }

    return null;
  };

  // Render method-specific form fields
  const renderMethodFields = () => {
    if (!activeMethod) return null;
    
    const methodName = activeMethod.gatewayName?.toLowerCase();
    const labels = getMethodLabels(methodName);
    
    switch(methodName) {
      case "bkash":
        return (
          <div className="mb-4 md:mb-6">
            <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
              {labels.phoneLabel}
              <span className="text-[#ff6b6b] ml-1">*</span>
            </label>
            <input
              type="tel"
              className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                formErrors.phoneNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
              }`}
              placeholder={labels.phonePlaceholder}
              value={formData.bkashPhoneNumber}
              onChange={(e) => handleInputChange("bkashPhoneNumber", e.target.value)}
              disabled={!wageringInfo.isCompleted}
            />
            {formErrors.phoneNumber && (
              <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.phoneNumber}</p>
            )}
          </div>
        );
        
      case "rocket":
        return (
          <div className="mb-4 md:mb-6">
            <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
              {labels.phoneLabel}
              <span className="text-[#ff6b6b] ml-1">*</span>
            </label>
            <input
              type="tel"
              className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                formErrors.phoneNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
              }`}
              placeholder={labels.phonePlaceholder}
              value={formData.rocketPhoneNumber}
              onChange={(e) => handleInputChange("rocketPhoneNumber", e.target.value)}
              disabled={!wageringInfo.isCompleted}
            />
            {formErrors.phoneNumber && (
              <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.phoneNumber}</p>
            )}
          </div>
        );
        
      case "nagad":
        return (
          <div className="mb-4 md:mb-6">
            <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
              {labels.phoneLabel}
              <span className="text-[#ff6b6b] ml-1">*</span>
            </label>
            <input
              type="tel"
              className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                formErrors.phoneNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
              }`}
              placeholder={labels.phonePlaceholder}
              value={formData.nagadPhoneNumber}
              onChange={(e) => handleInputChange("nagadPhoneNumber", e.target.value)}
              disabled={!wageringInfo.isCompleted}
            />
            {formErrors.phoneNumber && (
              <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.phoneNumber}</p>
            )}
          </div>
        );
        
      case "bank":
        return (
          <>
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.bankName}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.bankName ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.bankPlaceholder}
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.bankName && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.bankName}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.accountHolder}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.accountHolderName ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.accountHolderPlaceholder}
                value={formData.accountHolderName}
                onChange={(e) => handleInputChange("accountHolderName", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.accountHolderName && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.accountHolderName}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.accountNumber}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.accountNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.accountNumberPlaceholder}
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.accountNumber && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.accountNumber}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.branchName}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.branchName ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.branchPlaceholder}
                value={formData.branchName}
                onChange={(e) => handleInputChange("branchName", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.branchName && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.branchName}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.district}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.district ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={language.code === 'bn' ? "আপনার জেলার নাম" : "Your district"}
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.district && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.district}</p>
              )}
            </div>
            
            <div className="mb-4 md:mb-6">
              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                {labels.routingNumber}
                <span className="text-[#ff6b6b] ml-1">*</span>
              </label>
              <input
                type="text"
                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                  formErrors.routingNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                }`}
                placeholder={labels.routingPlaceholder}
                value={formData.routingNumber}
                onChange={(e) => handleInputChange("routingNumber", e.target.value)}
                disabled={!wageringInfo.isCompleted}
              />
              {formErrors.routingNumber && (
                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.routingNumber}</p>
              )}
            </div>
          </>
        );
        
      default:
        return null;
    }
  };

  // Helper function to render payment method buttons
  const renderPaymentMethodButton = (method) => (
    <button
      type="button"
      key={method._id}
      className={`px-3 py-3 md:px-4 md:py-4 rounded-lg flex flex-col items-center justify-center transition-all ${
        activeMethod?._id === method._id
          ? "bg-[#1a2a2a] border-2 border-[#3a8a6f]"
          : "bg-[#1a1f1f] hover:bg-[#1f2525] border-2 border-transparent"
      }`}
      onClick={() => setActiveMethod(method)}
      disabled={!wageringInfo.isCompleted}
    >
      <img
        src={`${API_BASE_URL}/images/${method.image}`}
        alt={method.gatewayName}
        className="w-8 h-8 md:w-10 md:h-10 mb-1 md:mb-2 object-contain"
      />
      <span className="text-xs font-medium">{method.gatewayName}</span>
    </button>
  );

  if (error && !userData) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0f0f]">
        <div className="bg-[#1a1f1f] text-[#ff6b6b] p-6 rounded-lg max-w-md text-center border border-[#2a2f2f]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium mb-2">{t.error || "Error"}</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#2a5c45] hover:bg-[#3a6c55] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {t.tryAgain || "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden font-rubik bg-[#0a0f0f] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex overflow-y-auto h-screen">
        <Sidebar isOpen={sidebarOpen} />

        <div
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <div className="max-w-6xl mx-auto py-4 md:py-8 pb-[30px] p-3 md:p-0">
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-white">
                {t.withdrawal || "Withdraw Funds"}
              </h1>
              <p className="text-sm md:text-base text-[#8a9ba8]">
                {language.code === 'bn'
                  ? "আপনার অ্যাকাউন্ট থেকে মোবাইল ব্যাংকিং বা ব্যাংকে টাকা উত্তোলন করুন"
                  : "Withdraw money from your account to mobile banking or bank"}
              </p>
            </div>

            {/* KYC Block — shows form or processing message; hides withdraw when active */}
            {renderKycBlock()}

            {/* Only show withdrawal content if KYC is NOT required or KYC is verified */}
            {!isKycRequired() && (
              <>
                {/* Wagering Requirement Alert */}
                {(userData?.depositamount && userData?.depositamount > 0 && !wageringInfo.isCompleted) && (
                  <div className="bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 border border-[#3a2f2f] shadow-lg">
                    <div className="flex items-center mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 md:h-8 md:w-8 text-[#e6db74] mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="text-base md:text-lg font-semibold text-[#e6db74]">
                        {wageringInfo.isSpecialCase 
                          ? (language.code === 'bn' ? "১.১x ওয়েজারিং প্রয়োজনীয়তা" : "1.1x Wagering Requirement Pending")
                          : (language.code === 'bn' ? "ওয়েজারিং প্রয়োজনীয়তা" : "Wagering Requirement Pending")}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm md:text-base text-[#a8b9c6]">
                        {wageringInfo.isSpecialCase 
                          ? (language.code === 'bn' 
                            ? "উত্তোলনের আগে আপনাকে ১.১x ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করতে হবে।"
                            : "You need to complete 1.1x wagering requirement before you can withdraw.")
                          : (language.code === 'bn'
                            ? "উত্তোলনের আগে আপনাকে ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করতে হবে।"
                            : "You need to complete wagering requirements before you can withdraw.")}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-3">
                        <div className="bg-[#1a1f1f] p-3 rounded-lg">
                          <p className="text-xs md:text-sm text-[#8a9ba8]">
                            {wageringInfo.isSpecialCase 
                              ? (language.code === 'bn' ? "প্রয়োজনীয় (১.১x)" : "Required (1.1x)")
                              : (language.code === 'bn' ? "প্রয়োজনীয় ওয়েজারিং" : "Required Wagering")}
                          </p>
                          <p className="text-base md:text-lg font-bold text-white">
                            ৳{wageringInfo.required.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-[#1a1f1f] p-3 rounded-lg">
                          <p className="text-xs md:text-sm text-[#8a9ba8]">
                            {language.code === 'bn' ? "ওয়েজার সম্পন্ন" : "Wagered"}
                          </p>
                          <p className="text-base md:text-lg font-bold text-[#4ecdc4]">
                            ৳{wageringInfo.completed.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-[#1a1f1f] p-3 rounded-lg">
                          <p className="text-xs md:text-sm text-[#8a9ba8]">
                            {language.code === 'bn' ? "বাকি" : "Remaining"}
                          </p>
                          <p className="text-base md:text-lg font-bold text-[#ff6b6b]">
                            ৳{wageringInfo.remaining.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full bg-[#1a1f1f] rounded-full h-3 md:h-4">
                          <div 
                            className="bg-gradient-to-r from-[#3a8a6f] to-[#4ecdc4] h-3 md:h-4 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${wageringInfo.required > 0 ? (wageringInfo.completed / wageringInfo.required) * 100 : 0}%`,
                              maxWidth: '100%'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs md:text-sm text-[#8a9ba8] mt-2 text-center">
                          {((wageringInfo.completed / wageringInfo.required) * 100 || 0).toFixed(1)}% {language.code === 'bn' ? "সম্পন্ন" : "Complete"}
                        </p>
                      </div>
                      <p className="text-xs md:text-sm text-[#ff6b6b] mt-3">
                        <strong>{language.code === 'bn' ? "নোট:" : "Note:"}</strong> {language.code === 'bn'
                          ? `উত্তোলনের আগে আরও ৳${wageringInfo.remaining.toLocaleString()} বাজি রাখতে হবে।`
                          : `You must wager ৳${wageringInfo.remaining.toLocaleString()} more before you can make a withdrawal.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* User Info Card */}
                {userData && (
                  <div className="bg-[#1a1f1f] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 border border-[#2a2f2f] shadow-lg">
                    <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white">
                      {language.code === 'bn' ? "অ্যাকাউন্ট তথ্য" : "Account Information"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <div>
                        <p className="text-xs md:text-sm text-[#8a9ba8]">{t.playerId || "Player ID"}</p>
                        <p className="text-sm md:text-base font-medium text-white">
                          {userData.player_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-[#8a9ba8]">{t.username || "Username"}</p>
                        <p className="text-sm md:text-base font-medium text-white">
                          {userData.username}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-[#8a9ba8]">{t.phone || "Phone"}</p>
                        <p className="text-sm md:text-base font-medium text-white">
                          {userData.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-[#1a2525] to-[#2a3535] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 shadow-lg border border-[#2a2f2f]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
                    <div>
                      <p className="text-xs md:text-sm text-[#a8b9c6]">
                        {language.code === 'bn' ? "বর্তমান ব্যালেন্স" : "Current Balance"}
                      </p>
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">
                        ৳ {userData ? userData.balance?.toLocaleString() : "0.00"}
                      </h2>
                      {userData?.bonusBalance > 0 && (
                        <p className="text-xs md:text-sm text-[#4ecdc4] mt-1">
                          {language.code === 'bn' ? "বোনাস ব্যালেন্স:" : "Bonus Balance:"} ৳{userData.bonusBalance?.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleRefreshBalance}
                        className="bg-[#2a5c45] cursor-pointer px-4 py-2 md:px-6 md:py-3 rounded-[5px] text-xs md:text-sm font-medium transition-colors flex items-center hover:bg-[#3a6c55]"
                        disabled={!wageringInfo.isCompleted}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        {t.refreshBalance || "Refresh Balance"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading State for Withdraw Methods */}
                {loadingMethods ? (
                  <div className="bg-[#1a1f1f] rounded-lg p-8 text-center border border-[#2a2f2f]">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#2a2f2f] rounded-full"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent rounded-full border-t-[#3a8a6f] animate-spin"></div>
                      </div>
                      <div>
                        <p className="text-[#8a9ba8] font-medium">{t.loading || "Loading..."}</p>
                      </div>
                    </div>
                  </div>
                ) : withdrawMethods.length === 0 ? (
                  <div className="bg-[#1a1f1f] rounded-[2px] p-8 text-center border border-[#2a2f2f]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto text-[#8a9ba8] mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-[#8a9ba8]">
                      {language.code === 'bn' 
                        ? "কোন উত্তোলন পদ্ধতি উপলব্ধ নেই।"
                        : "No withdrawal methods available at the moment."}
                    </p>
                  </div>
                ) : (
                  /* Withdrawal Methods */
                  <div className="bg-[#1a1f1f] rounded-[2px] overflow-hidden mb-6 md:mb-8 border border-[#2a2f2f]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 md:p-4 border-b border-[#2a2f2f]">
                      {withdrawMethods.map((method) => renderPaymentMethodButton(method))}
                    </div>

                    {activeMethod && (
                      <>
                        {/* Wagering Error Message */}
                        {(!wageringInfo.isCompleted || formErrors.wagering || formErrors.bonusWagering) && (
                          <div className="p-4 md:p-6 border-t border-[#2a2f2f] bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f]">
                            <div className="flex items-center mb-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 md:h-6 md:w-6 text-[#ff6b6b] mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              <h4 className="text-sm md:text-base font-semibold text-[#ff6b6b]">
                                {language.code === 'bn' ? "উত্তোলন সীমাবদ্ধতা" : "Withdrawal Restrictions"}
                              </h4>
                            </div>
                            {formErrors.wagering && (
                              <p className="text-xs md:text-sm text-[#ff6b6b] mb-2">
                                {formErrors.wagering}
                              </p>
                            )}
                            {formErrors.bonusWagering && (
                              <p className="text-xs md:text-sm text-[#ff6b6b]">
                                {formErrors.bonusWagering}
                              </p>
                            )}
                            {!formErrors.wagering && !formErrors.bonusWagering && !wageringInfo.isCompleted && (
                              <p className="text-xs md:text-sm text-[#ff6b6b]">
                                {wageringInfo.isSpecialCase 
                                  ? (language.code === 'bn'
                                    ? "উত্তোলনের আগে ১.১x ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করুন।"
                                    : "You need to complete 1.1x wagering requirement before withdrawing.")
                                  : (language.code === 'bn'
                                    ? "উত্তোলনের আগে ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করুন।"
                                    : "You need to complete wagering requirements before withdrawing.")}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Payment Instructions */}
                        <div className="p-4 md:p-6 border-t border-[#2a2f2f]">
                          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#3a8a6f]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {activeMethod.gatewayName} {language.code === 'bn' ? "উত্তোলন নির্দেশনা" : "Withdrawal Instructions"}
                          </h3>
                          <ul className="text-xs md:text-sm text-[#8a9ba8] space-y-2 md:space-y-3">
                            {getPaymentInstructions(activeMethod).map((step, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-[#3a8a6f] mr-2">•</span>
                                <span>
                                  <strong>{step.step}:</strong> {step.description}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Charges Information */}
                        <div className="p-4 md:p-6 border-t border-[#2a2f2f] bg-[#1f2525]">
                          <h4 className="text-sm md:text-base font-semibold mb-3 text-white">
                            {language.code === 'bn' ? "চার্জের তথ্য" : "Charges Information"}
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
                            <div>
                              <p className="text-[#8a9ba8]">{language.code === 'bn' ? "ন্যূনতম পরিমাণ" : "Min Amount"}</p>
                              <p className="text-white font-medium">৳{MIN_WITHDRAW_AMOUNT}</p>
                            </div>
                            <div>
                              <p className="text-[#8a9ba8]">{language.code === 'bn' ? "সর্বোচ্চ পরিমাণ" : "Max Amount"}</p>
                              <p className="text-white font-medium">৳{activeMethod.maxAmount}</p>
                            </div>
                          </div>
                        </div>

                        {/* Withdrawal Form */}
                        <div className="p-4 md:p-6">
                          <form onSubmit={handleSubmit}>
                            {/* Method-specific form fields */}
                            {renderMethodFields()}

                            {/* Amount Field */}
                            <div className="mb-4 md:mb-6">
                              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                                {language.code === 'bn' ? "পরিমাণ (৳)" : "Amount (৳)"}
                                <span className="text-[#ff6b6b] ml-1">*</span>
                              </label>
                              <input
                                type="number"
                                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${
                                  formErrors.amount ? "border-[#ff6b6b]" : "border-[#2a2f2f]"
                                }`}
                                placeholder={language.code === 'bn'
                                  ? `পরিমাণ লিখুন (ন্যূনতম: ৳${MIN_WITHDRAW_AMOUNT}, সর্বোচ্চ: ৳${activeMethod.maxAmount})`
                                  : `Enter amount (Min: ৳${MIN_WITHDRAW_AMOUNT}, Max: ৳${activeMethod.maxAmount})`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min={MIN_WITHDRAW_AMOUNT}
                                max={Math.min(activeMethod.maxAmount, userData?.balance || 0)}
                                required
                                disabled={!wageringInfo.isCompleted}
                              />
                              {formErrors.amount && (
                                <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">
                                  {formErrors.amount}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                                {quickAmounts.map((quickAmount) => (
                                  <button
                                    key={quickAmount}
                                    type="button"
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                                      amount === quickAmount.toString()
                                        ? "bg-[#2a5c45] text-white"
                                        : "bg-[#1f2525] text-[#8a9ba8] hover:bg-[#252b2b]"
                                    }`}
                                    onClick={() => setAmount(quickAmount.toString())}
                                    disabled={
                                      !wageringInfo.isCompleted ||
                                      quickAmount > (userData?.balance || 0) || 
                                      quickAmount > activeMethod.maxAmount || 
                                      quickAmount < MIN_WITHDRAW_AMOUNT
                                    }
                                  >
                                    ৳ {quickAmount.toLocaleString()}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              className="w-full bg-gradient-to-r from-[#2a5c45] to-[#3a6c55] hover:from-[#3a6c55] hover:to-[#4a7c65] py-3 md:py-4 rounded-lg text-sm md:text-base text-white font-medium flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                              type="submit"
                              disabled={
                                !wageringInfo.isCompleted ||
                                isProcessing ||
                                !amount ||
                                parseFloat(amount) > (userData?.balance || 0) ||
                                parseFloat(amount) < MIN_WITHDRAW_AMOUNT ||
                                parseFloat(amount) > parseFloat(activeMethod?.maxAmount || 30000)
                              }
                            >
                              {!wageringInfo.isCompleted ? (
                                wageringInfo.isSpecialCase 
                                  ? (language.code === 'bn' ? "প্রথমে ১.১x ওয়েজারিং সম্পন্ন করুন" : "Complete 1.1x Wagering Requirements First")
                                  : (language.code === 'bn' ? "প্রথমে ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করুন" : "Complete Wagering Requirements First")
                              ) : isProcessing ? (
                                <>
                                  <svg
                                    className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  {language.code === 'bn' ? "প্রক্রিয়াকরণ..." : "Processing..."}
                                </>
                              ) : (
                                `${language.code === 'bn' ? "উত্তোলন করুন" : "Withdraw to"} ${activeMethod.gatewayName}`
                              )}
                            </button>
                          </form>

                          {transactionStatus && (
                            <div
                              className={`mt-3 md:mt-4 p-3 md:p-4 rounded-lg text-xs md:text-sm ${
                                transactionStatus.success
                                  ? "bg-[#1a2525] text-[#4ecdc4] border border-[#2a3535]"
                                  : "bg-[#2a1f1f] text-[#ff6b6b] border border-[#3a2f2f]"
                              }`}
                            >
                              <div className="flex items-center">
                                {transactionStatus.success ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 md:h-5 md:w-5 mr-2"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 md:h-5 md:w-5 mr-2"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {transactionStatus.message}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Instructions and Transaction History */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 md:gap-8">
                  {/* Instructions */}
                  {activeMethod && (
                    <div className="bg-[#1a1f1f] rounded-[2px] p-4 md:p-6 border border-[#2a2f2f]">
                      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#3a8a6f]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {language.code === 'bn' ? "উত্তোলনের তথ্য" : "Withdrawal Information"}
                      </h3>
                      <ul className="text-xs md:text-sm text-[#8a9ba8] space-y-2 md:space-y-3">
                        <li className="flex items-start">
                          <span className="text-[#3a8a6f] mr-2">•</span>
                          <span>{language.code === 'bn' ? "ন্যূনতম উত্তোলনের পরিমাণ:" : "Minimum withdrawal amount:"} ৳{MIN_WITHDRAW_AMOUNT}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#3a8a6f] mr-2">•</span>
                          <span>{language.code === 'bn' ? "সর্বোচ্চ উত্তোলনের পরিমাণ:" : "Maximum withdrawal amount:"} ৳{activeMethod?.maxAmount || 30000}</span>
                        </li>
                        {userData?.depositamount && userData?.depositamount > 0 && (
                          <>
                            <li className="flex items-start">
                              <span className="text-[#3a8a6f] mr-2">•</span>
                              <span>
                                {userData.waigeringneed === 0 
                                  ? (language.code === 'bn' ? "ওয়েজারিং প্রয়োজনীয়তা: ডিপোজিটের ১.১x গুণ" : "Wagering requirement: 1.1x deposit amount")
                                  : (language.code === 'bn' ? `ওয়েজারিং প্রয়োজনীয়তা: ডিপোজিটের ${userData.waigeringneed}x গুণ` : `Wagering requirement: ${userData.waigeringneed}x deposit amount`)}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-[#3a8a6f] mr-2">•</span>
                              <span>
                                {language.code === 'bn' ? "প্রয়োজনীয় ওয়েজারিং:" : "Required wagering:"} ৳{(userData.waigeringneed === 0 
                                  ? userData.depositamount * 1.1 
                                  : userData.depositamount * userData.waigeringneed).toLocaleString()}
                              </span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-[#3a8a6f] mr-2">•</span>
                              <span>
                                {language.code === 'bn' ? "সম্পন্ন ওয়েজারিং:" : "Completed wagering:"} ৳{userData.total_bet?.toLocaleString() || 0}
                              </span>
                            </li>
                          </>
                        )}
                        <li className="flex items-start">
                          <span className="text-[#3a8a6f] mr-2">•</span>
                          <span>{language.code === 'bn' ? "উত্তোলন প্রক্রিয়াকরণ সময়: ৫-৩০ মিনিট" : "Withdrawal processing time: 5-30 minutes"}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#3a8a6f] mr-2">•</span>
                          <span>{language.code === 'bn' ? "আপনার অ্যাকাউন্ট সক্রিয় এবং যাচাইকৃত আছে কিনা নিশ্চিত করুন" : "Ensure your account is active and verified"}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#3a8a6f] mr-2">•</span>
                          <span>{language.code === 'bn' ? "কোন সমস্যা হলে সাপোর্টে যোগাযোগ করুন" : "Contact support if you face any issues"}</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Transaction History */}
                  <div className="bg-[#1a1f1f] rounded-[2px] overflow-hidden border border-[#2a2f2f]">
                    <div className="p-4 md:p-6 border-b border-[#2a2f2f] flex justify-between items-center">
                      <h3 className="text-base md:text-lg font-semibold text-white">
                        {language.code === 'bn' ? "সাম্প্রতিক উত্তোলন" : "Recent Withdrawals"}
                      </h3>
                      <button className="text-[#3a8a6f] text-xs md:text-sm hover:text-[#4a9a7f] transition-colors">
                        {t.viewAll || "View All"}
                      </button>
                    </div>
                    <div className="p-3 md:p-4">
                      {withdrawalHistory.length > 0 ? (
                        <div className="space-y-3 md:space-y-4">
                          {withdrawalHistory
                            .slice(0, 5)
                            .map((transaction, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-[#1f2525] rounded-lg hover:bg-[#252b2b] transition-colors"
                              >
                                <div className="flex items-center">
                                  <div
                                    className={`p-1.5 md:p-2 rounded-full mr-2 md:mr-3 ${
                                      transaction.status === "completed"
                                        ? "bg-[#1a2525] text-[#4ecdc4]"
                                        : transaction.status === "pending"
                                        ? "bg-[#2a2a1f] text-[#e6db74]"
                                        : "bg-[#2a1f1f] text-[#ff6b6b]"
                                    }`}
                                  >
                                    {transaction.status === "completed" ? (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 md:h-5 md:w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    ) : transaction.status === "pending" ? (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 md:h-5 md:w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                    ) : (
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 md:h-5 md:w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs md:text-sm font-medium text-white">
                                      {new Date(
                                        transaction.date || transaction.createdAt
                                      ).toLocaleDateString(language.code === 'bn' ? 'bn-BD' : 'en-US')}
                                    </p>
                                    <p className="text-xs text-[#8a9ba8] capitalize">
                                      {transaction.method}
                                    </p>
                                    {transaction.details && (
                                      <p className="text-xs text-[#8a9ba8]">
                                        {transaction.details.phoneNumber || transaction.details.accountNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs md:text-sm font-medium text-white">
                                    ৳ {transaction.amount?.toLocaleString()}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      transaction.status === "completed"
                                        ? "text-[#4ecdc4]"
                                        : transaction.status === "pending"
                                        ? "text-[#e6db74]"
                                        : "text-[#ff6b6b]"
                                    }`}
                                  >
                                    {transaction.status === "completed"
                                      ? (language.code === 'bn' ? "সম্পূর্ণ" : "Completed")
                                      : transaction.status === "pending"
                                      ? (language.code === 'bn' ? "মুলতুবি" : "Pending")
                                      : (language.code === 'bn' ? "ব্যর্থ" : "Failed")}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center flex justify-center items-center flex-col py-6 md:py-8 text-[#8a9ba8]">
                          <div className="w-[40px] h-[40px] flex justify-center items-center border-[2px] border-[#2a2f2f] mb-[10px] rounded-full">
                            <FaBangladeshiTakaSign className="text-[#5a6b78]" />
                          </div>
                          <p className="text-sm md:text-base">
                            {language.code === 'bn' ? "কোন সাম্প্রতিক উত্তোলন নেই" : "No recent withdrawals"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Withdraw;