import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="">
      <NavBar />
      {children}
      <Footer />
    </div>
  );
}

export default layout;
