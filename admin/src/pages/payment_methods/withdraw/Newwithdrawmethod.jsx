import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineCamera } from "react-icons/ai";
import { FaPlus, FaTrash, FaSave, FaTimes, FaArrowLeft, FaDollarSign, FaPercentage, FaMoneyBillWave, FaInfoCircle } from 'react-icons/fa';
import Swal from "sweetalert2";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';

const Newwithdrawmethod = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const admin_info = JSON.parse(localStorage.getItem("admin"));
  
  const [formData, setFormData] = useState({
    image: null,
    gatewayName: "",
    currencyName: "",
    minAmount: "",
    maxAmount: "",
    fixedCharge: "",
    percentCharge: "",
    rate: "",
    withdrawInstruction: "",
    userData: [],
    createdbyid: admin_info?.id || ""
  });

  const [uploadedImage, setUploadedImage] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    type: "",
    isRequired: "",
    label: "",
    width: "",
    instruction: ""
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-gray-600';
  const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500';

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFieldFormChange = (e) => {
    const { name, value } = e.target;
    setFieldForm({ ...fieldForm, [name]: value });
  };

  const handleAddField = () => {
    if (!fieldForm.type || !fieldForm.isRequired || !fieldForm.label || !fieldForm.width) {
      toast.error("Please fill all required fields");
      return;
    }
    
    setFormData({
      ...formData,
      userData: [...formData.userData, fieldForm]
    });
    
    setFieldForm({
      type: "",
      isRequired: "",
      label: "",
      width: "",
      instruction: ""
    });
    
    setShowPopup(false);
    toast.success("New field added successfully");
  };

  const handleDeleteField = (index) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This field will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#f59e0b",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      background: "#161B22",
      color: "#e5e7eb"
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedFields = formData.userData.filter((_, i) => i !== index);
        setFormData({ ...formData, userData: updatedFields });
        toast.success("Field deleted successfully");
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.gatewayName || !formData.currencyName || !formData.rate || 
        !formData.minAmount || !formData.maxAmount) {
      toast.error("Please fill all required fields");
      return;
    }

    const form_data = new FormData();
    for (const key in formData) {
      if (key === "userData") {
        form_data.append(key, JSON.stringify(formData[key]));
      } else if (formData[key] !== null && formData[key] !== "") {
        form_data.append(key, formData[key]);
      }
    }

    try {
      const res = await axios.post(
        `${base_url}/api/admin/manual-withdraw`,
        form_data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      Swal.fire({
        title: "Success",
        text: res.data.message,
        icon: "success",
        background: "#161B22",
        color: "#e5e7eb"
      }).then(() => {
        navigate('/payment-method/all-withdraw-method');
      });
    } catch (err) {
      console.error("Error:", err);
      toast.error(err.response?.data?.message || "Failed to add withdrawal method");
    }
  };

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="p-6">
            <form onSubmit={handleSubmit} className="bg-[#161B22] border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              
              {/* Header */}
              <div className="bg-[#1C2128] px-6 py-5 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tighter uppercase flex items-center gap-2">
                    Add Withdrawal Method
                  </h1>
                  <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-2">
                    Create a new withdrawal gateway for your users
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/payment-method/all-withdraw-method')}
                  className="bg-[#0F111A] hover:bg-amber-600/20 border border-gray-700 hover:border-amber-500/40 px-5 py-2 rounded font-bold text-xs transition-all flex items-center gap-2 text-amber-400"
                >
                  <FaArrowLeft /> BACK TO LIST
                </button>
              </div>

              <div className="p-6 space-y-8">
                
                {/* Image Upload Section */}
                <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Method Image</h2>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="relative w-32 h-32 bg-[#0F111A] border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center hover:border-amber-500 transition-colors group cursor-pointer">
                      {uploadedImage ? (
                        <img 
                          src={uploadedImage} 
                          alt="Gateway" 
                          className="w-full h-full object-contain rounded-lg" 
                        />
                      ) : (
                        <div className="text-center">
                          <AiOutlineCamera className="text-gray-600 text-3xl mx-auto group-hover:text-amber-400 transition-colors" />
                          <p className="text-[9px] text-gray-600 mt-1">Click to upload</p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleImageUpload}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Click the box to upload a gateway image</p>
                      <p className="text-[10px] text-gray-600 mt-1">Recommended: 200x200px PNG or JPG</p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Basic Information</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className={labelClass}>Method Name <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        name="gatewayName"
                        value={formData.gatewayName}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                        placeholder="e.g., bKash, Nagad, Bank Transfer"
                      />
                    </div>
                    
                    <div>
                      <label className={labelClass}>Currency <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        name="currencyName"
                        value={formData.currencyName}
                        onChange={handleInputChange}
                        className={inputClass}
                        required
                        placeholder="e.g., BDT, USD"
                      />
                    </div>
                    
                    <div>
                      <label className={labelClass}>Exchange Rate (1 USD = ?) <span className="text-rose-400">*</span></label>
                      <div className="relative">
                        <input
                          type="number"
                          name="rate"
                          value={formData.rate}
                          onChange={handleInputChange}
                          className={`${inputClass} pr-16`}
                          placeholder="1.00"
                          step="0.01"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-400 bg-[#1C2128] px-2 py-0.5 rounded">
                          {formData.currencyName || 'CUR'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount Range & Charges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Amount Range */}
                  <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Amount Range</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Minimum Amount <span className="text-rose-400">*</span></label>
                        <div className="relative">
                          <input
                            type="number"
                            name="minAmount"
                            value={formData.minAmount}
                            onChange={handleInputChange}
                            className={`${inputClass} pr-16`}
                            required
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 bg-[#1C2128] px-2 py-0.5 rounded">
                            BDT
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Maximum Amount <span className="text-rose-400">*</span></label>
                        <div className="relative">
                          <input
                            type="number"
                            name="maxAmount"
                            value={formData.maxAmount}
                            onChange={handleInputChange}
                            className={`${inputClass} pr-16`}
                            required
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 bg-[#1C2128] px-2 py-0.5 rounded">
                            BDT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charges */}
                  <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-1 h-5 bg-rose-500 rounded-full"></div>
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-rose-400">Transaction Charges</h2>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Fixed Charge <span className="text-rose-400">*</span></label>
                        <div className="relative">
                          <input
                            type="number"
                            name="fixedCharge"
                            value={formData.fixedCharge}
                            onChange={handleInputChange}
                            className={`${inputClass} pr-16`}
                            required
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-400 bg-[#1C2128] px-2 py-0.5 rounded">
                            BDT
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Percent Charge <span className="text-rose-400">*</span></label>
                        <div className="relative">
                          <input
                            type="number"
                            name="percentCharge"
                            value={formData.percentCharge}
                            onChange={handleInputChange}
                            className={`${inputClass} pr-12`}
                            required
                            step="0.01"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-400 bg-[#1C2128] px-2 py-0.5 rounded">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Withdrawal Instructions */}
                <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Withdrawal Instructions</h2>
                  </div>
                  <textarea
                    name="withdrawInstruction"
                    value={formData.withdrawInstruction}
                    onChange={handleInputChange}
                    className="w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg p-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-gray-600 min-h-[150px]"
                    placeholder="Enter detailed withdrawal instructions for users..."
                  />
                </div>

                {/* User Data Fields */}
                <div className="bg-[#0F111A] border border-gray-800 rounded-lg p-5">
                  <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400">Custom Form Fields</h2>
                      </div>
                      <p className="text-[9px] text-gray-500 mt-1">Add custom fields for user information</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPopup(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <FaPlus /> ADD FIELD
                    </button>
                  </div>
                  
                  {formData.userData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-800 rounded-lg overflow-hidden">
                        <thead className="bg-[#1C2128]">
                          <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-left">Required</th>
                            <th className="px-4 py-3 text-left">Label</th>
                            <th className="px-4 py-3 text-left">Width</th>
                            <th className="px-4 py-3 text-left">Instruction</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {formData.userData.map((field, index) => (
                            <tr key={index} className="hover:bg-[#1C2128] transition-colors">
                              <td className="px-4 py-3 text-xs text-gray-300 capitalize">{field.type}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase ${field.isRequired === 'required' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                  {field.isRequired}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-300">{field.label}</td>
                              <td className="px-4 py-3 text-xs text-gray-300 capitalize">{field.width}</td>
                              <td className="px-4 py-3 text-xs text-gray-400">{field.instruction || '-'}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteField(index)}
                                  className="text-rose-400 hover:text-rose-300 transition-colors"
                                  title="Delete Field"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-gray-800 rounded-lg bg-[#0F111A]">
                      <FaPlus className="text-gray-600 text-2xl mx-auto mb-2" />
                      <p className="text-xs">No custom fields added yet</p>
                      <p className="text-[10px] mt-1 text-gray-600">Click "Add Field" to create custom form inputs for users</p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <FaSave /> CREATE WITHDRAWAL METHOD
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/payment-method/all-withdraw-method')}
                    className="px-6 bg-[#1C2128] hover:bg-gray-700 border border-gray-700 text-gray-300 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <FaTimes /> CANCEL
                  </button>
                </div>
              </div>
            </form>

            {/* Add Field Modal */}
            {showPopup && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
                <div className="bg-[#161B22] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md">
                  <div className="bg-[#1C2128] px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                      <FaPlus /> Add New Field
                    </h3>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className={labelClass}>Field Type <span className="text-rose-400">*</span></label>
                      <select
                        name="type"
                        value={fieldForm.type}
                        onChange={handleFieldFormChange}
                        className={selectClass}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="text">Text</option>
                        <option value="file">File</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={labelClass}>Required <span className="text-rose-400">*</span></label>
                      <select
                        name="isRequired"
                        value={fieldForm.isRequired}
                        onChange={handleFieldFormChange}
                        className={selectClass}
                        required
                      >
                        <option value="">Select Option</option>
                        <option value="required">Required</option>
                        <option value="optional">Optional</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={labelClass}>Label <span className="text-rose-400">*</span></label>
                      <input
                        type="text"
                        name="label"
                        value={fieldForm.label}
                        onChange={handleFieldFormChange}
                        className={inputClass}
                        placeholder="e.g., Account Number, Bank Name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className={labelClass}>Width <span className="text-rose-400">*</span></label>
                      <select
                        name="width"
                        value={fieldForm.width}
                        onChange={handleFieldFormChange}
                        className={selectClass}
                        required
                      >
                        <option value="">Select Width</option>
                        <option value="full">Full Width</option>
                        <option value="half">Half Width</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={labelClass}>Instructions (Help Text)</label>
                      <input
                        type="text"
                        name="instruction"
                        value={fieldForm.instruction}
                        onChange={handleFieldFormChange}
                        className={inputClass}
                        placeholder="e.g., Enter your 10-digit account number"
                      />
                    </div>
                  </div>
                  
                  <div className="bg-[#1C2128] px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPopup(false)}
                      className="px-4 py-2 bg-[#0F111A] border border-gray-700 text-gray-300 rounded text-xs font-bold hover:border-gray-500 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <FaPlus /> Add Field
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Newwithdrawmethod;