"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  HomeFilled,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/SideBar";
import axios from "axios";
import { UserProfile } from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";

interface DaashboardTemplateProps {
  children: ReactNode;
}
const DashboardTemplate: React.FC<DaashboardTemplateProps> = ({ children }) => {
  const pathname = usePathname();
  const [userName, setUserName] = useState("");

  const fetchInitialData = async () => {
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
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
      setUserName(
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
      href: "/user/client-dashboard",
      icon: <HomeFilled />,
      title: `👋 Hello, ${userName || ""}`,
    },
    // {
    //   key: "2",
    //   label: "Settings",
    //   icon: <SettingFilled />,
    //   href: "/user/setting",

    //   subMenu: [
    //     { key: "2-1", label: "Profile", href: "/user/settings/profile" },
    //     { key: "2-2", label: "Security", href: "/user/settings/security" },
    //   ],
    // },
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
      label: "User Companies",
      icon: <UserOutlined />,
      href: "/user/user-companies",
    },
    {
      key: "4",
      label: "Catalogue",
      icon: <UnorderedListOutlined />,
      href: "/user/catalogue",
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
      userRole="user"
    >
      {children}
    </DashboardLayout>
  );
};

export default DashboardTemplate;
