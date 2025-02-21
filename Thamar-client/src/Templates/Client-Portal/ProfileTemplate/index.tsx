"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Upload, Avatar, message, Spin } from "antd";
import axios from "axios";
import { apiClient } from "@/utils/ApiCall";
import { toast } from "react-toastify";
import { isAPIError } from "@/utils/utilFunctions";
import { UploadChangeParam } from "antd/es/upload";
import { uploadFileToS3 } from "@/utils/UploadFiletoS3/uploadFiletoS3";
import "@/shared/styles/styles.css";
interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  company_name: string;
  profile_picture: string | null; // null if no profile picture is provided
  last_login: string; // ISO 8601 date string
  last_login_ip: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

const ProfileTemplate = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  // const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }
      const data = await apiClient<undefined, UserProfile>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: "/me",
        method: "GET",
      });

      setUserData(data);

      form.setFieldsValue({
        first_name: data?.first_name,
        last_name: data?.last_name,
        email: data?.email,
        phone_number: data?.phone_number,
        company_name: data?.company_name,
      });
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleFileChange = async (info: UploadChangeParam) => {
    const file = info.fileList[0]?.originFileObj;

    if (file) {
      // Validate file size and type
      if (file.size > 6 * 1024 * 1024) {
        messageApi.error("File size should not exceed 6MB");
        info.fileList.length = 0;
        return;
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        messageApi.error("Only JPG and PNG images are allowed");
        info.fileList.length = 0;
        return;
      }

      // setProfilePicture(file); // Save file state for later use

      try {
        setLoading(true);
        const tokenResponse = await axios.get(
          "/api/get-cookie?tokenName=userToken"
        );
        const accessToken = tokenResponse?.data?.cookies?.accessToken;

        if (!accessToken) {
          throw new Error("Access token is missing from the response.");
        }

        // Upload file to S3
        const { key } = await uploadFileToS3(
          file,
          accessToken,
          "profile-image"
        );

        const data = await apiClient<
          { file_key: string },
          { message: string; profile_picture_url: string }
        >({
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data", // Ensure content type is multipart/form-data
          },
          url: "/update-profile-picture",
          method: "PUT",
          data: { file_key: key }, // Pass the formData with file
        });

        // Update profile picture state with the S3 URL
        setUserData((prev) =>
          prev ? { ...prev, profile_picture: data.profile_picture_url } : null
        );
        toast.success(data?.message || "Profile Image Updated Successfully");
        info.fileList.length = 0;
        window.location.reload();
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Failed to upload profile picture.");
      } finally {
        setLoading(false);
        // setProfilePicture(null);
      }
    }
  };

  const handleUpdateProfile = async (values: UserProfile) => {
    try {
      const formData = new FormData();
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("phone_number", values.phone_number);
      formData.append("company_name", values.company_name);
      // if (profilePicture) {
      //   formData.append("profile_picture", profilePicture); // Attach the file
      // }

      setLoading(true);
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }

      const data = await apiClient<
        FormData,
        { message: string; profile_picture: string }
      >({
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data", // Ensure content type is multipart/form-data
        },
        url: "/update-profile",
        method: "PUT",
        data: formData, // Pass the formData with file
      });

      toast.success(data?.message || "Profile updated successfully!");
      fetchUserData(); // Refresh user data
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
    <>
      {loading ? (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <Spin size="large" />
        </div>
      ) : (
        <div className="flex justify-center py-8">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            className="w-full max-w-lg text-center"
          >
            {contextHolder}
            {/* Profile Picture */}
            <div className="relative mb-6 flex flex-col items-center">
              <Upload
                accept="image/*"
                beforeUpload={() => false}
                onChange={handleFileChange} // Use handleFileChange here
                showUploadList={false}
              >
                <Avatar
                  size={128}
                  src={userData?.profile_picture || "/images/profile.svg"}
                  className="cursor-pointer border border-gray-200"
                />
              </Upload>

              <p className="text-sm text-gray-500 mt-2">
                Click on the profile picture to upload
              </p>
            </div>

            {/* Form Fields */}
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[
                { required: true, message: "Please enter your first name" },
              ]}
              className="w-full"
            >
              <Input
                placeholder="Enter first name"
                className="rounded-md border-gray-300 w-full"
              />
            </Form.Item>

            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[
                { required: true, message: "Please enter your last name" },
              ]}
              className="w-full"
            >
              <Input
                placeholder="Enter last name"
                className="rounded-md border-gray-300 w-full"
              />
            </Form.Item>

            <Form.Item name="email" label="Email" className="w-full">
              <Input
                disabled
                className="rounded-md border-gray-300 bg-gray-100 w-full"
              />
            </Form.Item>

            <Form.Item
              name="phone_number"
              label="Phone Number"
              rules={[
                {
                  required: true,
                  message: "Please enter your phone number",
                },
              ]}
              className="w-full"
            >
              <Input
                placeholder="Enter phone number"
                className="rounded-md border-gray-300 w-full"
              />
            </Form.Item>

            <Form.Item
              name="company_name"
              label="Company Name"
              rules={[
                {
                  required: true,
                  message: "Please enter your company name",
                },
              ]}
              className="w-full"
            >
              <Input
                placeholder="Enter company name"
                className="rounded-md border-gray-300 w-full"
              />
            </Form.Item>

            {/* Submit Button */}
            <Form.Item>
              <button className="w-full bg-primary text-white py-2 rounded-md hover:bg-onBtnHover">
                Update Profile
              </button>
            </Form.Item>
          </Form>
        </div>
      )}
    </>
  );
};

export default ProfileTemplate;
