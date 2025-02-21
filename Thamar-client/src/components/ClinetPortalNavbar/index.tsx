"use client";
import React, { useState } from "react";
import Image from "next/image";
import { BellOutlined, DownOutlined } from "@ant-design/icons";
import { Dropdown } from "antd";

function ClientPortalNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const userMenuItems = [
    {
      key: "1",
      label: (
        <span onClick={() => console.log("Setting Clicked!")}>Settings</span>
      ),
    },
    { key: "2", label: <a href="/logout">Logout</a> },
  ];

  return (
    <nav className="bg-[#D9E0C8] text-white px-4 py-3 sticky w-full z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <Image
          src={"/images/Thamer-logo.png"}
          alt="logo.png"
          height={70}
          width={50}
          className="rounded"
        />

        {/* Hamburger Menu */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="block md:hidden text-white focus:outline-none"
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

        {/* Right Section */}
        <div className="hidden md:flex space-x-4">
          <div className="text-lg cursor-pointer">
            <BellOutlined style={{ fontSize: "18px" }} />
          </div>

          {/* Username Dropdown */}
          <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
            <div className="flex items-center cursor-pointer">
              <span className="text-[#003422]">Username</span>
              <DownOutlined style={{ fontSize: "12px", marginLeft: "4px" }} />
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-black text-white transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4">
          <button
            onClick={() => setIsOpen(false)}
            className="text-white focus:outline-none mb-4"
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
          <ul className="space-y-4">
            <li>
              <a href="/dashboard" className="block">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/notifications" className="block">
                Notifications
              </a>
            </li>
            <li>
              <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
                <div className="flex items-center cursor-pointer">
                  <span>Username</span>
                  <DownOutlined
                    style={{ fontSize: "12px", marginLeft: "4px" }}
                  />
                </div>
              </Dropdown>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default ClientPortalNavbar;
