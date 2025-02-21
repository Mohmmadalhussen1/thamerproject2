import React from "react";
import { ToastContainer } from "react-toastify";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ToastContainer />
      {children}
    </div>
  );
}

export default layout;
