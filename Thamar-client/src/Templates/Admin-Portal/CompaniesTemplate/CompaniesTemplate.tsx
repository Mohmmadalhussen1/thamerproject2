"use client";

import React, { useEffect, useState } from "react";

import { Table, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Company } from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";
import { toast } from "react-toastify";
import { getAccessToken, isAPIError } from "@/utils/utilFunctions";
import { GetAllCompaniesResponse } from "./types/type";
import { useRouter } from "next/navigation";

function CompaniesTemplate() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  const router = useRouter(); // Initialize the router

  // Fetch users from API
  const fetchCompanies = async (page) => {
    setLoading(true);
    try {
      const accessToken = await getAccessToken("adminToken");
      if (!accessToken) throw new Error("Access token is missing.");

      const response = await apiClient<undefined, GetAllCompaniesResponse>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/admin/companies?page=${page}&page_size=10`,
        method: "GET",
      });

      setCompanies(response?.company_details);
      setTotalCompanies(response.total); // Correctly update total users
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
    fetchCompanies(currentPage);
  }, [currentPage]);

  // Delete user
  //   const deleteUser = async (userId: number) => {
  //     setUpdatingUser(userId);

  //     try {
  //       const accessToken = await getAccessToken("adminToken");
  //       if (!accessToken) throw new Error("Access token is missing.");

  //       const response = await apiClient<undefined, ActionUserResponse>({
  //         headers: { Authorization: `Bearer ${accessToken}` },
  //         url: `/api/admin/users/${userId}`,
  //         method: "DELETE",
  //       });
  //       //   await axios.delete(`https://thamerweb.com/api/admin/users/${userId}`, {
  //       //     headers: { Authorization: `Bearer ${accessToken}` },
  //       //   });

  //       // setCompanies((prevUsers) => prevUsers.filter((user) => user.id !== userId));
  //       // setTotalCompanies((prevTotal) => prevTotal - 1);
  //       toast.success(response?.message || "User deactivated successfully!");
  //       fetchCompanies(currentPage); // Refresh user list
  //     } catch (error: unknown) {
  //       if (isAPIError(error)) {
  //         const errorMessage = error?.detail || "An unexpected error occurred.";

  //         toast.error(errorMessage);
  //       } else {
  //         console.error("Unknown error:", error);
  //         toast.error("An unknown error occurred.");
  //       }
  //     } finally {
  //       setUpdatingUser(null);
  //     }
  //   };

  //   // Restore user
  //   const restoreUser = async (userId: number) => {
  //     setUpdatingUser(userId);
  //     try {
  //       const accessToken = await getAccessToken("adminToken");
  //       if (!accessToken) throw new Error("Access token is missing.");
  //       const response = await apiClient<undefined, ActionUserResponse>({
  //         headers: { Authorization: `Bearer ${accessToken}` },
  //         url: `/api/admin/users/${userId}/restore`,
  //         method: "PUT",
  //       });

  //       fetchCompanies(currentPage); // Refresh user list
  //       toast.success(response?.message || "User Restored successfully!");
  //     } catch (error) {
  //       console.error("Failed to delete user:", error);
  //       message.error("Failed to delete user.");
  //     } finally {
  //       setUpdatingUser(null);
  //     }
  //   };

  // Dropdown menu for actions
  //   const actionMenu = (user: User) => (
  //     <Menu>
  //       <Menu.Item
  //         key="delete"
  //         onClick={() => deleteUser(user.id)}
  //         disabled={updatingUser === user.id}
  //       >
  //         Delete
  //       </Menu.Item>
  //       <Menu.Item
  //         key="restore"
  //         onClick={() => restoreUser(user.id)}
  //         disabled={updatingUser === user.id}
  //       >
  //         Restore
  //       </Menu.Item>
  //     </Menu>
  //   );

  // Define table columns
  const columns: ColumnsType<Company> = [
    {
      title: "No.",
      key: "rowNumber",
      render: (_, __, index) => (currentPage - 1) * 10 + index + 1,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone_number", key: "phone_number" },
    {
      title: "Sectors",
      dataIndex: "sectors",
      key: "sectors",
      render: (sectors: string[] | undefined) => {
        if (!sectors || sectors.length === 0) return "N/A";
        if (sectors.length === 1) return sectors[0];
        return `${sectors[0]} and ${sectors.length - 1} more`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let backgroundColor;
        let text;

        switch (status?.toLowerCase()) {
          case "approved":
            backgroundColor = "#30AA7F"; // Green
            text = "Approved";
            break;
          case "rejected":
            backgroundColor = "#FF4D4F"; // Red
            text = "Rejected";
            break;
          case "pending":
          default:
            backgroundColor = "#F69C2E"; // Orange
            text = "Pending";
            break;
        }

        return (
          <span
            style={{
              padding: "6px 15px",
              backgroundColor,
              borderRadius: "5px",
              color: "#fff",
            }}
          >
            {text}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-semibold mb-4">Companies List</h1>
      {/* Show loading spinner while fetching */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spin />
        </div>
      ) : (
        <Table
          dataSource={companies}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{
            current: currentPage,
            total: totalCompanies,
            pageSize: 10,
            responsive: true,
            onChange: (page) => setCurrentPage(page),
          }}
          scroll={{ x: "max-content" }}
          onRow={(record) => ({
            onClick: () => {
              router.push(`/admin/companies/${record?.id}`);
            },
          })}
        />
      )}
    </div>
  );
}

export default CompaniesTemplate;
