import React, { useEffect } from "react";
import axios from "axios";
import { apiClient } from "@/utils/ApiCall";
import { isAPIError } from "@/utils/utilFunctions";
import { toast } from "react-toastify";
import CompanyProfile from "@/components/CompanyProfile";
import { Spin } from "antd";
import EmptyState from "@/components/EmptyState";
import { Company } from "@/shared/types";

interface SingleCatalogueCompanyTemplateProp {
  id: string;
}

const SingleCatalogueCompanyTemplate: React.FC<
  SingleCatalogueCompanyTemplateProp
> = ({ id }) => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [company, setCompany] = React.useState<Company | null>(null);
  // const [companyStats, setCompanyStats] = React.useState<CompanyStats>({
  //   total_views: 0,
  //   views_last_7_days: 0,
  //   views_last_30_days: 0,
  //   anonymous_views: 0,
  //   authenticated_views: 0,
  // });

  const getCompanyById = async () => {
    // setLoading(true);
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }
      const data = await apiClient<undefined, Company>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/user/companies/${id}`,
        method: "GET",
      });

      // const companyStatsData = await apiClient<undefined, CompanyStats>({
      //   headers: { Authorization: `Bearer ${accessToken}` },
      //   url: `/api/companies/${id}/views/stats`,
      //   method: "GET",
      // });

      setCompany(data);
      // setCompanyStats(companyStatsData || null);
    } catch (error: unknown) {
      if (isAPIError(error)) {
        const errorMessage = error?.detail || "An unexpected error occurred.";
        toast.error(errorMessage);
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCompanyById();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "50px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh", // Make it full-screen height or adjust as needed
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!company) {
    return <EmptyState />;
  }

  return (
    <div>
      <CompanyProfile
        company={company}
        // viewStats={companyStats}
        path="catalogue"
      />
    </div>
  );
};

export default SingleCatalogueCompanyTemplate;
