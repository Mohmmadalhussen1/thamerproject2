"use client";
import React from "react";
import DetailCompanyTemplate from "@/Templates/Admin-Portal/CompaniesTemplate/DetailCompanyTemplate/DetailCompanyTemplate";
import { useParams } from "next/navigation";

function CompanyDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <DetailCompanyTemplate id={id} />
    </div>
  );
}

export default CompanyDetail;
