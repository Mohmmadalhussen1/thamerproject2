"use client";

import React from "react";
import { Collapse } from "antd";
import "./styles.css";
const { Panel } = Collapse;
interface FAQ {
  key: string;
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQ[]; // Expecting an array of FAQ objects as a prop
}

const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
  return (
    <div className="py-12 bg-[#F6F7FD]">
      <div className="w-2/3 mx-auto bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-3xl font-bold mb-6">Frequently Asked Questions</h2>
        <Collapse
          accordion
          bordered={false}
          expandIconPosition="end"
          className="faq-collapse"
        >
          {faqs.map((faq) => (
            <Panel
              header={
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-800">{faq.key}.</div>
                  <div className="text-sm  text-gray-800">{faq.question}</div>
                </div>
              }
              key={faq.key}
              className="faq-panel"
            >
              <p className="text-gray-600">{faq.answer}</p>
            </Panel>
          ))}
        </Collapse>
        {/* <div className="mt-6">
          <button className="bg-black hover:bg-gray-800 text-white rounded py-1 px-4 text-sm">
            View More
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default FAQSection;
