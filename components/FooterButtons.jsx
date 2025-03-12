import React, { useState } from 'react'

const FooterButtons = () => {

    const [activeTab, setActiveTab] = useState("buy")

  return (
    <>
         <div className="flex justify-between mt-6 border-t pt-4 tab-container">
            <button
              onClick={() => setActiveTab("buy")}
              className={`px-4 py-2 transition-all duration-300 ${
                activeTab === "buy" ? "font-bold text-red-500 scale-110" : "text-black"
              }`}
            >
              BUY
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 transition-all duration-300 ${
                activeTab === "list" ? "font-bold text-red-500 scale-110" : "text-gray-500"
              }`}
            >
              LIST
            </button>
            <button
              onClick={() => setActiveTab("rent")}
              className={`px-4 py-2 transition-all duration-300 ${
                activeTab === "rent" ? "font-bold text-red-500 scale-110" : "text-gray-500"
              }`}
            >
              RENT
            </button>
            <button
              onClick={() => setActiveTab("mortgage")}
              className={`px-4 py-2 transition-all duration-300 ${
                activeTab === "mortgage" ? "font-bold text-red-500 scale-110" : "text-gray-500"
              }`}
            >
              MORTGAGE RATES
            </button>
            <button
              onClick={() => setActiveTab("more")}
              className={`px-4 py-2 transition-all duration-300 ${
                activeTab === "more" ? "font-bold text-red-500 scale-110" : "text-gray-500"
              }`}
            >
              MORE
            </button>
          </div>
    </>
  )
}

export default FooterButtons