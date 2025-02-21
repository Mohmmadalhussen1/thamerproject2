"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { apiClient } from "@/utils/ApiCall";
import { Row, Col, Card, Statistic, Table, Tag, Spin } from "antd";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js Components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Interface for API Data
interface DashboardData {
  profile_summary: {
    total_companies: number;
    approved_companies: number;
  };
  engagement: {
    total_views: number;
    view_trend: Record<string, number>;
  };
  subscription: {
    plan_name: string;
    renewal_date: string;
  };
  performance: {
    score_trend: Record<string, number>;
  };
  company_stats: {
    company_name: string;
    monthly_views: Record<string, number>;
    performance_trend: Record<string, number>;
  }[];
}

function ClientDashboardTemplate() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true); // Track loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenResponse = await axios.get(
          "/api/get-cookie?tokenName=userToken"
        );
        const accessToken = tokenResponse?.data?.cookies?.accessToken;

        if (!accessToken) {
          throw new Error("Access token is missing from the response.");
        }

        const response = await apiClient<undefined, DashboardData>({
          headers: { Authorization: `Bearer ${accessToken}` },
          url: `/stats`,
          method: "GET",
        });

        setData(response);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 📌 Show Centered Spinner When Loading
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100%",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!data) return <p>Error loading data</p>;

  const {
    profile_summary,
    engagement,
    subscription,
    performance,
    company_stats,
  } = data;

  // 📊 Bar Chart Data (Overall Monthly Views)
  const barChartData = {
    labels: Object.keys(engagement.view_trend),
    datasets: [
      {
        label: "Total Views",
        data: Object.values(engagement.view_trend),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // 📊 Stacked Bar Chart Data (Company-wise Monthly Views)
  const companyBarData = {
    labels: Object.keys(engagement.view_trend),
    datasets: company_stats.map((company) => ({
      label: company.company_name,
      data: Object.keys(engagement.view_trend).map(
        (month) => company.monthly_views[month] || 0
      ),
      backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
        Math.random() * 255
      }, 0.6)`,
      borderColor: "black",
      borderWidth: 1,
    })),
  };

  // 📈 Line Chart Data (Overall Performance Trend)
  const lineChartData = {
    labels: Object.keys(performance.score_trend),
    datasets: [
      {
        label: "Performance Score",
        data: Object.values(performance.score_trend),
        fill: false,
        borderColor: "#36A2EB",
        backgroundColor: "#36A2EB",
        tension: 0.2,
      },
    ],
  };

  // 📈 Multi-Line Chart Data (Company Performance Trends)
  const companyLineData = {
    labels: Object.keys(performance.score_trend),
    datasets: company_stats.map((company) => ({
      label: company.company_name,
      data: Object.keys(performance.score_trend).map(
        (year) => company.performance_trend[year] || 0
      ),
      borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${
        Math.random() * 255
      }, 1)`,
      backgroundColor: "transparent",
      borderWidth: 2,
      tension: 0.2,
    })),
  };

  // 📋 Table Columns (Company Stats)
  const columns = [
    {
      title: "Company",
      dataIndex: "company_name",
      key: "company_name",
    },
    {
      title: "Monthly Views",
      dataIndex: "monthly_views",
      key: "monthly_views",
      render: (views: Record<string, number>) => (
        <Tag color="blue">
          {Object.values(views).reduce((a, b) => a + b, 0)}
        </Tag>
      ),
    },
    {
      title: "Performance Trend",
      dataIndex: "performance_trend",
      key: "performance_trend",
      render: (trend: Record<string, number>) => (
        <Tag color="green">
          {Object.values(trend).reduce((a, b) => a + b, 0)}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}
      >
        🚀 User Dashboard
      </h1>

      {/* 📌 Summary Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Companies"
              value={profile_summary.total_companies ?? "N/A"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Approved Companies"
              value={profile_summary.approved_companies ?? "N/A"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Views"
              value={engagement.total_views ?? "N/A"}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Subscription Plan"
              value={subscription.plan_name ?? "N/A"}
            />
          </Card>
        </Col>
      </Row>

      {/* 📊 Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
        <Col xs={24} lg={12}>
          <Card>
            <h2>📊 Monthly Views</h2>
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <h2>📈 Yearly Performance Trend</h2>
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 📋 Summary Table */}
      <Card style={{ marginTop: "24px" }}>
        <h2>📋 Company Stats</h2>
        <Table
          columns={columns}
          dataSource={company_stats}
          rowKey="company_name"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* 📊 More Charts with Titles */}
      <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
        <Col xs={24} lg={12}>
          <Card>
            <h2>📊 Monthly Views Per Company</h2>
            <Bar
              data={companyBarData}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <h2>📈 Yearly Performance Per Company</h2>
            <Line
              data={companyLineData}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ClientDashboardTemplate;
