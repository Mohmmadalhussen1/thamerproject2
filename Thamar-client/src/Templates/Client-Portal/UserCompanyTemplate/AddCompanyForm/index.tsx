"use client";

import React from "react";
import { Form, Input, Button } from "antd";

interface CompanyFormData {
  name: string;
  email: string;
  phone_number: string;
  cr: string;
  website: string;
  local_score: number;
  current_iktva_score: number;
  last_year_iktva_score: number;
  iktva_certificate: string;
}
interface AddCompanyFormProps {
  onSubmit: (data: CompanyFormData) => void;
}

const AddCompanyForm: React.FC<AddCompanyFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm<CompanyFormData>();

  const handleFinish = async (values: CompanyFormData) => {
    onSubmit(values); // Pass the form values to the parent component for API call
    form.resetFields();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="space-y-4"
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Please enter the company name" }]}
      >
        <Input placeholder="Enter company name" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[
          {
            required: true,
            message: "Please enter a valid email",
            type: "email",
          },
        ]}
      >
        <Input placeholder="Enter email" />
      </Form.Item>

      <Form.Item
        label="Phone Number"
        name="phone_number"
        rules={[{ required: true, message: "Please enter the phone number" }]}
      >
        <Input placeholder="Enter phone number" />
      </Form.Item>

      <Form.Item
        label="CR"
        name="cr"
        rules={[{ required: true, message: "Please enter the CR" }]}
      >
        <Input placeholder="Enter CR" />
      </Form.Item>

      <Form.Item
        label="Website"
        name="website"
        rules={[{ required: true, message: "Please enter the website URL" }]}
      >
        <Input placeholder="Enter website URL" />
      </Form.Item>

      <Form.Item
        label="Local Score"
        name="local_score"
        rules={[{ required: true, message: "Please enter the local score" }]}
      >
        <Input type="number" placeholder="Enter local score" />
      </Form.Item>

      <Form.Item
        label="Current IKTVA Score"
        name="current_iktva_score"
        rules={[
          { required: true, message: "Please enter the current IKTVA score" },
        ]}
      >
        <Input type="number" placeholder="Enter current IKTVA score" />
      </Form.Item>

      <Form.Item
        label="Last Year IKTVA Score"
        name="last_year_iktva_score"
        rules={[
          { required: true, message: "Please enter the last year IKTVA score" },
        ]}
      >
        <Input type="number" placeholder="Enter last year IKTVA score" />
      </Form.Item>

      <Form.Item
        label="IKTVA Certificate"
        name="iktva_certificate"
        rules={[
          { required: true, message: "Please enter the IKT Certificate" },
        ]}
      >
        <Input placeholder="Enter IKT Certificate" />
      </Form.Item>

      <div className="flex justify-end">
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </div>
    </Form>
  );
};

export default AddCompanyForm;
