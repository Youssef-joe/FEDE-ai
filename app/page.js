"use client";
import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { createClient } from "@supabase/supabase-js";
import { generateResponse } from "../lib/gemini.js";
import { gsap } from "gsap";
import Sidebar from "./../components/SideBar.jsx";

const supabaseUrl = "https://otbceulonwfqerlsozft.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YmNldWxvbndmcWVybHNvemZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExODg3NDQsImV4cCI6MjA1Njc2NDc0NH0.NXTNyYhIGZV_nKVjgOBI-j_kkaj5N87iYXSCZQAfJFs";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("buy");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const mainContentRef = useRef(null);
  const headerRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // GSAP animations on page load
  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.from(headerRef.current, {
      y: -50,
      opacity: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .from(mainContentRef.current.querySelector("h2"), {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: "power3.out"
    }, "-=0.4")
    .from(chatContainerRef.current, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      ease: "power3.out"
    }, "-=0.3")
    .from(mainContentRef.current.querySelector("form"), {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: "power3.out"
    }, "-=0.3")
    .from(mainContentRef.current.querySelectorAll("button"), {
      opacity: 0,
      stagger: 0.1,
      duration: 0.3,
      ease: "power3.out"
    }, "-=0.2");
  }, []);

  // Animation for new messages
  useEffect(() => {
    if (messages.length > 0) {
      const messageElements = chatContainerRef.current.querySelectorAll(".message-bubble");
      if (messageElements.length > 0) {
        const latestMessage = messageElements[messageElements.length - 1];
        gsap.from(latestMessage, {
          x: latestMessage.classList.contains("user-message") ? 50 : -50,
          opacity: 0,
          duration: 0.5,
          ease: "power3.out"
        });
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchChats();
    const subscription = supabase
      .channel("chats")
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chats" },
        (payload) => {
          setChats((prev) => prev.filter((chat) => chat.id !== payload.old.id));
          if (currentChatId === payload.old.id) {
            setCurrentChatId(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentChatId]);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
      const subscription = supabase
        .channel(`messages:chat_id=${currentChatId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${currentChatId}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching chats:", error);
    } else {
      setChats(data);
      if (!currentChatId && data.length > 0) {
        setCurrentChatId(data[0].id);
      }
    }
  };

  const fetchMessages = async (chatId) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      setMessages(data);
    }
  };

  const startNewChat = async () => {
    const { data, error } = await supabase
      .from("chats")
      .insert({ title: `Chat ${new Date().toLocaleString()}` })
      .select()
      .single();
    if (error) {
      console.error("Error creating new chat:", error);
    } else {
      setChats((prev) => [data, ...prev]);
      setCurrentChatId(data.id);
      
      // Close sidebar on mobile after creating a new chat
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }
  };

  const deleteChat = async (chatId) => {
    const { error } = await supabase.from("chats").delete().eq("id", chatId);
    if (error) {
      console.error("Error deleting chat:", error);
    }
    // No need to manually update state here; real-time subscription handles it
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentChatId) return;

    const userMessage = { role: "user", content: input, chat_id: currentChatId };
    setInput("");
    setIsLoading(true);

    const { error: userError } = await supabase
      .from("messages")
      .insert(userMessage);
    if (userError) {
      console.error("Error saving user message:", userError);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error saving message" },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await generateResponse(input, messages);
      const assistantMessage = { role: "assistant", content: response, chat_id: currentChatId };

      const { error: assistantError } = await supabase
        .from("messages")
        .insert(assistantMessage);
      if (assistantError) {
        console.error("Error saving assistant message:", assistantError);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error saving response" },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Oops! Something went wrong: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate main content class based on sidebar state
  const mainContentClass = sidebarOpen ? "ml-0 md:ml-64" : "ml-0";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Head>
        <title>FEDE - Your Real Estate Portal</title>
        <meta name="description" content="Real estate assistant powered by AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Sidebar Component */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        chats={chats}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        startNewChat={startNewChat}
        deleteChat={deleteChat}
      />

      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${mainContentClass}`}
        ref={mainContentRef}
      >
        <header ref={headerRef} className="bg-white p-4 shadow-sm">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-wider text-black">
              FEDE
            </h1>
            <button className="p-2 rounded-full hover:bg-gray-100">
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2 text-black">
              YOUR REAL ESTATE <span className="text-red-500">PORTAL</span>
            </h2>
          </div>

          <div 
            ref={chatContainerRef}
            className="bg-gray-100 rounded-lg p-4 flex-1 mb-4 overflow-y-auto max-h-[calc(100vh-300px)]"
          >
            {messages.length === 0 && !currentChatId ? (
              <div className="flex items-center justify-center h-full text-black">
                Start a new chat or select an existing one
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-black">
                Ask FEDE anything about real estate
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`p-3 rounded-lg message-bubble ${
                      msg.role === "user"
                        ? "bg-blue-100 ml-auto max-w-md text-black user-message"
                        : "bg-white mr-auto max-w-md text-black assistant-message"
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center bg-gray-200 rounded-full overflow-hidden p-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent p-2 px-4 outline-none text-black"
                placeholder="Ask anything..."
                disabled={isLoading || !currentChatId}
              />
              <button
                type="submit"
                disabled={isLoading || !currentChatId}
                className="bg-gray-800 text-white p-2 rounded-full"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5"
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
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </form>

         
        </main>
      </div>
    </div>
  );
}