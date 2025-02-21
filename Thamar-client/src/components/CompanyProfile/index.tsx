console.log("Base API URL:", process.env.NEXT_PUBLIC_API_URL);

import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Tag,
  Avatar,
  Button,
  Tooltip,
  List,
  Statistic,
  Badge,
  Pagination,
  Spin,
} from "antd";
import {
  DownloadOutlined,
  // EditOutlined,
  FacebookOutlined,
  FieldTimeOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  UserOutlined,
  XOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { CompanyStats, Viewer, ViewersResponse } from "@/shared/types";
import axios from "axios";
import { apiClient } from "@/utils/ApiCall";
import { isAPIError } from "@/utils/utilFunctions";
import { usePathname } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
// import CompanyProfileEdit from "../EditableSection";
// import EditCompanyModal from "../EditableSection";
import "./../EditableSection/styles.css";
dayjs.extend(relativeTime);
dayjs.extend(utc);

// Register necessary chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Legend
);

interface Score {
  id: number;
  year: number;
  score: number;
  score_type: string;
  file: { key?: string; url?: string };
}

interface Company {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  cr: string;
  website: string;
  description: string;
  tagline: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  logo: { key: string; url: string };
  awards: string[] | null;
  sectors: string[] | null;
  created_at: string;
  last_updated: string;
  scores: Score[];
  status?: string;
  rejection_reason: string;
}

