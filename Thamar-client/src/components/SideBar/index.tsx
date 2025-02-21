"use client";
import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { MenuOutlined, BellOutlined, LogoutOutlined } from "@ant-design/icons";
import Image from "next/image";
import "./styles.css";
import { useRouter } from "next/navigation";
import axios from "axios";
import { NotificationResponse, UserProfile } from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";

interface NavLink {
  key: string;
  label: string;
  href: string;
  icon?: ReactNode;
  subMenu?: NavLink[];
}

interface DashboardLayoutProps {
  title?: string;
  sideNavLinks: NavLink[];
  children: ReactNode;
  pathname: string;
  userRole?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title = "Dashboard",
  sideNavLinks,
  children,
  pathname,
  userRole = "user",
}) => {
  console.log("🚀 ~ pathname:", pathname);
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Closes sidebar automatically on menu click
  const handleMenuClick = (href: string) => {
    setIsSidebarOpen(false);
    router.push(href);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const tokenResponse = await axios.get(
          `/api/get-cookie?tokenName=${
            userRole === "user" ? "userToken" : "adminToken"
          }`
        );
        const accessToken = tokenResponse?.data?.cookies?.accessToken;
        if (!accessToken) throw new Error("Access token is missing.");

        const data = await apiClient<undefined, NotificationResponse>({
          headers: { Authorization: `Bearer ${accessToken}` },
          url: `/notifications?page=1&page_size=10`,
          method: "GET",
        });

        const userProfileData = await apiClient<undefined, UserProfile>({
          headers: { Authorization: `Bearer ${accessToken}` },
          url: "/me",
          method: "GET",
        });

        setUnreadCount(data?.unread_count || 0);
        setProfilePicture(userProfileData?.profile_picture);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchInitialData();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/logout", { role: userRole });
      router.push(userRole === "user" ? "/login" : "/admin/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-md fixed top-0 h-full z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:static md:translate-x-0 md:w-20 flex flex-col overflow-hidden`}
      >
        {/* Sidebar Content with Scrollable Menu */}
        <div className="bg-[#d9e0c8] flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {/* Logo Section */}
          <div className="w-full flex justify-center py-4 sticky top-0 bg-[#d9e0c8] z-10">
            <Link href={"/"}>
              <Image
                src={"/images/Thamer-logo.png"}
                alt="logo.png"
                height={70}
                width={60}
                className="rounded"
              />
            </Link>
          </div>

          {/* Scrollable Menu Items */}
          <div className="flex flex-col space-y-6 w-full">
            {sideNavLinks.map((link) => (
              <div
                key={link.key}
                className="w-full text-center cursor-pointer p-4"
                onClick={() => handleMenuClick(link.href)}
              >
                <Link href={link.href || "#"}></Link>
                <div className="flex flex-col items-center">
                  {link.icon && (
                    <span
                      className={`custom-icon text-2xl mb-1 ${
                        pathname.includes(link.href)
                          ? "active-icon"
                          : "inactive-icon"
                      }`}
                    >
                      {link.icon}
                    </span>
                  )}
                  <span
                    className={`text-xs ${
                      pathname === link.href ? "text-primary" : "text-[#998E95]"
                    }`}
                  >
                    {link.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer (Notifications & Logout) */}
        <div className="p-4 bg-[#d9e0c8] flex flex-col items-center space-y-4 gap-4">
          {/* Notification Bell */}
          <Link href={userRole === "user" ? "/user/notifications" : "#"}>
            <div className="relative">
              <BellOutlined
                onClick={() => setIsSidebarOpen(false)}
                className={`text-2xl cursor-pointer ${
                  pathname.includes("notifications")
                    ? "text-primary"
                    : "text-[#998E95] hover:text-primary"
                }`}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </Link>

          {/* Profile Image */}
          <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center">
            <Image
              src={
                profilePicture && profilePicture.startsWith("http")
                  ? profilePicture
                  : "/images/profile.svg"
              }
              alt="Profile Picture"
              width={64}
              height={64}
              className="object-cover w-full h-full cursor-pointer"
              onClick={() => {
                router.push(userRole === "user" ? "/user/profile" : "#");
                setIsSidebarOpen(false);
              }}
            />
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center text-[#998E95] hover:text-red-500 transition duration-200"
          >
            <LogoutOutlined className="text-2xl" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-secondary shadow-md p-6 flex items-center justify-between">
          {/* Toggle Sidebar on Small Screens */}
          <button
            onClick={toggleSidebar}
            className="text-black focus:outline-none md:hidden"
          >
            <MenuOutlined />
          </button>
          <h1 className="text-xl font-bold">{title}</h1>
        </header>
        <div className="p-6 overflow-auto">{children}</div>
      </main>

      {/* Backdrop for Sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;
