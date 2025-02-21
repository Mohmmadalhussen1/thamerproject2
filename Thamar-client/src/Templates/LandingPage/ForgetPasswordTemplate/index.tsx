"use client";

import React, { useState } from "react";
import { apiClient } from "@/utils/ApiCall";
import { toast } from "react-toastify";
import { isAPIError } from "@/utils/utilFunctions";
import Link from "next/link";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface FormErrors {
  email?: string;
  otp?: string;
  newPassword?: string;
}

function ForgotPasswordTemplate() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Email, Step 2: OTP and New Password
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const router = useRouter();

  const validateEmail = () => {
    const newErrors: FormErrors = {};

    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
      newErrors.email = "Please enter a valid email address!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtpAndPassword = () => {
    const newErrors: FormErrors = {};

    if (!otp.match(/^\d{6}$/)) {
      newErrors.otp = "Please enter a valid 6-digit OTP!";
    }
    if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    try {
      const response = await apiClient<{ email: string }, { message: string }>({
        url: "/auth/forgot-password",
        method: "POST",
        data: {
          email,
        },
      });

      toast.success(response?.message || "OTP sent to your email!");
      setStep(2); // Move to OTP and New Password input step
    } catch (error: unknown) {
      if (isAPIError(error)) {
        const errorMessage = error?.detail || "An unexpected error occurred.";
        toast.error(errorMessage);
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred.");
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateOtpAndPassword()) {
      return;
    }

    try {
      const response = await apiClient<
        { otp: string; email: string; new_password: string },
        { message: string }
      >({
        url: "/auth/reset-password",
        method: "POST",
        data: {
          otp,
          email,
          new_password: newPassword,
        },
      });

      toast.success(response?.message || "Password reset successfully!");
      // Redirect or handle post-reset logic here
      router.push("/login");
    } catch (error: unknown) {
      if (isAPIError(error)) {
        const errorMessage = error?.detail || "An unexpected error occurred.";
        toast.error(errorMessage);
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "email") {
      setEmail(value);
      setErrors((prev) => ({ ...prev, email: "" }));
    } else if (name === "otp") {
      setOtp(value);
      setErrors((prev) => ({ ...prev, otp: "" }));
    } else if (name === "newPassword") {
      setNewPassword(value);
      setErrors((prev) => ({ ...prev, newPassword: "" }));
    }
  };

  return (
    <div className="container p-6">
      <h2 className="text-3xl font-bold mb-6">
        {step === 1 ? "Forgot Password" : "Reset Password"}
      </h2>

      {step === 1 && (
        <form
          onSubmit={handleEmailSubmit}
          className="space-y-6 w-full p-6 w-1/3"
        >
          {/* Email Field */}
          <div className="space-y-2 text-left">
            <label className="text-lg font-semibold">Email*</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-onBtnHover text-white font-bold py-2 rounded"
          >
            Send OTP
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleOtpSubmit} className="space-y-6 w-full p-6 w-1/3">
          {/* Email Display */}
          <div className="space-y-2 text-left">
            <label className="text-lg font-semibold">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full border border-gray-300 rounded px-4 py-2 outline-none bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* OTP Field */}
          <div className="space-y-2 text-left">
            <label className="text-lg font-semibold">OTP*</label>
            <input
              type="text"
              name="otp"
              placeholder="Enter the 6-digit OTP"
              value={otp}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
            />
            {errors.otp && <p className="text-red-500 text-sm">{errors.otp}</p>}
          </div>

          {/* New Password Field */}
          <div className="space-y-2 text-left">
            <label className="text-lg font-semibold">New Password*</label>
            <div className="flex items-center border border-gray-300 rounded px-4 py-2">
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={handleChange}
                className="flex-1 border-none outline-none text-base w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOutlined className="text-xl" />
                ) : (
                  <EyeInvisibleOutlined className="text-xl" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm">{errors.newPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary hover:bg-onBtnHover text-white font-bold py-2 rounded"
          >
            Reset Password
          </button>
        </form>
      )}

      <div className="mt-6">
        <Link
          href="/login"
          className="text-primary hover:underline text-center"
        >
          Go back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPasswordTemplate;
