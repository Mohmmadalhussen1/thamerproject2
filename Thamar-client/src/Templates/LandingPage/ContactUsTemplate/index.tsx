"use client";
import React from "react";
import { PhoneFilled, MailFilled } from "@ant-design/icons";
import Image from "next/image";
import FAQSection from "../HomePageTemplate/Faq";

function ContactUsTemplate() {
  const faqData = [
    {
      key: "1",
      question: "What does THAMER do?",
      answer:
        "THAMER connects businesses with local suppliers, offering tools to showcase certifications, Local Content, and Iktva scores.",
    },
    {
      key: "2",
      question: "How can I register on THAMER?",
      answer:
        "Simply sign up for free and set up your company profile with key details, certifications, and scores or register as Shopper to check the Company Catalog with subscription fees.",
    },
    {
      key: "3",
      question: "What makes THAMER unique?",
      answer:
        "Our focus on Local Content and Iktva-certified suppliers ensures reliable and impactful connections.",
    },
    {
      key: "4",
      question: "How can I secure a consultation?",
      answer:
        "Book a consultation directly through our platform to receive tailored business advice.",
    },
    {
      key: "5",
      question: "What pricing plans are available for suppliers and shoppers?",
      answer:
        "Our free plan for suppliers allows them to showcase their profiles, while shoppers can access premium features at SAR 5099 per year.",
    },
  ];
  return (
    <div className="">
      <div
        className="flex items-center justify-center bg-cover bg-center h-[200px] md:h-[500px]"
        style={{
          backgroundImage: "url('/images/contact-us.svg')",
          backgroundPosition: "center top", // Align at the top to avoid cutting
          minHeight: "300px", // Adjust based on the design
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-5xl text-black font-medium mb-4">Contact Us</h1>
          <p className="text-lg font-light text-black">
            Reach Out: Let&apos;s Connect and Make Things Happen!
          </p>
        </div>
      </div>

      <div className="pt-[5%] bg-[#F6F7FD] py-5">
        <div className="container mx-auto max-w-[66.7%] px-4">
          <div className="py-12 bg-[#F6F7FD] text-left">
            <div className="w-full bg-white p-8 rounded-lg shadow-md mx-auto flex flex-col md:flex-row items-center">
              {/* Contact Information Section */}
              <div className="w-full md:w-1/2">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4">
                  Let’s get in touch!
                </h1>
                <p className="text-base sm:text-lg mb-6">
                  Got questions about the Landing THAMER? Our team is here to
                  help. Contact us for quick and friendly support.
                </p>
                <div className="space-y-4">
                  {/* Phone Contact */}
                  <div className="flex items-start space-x-3">
                    <PhoneFilled className="text-black text-xl flex-shrink-0" />
                    <span className="text-base sm:text-lg break-all leading-snug">
                      +966 54 83 44 866
                    </span>
                  </div>
                  {/* Email Contact */}
                  <div className="flex items-start space-x-3">
                    <MailFilled className="text-black text-xl flex-shrink-0" />
                    <span className="text-base sm:text-lg break-all leading-snug">
                      admin@thamerweb.com
                    </span>
                  </div>
                </div>
                <button
                  className="mt-6 px-6 py-2 bg-black text-sm text-white rounded hover:bg-gray-800 transition duration-300 w-full sm:w-auto"
                  onClick={() =>
                    (window.location.href = "http://wa.me/966548344866")
                  }
                >
                  Contact Support
                </button>
              </div>

              {/* Image Section */}
              <div className="w-full md:w-1/2 mt-8 md:mt-0 md:ml-6">
                <Image
                  src="/images/contact-us-2.svg"
                  alt="Contact Us"
                  width={400}
                  height={300}
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
        <FAQSection faqs={faqData} />
      </div>
    </div>
  );
}

export default ContactUsTemplate;
