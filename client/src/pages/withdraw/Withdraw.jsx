import React, { useState, useEffect, useContext } from "react";
import { Header } from "../../components/header/Header";
import Sidebar from "../../components/sidebar/Sidebar";
import Footer from "../../components/footer/Footer";
import axios from "axios";
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { LanguageContext } from "../../context/LanguageContext";

// ── Defined OUTSIDE Withdraw so React never remounts them ──

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
          <span className="text-xs text-[#8a9ba8] truncate max-w-[70%]" title={fileName}>{fileName}</span>
          <span className={`text-xs font-semibold ${progress === 100 ? "text-[#4ecdc4]" : "text-[#e6db74]"}`}>
            {progress === 100 ? (languageCode === 'bn' ? "সম্পন্ন" : "✓ Done") : `${progress}%`}
          </span>
        </div>
        <div className="w-full bg-[#1a1f1f] rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-out ${progress === 100 ? "bg-gradient-to-r from-[#3a8a6f] to-[#4ecdc4]" : "bg-gradient-to-r from-[#2a5c45] to-[#e6db74]"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )}
    {fieldKey === "documentFront" && (
      <p className="text-xs text-[#8a9ba8] mt-1">
        {languageCode === 'bn' ? "অনুমোদিত ফরম্যাট: JPEG, PNG, GIF, PDF (সর্বোচ্চ 5MB)" : "Allowed formats: JPEG, PNG, GIF, PDF (Max 5MB)"}
      </p>
    )}
  </div>
);

const KycFormBody = ({
  isResubmit, kycError, kycSuccess, kycUploading, overallUploadProgress,
  kycFormData, uploadProgressFront, frontFileName, uploadProgressBack,
  backFileName, onInputChange, onFileChange, onSubmit, languageCode,
}) => (
  <div className="p-4 md:p-6">
    {kycError && (
      <div className="bg-[#2a1f1f] border border-[#ff6b6b] text-[#ff6b6b] p-3 rounded-lg text-sm mb-4">{kycError}</div>
    )}
    {kycSuccess && (
      <div className="bg-[#1a2525] border border-[#4ecdc4] text-[#4ecdc4] p-3 rounded-lg text-sm mb-4">{kycSuccess}</div>
    )}
    {kycUploading && (
      <div className="mb-4 p-3 bg-[#1f2525] rounded-lg border border-[#2a3535]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#8a9ba8]">{languageCode === 'bn' ? "আপলোড হচ্ছে..." : "Uploading to server..."}</span>
          <span className="text-xs font-semibold text-[#4ecdc4]">{overallUploadProgress}%</span>
        </div>
        <div className="w-full bg-[#1a1f1f] rounded-full h-2.5 overflow-hidden">
          <div className="h-2.5 rounded-full bg-gradient-to-r from-[#2a5c45] via-[#3a8a6f] to-[#4ecdc4] transition-all duration-300 ease-out" style={{ width: `${overallUploadProgress}%` }} />
        </div>
        <p className="text-xs text-[#5a6b78] mt-1">{languageCode === 'bn' ? "অনুগ্রহ করে পেজ বন্ধ করবেন না" : "Please do not close this page"}</p>
      </div>
    )}
    <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
      <div>
        <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
          {languageCode === 'bn' ? "পূর্ণ নাম" : "Full Name"}<span className="text-[#ff6b6b] ml-1">*</span>
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
          {languageCode === 'bn' ? "ডকুমেন্ট টাইপ" : "Document Type"}<span className="text-[#ff6b6b] ml-1">*</span>
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
      <FileUploadField label={languageCode === 'bn' ? "ডকুমেন্টের সামনের অংশ" : "Document Front"} required={true} fieldKey="documentFront" progress={uploadProgressFront} fileName={frontFileName} onFileChange={onFileChange} languageCode={languageCode} />
      <FileUploadField label={languageCode === 'bn' ? "ডকুমেন্টের পিছনের অংশ" : "Document Back (Optional)"} required={false} fieldKey="documentBack" progress={uploadProgressBack} fileName={backFileName} onFileChange={onFileChange} languageCode={languageCode} />
      <button
        type="submit"
        disabled={kycUploading}
        className="w-full bg-gradient-to-r from-[#2a5c45] to-[#3a6c55] hover:from-[#3a6c55] hover:to-[#4a7c65] py-3 md:py-4 rounded-lg text-sm md:text-base text-white font-medium flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {kycUploading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {languageCode === 'bn' ? "জমা দেওয়া হচ্ছে..." : "Submitting..."}
          </>
        ) : isResubmit ? (languageCode === 'bn' ? "পুনরায় KYC জমা দিন" : "Resubmit KYC") : (languageCode === 'bn' ? "KYC জমা দিন" : "Submit KYC")}
      </button>
    </form>
  </div>
);

