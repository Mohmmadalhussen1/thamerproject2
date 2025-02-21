"use client";
import React from "react";
import { useParams } from "next/navigation";
import SingleUserCompany from "@/Templates/Client-Portal/UserCompanyTemplate/SingleUserCompany";

function UserCompany() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <SingleUserCompany id={id} />
    </div>
  );
}

export default UserCompany;
