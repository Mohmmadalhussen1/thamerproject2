"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "THAMER Catalog", href: "/login" },
    { name: "About Us", href: "/about-us" },
    { name: "How it works?", href: "/how-it-works" },
    { name: "Demo", href: "/demo" },
    { name: "Contact Us", href: "/contact-us" },
  ];

  return (
    <nav className="bg-black text-white px-4 py-3 sticky w-full top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <Image
            src="/images/Thamer-logo.png"
            alt="Thamer Logo"
            height={70}
            width={50}
            className="rounded"
          />
        </Link>

        {/* Hamburger Menu (Mobile) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white focus:outline-none"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Navigation Links (Mobile & Desktop) */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-black text-white transform transition-transform duration-300 z-50
          ${isOpen ? "translate-x-0" : "-translate-x-full"} 
          md:static md:flex md:flex-row md:items-center md:space-x-6 md:translate-x-0 md:w-auto`}
        >
          {/* Close Button (Mobile) */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-6 text-white focus:outline-none md:hidden"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <ul className="flex flex-col space-y-4 p-6 md:flex-row md:space-y-0 md:space-x-8 md:p-0">
            {navLinks.map((link, index) => (
              <li key={index} className="w-full md:w-auto">
                <Link href={link.href} onClick={() => setIsOpen(false)}>
                  <span
                    className={`flex items-center space-x-2 text-sm whitespace-nowrap ${
                      pathname === link.href
                        ? "text-yellow-500 font-bold"
                        : "hover:text-yellow-500"
                    }`}
                  >
                    <span>{link.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Desktop Actions (Fixed Button Layout) */}
        <div className="hidden lg:flex lg:space-x-4 max-lg:hidden max-[529px]:hidden">
          <Link
            href="http://wa.me/966548344866"
            className="border border-gray-300 text-gray-300 px-4 py-2 rounded transition duration-300 hover:bg-gray-300 hover:text-black whitespace-nowrap"
          >
            Schedule a Consultation
          </Link>
          <Link
            href="/login"
            className="bg-gray-300 text-black px-4 py-2 rounded transition duration-300 hover:bg-black hover:text-white hover:border border-white whitespace-nowrap"
          >
            Register / Log In
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
