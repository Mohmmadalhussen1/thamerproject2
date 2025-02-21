"use client";
import React, { useEffect, useState } from "react";
import NotificationList from "@/components/NotificationList";
import { apiClient } from "@/utils/ApiCall";
import { NotificationResponse, NotificationTypeEnum } from "@/shared/types";
import axios from "axios";

function NotificationsListTemplate() {
  const [notifications, setNotifications] = useState<NotificationResponse>({
    total: 0,
    unread_count: 0,
    page: 1,
    page_size: 10, // Set default page size
    items: [],
    type: NotificationTypeEnum.GENERAL,
  });
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }

      const data = await apiClient<undefined, NotificationResponse>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/notifications?page=${page}&page_size=10`,
        method: "GET",
      });

      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <NotificationList
      notifications={notifications}
      onPageChange={fetchNotifications}
      loading={loading}
    />
  );
}

export default NotificationsListTemplate;
