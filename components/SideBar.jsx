// components/Sidebar.jsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export default function Sidebar({
  isOpen,
  toggleSidebar,
  chats,
  currentChatId,
  setCurrentChatId,
  startNewChat,
  deleteChat,
}) {
  const sidebarRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    // Initialize GSAP timeline once
    if (!timelineRef.current) {
      timelineRef.current = gsap.timeline({ paused: true });
      timelineRef.current.to(sidebarRef.current, {
        x: 0,
        duration: 0.5,
        ease: "power3.out"
      });
    }
    
    // Control animation based on isOpen state
    if (isOpen) {
      timelineRef.current.play();
    } else {
      timelineRef.current.reverse();
    }
    
    return () => {
      // No need to kill the timeline on every effect run
    };
  }, [isOpen]);

  // Set initial position of sidebar based on isOpen state
  useEffect(() => {
    // Apply initial state directly without animation
    gsap.set(sidebarRef.current, {
      x: isOpen ? 0 : -264
    });
  }, []);

  return (
    <>
      {/* Sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 bg-gray-800 text-white p-2 rounded-full hover:cursor-pointer hover:bg-gray-700 shadow-md"
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>
      
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className="fixed top-0 left-0 w-64 h-full bg-white p-4 shadow-md flex flex-col z-40 transform -translate-x-full"
      >
        <div className="mt-12">
          <button
            onClick={startNewChat}
            className="w-full mb-4 bg-gray-800 text-white p-2 rounded hover:bg-gray-700 transition-colors duration-200"
          >
            New Chat
          </button>
          <div className="flex-1 overflow-y-auto max-h-[calc(100vh-100px)]">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center justify-between p-2 mb-2 rounded ${
                  currentChatId === chat.id ? "bg-blue-400 text-black" : "hover:bg-gray-100 text-black"
                } transition-colors duration-200`}
              >
                <span
                  onClick={() => setCurrentChatId(chat.id)}
                  className="flex-1 cursor-pointer truncate"
                >
                  {chat.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent closing sidebar when deleting chat
                    deleteChat(chat.id);
                  }}
                  className="text-red-500 hover:text-red-700 ml-2 transition-colors duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
      
      {/* Overlay to close sidebar on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}