const CompanyProfile = ({
  company,
  isAdmin = false,
  onApprove,
  onReject,
  viewStats,
  path,
}: {
  company: Company;
  isAdmin?: boolean;
  onApprove?: (companyId: number) => void;
  onReject?: (companyId: number) => void;
  viewStats?: CompanyStats;
  path?: string;
}) => {
  const pathname = usePathname();
  // 📊 Filter scores by type
  const iktvaScores = company.scores.filter(
    (score) => score.score_type === "Iktva"
  );
  const localScores = company.scores.filter(
    (score) => score.score_type === "Local"
  );

  // Get all unique years (sorted) to ensure both lines align correctly
  const allYears = Array.from(
    new Set(company.scores.map((score) => score.year))
  ).sort();

  // 📊 Chart Data with Two Lines
  const scoreChartData = {
    labels: allYears.map(String), // Convert years to strings for labels
    datasets: [
      {
        label: "IKTVA Scores",
        data: allYears.map(
          (year) =>
            iktvaScores.find((score) => score.year === year)?.score || null
        ),
        borderColor: "#42A5F5", // Blue
        backgroundColor: "rgba(66, 165, 245, 0.2)", // Light Blue
        tension: 0.4,
      },
      {
        label: "Local Scores",
        data: allYears.map(
          (year) =>
            localScores.find((score) => score.year === year)?.score || null
        ),
        borderColor: "#FFA726", // Orange
        backgroundColor: "rgba(255, 167, 38, 0.2)", // Light Orange
        tension: 0.4,
      },
    ],
  };

  // 🎯 Chart Options
  const scoreChartOptions = {
    responsive: true,
    maintainAspectRatio: window.innerWidth >= 768, // Dynamic aspect ratio
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Company Score Trends (IKTVA & Local)",
      },
    },
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge status="success" text="Approved" />;
      case "pending":
        return <Badge status="warning" text="Pending" />;
      case "rejected":
        return <Badge status="error" text="Rejected" />;
      default:
        return <Badge status="default" text="Unknown Status" />;
    }
  };

  const handleCompanyView = async () => {
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }
      await apiClient<undefined, string>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/company/${company?.id}/view`,
        method: "POST",
      });
    } catch (error: unknown) {
      if (isAPIError(error)) {
        const errorMessage = error?.detail || "An unexpected error occurred.";
        console.error(errorMessage);
      } else {
        console.error("Unknown error:", error);
      }
    }
  };
  useEffect(() => {
    if (path === "catalogue") {
      handleCompanyView();
    }
  });

  // 📊 State for viewers data and pagination
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [totalViewers, setTotalViewers] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingViewers, setLoadingViewers] = useState<boolean>(true);

  // ✅ Fetch paginated viewers
  const fetchViewers = async (page: number) => {
    setLoadingViewers(true);
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) throw new Error("Access token is missing.");

      const response = await apiClient<undefined, ViewersResponse>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: `/companies/${company.id}/viewers?page=${page}&page_size=20`,
        method: "GET",
      });

      setViewers(response?.items || []);
      setTotalViewers(response?.total || 0);
    } catch (error) {
      console.error(
        "Error fetching viewers:",
        isAPIError(error) ? error.detail : error
      );
    } finally {
      setLoadingViewers(false);
    }
  };

  // ✅ Fetch viewers when page changes
  useEffect(() => {
    fetchViewers(currentPage);
  }, [currentPage]);

  // const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="container">
      {/* Company Header */}
      <Card className="company-header" style={{ marginBottom: "16px" }}>
        <Row align="middle" gutter={[16, 16]}>
          {/* Logo */}
          <Col xs={24} sm={6} md={4}>
            {company.logo ? (
              <Avatar src={company.logo?.url} size={100} />
            ) : (
              <Avatar size={100}>{company.name[0]}</Avatar>
            )}
          </Col>
          {/* Company Name & Tagline */}
          <Col xs={24} sm={18} md={20} style={{ paddingLeft: "16px" }}>
            <Title level={3}>{company.name}</Title>
            <Text type="secondary">
              {company.tagline || "No Tagline Available"}
            </Text>

            {path !== "catalogue" && (
              <div style={{ marginTop: "8px" }}>
                {getStatusBadge(company.status)}
              </div>
            )}
          </Col>
          {/* Admin Controls (Approve/Reject Buttons) */}
          {isAdmin && company?.status === "pending" && (
            <Col>
              <Button
                type="primary"
                className="custom-button"
                onClick={() => onApprove?.(company.id)}
                style={{ marginRight: "8px" }}
              >
                Approve
              </Button>
              <Button danger onClick={() => onReject?.(company.id)}>
                Reject
              </Button>
            </Col>
          )}
          {/* <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => setIsModalOpen(true)}
            className="custom-button"
          >
            Edit Company
          </Button> */}
        </Row>

        {/* Rejected Reason - Visible to All Users */}
        {company?.status === "rejected" && (
          <Row style={{ marginTop: "8px" }}>
            <Col span={24}>
              <Text type="danger">
                <strong>Rejected Reason:</strong>{" "}
                {company?.rejection_reason || "No reason provided"}
              </Text>
            </Col>
          </Row>
        )}
      </Card>

      {/* About Section */}
      <Card title="About" style={{ marginBottom: "16px" }}>
        <Paragraph>
          {company.description || "No Description Available"}
        </Paragraph>
        <Divider />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Website: </Text>
            <a href={company.website} target="_blank" rel="noopener noreferrer">
              {company.website || "N/A"}
            </a>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Email: </Text>
            <Text>{company.email}</Text>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: "8px" }}>
          <Col xs={24} sm={12}>
            <Text strong>Phone: </Text>
            <Text>{company.phone_number}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>CR Number: </Text>
            <Text>{company.cr}</Text>
          </Col>
        </Row>
      </Card>

      {/* Scores Section */}
      <Card title="Scores" style={{ marginBottom: "16px" }}>
        {company.scores && company.scores.length > 0 ? (
          <Row gutter={[16, 16]}>
            {company.scores.map((score) => (
              <Col key={score.id} xs={24} sm={12} md={8}>
                <Card hoverable>
                  <Title level={5} style={{ marginBottom: "8px" }}>
                    {score.year}
                  </Title>
                  <Text>
                    <strong>Score: </strong>
                    {score.score}
                  </Text>
                  <br />
                  <Text>
                    <strong>Type: </strong>
                    {score.score_type}
                  </Text>
                  <Divider />
                  {!pathname.includes("catalogue") && (
                    <Tooltip title="Download File">
                      <Button
                        icon={<DownloadOutlined />}
                        href={score.file?.url}
                        target="_blank"
                        style={{
                          backgroundColor: "#88A34A",
                          color: "#fff",
                          border: "2px solid #88A34A",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#6B8E23";
                          e.currentTarget.style.color = "#000";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#88A34A";
                          e.currentTarget.style.color = "#fff";
                        }}
                      >
                        Download
                      </Button>
                    </Tooltip>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Text>No Scores Available</Text>
        )}
      </Card>
      <div className="container">
        {/* 📊 Score Trends Section */}
        <Card title="Score Trends" style={{ marginBottom: "16px" }}>
          <Row justify="center" align="middle" style={{ minHeight: "300px" }}>
            <Col
              xs={24}
              sm={22}
              md={16}
              lg={12}
              className="flex items-center justify-center"
            >
              {company.scores && company.scores.length > 0 ? (
                <div style={{ width: "100%", height: "300px" }}>
                  <Line data={scoreChartData} options={scoreChartOptions} />
                </div>
              ) : (
                <Text className="text-center">No Scores Available</Text>
              )}
            </Col>
          </Row>
        </Card>
      </div>

      <Card title="Social Media" style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]}>
          {company.linkedin && (
            <Col>
              <a
                href={company.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#8c8c8c", // Light black/gray color
                  fontSize: "16px",
                  transition: "color 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#0077b5")} // LinkedIn brand color on hover
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8c8c8c")}
              >
                <LinkedinOutlined
                  style={{ fontSize: "24px", marginRight: "8px" }}
                />{" "}
                LinkedIn
              </a>
            </Col>
          )}
          {company.facebook && (
            <Col>
              <a
                href={company.facebook}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#8c8c8c", // Light black/gray color
                  fontSize: "16px",
                  transition: "color 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#4267B2")} // Facebook brand color on hover
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8c8c8c")}
              >
                <FacebookOutlined
                  style={{ fontSize: "24px", marginRight: "8px" }}
                />{" "}
                Facebook
              </a>
            </Col>
          )}
          {company.twitter && (
            <Col>
              <a
                href={company.twitter}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#8c8c8c", // Light black/gray color
                  fontSize: "16px",
                  transition: "color 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#000")} // Twitter brand color on hover
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8c8c8c")}
              >
                <XOutlined style={{ fontSize: "24px", marginRight: "8px" }} /> X
              </a>
            </Col>
          )}
          {company.instagram && (
            <Col>
              <a
                href={company.instagram}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  color: "#8c8c8c", // Light black/gray color
                  fontSize: "16px",
                  transition: "color 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E1306C")} // Instagram brand color on hover
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8c8c8c")}
              >
                <InstagramOutlined
                  style={{ fontSize: "24px", marginRight: "8px" }}
                />{" "}
                Instagram
              </a>
            </Col>
          )}
        </Row>
      </Card>

      {/* Awards and Sectors Section */}
      <Card title="Awards and Sectors" style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]}>
          {/* Awards Section */}
          <Col xs={24} sm={12}>
            <Title level={5}>Awards</Title>
            {company.awards && company.awards.length > 0 ? (
              <List
                dataSource={company.awards}
                renderItem={(award) => <List.Item>{award}</List.Item>}
              />
            ) : (
              <Text>No Awards Available</Text>
            )}
          </Col>

          {/* Sectors Section (Fix for Overflowing Tags) */}
          <Col xs={24} sm={12}>
            <Title level={5}>Sectors</Title>
            {company.sectors && company.sectors.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {company.sectors.map((sector, index) => (
                  <Tag
                    key={index}
                    color="green"
                    className="whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                  >
                    {sector}
                  </Tag>
                ))}
              </div>
            ) : (
              <Text>No Sectors Available</Text>
            )}
          </Col>
        </Row>
      </Card>

      {/* 📈 View Statistics */}
      <div className="container">
        {/* 📊 View Statistics */}
        {path !== "catalogue" && (
          <Card title="Statistics" style={{ marginBottom: "16px" }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Views"
                  value={viewStats?.total_views || 0}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Views (Last 7 Days)"
                  value={viewStats?.views_last_7_days || 0}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Views (Last 30 Days)"
                  value={viewStats?.views_last_30_days || 0}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Anonymous Views"
                  value={viewStats?.anonymous_views || 0}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Authenticated Views"
                  value={viewStats?.authenticated_views || 0}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* 👀 Viewer Statistics  only show when its user is watching */}
        {/*  */}

        {pathname.includes("user-companies") && (
          <Card title="Recent Viewers" style={{ marginBottom: "16px" }}>
            {/* 🔄 Loading State */}
            {loadingViewers ? (
              <Spin size="large" />
            ) : (
              <>
                {/* 👥 Viewers List */}
                <List
                  itemLayout="horizontal"
                  dataSource={viewers}
                  renderItem={(viewer) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={50}
                            src={viewer.profile_picture}
                            icon={!viewer.profile_picture && <UserOutlined />}
                          />
                        }
                        title={
                          <div className="flex justify-between items-center">
                            <span>{viewer.viewer_name}</span>
                            <Text type="secondary" className="text-sm">
                              <FieldTimeOutlined className="mr-1" />{" "}
                              {dayjs(viewer?.viewed_at)?.fromNow()}
                            </Text>
                          </div>
                        }
                        description={
                          <div>
                            <MailOutlined className="mr-2 text-gray-500" />
                            <a
                              href={`mailto:${viewer?.viewer_email}`}
                              className="text-blue-500"
                            >
                              {viewer?.viewer_email}
                            </a>
                            <br />
                            <Text type="secondary">
                              Company: <strong>{viewer?.company_name}</strong>
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />

                {/* 🔢 Pagination */}
                <div className="flex justify-center mt-4">
                  <Pagination
                    current={currentPage}
                    pageSize={20}
                    total={totalViewers}
                    onChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </>
            )}
          </Card>
        )}
      </div>

      {/* Metadata Section */}
      <Card title="Record Information">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Text strong>Created At: </Text>
            <Text>{new Date(company.created_at).toLocaleString()}</Text>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Last Updated: </Text>
            <Text>{new Date(company.last_updated).toLocaleString()}</Text>
          </Col>
        </Row>
      </Card>

      {/* Edit Company Modal */}

      {/* {pathname?.includes("user-companies") && (
        <EditCompanyModal
          company={company}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )} */}
    </div>
  );
};

export default CompanyProfile;
