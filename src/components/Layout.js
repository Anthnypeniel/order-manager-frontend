import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useTheme } from "../context/ThemeContext";
import FreeTierBanner from "./FreeTierBanner";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <div
      className={`flex h-screen overflow-hidden ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            <FreeTierBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
