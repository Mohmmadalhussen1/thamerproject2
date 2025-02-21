"use client";
import PaymentReceipt from "@/components/PaymentCallback";
import { PaymentStatusResponse } from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";
import { isAPIError } from "@/utils/utilFunctions";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { Alert } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const CallbackTemplate = () => {
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    date: "",
    orderNumber: "",
    paymentMethod: "",
    status: "pending" as "settled" | "decline",
    reason: "",
    currency: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const orderId = localStorage.getItem("orderId");
    if (!orderId) {
      toast.error("No order found!.");
      setLoading(false);
      router.push("/user/catalogue");
      return;
    }

    const fetchPaymentStatus = async () => {
      try {
        const tokenResponse = await axios.get(
          "/api/get-cookie?tokenName=userToken"
        );
        const accessToken = tokenResponse?.data?.cookies?.accessToken;

        if (!accessToken) {
          throw new Error("Access token is missing.");
        }

        const response = await apiClient<undefined, PaymentStatusResponse>({
          headers: { Authorization: `Bearer ${accessToken}` },
          url: `/payment/payment/status/${orderId}`,
          method: "GET",
        });

        const paymentInfo = response.payment_status.responseBody;

        setPaymentData({
          amount: parseFloat(paymentInfo.order.amount),
          date: dayjs(paymentInfo.date).format("dddd, MMMM D, YYYY"),
          orderNumber: paymentInfo.order.number,
          currency: paymentInfo?.order?.currency,
          paymentMethod: `${paymentInfo.brand} - ${paymentInfo.payment_id.slice(
            -4
          )}`,
          status: paymentInfo.status,
          reason: paymentInfo.reason || "",
        });
      } catch (error: unknown) {
        if (isAPIError(error)) {
          if (error?.detail?.includes("404: Payment ID not found")) {
            setError(
              "Payment not found. Please wait while we process your payment."
            );
          } else {
            setError(error.detail || "Failed to fetch payment status.");
            toast.error(error?.detail || "Failed to fetch payment status.");
          }
        } else {
          console.error("Unknown error:", error);
          toast.error("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Loading payment details...
      </p>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        {/* Ant Design Alert with Custom Icon */}
        <Alert
          message={
            <div className="flex items-center justify-between w-full">
              {/* Left: Icon + Text (Handled by Ant Design) */}
              <div>
                <p className="text-gray-600">{error}</p>
              </div>

              {/* Right: Retry Button */}
              <button
                onClick={() => window.location.reload()}
                className="bg-newSecondary text-white px-4 py-2 rounded-lg hover:bg-onBtnHover transition"
              >
                Retry
              </button>
            </div>
          }
          type="warning"
          icon={
            <ExclamationCircleOutlined
              style={{ fontSize: "24px", color: "#faad14" }}
            />
          } // Custom Large Icon
          showIcon
          className="w-full"
        />
      </div>
    );
  }

  return (
    <PaymentReceipt
      amount={paymentData.amount}
      date={paymentData.date}
      currency={paymentData?.currency}
      orderNumber={paymentData.orderNumber}
      paymentMethod={paymentData.paymentMethod}
      status={paymentData.status}
      reason={paymentData.reason}
    />
  );
};

export default CallbackTemplate;
