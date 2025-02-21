"use client";
import React, { useState } from "react";
import { Form, Input, Button, Typography, Card } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { apiClient } from "@/utils/ApiCall";
import axios from "axios";
import { toast } from "react-toastify";
import { isAPIError } from "@/utils/utilFunctions";
import { useRouter } from "next/navigation";

const { Title } = Typography;

function AdminPortalLoginTemplate() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await apiClient<
        { email: string; password: string },
        { access_token: string }
      >({
        url: "/auth/login",
        method: "POST",
        data: values,
      });

      await axios.post("/api/set-cookie", {
        tokenName: "adminToken",
        tokenValue: response?.access_token,
      });

      toast.success("Login successful!");
      // Handle successful login logic here, e.g., store token, redirect, etc.
      router.push("/admin/dashboard");
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-lg p-8 min-h-[420px] flex flex-col justify-center">
        <Title level={3} className="text-center mb-6 text-gray-700">
          Admin Login
        </Title>
        <Form
          name="login"
          layout="vertical"
          className="space-y-4"
          onFinish={onFinish}
        >
          {/* Email */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email!" },
              { type: "email", message: "Invalid email!" },
            ]}
          >
            <Input size="large" prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          {/* Password */}
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password!" }]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item className="mt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default AdminPortalLoginTemplate;
