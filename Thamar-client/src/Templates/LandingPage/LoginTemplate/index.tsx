"use client";

import React, { useState } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { apiClient } from "@/utils/ApiCall";
import { toast } from "react-toastify";
import { isAPIError } from "@/utils/utilFunctions";
import { useRouter } from "next/navigation";
import axios from "axios";

interface FormErrors {
  email?: string;
  password?: string;
}

function LoginTemplate() {
  const [formValues, setFormValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (
      !formValues.email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
    ) {
      newErrors.email = "Please enter a valid email address!";
    }
    if (!formValues.password) {
      newErrors.password = "Please enter your password!";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const response = await apiClient<
        { email: string; password: string },
        { access_token: string }
      >({
        url: "/auth/login",
        method: "POST",
        data: {
          email: formValues.email,
          password: formValues.password,
        },
      });

      await axios.post("/api/set-cookie", {
        tokenName: "userToken",
        tokenValue: response?.access_token,
      });

      toast.success("Login successful!");
      router.push("/user/client-dashboard");
    } catch (error: unknown) {
      if (isAPIError(error)) {
        const errorMessage = error?.detail || "An unexpected error occurred.";

        // ✅ Ensure email is preserved before OTP request
        if (errorMessage.includes("User is not verified")) {
          console.log("User not verified, requesting OTP...");
          try {
            const otpResponse = await apiClient<
              { email: string },
              { message: string }
            >({
              url: `/auth/send-otp?email=${formValues.email}`,
              method: "POST",
            });

            // ✅ Ensure email is stored for OTP verification
            setFormValues((prev) => ({ ...prev, email: formValues.email }));

            // ✅ Show OTP form
            setShowOtpForm(true);

            toast.success(otpResponse?.message);
          } catch (otpError) {
            console.error("OTP Request Failed:", otpError);
            toast.error("Failed to send OTP. Please try again.");
          }
        } else {
          toast.error(errorMessage);
        }
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiClient<
        { otp: string; email: string },
        { message: string }
      >({
        url: "/auth/verify-otp",
        method: "POST",
        data: {
          otp,
          email: formValues.email, // Pass the email for verification
        },
      });
      toast.success(response?.message);
      // Redirect or handle post-verification logic here
      setShowOtpForm(false);
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

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
  };

  return (
    <div className="container p-5 mx-auto max-w-lg">
      {!showOtpForm ? (
        <>
          <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-lg font-semibold block text-left">
                Email*
              </label>
              <div className="flex items-center border border-gray-300 rounded px-4 py-2 w-full">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formValues.email}
                  onChange={handleChange}
                  className="flex-1 border-none outline-none text-base w-full"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-lg font-semibold block text-left">
                Password*
              </label>
              <div className="flex items-center border border-gray-300 rounded px-4 py-2 w-full">
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
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formValues.password}
                  onChange={handleChange}
                  className="flex-1 border-none outline-none text-base w-full ml-2"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-primary hover:bg-onBtnHover text-white font-bold py-2 rounded flex items-center justify-center"
            >
              Login
            </button>
          </form>

          <div className="flex justify-between items-center text-sm mt-4">
            <a
              href="/forgot-password"
              className="text-primary hover:text-onBtnHover underline"
            >
              Forgot Password? Reset Here
            </a>
          </div>

          <div className="flex justify-center mt-6">
            <button
              className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 w-full"
              onClick={() => router.push("/sign-up")}
            >
              Create New Account
            </button>
          </div>

          <footer className="flex justify-center space-x-4 mt-6">
            <Link
              href={"/"}
              className="text-primary hover:text-onBtnHover px-4 py-2 rounded border border-primary hover:border-onBtnHover w-full text-center"
            >
              Go back
            </Link>
          </footer>
        </>
      ) : (
        <>
          <h2 className="text-4xl text-left mb-6">Verify OTP</h2>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="text-lg font-semibold">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="Enter the OTP sent to your email"
                className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-onBtnHover text-white font-bold py-3 rounded transition duration-300"
            >
              Verify OTP
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default LoginTemplate;
