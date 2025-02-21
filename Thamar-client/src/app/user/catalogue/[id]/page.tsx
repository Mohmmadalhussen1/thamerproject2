"use client";
import SingleCatalogueCompanyTemplate from "@/Templates/Client-Portal/CatalogueTemplate/SingleCatalogueCompanyTemplate";
import { useParams } from "next/navigation";
import React from "react";

function SingleCatalogueCompany() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <SingleCatalogueCompanyTemplate id={id} />
    </div>
  );
}

export default SingleCatalogueCompany;
