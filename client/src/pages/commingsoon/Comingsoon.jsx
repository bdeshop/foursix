import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FaRocket, FaBell } from "react-icons/fa";

const ComingSoon = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams] = useSearchParams();
  const pageTitle = searchParams.get("title") || "New Feature";

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#0a0a0a] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">
          <div className="flex flex-col min-h-full">
            {/* Main Content Area */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
              <div className="relative w-full max-w-2xl text-center">
                
                {/* Decorative Elements */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Content Card */}
                <div className="relative z-10 space-y-6">
                  {/* Small Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2">
                    <FaRocket className="text-[10px]" />
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold">In Development</span>
                  </div>

                  {/* Responsive Title */}
                  <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                    {pageTitle} <br />
                    <span className="text-gray-500 italic font-light font-serif">Is Launching Soon</span>
                  </h1>

                  {/* Divider Line */}
                  <div className="flex justify-center">
                    <div className="w-12 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                  </div>

                  {/* Description - Smaller Font */}
                  <p className="text-sm md:text-base text-gray-400 max-w-md mx-auto leading-relaxed">
                    We're meticulously crafting a world-class experience. 
                    Be the first to know when we go live.
                  </p>

                </div>
              </div>
            </div>

            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;