"use client";

import React, { useEffect, useState } from "react";
import { Table, Spin, Button, Dropdown, Menu, message, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ActionUserResponse, User } from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";
import { EllipsisOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { getAccessToken, isAPIError } from "@/utils/utilFunctions";
import { GetAllUsers } from "./types/type";
import dayjs from "dayjs";

function UsersTemplate() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);

  // Fetch users from API
  const fetchUsers = async (page) => {
    setLoading(true);
    try {
      const accessToken = await getAccessToken("adminToken");
      if (!accessToken) throw new Error("Access token is missing.");

      const response = await apiClient<undefined, GetAllUsers>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/admin/users?page=${page}&page_size=10`,
        method: "GET",
      });

      setUsers(response?.data);
      setTotalUsers(response.total); // Correctly update total users
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

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  // Delete user
  const deleteUser = async (userId: number) => {
    setUpdatingUser(userId);

    try {
      const accessToken = await getAccessToken("adminToken");
      if (!accessToken) throw new Error("Access token is missing.");

      const response = await apiClient<undefined, ActionUserResponse>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/admin/users/${userId}`,
        method: "DELETE",
      });
      //   await axios.delete(`https://thamerweb.com/api/admin/users/${userId}`, {
      //     headers: { Authorization: `Bearer ${accessToken}` },
      //   });

      // setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      // setTotalUsers((prevTotal) => prevTotal - 1);
      toast.success(response?.message || "User deactivated successfully!");
      fetchUsers(currentPage); // Refresh user list
    } catch (error: unknown) {
      if (isAPIError(error)) {
        const errorMessage = error?.detail || "An unexpected error occurred.";

        toast.error(errorMessage);
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred.");
      }
    } finally {
      setUpdatingUser(null);
    }
  };

  // Restore user
  const restoreUser = async (userId: number) => {
    setUpdatingUser(userId);
    try {
      const accessToken = await getAccessToken("adminToken");
      if (!accessToken) throw new Error("Access token is missing.");
      const response = await apiClient<undefined, ActionUserResponse>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/admin/users/${userId}/restore`,
        method: "PUT",
      });

      fetchUsers(currentPage); // Refresh user list
      toast.success(response?.message || "User Restored successfully!");
    } catch (error) {
      console.error("Failed to delete user:", error);
      message.error("Failed to delete user.");
    } finally {
      setUpdatingUser(null);
    }
  };

  // Dropdown menu for actions
  const actionMenu = (user: User) => (
    <Menu>
      <Menu.Item
        key="delete"
        onClick={() => deleteUser(user.id)}
        disabled={updatingUser === user.id}
      >
        Delete
      </Menu.Item>
      <Menu.Item
        key="restore"
        onClick={() => restoreUser(user.id)}
        disabled={updatingUser === user.id}
      >
        Restore
      </Menu.Item>
    </Menu>
  );

  // Define table columns
  const columns: ColumnsType<User> = [
    // { title: "ID", dataIndex: "id", key: "id" },
    {
      title: "No.",
      key: "rowNumber",
      render: (_, __, index) => (currentPage - 1) * 10 + index + 1,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        const color = role === "admin" ? "red" : "blue"; // Customize colors based on role
        return <Tag color={color}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Joined At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("MMM D, YYYY h:mm A"),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isApproved: boolean) => (
        <span
          style={{
            padding: "6px 15px",
            backgroundColor: isApproved ? "#30AA7F" : "#F69C2E",
            borderRadius: "5px",
            color: "#fff",
          }}
        >
          {isApproved ? "Active" : "In Active"}
        </span>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, user) => (
        <Dropdown overlay={actionMenu(user)} trigger={["click"]}>
          <Button
            icon={<EllipsisOutlined />}
            loading={updatingUser === user.id}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-semibold mb-4">Users List</h1>
      {/* Show loading spinner while fetching */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spin />
        </div>
      ) : (
        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{
            current: currentPage,
            total: totalUsers,
            pageSize: 10,
            responsive: true,
            onChange: (page) => setCurrentPage(page),
          }}
          scroll={{ x: "max-content" }}
        />
      )}
    </div>
  );
}

export default UsersTemplate;
