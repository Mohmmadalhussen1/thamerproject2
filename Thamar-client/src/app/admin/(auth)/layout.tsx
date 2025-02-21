import AdminDashboardTemplate from "@/Templates/Admin-Portal/DashboardTemplate/AdminDashboardTemplate";
import React from "react";
import { ToastContainer } from "react-toastify";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ToastContainer />
      <AdminDashboardTemplate>{children}</AdminDashboardTemplate>
    </div>
  );
}

export default layout;
