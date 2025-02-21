"use client";

import React, { useState } from "react";
import Image from "next/image";
import { apiClient } from "@/utils/ApiCall";
import { toast } from "react-toastify";
import { isAPIError } from "@/utils/utilFunctions/index";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserRegistration {
  first_name: string;
  last_name: string;
  phone_number: string;
  company_name: string;
  email: string;
  password: string;
}

function RegistrationForm() {
  const [formValues, setFormValues] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    company_name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formValues.first_name)
      newErrors.first_name = "First name is required!";
    if (!formValues.last_name) newErrors.last_name = "Last name is required!";
    if (!formValues.phone_number.match(/^[0-9]{9}$/)) {
      newErrors.phone_number =
        "Please enter a valid 9-digit Saudi phone number!";
    }
    if (!formValues.company_name) {
      newErrors.company_name = "Company name is required!";
    }
    if (
      !formValues.email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)
    ) {
      newErrors.email = "Please enter a valid email address!";
    }
    if (!formValues.password) newErrors.password = "Password is required!";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await apiClient<UserRegistration, { message: string }>(
          {
            url: "/auth/signup",
            method: "POST",
            data: {
              ...formValues,
            },
          }
        );
        toast.success(response?.message);
        setShowOtpForm(true); // Show the OTP form after signup
      } catch (error: unknown) {
        if (isAPIError(error)) {
          const errorMessage = error?.detail || "An unexpected error occurred.";

          toast.error(errorMessage);
        } else {
          console.error("Unknown error:", error);
          toast.error("An unknown error occurred.");
        }
      }
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
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

  return (
    <div className="container p-6 ">
      {!showOtpForm ? (
        <>
          <h2 className="text-4xl  text-left mb-6">Sign Up</h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
          >
            {/* First Name */}
            <div className="space-y-2">
              <label className="text-lg font-semibold text-left">
                First Name*
              </label>
              <input
                type="text"
                name="first_name"
                value={formValues.first_name}
                onChange={handleChange}
                placeholder="Enter your first name"
                className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm">{errors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label className="text-lg font-semibold text-left">
                Last Name*
              </label>
              <input
                type="text"
                name="last_name"
                value={formValues.last_name}
                onChange={handleChange}
                placeholder="Enter your last name"
                className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm">{errors.last_name}</p>
              )}
            </div>

            {/* Phone Number */}
            {/* Phone Number */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-lg font-semibold text-left">
                Phone Number*
              </label>
              <div className="flex items-center border border-gray-300 rounded px-4 py-2 flex-wrap">
                <Image
                  src="/images/saudi-flag.png"
                  alt="Saudi Flag"
                  width={25}
                  height={25}
                  className="mr-2"
                />
                <span className="mr-2">+966</span>
                <input
                  type="text"
                  name="phone_number"
                  value={formValues.phone_number}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="flex-1 min-w-0 border-none outline-none text-base focus:ring-0 max-w-full"
                />
              </div>
              {errors.phone_number && (
                <p className="text-red-500 text-sm">{errors.phone_number}</p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-lg font-semibold text-left">
                Company Name*
              </label>
              <input
                type="text"
                name="company_name"
                value={formValues.company_name}
                onChange={handleChange}
                placeholder="Enter your company name"
                className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {errors.company_name && (
                <p className="text-red-500 text-sm">{errors.company_name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-lg font-semibold text-left">Email*</label>
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                className="w-full border border-gray-300 rounded px-4 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-lg font-semibold text-left">
                Password*
              </label>
              <div className="flex items-center border border-gray-300 rounded px-4 py-2">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formValues.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-primary hover:bg-onBtnHover text-white font-bold py-3 rounded transition duration-300"
              >
                Register
              </button>
            </div>

            {/* Login Link */}
            <div className="md:col-span-2 text-center mt-4">
              <Link href={"/login"}>
                <p className="text-primary hover:underline">
                  Have an account? Login Here
                </p>
              </Link>
            </div>
          </form>
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

export default RegistrationForm;
