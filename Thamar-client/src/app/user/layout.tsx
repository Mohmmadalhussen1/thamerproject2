import React from "react";
import DashboardTemplate from "@/Templates/Client-Portal/DashboradTemplate/DaashboaardTemplate";
import { ToastContainer } from "react-toastify";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="">
      {/* <ClientPortalDashboard /> */}
      <ToastContainer />
      <DashboardTemplate>{children}</DashboardTemplate>
    </div>
  );
}

export default layout;
