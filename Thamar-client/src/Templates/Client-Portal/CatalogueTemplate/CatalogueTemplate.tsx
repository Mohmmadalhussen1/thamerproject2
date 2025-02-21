"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Spin,
  Input,
  Select,
  Form,
  Button,
  Row,
  Col,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Company,
  CompanyFiltering,
  PaymentInitiateResponse,
  Score,
  UserSubscriptionResponse,
} from "@/shared/types";
import { apiClient } from "@/utils/ApiCall";
import { toast } from "react-toastify";
import { getAccessToken, isAPIError } from "@/utils/utilFunctions";
import { useRouter } from "next/navigation";
import { GetCatalogueCompaniesResponse } from "@/Templates/Admin-Portal/CompaniesTemplate/types/type";
import { SearchOutlined } from "@ant-design/icons"; // ✅ Import icon
import dayjs from "dayjs";

function CatalogueTemplate() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  const [filters, setFilters] = useState<CompanyFiltering>({
    score_type: undefined,
    min_year: undefined,
    max_year: undefined,
    company_name: "",
    sectors: undefined,
  });

  // 🔹 Holds the input values before applying filters
  const [tempFilters, setTempFilters] = useState({
    company_name: "",
    // score_type: undefined,
    min_year: undefined,
    max_year: undefined,
    sectors: undefined,
  });

  const [isSubscriptionValid, setIsSubscriptionValid] = useState<
    boolean | null
  >(null);

  const router = useRouter();

  useEffect(() => {
    const fetchCompanies = async (page) => {
      setLoading(true);
      try {
        const accessToken = await getAccessToken("userToken");
        if (!accessToken) throw new Error("Access token is missing.");

        const userSubscriptionResponse = await apiClient<
          undefined,
          UserSubscriptionResponse
        >({
          headers: { Authorization: `Bearer ${accessToken}` },
          url: "/user/subscription",
          method: "GET",
        });

        const isSubscriptionValidCheck =
          !userSubscriptionResponse?.payment ||
          !userSubscriptionResponse?.subscription ||
          dayjs(userSubscriptionResponse.subscription.end_date).isBefore(
            dayjs()
          ) ||
          userSubscriptionResponse?.payment?.status?.toLowerCase() !==
            "settled";

        setIsSubscriptionValid(!isSubscriptionValidCheck);

        if (isSubscriptionValidCheck) {
          setLoading(false);
          return;
        }
        const queryParams = new URLSearchParams({
          page: page.toString(),
          page_size: "10",
          ...(filters.company_name && { company_name: filters.company_name }),
          ...(filters.score_type && { score_type: filters.score_type }),
          ...(filters.min_year && { min_year: filters.min_year }),
          ...(filters.max_year && { max_year: filters.max_year }),
          ...(filters.sectors && { sectors: filters.sectors }),
        });

        const response = await apiClient<
          undefined,
          GetCatalogueCompaniesResponse
        >({
          headers: { Authorization: `Bearer ${accessToken}` },
          url: `/companies-with-scores?${queryParams.toString()}`,
          method: "GET",
        });

        setCompanies(response?.data);
        setTotalCompanies(response.total);
      } catch (error: unknown) {
        if (isAPIError(error)) {
          toast.error(error?.detail || "An unexpected error occurred.");
        } else {
          console.error("Unknown error:", error);
          toast.error("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies(currentPage);
  }, [filters, currentPage]);

  // ✅ Handles user input but does NOT trigger an API call yet
  const handleInputChange = (key, value) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
    console.log(tempFilters);
  };

  // ✅ Applies all filters at once when clicking "Apply Filter"
  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setCurrentPage(1); // Reset to first page
  };

  const handleClearFilters = () => {
    setTempFilters({
      company_name: "",
      // score_type: undefined,
      min_year: undefined,
      max_year: undefined,
      sectors: undefined,
    });
    setFilters({
      // score_type: undefined,
      min_year: undefined,
      max_year: undefined,
      company_name: "",
      sectors: undefined,
    });
    setCurrentPage(1);
  };

  const columns: ColumnsType<Company> = [
    {
      title: "No.",
      key: "rowNumber",
      render: (_, __, index) => (currentPage - 1) * 10 + index + 1,
    },
    { title: "Name", dataIndex: "name", key: "name" },
    // { title: "Email", dataIndex: "email", key: "email" },
    // { title: "Phone", dataIndex: "phone_number", key: "phone_number" },
    {
      title: "Sectors",
      dataIndex: "sectors",
      key: "sectors",
      render: (sectors: string[] | undefined) =>
        sectors?.length
          ? `${sectors[0]} and ${sectors.length - 1} more`
          : "N/A",
    },
    {
      title: "Iktva Score",
      dataIndex: "scores",
      key: "scores",
      render: (scores: Score[]) => {
        // Find the latest score based on the highest year
        const filteredScores = scores.filter(
          (score) => score.score_type.trim().toLowerCase() === "iktva"
        );

        // If no valid iktva scores exist, return a message
        if (filteredScores.length === 0) {
          return <div className="">-</div>;
        }

        // Find the latest score based on the highest year
        const latestScore = filteredScores.reduce((prev, current) =>
          prev.year > current.year ? prev : current
        );

        return (
          <span style={{}}>
            {latestScore.score} {/* Display the latest score */}
          </span>
        );
      },
    },
    {
      title: "Local Score",
      dataIndex: "scores",
      key: "scores",
      render: (scores: Score[]) => {
        const filteredScores = scores.filter(
          (score) => score.score_type.trim().toLowerCase() === "local"
        );

        // If no valid iktva scores exist, return a message
        if (filteredScores.length === 0) {
          return <div className="">-</div>;
        }

        // Find the latest score based on the highest year
        const latestScore = filteredScores.reduce((prev, current) =>
          prev.year > current.year ? prev : current
        );
        return (
          <span style={{}}>
            {latestScore.score} {/* Display the latest score */}
          </span>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "id",
      key: "id",
      render: (id: number) => {
        return (
          <button
            className="p-2 bg-primary text-white rounded"
            onClick={() => router.push(`/user/catalogue/${id}`)}
          >
            Explore More
          </button>
        );
      },
    },
  ];

  const redirectToCheckout = async () => {
    setLoading(true);

    try {
      const accessToken = await getAccessToken("userToken");
      if (!accessToken) throw new Error("Access token is missing.");

      const paymentInitiateResponse = await apiClient<
        undefined,
        PaymentInitiateResponse
      >({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: "/payment/initiate?plan_id=2",
        method: "POST",
      });

      localStorage.setItem("orderId", paymentInitiateResponse?.order_id);

      if (paymentInitiateResponse?.redirect_url)
        window.location.href = paymentInitiateResponse?.redirect_url; // Redirect user to checkout page
    } catch (error: unknown) {
      if (isAPIError(error)) {
        toast.error(error?.detail || "An unexpected error occurred.");
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  {
    /* Generate Years from 2010 to Current Year */
  }
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => 2010 + i);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spin />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-semibold mb-4">Company Catalogue</h1>

      {/* Alert for No Subscription */}
      {!isSubscriptionValid ? (
        <Alert
          message="No Active Subscription"
          description="To access the company catalogue, you need to purchase a subscription."
          type="warning"
          showIcon
          action={
            <Button
              type="primary"
              onClick={redirectToCheckout}
              className="mt-2"
            >
              Pay Now
            </Button>
          }
          className="mb-4"
        />
      ) : (
        // Filters
        <Form
          layout="vertical"
          className="mb-4 bg-gray-100 p-4 rounded-xl shadow-sm"
        >
          <Row gutter={[12, 12]} align="middle">
            {/* 🔹 Search Field */}
            <Col xs={24} sm={12} md={5} lg={4}>
              <Form.Item>
                <Input
                  placeholder="Search by name"
                  value={tempFilters.company_name}
                  onChange={(e) =>
                    handleInputChange("company_name", e.target.value)
                  }
                  prefix={<SearchOutlined className="text-gray-400" />}
                  className="rounded-full px-4 py-2 border-gray-300 w-full"
                />
              </Form.Item>
            </Col>

            {/* 🔹 Score Type Filter */}
            {/* <Col xs={24} sm={12} md={4} lg={3}>
              <Form.Item>
                <Select
                  placeholder="Score Type"
                  value={tempFilters.score_type}
                  onChange={(value) => handleInputChange("score_type", value)}
                  allowClear
                  className="rounded-full w-full"
                >
                  <Option value="iktva">Iktva</Option>
                  <Option value="local">Local</Option>
                </Select>
              </Form.Item>
            </Col> */}

            {/* 🔹 Min Year Filter */}
            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Item>
                <Select
                  placeholder="Min Year"
                  value={tempFilters.min_year}
                  onChange={(value) => handleInputChange("min_year", value)}
                  className="rounded-full w-full"
                  options={years.map((year) => ({ value: year, label: year }))}
                />
              </Form.Item>
            </Col>

            {/* 🔹 Max Year Filter */}
            <Col xs={12} sm={6} md={3} lg={2}>
              <Form.Item>
                <Select
                  placeholder="Max Year"
                  value={tempFilters.max_year}
                  onChange={(value) => handleInputChange("max_year", value)}
                  className="rounded-full w-full"
                  options={years.map((year) => ({ value: year, label: year }))}
                />
              </Form.Item>
            </Col>

            {/* 🔹 Sectors Filter */}
            <Col xs={24} sm={12} md={5} lg={4}>
              <Form.Item>
                <Select
                  mode="multiple"
                  placeholder="Select Sectors"
                  value={tempFilters.sectors}
                  onChange={(value) => handleInputChange("sectors", value)}
                  allowClear
                  className="rounded-full w-full"
                  options={[
                    {
                      value: "SERVICES-KSA Accommodation",
                      label: "SERVICES-KSA Accommodation",
                    },
                    {
                      value: "SERVICES-KSA Food and Beverages",
                      label: "SERVICES-KSA Food and Beverages",
                    },
                    {
                      value: "SERVICES-KSA Industrial Services",
                      label: "SERVICES-KSA Industrial Services",
                    },
                    {
                      value: "SERVICES-KSA Security Services",
                      label: "SERVICES-KSA Security Services",
                    },
                    {
                      value: "SERVICES-KSA local Professional Services",
                      label: "SERVICES-KSA local Professional Services",
                    },
                    {
                      value:
                        "SERVICES-KSA local representatives of Foreign professional services provider",
                      label:
                        "SERVICES-KSA local representatives of Foreign professional services provider",
                    },
                    {
                      value: "SERVICES-KSA Real Estate",
                      label: "SERVICES-KSA Real Estate",
                    },
                    {
                      value: "SERVICES-KSA Construction",
                      label: "SERVICES-KSA Construction",
                    },
                    {
                      value: "SERVICES-KSA Education",
                      label: "SERVICES-KSA Education",
                    },
                    {
                      value: "SERVICES-KSA Finance and Insurance",
                      label: "SERVICES-KSA Finance and Insurance",
                    },
                    {
                      value: "SERVICES-KSA Healthcare",
                      label: "SERVICES-KSA Healthcare",
                    },
                    {
                      value: "SERVICES-KSA Public Administration and Defense",
                      label: "SERVICES-KSA Public Administration and Defense",
                    },
                    {
                      value: "SERVICES-KSA Transport and Logistics",
                      label: "SERVICES-KSA Transport and Logistics",
                    },
                    {
                      value: "SERVICES-KSA Onshore Drilling",
                      label: "SERVICES-KSA Onshore Drilling",
                    },
                    {
                      value: "SERVICES-KSA Offshore Drilling",
                      label: "SERVICES-KSA Offshore Drilling",
                    },
                    {
                      value: "SERVICES-KSA Mining",
                      label: "SERVICES-KSA Mining",
                    },
                    {
                      value: "SERVICES-KSA Facility Rental",
                      label: "SERVICES-KSA Facility Rental",
                    },
                    {
                      value: "SERVICES-KSA Cars, Truck, and Equipment Rental",
                      label: "SERVICES-KSA Cars, Truck, and Equipment Rental",
                    },
                    {
                      value: "SERVICES-KSA Man Power Supply",
                      label: "SERVICES-KSA Man Power Supply",
                    },
                    {
                      value: "SERVICES-IT & Telecom Services",
                      label: "SERVICES-IT & Telecom Services",
                    },
                    {
                      value: "SERVICES-KSA Other Services",
                      label: "SERVICES-KSA Other Services",
                    },
                    {
                      value: "SERVICES-KSA Foreign Services Agent",
                      label: "SERVICES-KSA Foreign Services Agent",
                    },
                    { value: "SERVICES- Foreign", label: "SERVICES- Foreign" },
                    {
                      value: "GOODS-KSA Agriculture, Forestry and Fishing",
                      label: "GOODS-KSA Agriculture, Forestry and Fishing",
                    },
                    {
                      value: "GOODS-KSA Food and Beverages",
                      label: "GOODS-KSA Food and Beverages",
                    },
                    {
                      value: "GOODS-KSA Chemicals and Gas",
                      label: "GOODS-KSA Chemicals and Gas",
                    },

                    {
                      value: "GOODS-KSA Chemicals Blending",
                      label: "GOODS-KSA Chemicals Blending",
                    },
                    {
                      value: "GOODS-KSA Machinery and Equipment",
                      label: "GOODS-KSA Machinery and Equipment",
                    },
                    {
                      value: "GOODS-KSA Electrical Materials",
                      label: "GOODS-KSA Electrical Materials",
                    },
                    { value: "GOODS-KSA Mining", label: "GOODS-KSA Mining" },
                    {
                      value: "GOODS-KSA Statistics Equipment",
                      label: "GOODS-KSA Statistics Equipment",
                    },
                    {
                      value: "GOODS-KSA Cement and Gypsum",
                      label: "GOODS-KSA Cement and Gypsum",
                    },
                    {
                      value: "GOODS-KSA Steal Rebar Manufacturing",
                      label: "GOODS-KSA Steal Rebar Manufacturing",
                    },
                    {
                      value: "GOODS-KSA IT & Telecom Manufacturing",
                      label: "GOODS-KSA IT & Telecom Manufacturing",
                    },
                    {
                      value: "GOODS-KSA Other Manufacturing",
                      label: "GOODS-KSA Other Manufacturing",
                    },
                    {
                      value: "GOODS-KSA Recycling",
                      label: "GOODS-KSA Recycling",
                    },
                    {
                      value: "GOODS-KSA Agent or Distributor",
                      label: "GOODS-KSA Agent or Distributor",
                    },
                    {
                      value: "KSA High LC Companies",
                      label: "KSA High LC Companies",
                    },
                    { value: "GOODS- Foreign", label: "GOODS- Foreign" },
                  ]}
                />
              </Form.Item>
            </Col>

            {/* 🔹 Button Group - Properly Aligned */}
            <Col
              xs={24}
              sm={24}
              md={6}
              lg={5}
              className="flex items-center justify-center lg:justify-end gap-2 mt-0 mb-3"
            >
              {/* 🔹 Apply Filters Button */}
              <Button onClick={handleApplyFilters} className="custom-button">
                Apply Filters
              </Button>

              {/* 🔹 Clear Filters Button */}
              <Button
                onClick={handleClearFilters}
                danger
                className="w-full sm:w-auto lg:w-auto"
              >
                Clear Filters
              </Button>
            </Col>
          </Row>
        </Form>
      )}

      {/* Need to update table render checks */}
      {/* Table */}
      {isSubscriptionValid && (
        <Table
          dataSource={companies}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{
            current: currentPage,
            total: totalCompanies,
            pageSize: 10,
            onChange: (page) => setCurrentPage(page),
          }}
          // onRow={(record) => ({
          //   onClick: () => router.push(`/user/catalogue/${record?.id}`),
          // })}
          scroll={{ x: "max-content" }}
        />
      )}
    </div>
  );
}

export default CatalogueTemplate;
