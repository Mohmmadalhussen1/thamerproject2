"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HomeFilled, BankOutlined, UserOutlined } from "@ant-design/icons";
import DashboardLayout from "@/components/SideBar";
import { UserProfile } from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";
import axios from "axios";

interface AdminDashboardTemplateProps {
  children: ReactNode;
}

const AdminDashboardTemplate: React.FC<AdminDashboardTemplateProps> = ({
  children,
}) => {
  const pathname = usePathname();
  const [adminTitle, setAdminTitle] = useState("");

  const fetchInitialData = async () => {
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=adminToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }

      const userProfileData = await apiClient<undefined, UserProfile>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: "/me",
        method: "GET",
      });
      setAdminTitle(
        `${userProfileData?.first_name} ${userProfileData?.last_name}`
      );
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);
  const sideNavLinks = [
    {
      key: "1",
      label: "Home",
      href: "/admin/dashboard",
      icon: <HomeFilled />,
      title: `👋 Hello, ${adminTitle || ""}`,
    },
    {
      key: "2",
      label: "Companies",
      icon: <BankOutlined />,
      href: "/admin/companies",

      //   subMenu: [
      //     { key: "2-1", label: "Profile", href: "/user/settings/profile" },
      //     { key: "2-2", label: "Security", href: "/user/settings/security" },
      //   ],
    },
    // {
    //   key: "3",
    //   label: "Users",
    //   icon: <UserOutlined />,
    //   subMenu: [
    //     { key: "3-1", label: "User List", href: "/users" },
    //     { key: "3-2", label: "Add User", href: "/users/add" },
    //   ],
    //   href: "#",
    // },
    {
      key: "3",
      label: "User",
      icon: <UserOutlined />,
      href: "/admin/users",
    },
  ];

  return (
    <DashboardLayout
      title={
        sideNavLinks?.find((navLink) => navLink.href === pathname)?.title ||
        sideNavLinks?.find((navLink) => navLink.href === pathname)?.label ||
        "Dashboard"
      }
      sideNavLinks={sideNavLinks}
      // currentPath={
      //   sideNavLinks?.find((navLink) => navLink?.href === pathname)?.href || ""
      // }
      pathname={pathname}
      userRole="admin"
    >
      {children}
    </DashboardLayout>
  );
};

export default AdminDashboardTemplate;
