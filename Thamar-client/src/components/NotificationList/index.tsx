"use client";

import React from "react";
import { List, Avatar, Typography, Empty, Spin, Pagination } from "antd";
import dayjs from "dayjs"; // ✅ Use default import
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { NotificationResponse } from "@/shared/types";
import { useRouter } from "next/navigation";

dayjs.extend(relativeTime);
dayjs.extend(utc);

interface Props {
  notifications: NotificationResponse;
  onPageChange: (page: number) => void; // Callback to fetch new page
  loading: boolean;
}

const NotificationList: React.FC<Props> = ({
  notifications,
  onPageChange,
  loading,
}) => {
  const router = useRouter();
  return (
    <div className="bg-white shadow-lg rounded-md p-4">
      <Typography.Title level={5} className="text-gray-700 mb-3">
        Notifications
      </Typography.Title>

      {loading ? (
        <div className="flex justify-center p-4">
          <Spin size="large" />
        </div>
      ) : notifications.items.length === 0 ? (
        <Empty description="No Notifications" />
      ) : (
        <>
          <List
            itemLayout="horizontal"
            dataSource={notifications.items}
            renderItem={(item) => {
              const notificationDate = dayjs.utc(item.created_at).local(); // ✅ Correct usage
              const dayName = notificationDate.format("ddd"); // Example: "Mon"
              const dayNumber = notificationDate.format("D"); // Example: "1"

              return (
                <List.Item
                  className={`cursor-pointer p-3 ${
                    !item.is_read ? "bg-gray-100" : ""
                  }`}
                  onClick={() => router.push(`/user/notifications/${item?.id}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        shape="square"
                        size={48}
                        style={{
                          backgroundColor: "#809848",
                          color: "white",
                          fontSize: "14px",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: "bold",
                        }}
                      >
                        <div style={{ fontSize: "12px" }}>{dayName}</div>
                        <div style={{ fontSize: "16px" }}>{dayNumber}</div>
                      </Avatar>
                    }
                    title={
                      <Typography.Text strong className="text-gray-900">
                        {item.title}
                      </Typography.Text>
                    }
                    description={
                      <div className="text-sm text-gray-600">
                        {item.message}
                        <div className="text-xs text-gray-400 mt-1">
                          {notificationDate.fromNow()}{" "}
                          {/* ✅ Correct time formatting */}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />

          {/* Pagination Component */}
          <div className="flex justify-center mt-3">
            <Pagination
              current={notifications.page}
              pageSize={notifications.page_size}
              total={notifications.total}
              onChange={onPageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationList;
