"use client";
import CompanyProfile from "@/components/CompanyProfile";
import EmptyState from "@/components/EmptyState";
import { Company } from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";
import { getAccessToken, isAPIError } from "@/utils/utilFunctions";
import { Button, Input, Modal, Spin } from "antd";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ValidateCompanyResponse } from "./types/types";

function DetailCompanyTemplate({ id }) {
  const router = useRouter(); // Initialize the router
  const [loading, setLoading] = React.useState<boolean>(true);
  const [company, setCompany] = React.useState<Company | null>(null);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const getCompanyById = async () => {
    // setLoading(true);
    try {
      const accessToken = await getAccessToken("adminToken");

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }
      const data = await apiClient<undefined, Company>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/admin/companies/${id}`,
        method: "GET",
      });
      setCompany(data);
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
    getCompanyById();
  }, []);

  // ✅ Handle Approve
  const handleApprove = async (id: number) => {
    try {
      const accessToken = await getAccessToken("adminToken");
      const response = await apiClient<undefined, ValidateCompanyResponse>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/admin/validate-company/${id}?status=approved`,
        method: "PUT",
      });
      console.log("🚀 ~ handleApprove ~ response:", response);

      toast.success(response?.message || "Company approved successfully!");
      router.push("/admin/companies");
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve company.");
    }
  };

  // ❌ Handle Reject - Show Modal
  const showRejectModal = () => {
    setIsRejectModalVisible(true);
  };

  // ❌ Handle Reject - Submit Reason
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }

    try {
      const accessToken = await getAccessToken("adminToken");
      const response = await apiClient<undefined, ValidateCompanyResponse>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/admin/validate-company/${id}?status=rejected&rejection_reason=${rejectReason}`,
        method: "PUT",
      });

      toast.success(response?.message || "Company rejected successfully!");
      setCompany((prev) =>
        prev ? { ...prev, rejection_reason: rejectReason } : prev
      ); // Save reason in state
      setIsRejectModalVisible(false);
      router.push("/admin/companies");
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject company.");
    }
  };
  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh", // Make it full-screen height or adjust as needed
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!company) {
    return <EmptyState />;
  }

  return (
    <div>
      <CompanyProfile
        company={company}
        isAdmin={true}
        onApprove={handleApprove}
        onReject={showRejectModal}
      />

      {/* ❌ Rejection Modal */}
      <Modal
        title="Reject Company"
        open={isRejectModalVisible}
        onCancel={() => setIsRejectModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsRejectModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="reject" type="primary" danger onClick={handleReject}>
            Reject
          </Button>,
        ]}
      >
        <p>Enter the reason for rejection:</p>
        <Input.TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={4}
        />
      </Modal>
    </div>
  );
}

export default DetailCompanyTemplate;
