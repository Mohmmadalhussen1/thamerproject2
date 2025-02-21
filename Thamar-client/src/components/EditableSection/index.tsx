"use client";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Steps,
  Row,
  Col,
  Select,
  Button,
  Space,
  Upload,
  Spin,
} from "antd";
import { apiClient } from "@/utils/ApiCall";
import axios from "axios";
import { toast } from "react-toastify";
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { uploadFileToS3 } from "@/utils/UploadFiletoS3/uploadFiletoS3";
import "./styles.css";
const { TextArea } = Input;
const { Step } = Steps;

interface Score {
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
  logo: { url: string; key: string };
  awards: string[] | null;
  sectors: string[] | null;
  created_at: string;
  last_updated: string;
  scores: Score[];
  status?: string;
  rejection_reason: string;
}

interface Props {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
}

const EditCompanyModal: React.FC<Props> = ({ company, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false); // State to track upload progress
  const [logoPreview, setLogoPreview] = useState<{
    key?: string;
    url?: string;
  } | null>(company.logo || null);

  useEffect(() => {
    if (company.logo) {
      setLogoPreview(company.logo);
      form.setFieldsValue({
        logo: [{ key: company.logo.key, url: company.logo.url }],
      });
    }
    form.setFieldsValue(company);
  }, [company]);

  const handleNext = () => {
    form
      .validateFields(steps[currentStep].fields)
      .then(() => {
        setCurrentStep((prev) => prev + 1);
      })
      .catch((error) => console.error("Validation failed:", error));

    console.log("Progressing values:", form.getFieldsValue(true));
  };

  const handlePrev = () => setCurrentStep((prev) => prev - 1);

  const handleSubmit = async () => {
    try {
      // const values = await form.validateFields();
      const values = form.getFieldsValue(true);

      // Handle logo upload if changed
      const logo = values.logo?.[0]?.originFileObj;
      if (logo) {
        const tokenResponse = await axios.get(
          "/api/get-cookie?tokenName=userToken"
        );
        const accessToken = tokenResponse?.data?.cookies?.accessToken;
        if (!accessToken) throw new Error("Access token is missing.");

        await apiClient({
          headers: { Authorization: `Bearer ${accessToken}` },
          url: `/user/companies/${company.id}`,
          method: "PUT",
          data: values,
        });

        toast.success("Company updated successfully!");
        onClose();
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Failed to update company. Please try again.");
    }
  };

  const years = Array.from(
    { length: new Date().getFullYear() - 2009 },
    (_, i) => 2010 + i
  );

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
      ],
      content: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Company Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ type: "email" }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone_number" label="Phone Number">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cr" label="Company Registration Number">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="website" label="Website">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tagline" label="Tagline">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="logo" label="Company Logo">
            <Upload
              name="logo"
              listType="picture-card"
              fileList={
                logoPreview
                  ? [{ uid: "-1", name: "Current Logo", url: logoPreview.url }]
                  : []
              }
              showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
              beforeUpload={() => false} // Prevent automatic upload
              onPreview={(file) => {
                window.open(file.url || file.thumbUrl, "_blank"); // Open full image
              }}
              onChange={async ({ fileList }) => {
                if (fileList[0] && fileList[0].originFileObj) {
                  try {
                    setUploading(true);

                    // Get auth token
                    const tokenResponse = await axios.get(
                      "/api/get-cookie?tokenName=userToken"
                    );
                    const accessToken =
                      tokenResponse?.data?.cookies?.accessToken;
                    if (!accessToken)
                      throw new Error("Access token is missing.");

                    // Upload file to S3
                    const { key } = await uploadFileToS3(
                      fileList[0].originFileObj,
                      accessToken
                    );

                    // Generate preview URL
                    const uploadedFile = {
                      key,
                      url: URL.createObjectURL(fileList[0].originFileObj), // Local preview
                    };

                    // Update form and preview state
                    setLogoPreview(uploadedFile);
                    form.setFieldsValue({ logo: [uploadedFile] });

                    toast.success("Logo uploaded successfully!");
                  } catch (error) {
                    console.error("Logo upload failed:", error);
                    toast.error("Failed to upload logo. Please try again.");
                  } finally {
                    setUploading(false);
                  }
                }
              }}
              onRemove={() => {
                setLogoPreview(null);
                form.setFieldsValue({ logo: [] });
              }}
            >
              {/* Show Upload Button if No Image */}
              {!logoPreview && (
                <div>
                  {uploading ? <Spin /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>Upload Logo</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </>
      ),
    },
    {
      title: "Social Media",
      fields: ["linkedin", "facebook", "twitter", "instagram"],
      content: (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="linkedin" label="LinkedIn">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="facebook" label="Facebook">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="twitter" label="Twitter">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="instagram" label="Instagram">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    // {
    //   title: "Upload Logo",
    //   fields: ["logo"],
    //   content: (
    //     <Form.Item name="logo" label="Upload Logo">
    //       <Upload listType="picture" beforeUpload={() => false} maxCount={1}>
    //         <Button icon={<UploadOutlined />}>Upload Logo</Button>
    //       </Upload>
    //     </Form.Item>
    //   ),
    // },
    // {
    //   title: "Scores",
    //   fields: ["scores"],
    //   content: (
    //     <Form.List name="scores">
    //       {(fields, { add, remove }) => (
    //         <>
    //           {fields.map(({ key, name }) => (
    //             <Row key={key} gutter={16} align="middle">
    //               <Col span={5}>
    //                 <Form.Item
    //                   name={[name, "year"]}
    //                   rules={[{ required: true, message: "Enter year" }]}
    //                 >
    //                   <Input placeholder="Year" />
    //                 </Form.Item>
    //               </Col>
    //               <Col span={5}>
    //                 <Form.Item
    //                   name={[name, "score"]}
    //                   rules={[{ required: true, message: "Enter score" }]}
    //                 >
    //                   <Input placeholder="Score" />
    //                 </Form.Item>
    //               </Col>
    //               <Col span={6}>
    //                 <Form.Item
    //                   name={[name, "score_type"]}
    //                   rules={[{ required: true }]}
    //                 >
    //                   <Select
    //                     placeholder="Score Type"
    //                     options={[
    //                       { value: "Iktva", label: "Iktva" },
    //                       { value: "Local", label: "Local" },
    //                     ]}
    //                   />
    //                 </Form.Item>
    //               </Col>
    //               <Col span={6}>
    //                 <Form.Item
    //                   name={[name, "file"]}
    //                   rules={[{ required: true, message: "Upload file" }]}
    //                 >
    //                   <Upload
    //                     listType="text"
    //                     beforeUpload={() => false}
    //                     maxCount={1}
    //                   >
    //                     <Button icon={<UploadOutlined />}>Upload</Button>
    //                   </Upload>
    //                 </Form.Item>
    //               </Col>
    //               <Col span={2}>
    //                 <Button
    //                   danger
    //                   icon={<DeleteOutlined />}
    //                   onClick={() => remove(name)}
    //                 />
    //               </Col>
    //             </Row>
    //           ))}
    //           <Button
    //             type="dashed"
    //             onClick={() => add()}
    //             icon={<PlusOutlined />}
    //             block
    //           >
    //             Add Score
    //           </Button>
    //         </>
    //       )}
    //     </Form.List>
    //   ),
    // },
    {
      title: "Data",
      fields: ["awards", "sectors"],
      content: (
        <>
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
        </>
      ),
    },
    {
      title: "Scores",
      fields: ["scores"],
      content: (
        <Form.List name="scores">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Row key={key} gutter={16} align="middle">
                  <Col span={5}>
                    <Form.Item
                      name={[name, "year"]}
                      rules={[{ required: true, message: "Enter year" }]}
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
                      rules={[{ required: true, message: "Enter score" }]}
                    >
                      <Input placeholder="Score" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name={[name, "score_type"]}
                      rules={[{ required: true }]}
                    >
                      <Select
                        placeholder="Score Type"
                        options={[
                          { value: "Iktva", label: "Iktva Score" },
                          { value: "Local", label: "Local Score" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      name={[name, "file"]}
                      rules={[
                        { required: true, message: "Upload Certificate" },
                      ]}
                    >
                      <Upload
                        listType="text"
                        disabled={uploading} // Disable while uploading
                        beforeUpload={() => false} // Prevent auto-upload
                        maxCount={1} // Restrict to a single file
                        onChange={async ({ fileList }) => {
                          console.log("file changed...");
                          if (
                            fileList &&
                            fileList[0] &&
                            fileList[0].originFileObj
                          ) {
                            try {
                              console.log(fileList[0].originFileObj);
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

                              // Update the `file_key` field in the form
                              const currentScores =
                                form.getFieldValue("scores") || [];
                              console.log(currentScores, "current");
                              console.log(currentScores[name], name, { key });

                              currentScores[name] = {
                                ...currentScores[name],
                                file_key: key, // Add the file key directly
                              };

                              console.log(currentScores[name], "updated");
                              form.setFieldsValue({
                                scores: currentScores,
                              }); // Update the form
                              // toast.success(
                              //   "File uploaded successfully!"
                              // );
                            } catch (error) {
                              console.error("File upload failed:", error);
                              // toast.error(
                              //   "Failed to upload file. Please try again."
                              // );
                            } finally {
                              setUploading(false);
                            }
                          }
                        }}
                      >
                        {uploading && <Spin />}
                        <Upload />
                        <Button icon={<UploadOutlined />}>Upload</Button>
                      </Upload>
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                onClick={() => add()}
                icon={<PlusOutlined />}
                block
              >
                Add Score
              </Button>
            </>
          )}
        </Form.List>
      ),
    },
  ];

  return (
    <Modal
      title="Edit Company"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Steps current={currentStep} size="small" className="custom-steps">
          {steps.map((step, index) => (
            <Step key={index} title={step.title} />
          ))}
        </Steps>

        <div style={{ marginTop: 20 }}>{steps[currentStep].content}</div>

        <Space
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          {currentStep > 0 && (
            <Button onClick={handlePrev} className="previous-button">
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button
              type="primary"
              onClick={handleNext}
              className="custom-button"
            >
              Next
            </Button>
          ) : (
            <Button type="primary" htmlType="submit" className="custom-button">
              Save Changes
            </Button>
          )}
        </Space>
      </Form>
    </Modal>
  );
};

export default EditCompanyModal;
