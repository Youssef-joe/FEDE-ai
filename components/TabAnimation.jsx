// components/TabAnimation.jsx
"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function TabAnimation({ activeTab, setActiveTab, tabs }) {
  const tabContainerRef = useRef(null);
  
  useEffect(() => {
    // Animate tab change
    const activeTabElement = tabContainerRef.current?.querySelector(`.tab-${activeTab}`);
    
    if (activeTabElement) {
      gsap.to(activeTabElement, {
        scale: 1.1,
        color: activeTab === "mortgage" ? "#ef4444" : "#000000", 
        fontWeight: "bold",
        duration: 0.3,
        ease: "power2.out"
      });
      
      // Reset other tabs
      tabs.forEach(tab => {
        if (tab.id !== activeTab) {
          const tabElement = tabContainerRef.current?.querySelector(`.tab-${tab.id}`);
          if (tabElement) {
            gsap.to(tabElement, {
              scale: 1,
              color: "#6b7280",
              fontWeight: "normal",
              duration: 0.3,
              ease: "power2.out"
            });
          }
        }
      });
    }
  }, [activeTab, tabs]);

  return (
    <div ref={tabContainerRef} className="flex justify-between mt-6 border-t pt-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 transition-all duration-300 tab-${tab.id}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}