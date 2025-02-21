"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, Card, Spin, Typography, Tag } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  MailOutlined,
  BankOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import axios from "axios";
import { NotificationItem } from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";
import { isAPIError } from "@/utils/utilFunctions";
import { toast } from "react-toastify";

dayjs.extend(relativeTime);
dayjs.extend(utc);

const NotificationDetailTemplate = () => {
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<NotificationItem>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotificationAndMarkAsRead = async () => {
      try {
        const tokenResponse = await axios.get(
          "/api/get-cookie?tokenName=userToken"
        );
        const accessToken = tokenResponse?.data?.cookies?.accessToken;

        if (!accessToken) {
          throw new Error("Access token is missing from the response.");
        }

        const data = await apiClient<undefined, NotificationItem>({
          headers: { Authorization: `Bearer ${accessToken}` },
          url: `/notifications/${id}`,
          method: "GET",
        });

        if (!data?.is_read) {
          apiClient<string[], string>({
            headers: { Authorization: `Bearer ${accessToken}` },
            url: `/notifications/mark-read`,
            method: "POST",
            data: [id],
          });
        }

        setNotification(data);
      } catch (error: unknown) {
        if (isAPIError(error)) {
          const errorMessage = error?.detail || "An unexpected error occurred.";
          toast.error(errorMessage);
        } else {
          console.error("Unknown error:", error);
          toast.error("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationAndMarkAsRead();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="text-center text-gray-500 mt-6">
        <Typography.Title level={4}>Notification Not Found</Typography.Title>
      </div>
    );
  }

  // Format date
  const formattedDate = dayjs
    .utc(notification.created_at)
    .local()
    .format("MMMM D, YYYY h:mm A");

  return (
    <div className=" mx-auto mt-8 p-6 bg-white shadow-lg rounded-lg">
      <Typography.Title level={3} className="text-gray-800">
        {notification.title}
      </Typography.Title>

      <div className="flex items-center gap-3 mb-3">
        <Tag color="blue">{notification.type}</Tag>
        <div className="text-gray-500 flex items-center gap-1">
          <CalendarOutlined />
          <span>{formattedDate}</span>
        </div>
      </div>

      <Typography.Paragraph className="text-gray-700 text-lg">
        {notification.message}
      </Typography.Paragraph>

      {/* If the notification type is "VIEW", display user details */}
      {notification.type === "VIEW" && notification.sender && (
        <Card className="mt-6 shadow-md border border-gray-100 rounded-lg p-5">
          <div className="flex items-center gap-4">
            <Avatar
              size={80}
              src={notification.sender.profile_picture}
              icon={!notification.sender.profile_picture && <UserOutlined />}
            />
            <div>
              <Typography.Title level={4} className="text-gray-900">
                {notification.sender.first_name} {notification.sender.last_name}
              </Typography.Title>
              <Typography.Text className="text-gray-500 flex items-center gap-2">
                <MailOutlined />
                <a
                  href={`mailto:${notification.sender.email}`}
                  className="hover:text-blue-500"
                >
                  {notification.sender.email}
                </a>
              </Typography.Text>
              <div className="mt-2 text-gray-600 flex items-center gap-2">
                <BankOutlined />
                <span className="font-semibold">
                  {notification.sender.company_name}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotificationDetailTemplate;
