import React from "react";

export default function PageWrapper({ children, className = "" }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-stone-50 via-[#f0e3c7]/30 to-stone-50 py-4 md:py-8 scrollbar-hide ${className}`}>
      <div className="container mx-auto px-4 max-w-7xl">
        {children}
      </div>
    </div>
  );
}