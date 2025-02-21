"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  Button,
  Form,
  Input,
  Steps,
  Row,
  Col,
  Select,
  Upload,
} from "antd";
import { apiClient } from "@/utils/ApiCall";
import axios from "axios";
import { isAPIError } from "@/utils/utilFunctions";
import { toast } from "react-toastify";
import "./styles.css";
import TextArea from "antd/es/input/TextArea";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { uploadFileToS3 } from "@/utils/UploadFiletoS3/uploadFiletoS3";

interface Company {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  cr: string;
  website: string;
  tagline: string;
  description: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  instagram: string;
  local_score: number;
  current_iktva_score: number;
  last_year_iktva_score: number;
  iktva_certificate: string;
  is_approved: boolean;
  is_active: boolean;
  rejection_reason: string;
  user_id: number;
  created_at: string;
  logo_key?: string;
}
interface Response {
  message: string;
  company: Company;
}
const UserCompaniesTemplate = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [formOpen, setFormOpen] = useState(false);
  const router = useRouter(); // Initialize the router

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }
      const data = await apiClient<undefined, Company[]>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: "/user/companies",
        method: "GET",
      });
      setCompanies(data);
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
    fetchCompanies();
  }, []);

  const handleAddCompany = async (newCompany: Company) => {
    try {
      const tokenResponse = await axios.get(
        "/api/get-cookie?tokenName=userToken"
      );
      const accessToken = tokenResponse?.data?.cookies?.accessToken;

      if (!accessToken) {
        throw new Error("Access token is missing from the response.");
      }

      const logo = await form.getFieldValue("logo");
      if (logo?.length && logo?.[0]?.key) {
        const key = logo?.[0].key;
        newCompany.logo_key = key;
      }
      const addedCompany = await apiClient<typeof newCompany, Response>({
        headers: { Authorization: `Bearer ${accessToken}` },
        url: "/register-company",
        method: "POST",
        data: newCompany,
      });

      setCompanies((prevCompanies) => [
        ...prevCompanies,
        addedCompany?.company,
      ]);
      toast.success(addedCompany?.message);
      setCurrentStep(0); // Reset steps
      form.resetFields();
      setFormOpen(false);
    } catch (error: unknown) {
      if (isAPIError(error)) {
        const errorMessage = error?.detail || "An unexpected error occurred.";
        toast.error(errorMessage);
      } else {
        console.error("Unknown error:", error);
        toast.error("An unknown error occurred.");
      }
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone_number", key: "phone_number" },
    // { title: "CR", dataIndex: "cr", key: "cr" },
    // { title: "Website", dataIndex: "website", key: "website" },
    {
      title: "Sectors",
      dataIndex: "sectors",
      key: "sectors",
      render: (sectors: string[] | undefined) => {
        if (!sectors || sectors.length === 0) return "N/A";
        if (sectors.length === 1) return sectors[0];
        return `${sectors[0]} and ${sectors.length - 1} more`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let backgroundColor;
        let text;

        switch (status?.toLowerCase()) {
          case "approved":
            backgroundColor = "#30AA7F"; // Green
            text = "Approved";
            break;
          case "rejected":
            backgroundColor = "#FF4D4F"; // Red
            text = "Rejected";
            break;
          case "pending":
          default:
            backgroundColor = "#F69C2E"; // Orange
            text = "Pending";
            break;
        }

        return (
          <span
            style={{
              padding: "6px 15px",
              backgroundColor,
              borderRadius: "5px",
              color: "#fff",
            }}
          >
            {text}
          </span>
        );
      },
    },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2009 }, (_, i) => 2010 + i);

  const steps = [
    {
      title: "Basic Information",
      fields: [
        "name",
        "email",
        "phone_number",
        "cr",
        "website",
        "tagline",
        "description",
      ], // Field names
      content: (
        <>
          <h3 className="text-lg font-medium mb-4">Enter Basic Information</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Company Name"
                rules={[
                  {
                    required: true,
                    message: "Please enter the company name",
                  },
                ]}
              >
                <Input placeholder="e.g., ABC Corporation" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter the email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="e.g., contact@abc.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone_number"
                label="Phone Number"
                rules={[
                  {
                    required: true,
                    message: "Please enter the phone number",
                  },
                ]}
              >
                <Input placeholder="e.g., +123456789" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cr"
                label="Company registration number"
                rules={[
                  {
                    required: true,
                    message: "Please enter the Company registration number",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="website" label="Website">
                <Input placeholder="https://www.abc.com"/>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tagline" label="Tag Line">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="description" label="Description">
                <TextArea
                  showCount
                  maxLength={4000}
                  placeholder="Describe the company"
                  style={{ height: 120, resize: "none" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="logo"
                label="Upload Logo"
                valuePropName="fileList"
                getValueFromEvent={(e: { fileList: File[] }) => e?.fileList}
              >
                <Upload
                  name="logo"
                  listType="picture-circle" // Enables the picture card UI
                  beforeUpload={() => false} // Prevent auto-upload
                  maxCount={1} // Restrict to a single file
                  onPreview={(file) => {
                    const url = file?.thumbUrl || file?.url;
                    if (url) {
                      const imgWindow = window.open(url, "_blank");
                      imgWindow?.focus();
                    }
                  }}
                  showUploadList={{
                    showPreviewIcon: false, // Display the preview icon
                    showRemoveIcon: false, // Allow removal of the uploaded file
                  }}
                  onChange={async ({ fileList }) => {
                    if (fileList && fileList[0] && fileList[0].originFileObj) {
                      try {
                        const tokenResponse = await axios.get(
                          "/api/get-cookie?tokenName=userToken"
                        );
                        const accessToken =
                          tokenResponse?.data?.cookies?.accessToken;

                        if (!accessToken) {
                          throw new Error(
                            "Access token is missing from the response."
                          );
                        }

                        // Upload the file to S3
                        const { key } = await uploadFileToS3(
                          fileList[0].originFileObj,
                          accessToken
                        );

                        // Update the form's `logo` field with the file key
                        form.setFieldsValue({
                          logo: [
                            {
                              key,
                              name: fileList[0].name,
                              url: fileList[0].thumbUrl,
                            },
                          ], // Save the S3 key and file name
                        });

                        // toast.success("Logo uploaded successfully!");
                      } catch (error) {
                        console.error("Logo upload failed:", error);
                        // toast.error("Failed to upload logo. Please try again.");
                      }
                    }
                  }}
                >
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload Logo</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      title: "Social Media Information",
      fields: ["linkedin", "facebook", "twitter", "instagram"], // Field names
      content: (
        <>
          <h3 className="text-lg font-medium mb-4">
            Provide Social Media Information
          </h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="linkedin"
                label="LinkedIn"
                rules={[{ type: "url", message: "Please enter a valid URL!" }]}
              >
                <Input placeholder="https://www.linkedin.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="facebook"
                label="Facebook"
                rules={[{ type: "url", message: "Please enter a valid URL!" }]}
              >
                <Input placeholder="https://www.facebook.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="twitter"
                label="Twitter"
                rules={[{ type: "url", message: "Please enter a valid URL!" }]}
              >
                <Input placeholder="https://www.twitter.com" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="instagram"
                label="Instagram"
                rules={[{ type: "url", message: "Please enter a valid URL!" }]}
              >
                <Input placeholder="https://www.instagram.com" />
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
    {
      title: "IKTVA Scores",
      fields: [
        "current_iktva_score",
        "last_year_iktva_score",
        "awards",
        "sectors",
        "score_files",
      ],
      content: (
        <>
          <h3 className="text-lg font-medium mb-4">
            Enter IKTVA Scores for Evaluation
          </h3>

          <Row gutter={16}>
            {/* Sectors Dropdown */}
            <Col span={12}>
              <Form.Item
                name="sectors"
                label="Sectors"
                rules={[
                  {
                    required: true,
                    message: "Please select at least one sector",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select sectors"
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
                      value: "GOODS-KSA Food and Beverages",
                      label: "GOODS-KSA Food and Beverages",
                    },
                    {
                      value: "GOODS-KSA Chemicals and Gas",
                      label: "GOODS-KSA Chemicals and Gas",
                    },
                    {
                      value: "GOODS-KSA Agriculture, Forestry and Fishing",
                      label: "GOODS-KSA Agriculture, Forestry and Fishing",
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

            <Col span={12}>
              <Form.Item
                label="Awards"
                help="Add multiple awards received by the company"
                name="awards"
              >
                <Form.List name="awards">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name }) => (
                        <Row
                          key={key}
                          gutter={16}
                          style={{ marginBottom: "10px" }}
                        >
                          <Col span={20}>
                            <Form.Item
                              name={name}
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter an award",
                                },
                              ]}
                            >
                              <Input placeholder={`Award ${key + 1}`} />
                            </Form.Item>
                          </Col>
                          <Col span={4}>
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        style={{ width: "100%" }}
                      >
                        Add Award
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            {/* Scores Section */}
            <Col span={24}>
              <Form.Item
                label="Scores"
                help="Add year, score, score type, and upload a certificate for each score."
                name="scores"
              >
                <Form.List name="scores">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name }) => (
                        <Row
                          key={key}
                          gutter={16}
                          align="middle"
                          className="my-3"
                        >
                          <Col span={5}>
                            <Form.Item
                              name={[name, "year"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Please select the year",
                                },
                              ]}
                            >
                              <Select placeholder="Select Year">
                                {years.map((year) => (
                                  <Select.Option key={year} value={year}>
                                    {year}
                                  </Select.Option>
                                ))}
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={5}>
                            <Form.Item
                              name={[name, "score"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter the score",
                                },
                              ]}
                            >
                              <Input placeholder="Score (e.g., 80)" />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              name={[name, "score_type"]}
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter the score type",
                                },
                              ]}
                            >
                              {/* <Input placeholder="Score Type (e.g., Final, Interim)" /> */}
                              <Select
                                placeholder="Select a score type"
                                options={[
                                  {
                                    value: "Iktva",
                                    label: "Iktva Score",
                                  },
                                  {
                                    value: "Local",
                                    label: "Local Score",
                                  },
                                ]}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item
                              name={[name, "file_key"]} // Bind to `file_key`
                              valuePropName="file_key"
                              // style={{ marginBottom: 0 }}
                              rules={[
                                {
                                  required: true,
                                  message: "Please upload a certificate",
                                },
                              ]}
                            >
                              <Upload
                                name="file"
                                style={{ marginBottom: 0 }}
                                listType="text"
                                beforeUpload={() => false} // Prevent auto-upload
                                maxCount={1} // Restrict to a single file
                                onChange={async ({ fileList }) => {
                                  if (
                                    fileList &&
                                    fileList[0] &&
                                    fileList[0].originFileObj
                                  ) {
                                    try {
                                      const tokenResponse = await axios.get(
                                        "/api/get-cookie?tokenName=userToken"
                                      );
                                      const accessToken =
                                        tokenResponse?.data?.cookies
                                          ?.accessToken;

                                      if (!accessToken) {
                                        throw new Error(
                                          "Access token is missing from the response."
                                        );
                                      }

                                      // Upload the file to S3
                                      const { key } = await uploadFileToS3(
                                        fileList[0].originFileObj,
                                        accessToken
                                      );

                                      // Update the `file_key` field in the form
                                      const currentScores =
                                        form.getFieldValue("scores") || [];
                                      currentScores[name] = {
                                        ...currentScores[name],
                                        file_key: key, // Add the file key directly
                                      };
                                      form.setFieldsValue({
                                        scores: currentScores,
                                      }); // Update the form
                                      // toast.success(
                                      //   "File uploaded successfully!"
                                      // );
                                    } catch (error) {
                                      console.error(
                                        "File upload failed:",
                                        error
                                      );
                                      // toast.error(
                                      //   "Failed to upload file. Please try again."
                                      // );
                                    }
                                  }
                                }}
                              >
                                <Button icon={<PlusOutlined />}>
                                  Upload Certificate
                                </Button>
                              </Upload>
                            </Form.Item>
                          </Col>
                          <Col span={2}>
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        icon={<PlusOutlined />}
                        style={{ width: "100%" }}
                      >
                        Add Score
                      </Button>
                    </>
                  )}
                </Form.List>
              </Form.Item>
            </Col>
          </Row>
        </>
      ),
    },
  ];

  const handleNext = () => {
    form
      .validateFields(steps[currentStep].fields) // Validate only the current step's fields
      .then(() => {
        setCurrentStep((prevStep) => prevStep + 1); // Move to the next step
      })
      .catch((error) => console.error("Validation failed:", error));
  };

  const handlePrev = () => setCurrentStep((prevStep) => prevStep - 1);
  const handleSubmit = async () => {
    try {
      // Validate all fields only if the above condition is satisfied
      const allValues = await form.validateFields();

      handleAddCompany(allValues); // Send all form data to the API
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  return (
    <div className=" w-full h-full overflow-auto">
      {!formOpen ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">User Companies</h2>
            <Button
              type="primary"
              className="custom-button"
              onClick={() => setFormOpen(true)}
            >
              Add Company
            </Button>
          </div>
          <Table
            dataSource={companies}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: "max-content" }}
            pagination={false}
            onRow={(record) => ({
              onClick: () => {
                router.push(`/user/user-companies/${record?.id}`);
              },
            })}
          />
        </>
      ) : (
        <>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Steps current={currentStep} size="small" className="custom-steps">
              {steps.map((step, index) => (
                <Steps.Step key={index} title={step.title} />
              ))}
            </Steps>
            <div className="p-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  style={{
                    display: index === currentStep ? "block" : "none", // Hide non-active steps
                  }}
                >
                  {step.content}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              {currentStep > 0 && (
                <Button
                  onClick={handlePrev}
                  className="previous-button"
                  style={{ marginRight: 8 }}
                >
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button
                  type="primary"
                  className="custom-button"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button
                  type="primary"
                  htmlType="submit"
                  className="custom-button"
                >
                  Submit
                </Button>
              )}
              <Button
                className="cancel-button"
                style={{ marginLeft: 8 }}
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </>
      )}
    </div>
  );
};

export default UserCompaniesTemplate;
