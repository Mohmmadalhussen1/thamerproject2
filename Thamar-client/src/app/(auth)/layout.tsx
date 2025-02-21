import React from "react";
import Image from "next/image";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import styles for react-toastify
import Link from "next/link";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Header Section */}
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center relative z-10">
        {/* Logo */}
        <div className="flex items-center">
          <Link href={"/"}>
            <Image
              src="/images/Thamer-logo.png"
              alt="Logo"
              width={100}
              height={50}
            />
          </Link>
        </div>

        {/* Language Selector */}
        <select className="bg-black text-white border border-gray-600 px-3 py-2 rounded focus:outline-none focus:ring focus:ring-yellow-500">
          <option value="en">English</option>
          <option value="ar">Arabic</option>
        </select>
      </header>

      {/* Background Image Section */}
      <div
        className="relative flex-1 flex items-center justify-center bg-no-repeat bg-cover bg-center"
        style={{ backgroundImage: "url('/images/auth-right.svg')" }}
      >
        {/* Optional Dark Overlay for Contrast */}
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Centered Content */}
        <div className="relative z-10 bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-lg w-full text-center">
          {children}
        </div>
      </div>

      {/* Toast Notification */}
      <ToastContainer />
    </div>
  );
}

export default Layout;
