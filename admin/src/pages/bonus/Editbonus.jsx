import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaPercentage, FaGift, FaSpinner, FaTimes, FaInfoCircle } from 'react-icons/fa';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useNavigate, useParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { FaBangladeshiTakaSign } from "react-icons/fa6";

const Editbonus = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const bonusTypes = ['welcome', 'deposit', 'reload', 'cashback', 'free_spin', 'special', 'manual'];

  const [formData, setFormData] = useState({
    name: '', bonusCode: '', bonusType: 'deposit', amount: 0, percentage: 0,
    minDeposit: 0, maxBonus: null, wageringRequirement: 0, validityDays: 30,
    status: 'active', applicableTo: 'all', startDate: new Date().toISOString().split('T')[0], endDate: '', createdBy: null,
  });
  const [errors, setErrors] = useState({});
  const [originalData, setOriginalData] = useState(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchBonusData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${base_url}/api/admin/bonuses/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch bonus data');
        if (data.success && data.bonus) {
          const bonus = data.bonus;
          const startDate = bonus.startDate ? new Date(bonus.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const endDate = bonus.endDate ? new Date(bonus.endDate).toISOString().split('T')[0] : '';
          setFormData({ name: bonus.name || '', bonusCode: bonus.bonusCode || '', bonusType: bonus.bonusType || 'deposit', amount: bonus.amount || 0, percentage: bonus.percentage || 0, minDeposit: bonus.minDeposit || 0, maxBonus: bonus.maxBonus !== undefined ? bonus.maxBonus : null, wageringRequirement: bonus.wageringRequirement || 0, validityDays: bonus.validityDays || 30, status: bonus.status || 'active', applicableTo: bonus.applicableTo || 'all', startDate, endDate, createdBy: bonus.createdBy || null });
          setOriginalData(bonus);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load bonus data');
        setTimeout(() => navigate(-1), 2000);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBonusData();
  }, [id, base_url, navigate]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let processedValue;
    if (type === 'number') { processedValue = value === '' ? '' : parseFloat(value); if (isNaN(processedValue)) processedValue = ''; }
    else processedValue = value;
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Bonus name is required';
    else if (formData.name.length < 3) newErrors.name = 'Bonus name must be at least 3 characters';
    if (formData.amount <= 0 && formData.percentage <= 0) { newErrors.amount = 'Either amount or percentage must be greater than 0'; newErrors.percentage = 'Either amount or percentage must be greater than 0'; }
    if (formData.amount < 0) newErrors.amount = 'Amount cannot be negative';
    if (formData.percentage < 0) newErrors.percentage = 'Percentage cannot be negative';
    else if (formData.percentage > 500) newErrors.percentage = 'Percentage cannot exceed 500%';
    if (formData.minDeposit < 0) newErrors.minDeposit = 'Minimum deposit cannot be negative';
    if (formData.maxBonus !== null && formData.maxBonus < 0) newErrors.maxBonus = 'Maximum bonus cannot be negative';
    if (formData.wageringRequirement < 0) newErrors.wageringRequirement = 'Wagering requirement cannot be negative';
    else if (formData.wageringRequirement > 100) newErrors.wageringRequirement = 'Wagering requirement cannot exceed 100x';
    if (formData.validityDays <= 0) newErrors.validityDays = 'Validity days must be greater than 0';
    else if (formData.validityDays > 365) newErrors.validityDays = 'Validity days cannot exceed 365 days';
    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) newErrors.endDate = 'End date must be after start date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) { toast.error('Please fix the form errors before submitting'); return; }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${base_url}/api/admin/bonuses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
        body: JSON.stringify({ ...formData, amount: formData.amount || 0, percentage: formData.percentage || 0, maxBonus: formData.maxBonus === '' ? null : formData.maxBonus, endDate: formData.endDate === '' ? null : formData.endDate }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update bonus');
      toast.success('Bonus updated successfully!');
      setOriginalData(data.bonus);
      setTimeout(() => navigate(-1), 2000);
    } catch (error) {
      toast.error(error.message || 'Failed to update bonus');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      const startDate = originalData.startDate ? new Date(originalData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const endDate = originalData.endDate ? new Date(originalData.endDate).toISOString().split('T')[0] : '';
      setFormData({ name: originalData.name || '', bonusCode: originalData.bonusCode || '', bonusType: originalData.bonusType || 'deposit', amount: originalData.amount || 0, percentage: originalData.percentage || 0, minDeposit: originalData.minDeposit || 0, maxBonus: originalData.maxBonus !== undefined ? originalData.maxBonus : null, wageringRequirement: originalData.wageringRequirement || 0, validityDays: originalData.validityDays || 30, status: originalData.status || 'active', applicableTo: originalData.applicableTo || 'all', startDate, endDate, createdBy: originalData.createdBy || null });
    }
    setErrors({});
  };

  const calculateBonusFromPercentage = () => {
    if (formData.percentage > 0 && formData.minDeposit > 0) {
      const calculated = (formData.minDeposit * formData.percentage) / 100;
      if (formData.maxBonus && calculated > formData.maxBonus) return formData.maxBonus;
      return calculated;
    }
    return formData.amount;
  };

  const formatBonusType = (type) => type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const getBonusTypeIcon = (type) => ({ welcome: '🎉', deposit: '💰', reload: '🔄', cashback: '💸', free_spin: '🎰', special: '⭐', manual: '✏️' }[type] || '🎁');
  const getApplicableToLabel = (type) => ({ all: 'All Users', new: 'New Users Only', existing: 'Existing Users Only' }[type] || type);

  const inputClass = (field) =>
    `w-full bg-[#0F111A] border ${errors[field] ? 'border-rose-500' : 'border-gray-700'} text-gray-200 text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-amber-500 placeholder-gray-600 transition-colors`;
  const labelClass = 'block text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2';

  if (loading) {
    return (
      <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="flex items-center justify-center h-full flex-col gap-3">
              <FaSpinner className="animate-spin text-amber-400 text-2xl" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Loading bonus data...</p>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase">Edit Bonus</h1>
              <p className="text-xs font-bold text-gray-500 mt-1">{originalData?.name || formData.name}</p>
              {originalData?.createdBy && (
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Created by: <span className="text-gray-500">{originalData.createdBy.username}</span> &nbsp;·&nbsp;
                  Last updated: <span className="text-gray-500">{new Date(originalData.updatedAt || originalData.createdAt).toLocaleDateString()}</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleCancel} className="bg-[#1F2937] hover:bg-[#374151] border border-gray-700 px-4 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-gray-400">
                <FaTimes /> Reset
              </button>
              <button onClick={() => navigate(-1)} className="bg-[#1F2937] hover:bg-[#374151] border border-gray-700 px-4 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-gray-400">
                ← Back
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left Column */}
              <div className="space-y-5">
                {/* Basic Info */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2"><div className="w-1 h-4 bg-amber-500"></div> Basic Info</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Bonus Name <span className="text-rose-400">*</span></label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Welcome Bonus 2024" className={inputClass('name')} />
                      {errors.name && <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1"><FaInfoCircle /> {errors.name}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Bonus Code</label>
                      <input type="text" name="bonusCode" value={formData.bonusCode} onChange={handleInputChange} placeholder="WELCOME2024" className={inputClass('bonusCode') + ' uppercase'} maxLength={20} />
                      <p className="mt-1 text-[10px] text-gray-600">Uppercase letters and numbers only</p>
                    </div>
                    <div>
                      <label className={labelClass}>Applicable To</label>
                      <div className="flex gap-2">
                        {['all', 'new', 'existing'].map((opt) => (
                          <button key={opt} type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, applicableTo: opt }))}
                            className={`flex-1 py-2 rounded text-xs font-bold border transition-all uppercase tracking-wide ${formData.applicableTo === opt ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#0F111A] border-gray-700 text-gray-400 hover:border-amber-500/50'}`}
                          >{opt}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonus Type */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2"><div className="w-1 h-4 bg-amber-500"></div> Bonus Type</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {bonusTypes.map((type) => (
                      <button key={type} type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, bonusType: type }))}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-center gap-2 ${formData.bonusType === type ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-gray-700 bg-[#0F111A] text-gray-500 hover:border-amber-500/40 hover:text-gray-300'}`}
                      >
                        <span className="text-lg">{getBonusTypeIcon(type)}</span>
                        <span className="text-[10px] font-bold">{formatBonusType(type)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Value Settings */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2"><div className="w-1 h-4 bg-amber-500"></div> Value Settings</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Fixed Amount (BDT)</label>
                      <div className="relative">
                        <FaBangladeshiTakaSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                        <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} min="0" step="0.01" className={inputClass('amount') + ' pl-8'} />
                      </div>
                      {errors.amount && <p className="mt-1 text-xs text-rose-400">{errors.amount}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Percentage (%)</label>
                      <div className="relative">
                        <FaPercentage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                        <input type="number" name="percentage" value={formData.percentage} onChange={handleInputChange} min="0" max="500" step="0.1" className={inputClass('percentage') + ' pl-8'} />
                      </div>
                      {errors.percentage && <p className="mt-1 text-xs text-rose-400">{errors.percentage}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Min Deposit (BDT)</label>
                      <input type="number" name="minDeposit" value={formData.minDeposit} onChange={handleInputChange} min="0" step="0.01" className={inputClass('minDeposit')} />
                      {errors.minDeposit && <p className="mt-1 text-xs text-rose-400">{errors.minDeposit}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Max Bonus (BDT)</label>
                      <input type="number" name="maxBonus" value={formData.maxBonus === null ? '' : formData.maxBonus} onChange={handleInputChange} min="0" step="0.01" placeholder="No limit" className={inputClass('maxBonus')} />
                      {errors.maxBonus && <p className="mt-1 text-xs text-rose-400">{errors.maxBonus}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Requirements */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2"><div className="w-1 h-4 bg-amber-500"></div> Requirements</p>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className={labelClass + ' mb-0'}>Wagering Requirement</label>
                        <span className="text-lg font-black text-amber-400">{formData.wageringRequirement}x</span>
                      </div>
                      <input type="range" name="wageringRequirement" value={formData.wageringRequirement} onChange={handleInputChange} min="0" max="100" step="1" className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                      <div className="flex justify-between text-[10px] text-gray-600 mt-1.5"><span>No Requirement</span><span>100x</span></div>
                      <p className="mt-2 text-[10px] text-gray-600">Players must wager bonus {formData.wageringRequirement} times before withdrawal</p>
                      {errors.wageringRequirement && <p className="mt-1 text-xs text-rose-400">{errors.wageringRequirement}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Validity Period (Days)</label>
                      <input type="number" name="validityDays" value={formData.validityDays} onChange={handleInputChange} min="1" max="365" className={inputClass('validityDays')} />
                      {errors.validityDays && <p className="mt-1 text-xs text-rose-400">{errors.validityDays}</p>}
                      <p className="mt-1.5 text-[10px] text-gray-600">Bonus expires after {formData.validityDays} days from activation</p>
                    </div>
                  </div>
                </div>

                {/* Schedule & Status */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2"><div className="w-1 h-4 bg-amber-500"></div> Schedule & Status</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Start Date</label>
                        <div className="relative">
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                          <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={inputClass('startDate') + ' pl-8'} />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>End Date (Optional)</label>
                        <div className="relative">
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
                          <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} min={formData.startDate} className={inputClass('endDate') + ' pl-8'} />
                        </div>
                        {errors.endDate && <p className="mt-1 text-xs text-rose-400">{errors.endDate}</p>}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <div className="flex gap-3">
                        {['active', 'inactive'].map((s) => (
                          <label key={s} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="status" value={s} checked={formData.status === s} onChange={handleInputChange} className="accent-amber-500" />
                            <span className={`text-xs font-bold uppercase ${formData.status === s ? (s === 'active' ? 'text-emerald-400' : 'text-gray-400') : 'text-gray-600'}`}>{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-[#161B22] border border-gray-800 rounded-lg p-5">
                  <div className="bg-[#1C2128] -mx-5 -mt-5 px-5 py-3 mb-5 border-b border-gray-800">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2"><div className="w-1 h-4 bg-amber-500"></div> <FaGift /> Preview</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {[
                      { label: 'Type', value: `${getBonusTypeIcon(formData.bonusType)} ${formatBonusType(formData.bonusType)}` },
                      { label: 'Value', value: formData.amount > 0 ? `৳${formData.amount.toFixed(2)}` : formData.percentage > 0 ? `${formData.percentage}%` : '—', valueClass: 'text-amber-400' },
                      { label: 'Wagering', value: `${formData.wageringRequirement}x`, valueClass: 'text-indigo-400' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#0F111A] border border-gray-800 p-3 rounded">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-black mb-1">{item.label}</p>
                        <p className={`text-xs font-bold ${item.valueClass || 'text-white'}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {formData.minDeposit > 0 && formData.percentage > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Example</p>
                      <p className="text-xs text-gray-300">Deposit <span className="text-white font-bold">৳{formData.minDeposit.toFixed(2)}</span> → Get <span className="text-emerald-400 font-bold">৳{calculateBonusFromPercentage().toFixed(2)}</span> bonus</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleCancel} className="px-6 py-3 bg-[#1F2937] border border-gray-700 text-gray-300 rounded font-bold text-xs uppercase tracking-wider hover:border-gray-500 transition-all">
                Reset Changes
              </button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                {isSubmitting ? <><FaSpinner className="animate-spin" /> Updating...</> : <><FaGift /> Update Bonus</>}
              </button>
            </div>
          </form>
        </main>
      </div>
    </section>
  );
};

export default Editbonus;