// ─────────────────────────────────────────────────────────────
//  DEFAULT wagering multiplier when user has NO active bonus
// ─────────────────────────────────────────────────────────────
const DEFAULT_WAGER_MULTIPLIER = 1.1;

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

  // Single source of truth for wagering
  const [wageringInfo, setWageringInfo] = useState({
    required: 0,
    completed: 0,
    remaining: 0,
    isCompleted: true,
    progress: 0,
    hasRequirement: false,
    isBonusWager: false,      // true  → bonus wagering (depositamount × waigeringneed)
    isDefaultWager: false,    // true  → default 1.1x total_deposit wagering
    multiplier: 0,
    baseAmount: 0,
  });

  // KYC states
  const [kycFormData, setKycFormData] = useState({ fullName: "", documentType: "nid", documentFront: null, documentBack: null });
  const [kycUploading, setKycUploading] = useState(false);
  const [kycError, setKycError] = useState(null);
  const [kycSuccess, setKycSuccess] = useState(null);
  const [uploadProgressFront, setUploadProgressFront] = useState(0);
  const [uploadProgressBack, setUploadProgressBack] = useState(0);
  const [frontFileName, setFrontFileName] = useState("");
  const [backFileName, setBackFileName] = useState("");
  const [overallUploadProgress, setOverallUploadProgress] = useState(0);

  // Method-specific form fields
  const [formData, setFormData] = useState({
    bkashPhoneNumber: "", rocketPhoneNumber: "", nagadPhoneNumber: "",
    bankName: "", accountHolderName: "", accountNumber: "",
    branchName: "", district: "", routingNumber: "", accountType: "personal",
  });

  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const quickAmounts = [300, 500, 1000, 2000, 5000];
  const MIN_WITHDRAW_AMOUNT = 300;

  // ─────────────────────────────────────────────────────────────
  //  UNIFIED WAGERING CALCULATOR
  //
  //  Priority 1 — Bonus wagering:
  //    User has a bonus applied  →  depositamount × waigeringneed
  //
  //  Priority 2 — Default wagering (no bonus):
  //    No bonus / waigeringneed is 0  →  total_deposit × 1.1
  //
  //  In both cases: compare against userData.total_bet
  // ─────────────────────────────────────────────────────────────
  const calculateWageringRequirements = (data) => {
    const empty = {
      required: 0, completed: 0, remaining: 0,
      isCompleted: true, progress: 100,
      hasRequirement: false, isBonusWager: false, isDefaultWager: false,
      multiplier: 0, baseAmount: 0,
    };
    if (!data) return empty;

    const depositAmount  = parseFloat(data.depositamount)  || 0;
    const wageringNeed   = parseFloat(data.waigeringneed)   || 0;
    const totalDeposit   = parseFloat(data.total_deposit)   || 0;
    const totalBet       = parseFloat(data.total_bet)        || 0;

    let requiredWager = 0;
    let isBonusWager  = false;
    let isDefaultWager = false;
    let multiplier    = 0;
    let baseAmount    = 0;

    // ── CASE 1: Active bonus wagering requirement ──
    if (depositAmount > 0 && wageringNeed > 0) {
      requiredWager  = depositAmount * wageringNeed;
      isBonusWager   = true;
      multiplier     = wageringNeed;
      baseAmount     = depositAmount;
    }
    // ── CASE 2: Default 1.1x wagering (no bonus) ──
    else if (totalDeposit > 0) {
      requiredWager  = totalDeposit * DEFAULT_WAGER_MULTIPLIER;
      isDefaultWager = true;
      multiplier     = DEFAULT_WAGER_MULTIPLIER;
      baseAmount     = totalDeposit;
    }
    // ── CASE 3: No deposit at all → no restriction ──
    else {
      return empty;
    }

    const remainingWager = Math.max(0, requiredWager - totalBet);
    const isCompleted    = remainingWager <= 0;
    const progress       = requiredWager > 0 ? Math.min((totalBet / requiredWager) * 100, 100) : 100;

    return {
      required: requiredWager,
      completed: totalBet,
      remaining: remainingWager,
      isCompleted,
      progress,
      hasRequirement: true,
      isBonusWager,
      isDefaultWager,
      multiplier,
      baseAmount,
    };
  };

  // KYC guard
  const isKycRequired = () => {
    if (!userData) return false;
    return (
      userData.assignkyc === "assigned" &&
      (userData.kycStatus === "pending" || userData.kycStatus === "rejected" || userData.kycStatus === "processing")
    );
  };

  const fetchKycStatus = async () => {
    try {
      const token = localStorage.getItem("usertoken");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/user/kyc/my-status`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success && res.data.data.status === 'rejected' && res.data.data.canResubmit) {
        // allow resubmit form
      }
    } catch (err) { console.error("KYC status error:", err); }
  };

  const fetchKycDetails = async () => {
    try {
      const token = localStorage.getItem("usertoken");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/user/kyc/my-details`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setKycFormData(prev => ({ ...prev, fullName: res.data.data.fullName || "", documentType: res.data.data.documentType || "nid" }));
      }
    } catch (err) { console.error("KYC details error:", err); }
  };

  const handleKycInputChange = (field, value) => { setKycFormData(prev => ({ ...prev, [field]: value })); setKycError(null); };

  const handleKycFileChange = (field, file) => {
    if (!file) return;
    setKycFormData(prev => ({ ...prev, [field]: file }));
    setKycError(null);
    const isFront = field === "documentFront";
    const setProgress = isFront ? setUploadProgressFront : setUploadProgressBack;
    const setName = isFront ? setFrontFileName : setBackFileName;
    setName(file.name);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.floor(Math.random() * 15) + 5;
      if (p >= 100) { p = 100; clearInterval(interval); }
      setProgress(p);
    }, 120);
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycFormData.fullName.trim()) { setKycError(language.code === 'bn' ? "পূর্ণ নাম প্রয়োজন" : "Full name is required"); return; }
    if (!kycFormData.documentFront) { setKycError(language.code === 'bn' ? "ডকুমেন্টের সামনের অংশ প্রয়োজন" : "Document front is required"); return; }
    setKycUploading(true); setKycError(null); setKycSuccess(null); setOverallUploadProgress(0);
    try {
      const token = localStorage.getItem("usertoken");
      const fd = new FormData();
      fd.append("fullName", kycFormData.fullName);
      fd.append("documentType", kycFormData.documentType);
      fd.append("documentFront", kycFormData.documentFront);
      if (kycFormData.documentBack) fd.append("documentBack", kycFormData.documentBack);
      const config = {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        onUploadProgress: (pe) => setOverallUploadProgress(Math.round((pe.loaded * 100) / pe.total)),
      };
      const url = userData?.kycStatus === 'rejected' ? `${API_BASE_URL}/api/user/kyc/resubmit` : `${API_BASE_URL}/api/user/kyc/submit`;
      const res = await axios.post(url, fd, config);
      if (res.data.success) {
        setOverallUploadProgress(100);
        setKycSuccess(res.data.message);
        const user = JSON.parse(localStorage.getItem("user"));
        const ur = await axios.get(`${API_BASE_URL}/api/user/all-information/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (ur.data.success) { setUserData(ur.data.data); setWageringInfo(calculateWageringRequirements(ur.data.data)); }
        await fetchKycStatus();
        setKycFormData({ fullName: "", documentType: "nid", documentFront: null, documentBack: null });
        setUploadProgressFront(0); setUploadProgressBack(0); setFrontFileName(""); setBackFileName(""); setOverallUploadProgress(0);
      } else { setKycError(res.data.message); }
    } catch (err) {
      setKycError(err.response?.data?.message || (language.code === 'bn' ? "KYC জমা দিতে ব্যর্থ হয়েছে" : "Failed to submit KYC"));
    } finally { setKycUploading(false); }
  };

  const getMethodLabels = (methodName) => ({
    bkash:  { phoneLabel: language.code === 'bn' ? "আপনার বিকাশ নাম্বার লিখুন" : "Enter your bKash number", phonePlaceholder: "01XXXXXXXXX" },
    rocket: { phoneLabel: language.code === 'bn' ? "আপনার রকেট নাম্বার লিখুন" : "Enter your Rocket number", phonePlaceholder: "01XXXXXXXXX" },
    nagad:  { phoneLabel: language.code === 'bn' ? "আপনার নগদ নাম্বার লিখুন" : "Enter your Nagad number", phonePlaceholder: "01XXXXXXXXX" },
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
      routingPlaceholder: language.code === 'bn' ? "৯ ডিজিটের রাউটিং নাম্বার" : "9-digit routing number",
    },
  }[methodName] || {});

  // Fetch withdraw methods
  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/withdraw-methods`);
        if (res.data.success && res.data.method) {
          setWithdrawMethods(res.data.method);
          if (res.data.method.length > 0) setActiveMethod(res.data.method[0]);
        }
      } catch (err) { console.error("Withdraw methods error:", err); }
      finally { setLoadingMethods(false); }
    };
    run();
  }, [API_BASE_URL]);

  // Fetch user data
  useEffect(() => {
    const run = async () => {
      try {
        const user  = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("usertoken");
        if (!token) { setError(t.authenticationRequired || "Authentication token not found"); setLoading(false); return; }

        const ur = await axios.get(`${API_BASE_URL}/api/user/all-information/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (ur.data.success) {
          setUserData(ur.data.data);
          setWageringInfo(calculateWageringRequirements(ur.data.data));
        } else { setError(ur.data.message); }

        try {
          const hr = await axios.get(`${API_BASE_URL}/api/user/withdraw/history/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (hr.data.success) setWithdrawalHistory(hr.data.data);
        } catch { setWithdrawalHistory([]); }

        await fetchKycStatus();
        await fetchKycDetails();
      } catch (err) {
        setError(t.failedToFetchUserData || "Failed to fetch user data");
        console.error(err);
      } finally { setLoading(false); }
    };
    run();
  }, [API_BASE_URL]);

  const getPaymentInstructions = (method) => {
    if (!method) return [];
    return [
      { step: language.code === 'bn' ? "অ্যাকাউন্ট প্রস্তুত করুন" : "Prepare Account", description: language.code === 'bn' ? `আপনার ${method.gatewayName} অ্যাকাউন্ট সক্রিয় এবং যাচাইকৃত আছে কিনা নিশ্চিত করুন।` : `Ensure your ${method.gatewayName} account is active and verified.` },
      { step: language.code === 'bn' ? "তথ্য প্রদান করুন" : "Enter Details", description: language.code === 'bn' ? `আপনার ${method.gatewayName} অ্যাকাউন্টের তথ্য সঠিকভাবে প্রদান করুন।` : `Provide your ${method.gatewayName} account details correctly.` },
      { step: language.code === 'bn' ? "পরিমাণ লিখুন" : "Enter Amount", description: language.code === 'bn' ? `উত্তোলনের পরিমাণ লিখুন (ন্যূনতম: ৳${MIN_WITHDRAW_AMOUNT}, সর্বোচ্চ: ৳${method.maxAmount})` : `Input the withdrawal amount (Min: ৳${MIN_WITHDRAW_AMOUNT}, Max: ৳${method.maxAmount}).` },
      { step: language.code === 'bn' ? "চার্জ যাচাই করুন" : "Review Charges", description: language.code === 'bn' ? `নোট: ${method.fixedCharge}৳ নির্ধারিত + ${method.percentCharge}% চার্জ প্রযোজ্য হবে।` : `Note: ${method.fixedCharge}৳ fixed + ${method.percentCharge}% charge will be applied.` },
      { step: language.code === 'bn' ? "অনুরোধ জমা দিন" : "Submit Request", description: language.code === 'bn' ? "আপনার উত্তোলন অনুরোধ প্রক্রিয়াকরণের জন্য জমা দিন।" : "Submit your withdrawal request for processing." },
    ];
  };

  const getCurrentMethodData = () => {
    if (!activeMethod) return {};
    switch (activeMethod.gatewayName?.toLowerCase()) {
      case "bkash":  return { phoneNumber: formData.bkashPhoneNumber };
      case "rocket": return { phoneNumber: formData.rocketPhoneNumber };
      case "nagad":  return { phoneNumber: formData.nagadPhoneNumber };
      case "bank":   return { bankName: formData.bankName, accountHolderName: formData.accountHolderName, accountNumber: formData.accountNumber, branchName: formData.branchName, district: formData.district, routingNumber: formData.routingNumber };
      default: return {};
    }
  };

  const validateForm = () => {
    const errors = {};
    const currentData = getCurrentMethodData();
    if (!activeMethod) { errors.method = language.code === 'bn' ? "পেমেন্ট মেথড নির্বাচন করুন" : "Please select a payment method"; }

    // Wagering block — single check using unified wageringInfo
    if (wageringInfo.hasRequirement && !wageringInfo.isCompleted) {
      if (wageringInfo.isBonusWager) {
        errors.wagering = language.code === 'bn'
          ? `উত্তোলনের আগে আরও ৳${wageringInfo.remaining.toLocaleString()} বাজি রাখতে হবে। প্রয়োজন: ${wageringInfo.multiplier}x ডিপোজিট (৳${wageringInfo.required.toLocaleString()}), বাজি রাখা হয়েছে: ৳${wageringInfo.completed.toLocaleString()}`
          : `You need to wager ৳${wageringInfo.remaining.toLocaleString()} more before withdrawing. Required: ${wageringInfo.multiplier}x deposit (৳${wageringInfo.required.toLocaleString()}), Wagered: ৳${wageringInfo.completed.toLocaleString()}`;
      } else {
        errors.wagering = language.code === 'bn'
          ? `উত্তোলনের আগে আরও ৳${wageringInfo.remaining.toLocaleString()} বাজি রাখতে হবে। ডিফল্ট প্রয়োজনীয়তা: মোট ডিপোজিটের ${DEFAULT_WAGER_MULTIPLIER}x (৳${wageringInfo.required.toLocaleString()}), বাজি রাখা হয়েছে: ৳${wageringInfo.completed.toLocaleString()}`
          : `You need to wager ৳${wageringInfo.remaining.toLocaleString()} more before withdrawing. Default requirement: ${DEFAULT_WAGER_MULTIPLIER}x total deposit (৳${wageringInfo.required.toLocaleString()}), Wagered: ৳${wageringInfo.completed.toLocaleString()}`;
      }
    }

    if (activeMethod) {
      const mn = activeMethod.gatewayName?.toLowerCase();
      if (["bkash","rocket","nagad"].includes(mn)) {
        if (!currentData.phoneNumber) errors.phoneNumber = language.code === 'bn' ? `${activeMethod.gatewayName} নাম্বার প্রয়োজন` : `${activeMethod.gatewayName} number is required`;
        else if (!/^(01[3-9]\d{8})$/.test(currentData.phoneNumber)) errors.phoneNumber = language.code === 'bn' ? `সঠিক ${activeMethod.gatewayName} নাম্বার দিন (01XXXXXXXXX)` : `Enter valid ${activeMethod.gatewayName} number (01XXXXXXXXX)`;
      } else if (mn === "bank") {
        if (!currentData.bankName) errors.bankName = language.code === 'bn' ? "ব্যাংকের নাম প্রয়োজন" : "Bank name is required";
        if (!currentData.accountHolderName) errors.accountHolderName = language.code === 'bn' ? "একাউন্ট হোল্ডারের নাম প্রয়োজন" : "Account holder name is required";
        if (!currentData.accountNumber) errors.accountNumber = language.code === 'bn' ? "একাউন্ট নাম্বার প্রয়োজন" : "Account number is required";
        if (!currentData.branchName) errors.branchName = language.code === 'bn' ? "ব্রাঞ্চের নাম প্রয়োজন" : "Branch name is required";
        if (!currentData.district) errors.district = language.code === 'bn' ? "জেলা প্রয়োজন" : "District is required";
        if (!currentData.routingNumber) errors.routingNumber = language.code === 'bn' ? "রাউটিং নাম্বার প্রয়োজন" : "Routing number is required";
        if (currentData.routingNumber && !/^\d{9}$/.test(currentData.routingNumber)) errors.routingNumber = language.code === 'bn' ? "রাউটিং নাম্বার ৯ ডিজিট হতে হবে" : "Routing number must be 9 digits";
      }
    }

    if (!amount) errors.amount = language.code === 'bn' ? "পরিমাণ প্রয়োজন" : "Amount is required";
    else if (parseFloat(amount) < MIN_WITHDRAW_AMOUNT) errors.amount = language.code === 'bn' ? `ন্যূনতম উত্তোলনের পরিমাণ ৳${MIN_WITHDRAW_AMOUNT}` : `Minimum withdrawal amount is ৳${MIN_WITHDRAW_AMOUNT}`;
    else if (parseFloat(amount) > parseFloat(activeMethod?.maxAmount || 30000)) errors.amount = language.code === 'bn' ? `সর্বোচ্চ উত্তোলনের পরিমাণ ৳${activeMethod?.maxAmount || 30000}` : `Maximum withdrawal amount is ৳${activeMethod?.maxAmount || 30000}`;
    else if (parseFloat(amount) > (userData?.balance || 0)) errors.amount = language.code === 'bn' ? "পর্যাপ্ত ব্যালেন্স নেই" : "Insufficient balance for this withdrawal";
    else if (!/^\d+$/.test(amount)) errors.amount = language.code === 'bn' ? "পরিমাণ অবশ্যই পূর্ণ সংখ্যা হতে হবে" : "Amount must be a whole number";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsProcessing(true); setTransactionStatus(null);
    try {
      const user  = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("usertoken");
      const cd    = getCurrentMethodData();
      const mn    = activeMethod.gatewayName?.toLowerCase();
      let payload = { method: mn, amount: parseFloat(amount) };
      if (["bkash","rocket","nagad"].includes(mn)) payload.phoneNumber = cd.phoneNumber;
      else if (mn === "bank") Object.assign(payload, { bankName: cd.bankName, accountHolderName: cd.accountHolderName, accountNumber: cd.accountNumber, branchName: cd.branchName, district: cd.district, routingNumber: cd.routingNumber });

      const res = await axios.post(`${API_BASE_URL}/api/user/withdraw`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setTransactionStatus({ success: true, message: res.data.message || (language.code === 'bn' ? "উত্তোলন অনুরোধ সফলভাবে জমা দেওয়া হয়েছে!" : "Withdrawal request submitted successfully!") });
        setUserData(prev => ({ ...prev, balance: prev.balance - parseFloat(amount) }));
        setAmount("");
        if (mn === "bkash") handleInputChange("bkashPhoneNumber", "");
        else if (mn === "rocket") handleInputChange("rocketPhoneNumber", "");
        else if (mn === "nagad") handleInputChange("nagadPhoneNumber", "");
        else if (mn === "bank") ["bankName","accountHolderName","accountNumber","branchName","district","routingNumber"].forEach(f => handleInputChange(f, ""));
        const hr = await axios.get(`${API_BASE_URL}/api/user/withdraw/history/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (hr.data.success) setWithdrawalHistory(hr.data.data);
      } else {
        setTransactionStatus({ success: false, message: res.data.message || (language.code === 'bn' ? "উত্তোলন ব্যর্থ হয়েছে।" : "Withdrawal failed. Please try again.") });
      }
    } catch (err) {
      let msg = language.code === 'bn' ? "উত্তোলন ব্যর্থ হয়েছে।" : "Withdrawal failed. Please try again.";
      if (err.response?.status === 401) msg = language.code === 'bn' ? "অনুগ্রহ করে পুনরায় লগইন করুন।" : "Please login again.";
      else if (err.response?.data?.message) msg = err.response.data.message;
      setTransactionStatus({ success: false, message: msg });
    } finally { setIsProcessing(false); }
  };

  const handleRefreshBalance = async () => {
    try {
      const user  = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("usertoken");
      if (!token) return;
      const res = await axios.get(`${API_BASE_URL}/api/user/all-information/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) { setUserData(res.data.data); setWageringInfo(calculateWageringRequirements(res.data.data)); }
    } catch (err) { console.error("Refresh error:", err); }
  };

  // ── Wagering banner label helpers ──
  const wagerLabel = (bn, en) => language.code === 'bn' ? bn : en;

  const getWagerTitle = () => {
    if (wageringInfo.isBonusWager)
      return wagerLabel("বোনাস ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন হয়নি", "Bonus Wagering Requirement Pending");
    return wagerLabel(`ডিফল্ট ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন হয়নি (${DEFAULT_WAGER_MULTIPLIER}x)`, `Default Wagering Requirement Pending (${DEFAULT_WAGER_MULTIPLIER}x)`);
  };

  const getWagerDesc = () => {
    if (wageringInfo.isBonusWager)
      return wagerLabel(
        `উত্তোলনের আগে আপনাকে ${wageringInfo.multiplier}x ওয়েজারিং প্রয়োজনীয়তা সম্পন্ন করতে হবে।`,
        `You need to complete ${wageringInfo.multiplier}x wagering requirement before you can withdraw.`
      );
    return wagerLabel(
      `আপনার কোনো বোনাস নেই, তবে উত্তোলনের আগে মোট ডিপোজিটের ${DEFAULT_WAGER_MULTIPLIER}x বাজি রাখতে হবে।`,
      `You have no active bonus, but a default ${DEFAULT_WAGER_MULTIPLIER}x of your total deposit must be wagered before withdrawal.`
    );
  };

  const getWagerBaseLabel = () => {
    if (wageringInfo.isBonusWager)
      return wagerLabel(`(${wageringInfo.multiplier}x × ৳${wageringInfo.baseAmount.toLocaleString()})`, `(${wageringInfo.multiplier}x × ৳${wageringInfo.baseAmount.toLocaleString()})`);
    return wagerLabel(`(${DEFAULT_WAGER_MULTIPLIER}x × মোট ডিপোজিট ৳${wageringInfo.baseAmount.toLocaleString()})`, `(${DEFAULT_WAGER_MULTIPLIER}x × total deposit ৳${wageringInfo.baseAmount.toLocaleString()})`);
  };

  // ── KYC Block renderer ──
  const renderKycBlock = () => {
    if (!userData || userData.assignkyc !== "assigned") return null;
    if (userData.kycStatus === "processing") {
      return (
        <div className="mb-6 md:mb-8 overflow-hidden rounded-[2px] border border-[#2a3a35]">
          <div className="h-1 w-full bg-gradient-to-r from-[#2a5c45] via-[#4ecdc4] to-[#2a5c45]" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2.5s linear infinite' }} />
          <style>{`@keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}@keyframes pulse-ring{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.12);opacity:.2}}@keyframes float-dots{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(-4px);opacity:.5}}`}</style>
          <div className="bg-[#111918] p-5 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-[#4ecdc4] opacity-20" style={{ animation: 'pulse-ring 2s ease-in-out infinite' }} />
                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#1a3a30] to-[#0d2520] border-2 border-[#3a8a6f] flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-[#4ecdc4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#4ecdc4]">{language.code === 'bn' ? "KYC যাচাইকরণ পর্যালোচনাধীন" : "KYC Verification Under Review"}</h3>
                  <span className="flex gap-0.5 items-end pb-0.5">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#4ecdc4]" style={{ animation: `float-dots 1.4s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />)}</span>
                </div>
                <p className="text-sm text-[#a8b9c6]">{language.code === 'bn' ? "আপনার নথিপত্র সফলভাবে জমা দেওয়া হয়েছে। আমাদের যাচাইকরণ দল পর্যালোচনা করছে।" : "Your documents have been submitted successfully. Our verification team is reviewing them."}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 md:gap-4 relative">
              <div className="absolute top-5 left-[16.66%] right-[16.66%] h-px bg-[#2a3a35] z-0" />
              {[
                { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>, label: language.code === 'bn' ? "জমা দেওয়া হয়েছে" : "Submitted", done: true },
                { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: language.code === 'bn' ? "পর্যালোচনাধীন" : "Under Review", active: true },
                { icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: language.code === 'bn' ? "অনুমোদিত" : "Approved", pending: true },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${step.done ? "bg-[#2a5c45] border-[#3a8a6f] text-[#4ecdc4]" : step.active ? "bg-[#1a3a30] border-[#4ecdc4] text-[#4ecdc4] shadow-[0_0_12px_rgba(78,205,196,0.3)]" : "bg-[#1a1f1f] border-[#2a2f2f] text-[#4a5b68]"}`}>{step.icon}</div>
                  <p className={`text-xs mt-2 text-center font-medium ${step.done ? "text-[#3a8a6f]" : step.active ? "text-[#4ecdc4]" : "text-[#4a5b68]"}`}>{step.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-3 bg-[#0d2520] border border-[#1a3a30] rounded-lg p-3 md:p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#4ecdc4] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs md:text-sm text-[#a8b9c6]">{language.code === 'bn' ? "সাধারণত ১–২ কার্যদিবসের মধ্যে যাচাইকরণ সম্পন্ন হয়। অনুমোদনের পরে আপনি উত্তোলন করতে পারবেন।" : "Verification is usually completed within 1–2 business days. You will be able to withdraw once approved."}</p>
            </div>
          </div>
        </div>
      );
    }
    const isPending  = userData.kycStatus === "pending";
    const isRejected = userData.kycStatus === "rejected";
    if (!isPending && !isRejected) return null;
    return (
      <div className="bg-[#1a1f1f] rounded-[2px] mb-6 md:mb-8 border border-[#2a2f2f] overflow-hidden">
        <div className={`bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f] p-4 md:p-6 border-b border-[#3a2f2f]`}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 md:h-8 md:w-8 mr-3 flex-shrink-0 ${isRejected ? "text-[#ff6b6b]" : "text-[#e6db74]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className={`text-base md:text-lg font-semibold ${isRejected ? "text-[#ff6b6b]" : "text-[#e6db74]"}`}>
                {isRejected ? (language.code === 'bn' ? "KYC আবেদন প্রত্যাখ্যাত" : "KYC Application Rejected") : (language.code === 'bn' ? "KYC যাচাইকরণ প্রয়োজন" : "KYC Verification Required")}
              </h3>
              <p className="text-xs md:text-sm text-[#a8b9c6] mt-1">
                {isRejected ? (language.code === 'bn' ? "আপনার KYC আবেদন প্রত্যাখ্যান করা হয়েছে। অনুগ্রহ করে সঠিক তথ্য সহ পুনরায় জমা দিন।" : "Your KYC application has been rejected. Please resubmit with correct information.") : (language.code === 'bn' ? "উত্তোলন করতে হলে আপনাকে প্রথমে KYC যাচাইকরণ সম্পন্ন করতে হবে।" : "You need to complete KYC verification before you can withdraw.")}
              </p>
            </div>
          </div>
        </div>
        <KycFormBody isResubmit={isRejected} kycError={kycError} kycSuccess={kycSuccess} kycUploading={kycUploading} overallUploadProgress={overallUploadProgress} kycFormData={kycFormData} uploadProgressFront={uploadProgressFront} frontFileName={frontFileName} uploadProgressBack={uploadProgressBack} backFileName={backFileName} onInputChange={handleKycInputChange} onFileChange={handleKycFileChange} onSubmit={handleKycSubmit} languageCode={language.code} />
      </div>
    );
  };

  const renderMethodFields = () => {
    if (!activeMethod) return null;
    const mn = activeMethod.gatewayName?.toLowerCase();
    const labels = getMethodLabels(mn);
    const isWagerBlocked = wageringInfo.hasRequirement && !wageringInfo.isCompleted;

    const phoneField = (phoneKey) => (
      <div className="mb-4 md:mb-6">
        <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">{labels.phoneLabel}<span className="text-[#ff6b6b] ml-1">*</span></label>
        <input type="tel" className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${formErrors.phoneNumber ? "border-[#ff6b6b]" : "border-[#2a2f2f]"}`} placeholder={labels.phonePlaceholder} value={formData[phoneKey]} onChange={(e) => handleInputChange(phoneKey, e.target.value)} disabled={isWagerBlocked} />
        {formErrors.phoneNumber && <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.phoneNumber}</p>}
      </div>
    );

    if (mn === "bkash")  return phoneField("bkashPhoneNumber");
    if (mn === "rocket") return phoneField("rocketPhoneNumber");
    if (mn === "nagad")  return phoneField("nagadPhoneNumber");
    if (mn === "bank") return (
      <>
        {[
          { key: "bankName",           label: labels.bankName,         placeholder: labels.bankPlaceholder,          error: formErrors.bankName },
          { key: "accountHolderName",  label: labels.accountHolder,    placeholder: labels.accountHolderPlaceholder, error: formErrors.accountHolderName },
          { key: "accountNumber",      label: labels.accountNumber,    placeholder: labels.accountNumberPlaceholder, error: formErrors.accountNumber },
          { key: "branchName",         label: labels.branchName,       placeholder: labels.branchPlaceholder,        error: formErrors.branchName },
          { key: "district",           label: labels.district,         placeholder: labels.districtPlaceholder,      error: formErrors.district },
          { key: "routingNumber",      label: labels.routingNumber,    placeholder: labels.routingPlaceholder,       error: formErrors.routingNumber },
        ].map(({ key, label, placeholder, error }) => (
          <div key={key} className="mb-4 md:mb-6">
            <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">{label}<span className="text-[#ff6b6b] ml-1">*</span></label>
            <input type="text" className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${error ? "border-[#ff6b6b]" : "border-[#2a2f2f]"}`} placeholder={placeholder} value={formData[key]} onChange={(e) => handleInputChange(key, e.target.value)} disabled={isWagerBlocked} />
            {error && <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{error}</p>}
          </div>
        ))}
      </>
    );
    return null;
  };

  const renderPaymentMethodButton = (method) => (
    <button type="button" key={method._id}
      className={`px-3 py-3 md:px-4 md:py-4 rounded-lg flex flex-col items-center justify-center transition-all ${activeMethod?._id === method._id ? "bg-[#1a2a2a] border-2 border-[#3a8a6f]" : "bg-[#1a1f1f] hover:bg-[#1f2525] border-2 border-transparent"}`}
      onClick={() => setActiveMethod(method)}
    >
      <img src={`${API_BASE_URL}/images/${method.image}`} alt={method.gatewayName} className="w-8 h-8 md:w-10 md:h-10 mb-1 md:mb-2 object-contain" />
      <span className="text-xs font-medium">{method.gatewayName}</span>
    </button>
  );

  if (error && !userData) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0a0f0f]">
        <div className="bg-[#1a1f1f] text-[#ff6b6b] p-6 rounded-lg max-w-md text-center border border-[#2a2f2f]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="text-lg font-medium mb-2">{t.error || "Error"}</p>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-[#2a5c45] hover:bg-[#3a6c55] px-4 py-2 rounded-lg text-sm font-medium transition-colors">{t.tryAgain || "Try Again"}</button>
        </div>
      </div>
    );
  }

  const isWagerBlocked = wageringInfo.hasRequirement && !wageringInfo.isCompleted;

  return (
    <div className="h-screen overflow-hidden font-rubik bg-[#0a0f0f] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex overflow-y-auto h-screen">
        <Sidebar isOpen={sidebarOpen} />
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
          <div className="max-w-6xl mx-auto py-4 md:py-8 pb-[30px] p-3 md:p-0">

            {/* Page title */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 text-white">{t.withdrawal || "Withdraw Funds"}</h1>
              <p className="text-sm md:text-base text-[#8a9ba8]">{language.code === 'bn' ? "আপনার অ্যাকাউন্ট থেকে মোবাইল ব্যাংকিং বা ব্যাংকে টাকা উত্তোলন করুন" : "Withdraw money from your account to mobile banking or bank"}</p>
            </div>

            {/* KYC Block */}
            {renderKycBlock()}

            {!isKycRequired() && (
              <>
                {/* ── WAGERING REQUIREMENT BANNER (pending) ── */}
                {isWagerBlocked && (
                  <div className={`rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 border shadow-lg ${wageringInfo.isBonusWager ? "bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f] border-[#3a2f2f]" : "bg-gradient-to-r from-[#1f1f2a] to-[#2a2a3a] border-[#2f2f3a]"}`}>
                    <div className="flex items-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-[#e6db74] mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-[#e6db74]">{getWagerTitle()}</h3>
                        {/* Badge showing which type */}
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${wageringInfo.isBonusWager ? "bg-[#3a2f1a] text-[#e6db74] border border-[#4a3f2a]" : "bg-[#1a1a3a] text-[#a0a0ff] border border-[#2a2a5a]"}`}>
                          {wageringInfo.isBonusWager ? (language.code === 'bn' ? "বোনাস ওয়েজার" : "Bonus Wager") : (language.code === 'bn' ? `ডিফল্ট ${DEFAULT_WAGER_MULTIPLIER}x ওয়েজার` : `Default ${DEFAULT_WAGER_MULTIPLIER}x Wager`)}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm md:text-base text-[#a8b9c6] mb-4">{getWagerDesc()}</p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                      <div className="bg-[#1a1f1f] p-3 rounded-lg">
                        <p className="text-xs md:text-sm text-[#8a9ba8]">{language.code === 'bn' ? "প্রয়োজনীয় ওয়েজারিং" : "Required Wagering"}</p>
                        <p className="text-base md:text-lg font-bold text-white">৳{wageringInfo.required.toLocaleString()}</p>
                        <p className="text-xs text-[#5a6b78] mt-1">{getWagerBaseLabel()}</p>
                      </div>
                      <div className="bg-[#1a1f1f] p-3 rounded-lg">
                        <p className="text-xs md:text-sm text-[#8a9ba8]">{language.code === 'bn' ? "ওয়েজার সম্পন্ন" : "Wagered So Far"}</p>
                        <p className="text-base md:text-lg font-bold text-[#4ecdc4]">৳{wageringInfo.completed.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#1a1f1f] p-3 rounded-lg">
                        <p className="text-xs md:text-sm text-[#8a9ba8]">{language.code === 'bn' ? "বাকি" : "Remaining"}</p>
                        <p className="text-base md:text-lg font-bold text-[#ff6b6b]">৳{wageringInfo.remaining.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-[#8a9ba8] mb-1">
                        <span>{language.code === 'bn' ? "অগ্রগতি" : "Progress"}</span>
                        <span className="font-semibold text-white">{wageringInfo.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-[#1a1f1f] rounded-full h-3 md:h-4">
                        <div
                          className={`h-3 md:h-4 rounded-full transition-all duration-500 ${wageringInfo.isBonusWager ? "bg-gradient-to-r from-[#e6a030] to-[#e6db74]" : "bg-gradient-to-r from-[#3a8a6f] to-[#4ecdc4]"}`}
                          style={{ width: `${wageringInfo.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#ff6b6b] mt-2">
                        <strong>{language.code === 'bn' ? "নোট:" : "Note:"}</strong>{" "}
                        {language.code === 'bn'
                          ? `উত্তোলনের আগে আরও ৳${wageringInfo.remaining.toLocaleString()} বাজি রাখতে হবে।`
                          : `You must wager ৳${wageringInfo.remaining.toLocaleString()} more before you can make a withdrawal.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── WAGERING COMPLETED banner ── */}
                {wageringInfo.hasRequirement && wageringInfo.isCompleted && (
                  <div className="bg-gradient-to-r from-[#1a2a1f] to-[#2a3a2f] rounded-[2px] p-4 md:p-5 mb-6 md:mb-8 border border-[#2a4a35] shadow-lg flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4ecdc4] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-[#4ecdc4]">
                        {wageringInfo.isBonusWager
                          ? wagerLabel("বোনাস ওয়েজারিং সম্পন্ন হয়েছে!", "Bonus Wagering Completed!")
                          : wagerLabel(`ডিফল্ট ${DEFAULT_WAGER_MULTIPLIER}x ওয়েজারিং সম্পন্ন হয়েছে!`, `Default ${DEFAULT_WAGER_MULTIPLIER}x Wagering Completed!`)}
                      </p>
                      <p className="text-xs text-[#a8b9c6]">
                        {language.code === 'bn'
                          ? `আপনি ৳${wageringInfo.completed.toLocaleString()} বাজি রেখেছেন (প্রয়োজন ছিল ৳${wageringInfo.required.toLocaleString()})। উত্তোলন করতে পারবেন।`
                          : `You wagered ৳${wageringInfo.completed.toLocaleString()} of required ৳${wageringInfo.required.toLocaleString()}. You may now withdraw.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Account Info */}
                {userData && (
                  <div className="bg-[#1a1f1f] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 border border-[#2a2f2f] shadow-lg">
                    <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white">{language.code === 'bn' ? "অ্যাকাউন্ট তথ্য" : "Account Information"}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <div><p className="text-xs md:text-sm text-[#8a9ba8]">{t.playerId || "Player ID"}</p><p className="text-sm md:text-base font-medium text-white">{userData.player_id}</p></div>
                      <div><p className="text-xs md:text-sm text-[#8a9ba8]">{t.username || "Username"}</p><p className="text-sm md:text-base font-medium text-white">{userData.username}</p></div>
                      <div><p className="text-xs md:text-sm text-[#8a9ba8]">{t.phone || "Phone"}</p><p className="text-sm md:text-base font-medium text-white">{userData.phone}</p></div>
                    </div>
                  </div>
                )}

                {/* Balance Card */}
                <div className="bg-gradient-to-r from-[#1a2525] to-[#2a3535] rounded-[2px] p-4 md:p-6 mb-6 md:mb-8 shadow-lg border border-[#2a2f2f]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0">
                    <div>
                      <p className="text-xs md:text-sm text-[#a8b9c6]">{language.code === 'bn' ? "বর্তমান ব্যালেন্স" : "Current Balance"}</p>
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white">৳ {userData ? userData.balance?.toLocaleString() : "0.00"}</h2>
                      {userData?.bonusBalance > 0 && <p className="text-xs md:text-sm text-[#4ecdc4] mt-1">{language.code === 'bn' ? "বোনাস ব্যালেন্স:" : "Bonus Balance:"} ৳{userData.bonusBalance?.toLocaleString()}</p>}
                    </div>
                    <button onClick={handleRefreshBalance} className="bg-[#2a5c45] cursor-pointer px-4 py-2 md:px-6 md:py-3 rounded-[5px] text-xs md:text-sm font-medium transition-colors flex items-center hover:bg-[#3a6c55]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      {t.refreshBalance || "Refresh Balance"}
                    </button>
                  </div>
                </div>

                {/* Withdraw Methods */}
                {loadingMethods ? (
                  <div className="bg-[#1a1f1f] rounded-lg p-8 text-center border border-[#2a2f2f]">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative"><div className="w-16 h-16 border-4 border-[#2a2f2f] rounded-full"></div><div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent rounded-full border-t-[#3a8a6f] animate-spin"></div></div>
                      <p className="text-[#8a9ba8] font-medium">{t.loading || "Loading..."}</p>
                    </div>
                  </div>
                ) : withdrawMethods.length === 0 ? (
                  <div className="bg-[#1a1f1f] rounded-[2px] p-8 text-center border border-[#2a2f2f]">
                    <p className="text-[#8a9ba8]">{language.code === 'bn' ? "কোন উত্তোলন পদ্ধতি উপলব্ধ নেই।" : "No withdrawal methods available at the moment."}</p>
                  </div>
                ) : (
                  <div className="bg-[#1a1f1f] rounded-[2px] overflow-hidden mb-6 md:mb-8 border border-[#2a2f2f]">
                    {/* Method tabs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 md:p-4 border-b border-[#2a2f2f]">
                      {withdrawMethods.map(renderPaymentMethodButton)}
                    </div>

                    {activeMethod && (
                      <>
                        {/* Wagering restriction notice inside card */}
                        {isWagerBlocked && (
                          <div className="p-4 md:p-5 border-t border-[#2a2f2f] bg-gradient-to-r from-[#2a1f1f] to-[#3a2f2f]">
                            <div className="flex items-start gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#ff6b6b] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                              <div>
                                <p className="text-sm font-semibold text-[#ff6b6b]">{language.code === 'bn' ? "উত্তোলন সীমাবদ্ধ" : "Withdrawal Restricted"}</p>
                                <p className="text-xs text-[#ff6b6b] mt-0.5">
                                  {wageringInfo.isBonusWager
                                    ? (language.code === 'bn' ? `বোনাস ওয়েজারিং: আরও ৳${wageringInfo.remaining.toLocaleString()} বাজি রাখতে হবে (${wageringInfo.progress.toFixed(1)}% সম্পন্ন)` : `Bonus wagering: Need ৳${wageringInfo.remaining.toLocaleString()} more (${wageringInfo.progress.toFixed(1)}% done)`)
                                    : (language.code === 'bn' ? `ডিফল্ট ${DEFAULT_WAGER_MULTIPLIER}x ওয়েজার: আরও ৳${wageringInfo.remaining.toLocaleString()} বাজি রাখতে হবে (${wageringInfo.progress.toFixed(1)}% সম্পন্ন)` : `Default ${DEFAULT_WAGER_MULTIPLIER}x wager: Need ৳${wageringInfo.remaining.toLocaleString()} more (${wageringInfo.progress.toFixed(1)}% done)`)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Instructions */}
                        <div className="p-4 md:p-6 border-t border-[#2a2f2f]">
                          <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#3a8a6f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {activeMethod.gatewayName} {language.code === 'bn' ? "উত্তোলন নির্দেশনা" : "Withdrawal Instructions"}
                          </h3>
                          <ul className="text-xs md:text-sm text-[#8a9ba8] space-y-2 md:space-y-3">
                            {getPaymentInstructions(activeMethod).map((step, i) => (
                              <li key={i} className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span><strong>{step.step}:</strong> {step.description}</span></li>
                            ))}
                          </ul>
                        </div>

                        {/* Charges */}
                        <div className="p-4 md:p-6 border-t border-[#2a2f2f] bg-[#1f2525]">
                          <h4 className="text-sm md:text-base font-semibold mb-3 text-white">{language.code === 'bn' ? "চার্জের তথ্য" : "Charges Information"}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm">
                            <div><p className="text-[#8a9ba8]">{language.code === 'bn' ? "ন্যূনতম পরিমাণ" : "Min Amount"}</p><p className="text-white font-medium">৳{MIN_WITHDRAW_AMOUNT}</p></div>
                            <div><p className="text-[#8a9ba8]">{language.code === 'bn' ? "সর্বোচ্চ পরিমাণ" : "Max Amount"}</p><p className="text-white font-medium">৳{activeMethod.maxAmount}</p></div>
                          </div>
                        </div>

                        {/* Form */}
                        <div className="p-4 md:p-6">
                          <form onSubmit={handleSubmit}>
                            {renderMethodFields()}

                            <div className="mb-4 md:mb-6">
                              <label className="block text-[#8a9ba8] text-xs md:text-sm mb-1 md:mb-2 font-medium">
                                {language.code === 'bn' ? "পরিমাণ (৳)" : "Amount (৳)"}<span className="text-[#ff6b6b] ml-1">*</span>
                              </label>
                              <input
                                type="number"
                                className={`w-full bg-[#1f2525] border rounded-lg p-3 md:p-4 text-sm md:text-base text-white placeholder-[#5a6b78] focus:outline-none focus:ring-2 focus:ring-[#3a8a6f] ${formErrors.amount ? "border-[#ff6b6b]" : "border-[#2a2f2f]"}`}
                                placeholder={language.code === 'bn' ? `পরিমাণ লিখুন (ন্যূনতম: ৳${MIN_WITHDRAW_AMOUNT}, সর্বোচ্চ: ৳${activeMethod.maxAmount})` : `Enter amount (Min: ৳${MIN_WITHDRAW_AMOUNT}, Max: ৳${activeMethod.maxAmount})`}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min={MIN_WITHDRAW_AMOUNT}
                                max={Math.min(activeMethod.maxAmount, userData?.balance || 0)}
                                required
                                disabled={isWagerBlocked}
                              />
                              {formErrors.amount && <p className="text-[#ff6b6b] text-xs md:text-sm mt-1">{formErrors.amount}</p>}
                              <div className="flex flex-wrap gap-2 mt-3 md:mt-4">
                                {quickAmounts.map((qa) => (
                                  <button key={qa} type="button"
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${amount === qa.toString() ? "bg-[#2a5c45] text-white" : "bg-[#1f2525] text-[#8a9ba8] hover:bg-[#252b2b]"}`}
                                    onClick={() => setAmount(qa.toString())}
                                    disabled={isWagerBlocked || qa > (userData?.balance || 0) || qa > activeMethod.maxAmount || qa < MIN_WITHDRAW_AMOUNT}
                                  >৳ {qa.toLocaleString()}</button>
                                ))}
                              </div>
                            </div>

                            {formErrors.wagering && (
                              <div className="mb-4 p-3 bg-[#2a1f1f] border border-[#ff6b6b] rounded-lg">
                                <p className="text-[#ff6b6b] text-xs md:text-sm">{formErrors.wagering}</p>
                              </div>
                            )}

                            <button
                              className="w-full bg-gradient-to-r from-[#2a5c45] to-[#3a6c55] hover:from-[#3a6c55] hover:to-[#4a7c65] py-3 md:py-4 rounded-lg text-sm md:text-base text-white font-medium flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                              type="submit"
                              disabled={isWagerBlocked || isProcessing || !amount || parseFloat(amount) > (userData?.balance || 0) || parseFloat(amount) < MIN_WITHDRAW_AMOUNT || parseFloat(amount) > parseFloat(activeMethod?.maxAmount || 30000)}
                            >
                              {isWagerBlocked ? (
                                language.code === 'bn'
                                  ? (wageringInfo.isBonusWager ? "প্রথমে বোনাস ওয়েজারিং সম্পন্ন করুন" : `প্রথমে ${DEFAULT_WAGER_MULTIPLIER}x ডিফল্ট ওয়েজারিং সম্পন্ন করুন`)
                                  : (wageringInfo.isBonusWager ? "Complete Bonus Wagering First" : `Complete ${DEFAULT_WAGER_MULTIPLIER}x Default Wagering First`)
                              ) : isProcessing ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  {language.code === 'bn' ? "প্রক্রিয়াকরণ..." : "Processing..."}
                                </>
                              ) : (
                                `${language.code === 'bn' ? "উত্তোলন করুন" : "Withdraw to"} ${activeMethod.gatewayName}`
                              )}
                            </button>
                          </form>

                          {transactionStatus && (
                            <div className={`mt-3 md:mt-4 p-3 md:p-4 rounded-lg text-xs md:text-sm ${transactionStatus.success ? "bg-[#1a2525] text-[#4ecdc4] border border-[#2a3535]" : "bg-[#2a1f1f] text-[#ff6b6b] border border-[#3a2f2f]"}`}>
                              <div className="flex items-center">
                                {transactionStatus.success
                                  ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                  : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
                                {transactionStatus.message}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Info + History */}
                <div className="grid grid-cols-1 gap-6 md:gap-8">
                  {activeMethod && (
                    <div className="bg-[#1a1f1f] rounded-[2px] p-4 md:p-6 border border-[#2a2f2f]">
                      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2 text-[#3a8a6f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {language.code === 'bn' ? "উত্তোলনের তথ্য" : "Withdrawal Information"}
                      </h3>
                      <ul className="text-xs md:text-sm text-[#8a9ba8] space-y-2 md:space-y-3">
                        <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? "ন্যূনতম উত্তোলনের পরিমাণ:" : "Minimum withdrawal amount:"} ৳{MIN_WITHDRAW_AMOUNT}</span></li>
                        <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? "সর্বোচ্চ উত্তোলনের পরিমাণ:" : "Maximum withdrawal amount:"} ৳{activeMethod?.maxAmount || 30000}</span></li>
                        {wageringInfo.isBonusWager && (
                          <>
                            <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? `বোনাস ওয়েজারিং প্রয়োজনীয়তা: ${wageringInfo.multiplier}x ডিপোজিট` : `Bonus wagering requirement: ${wageringInfo.multiplier}x deposit`}</span></li>
                            <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? "প্রয়োজনীয় ওয়েজারিং:" : "Required wagering:"} ৳{wageringInfo.required.toLocaleString()}</span></li>
                          </>
                        )}
                        {wageringInfo.isDefaultWager && (
                          <>
                            <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? `ডিফল্ট ওয়েজারিং প্রয়োজনীয়তা: মোট ডিপোজিটের ${DEFAULT_WAGER_MULTIPLIER}x` : `Default wagering requirement: ${DEFAULT_WAGER_MULTIPLIER}x of total deposit`}</span></li>
                            <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? "প্রয়োজনীয় ওয়েজারিং:" : "Required wagering:"} ৳{wageringInfo.required.toLocaleString()}</span></li>
                          </>
                        )}
                        <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? "সম্পন্ন ওয়েজারিং:" : "Completed wagering:"} ৳{wageringInfo.completed.toLocaleString()}</span></li>
                        <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? "উত্তোলন প্রক্রিয়াকরণ সময়: ৫-৩০ মিনিট" : "Withdrawal processing time: 5-30 minutes"}</span></li>
                        <li className="flex items-start"><span className="text-[#3a8a6f] mr-2">•</span><span>{language.code === 'bn' ? "কোন সমস্যা হলে সাপোর্টে যোগাযোগ করুন" : "Contact support if you face any issues"}</span></li>
                      </ul>
                    </div>
                  )}

                  {/* Transaction History */}
                  <div className="bg-[#1a1f1f] rounded-[2px] overflow-hidden border border-[#2a2f2f]">
                    <div className="p-4 md:p-6 border-b border-[#2a2f2f] flex justify-between items-center">
                      <h3 className="text-base md:text-lg font-semibold text-white">{language.code === 'bn' ? "সাম্প্রতিক উত্তোলন" : "Recent Withdrawals"}</h3>
                      <button className="text-[#3a8a6f] text-xs md:text-sm hover:text-[#4a9a7f] transition-colors">{t.viewAll || "View All"}</button>
                    </div>
                    <div className="p-3 md:p-4">
                      {withdrawalHistory.length > 0 ? (
                        <div className="space-y-3 md:space-y-4">
                          {withdrawalHistory.slice(0, 5).map((tx, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-[#1f2525] rounded-lg hover:bg-[#252b2b] transition-colors">
                              <div className="flex items-center">
                                <div className={`p-1.5 md:p-2 rounded-full mr-2 md:mr-3 ${tx.status === "completed" ? "bg-[#1a2525] text-[#4ecdc4]" : tx.status === "pending" ? "bg-[#2a2a1f] text-[#e6db74]" : "bg-[#2a1f1f] text-[#ff6b6b]"}`}>
                                  {tx.status === "completed"
                                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    : tx.status === "pending"
                                    ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>}
                                </div>
                                <div>
                                  <p className="text-xs md:text-sm font-medium text-white">{new Date(tx.date || tx.createdAt).toLocaleDateString(language.code === 'bn' ? 'bn-BD' : 'en-US')}</p>
                                  <p className="text-xs text-[#8a9ba8] capitalize">{tx.method}</p>
                                  {tx.details && <p className="text-xs text-[#8a9ba8]">{tx.details.phoneNumber || tx.details.accountNumber}</p>}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs md:text-sm font-medium text-white">৳ {tx.amount?.toLocaleString()}</p>
                                <p className={`text-xs ${tx.status === "completed" ? "text-[#4ecdc4]" : tx.status === "pending" ? "text-[#e6db74]" : "text-[#ff6b6b]"}`}>
                                  {tx.status === "completed" ? (language.code === 'bn' ? "সম্পূর্ণ" : "Completed") : tx.status === "pending" ? (language.code === 'bn' ? "মুলতুবি" : "Pending") : (language.code === 'bn' ? "ব্যর্থ" : "Failed")}
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
                          <p className="text-sm md:text-base">{language.code === 'bn' ? "কোন সাম্প্রতিক উত্তোলন নেই" : "No recent withdrawals"}</p>
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