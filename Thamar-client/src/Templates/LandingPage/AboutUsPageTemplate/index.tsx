"use client";

import React from "react";
import Image from "next/image";
import { PhoneFilled, MailFilled } from "@ant-design/icons";
function AboutUsTemplate() {
  const carouselData = [
    {
      image:
        "https://builtopv2.blob.core.windows.net/builtop-application-files-dev/collab.svg",
      alt: "Innovation Icon",
      title: "Innovation",
      description:
        "We embrace innovative solutions to transform industries and enhance local content. By leveraging cutting-edge tools and technology, we empower suppliers and businesses to achieve measurable progress and sustainability.",
      linkText: "Learn more",
    },
    {
      image:
        "https://builtopv2.blob.core.windows.net/builtop-application-files-dev/empower.svg",
      alt: "Collaboration Icon",
      title: "Collaboration",
      description:
        "Fostering seamless collaboration between suppliers, companies, and shoppers to achieve mutual success. THAMER creates an ecosystem that connects stakeholders for growth and development.",
      linkText: "Discover more",
    },
    {
      image:
        "https://builtopv2.blob.core.windows.net/builtop-application-files-dev/longterm.svg",
      alt: "Fast Delivery Icon",
      title: "Empowerment",
      description:
        "We empower businesses to excel by providing access to tools like Iktva and Local Content Score insights, enabling them to achieve their goals and expand their reach in the local market.",
      linkText: "Explore now",
    },
    {
      image:
        "https://builtopv2.blob.core.windows.net/builtop-application-files-dev/longterm.svg",
      alt: "Sustainability Icon",
      title: "Sustainability",
      description:
        "Committed to sustainable practices that drive economic and environmental growth, THAMER prioritizes long-term value creation for communities and industries.",
      linkText: "Explore now",
    },
    {
      image:
        "https://builtopv2.blob.core.windows.net/builtop-application-files-dev/acessibility.svg",
      alt: "Accessibility Icon",
      title: "Accessibility",
      description:
        "Our platform ensures equal access to opportunities for all stakeholders, enabling a fair and inclusive ecosystem that supports growth across sectors.",
      linkText: "Explore now",
    },
    {
      image:
        "https://builtopv2.blob.core.windows.net/builtop-application-files-dev/quality.svg",
      alt: "Excellence Icon",
      title: "Excellence",
      description:
        "We strive for excellence in every interaction, delivering top-quality experiences and measurable results for our users while maintaining high standards in service and innovation.",
      linkText: "Explore now",
    },
  ];
  return (
    <div className="">
      <div
        className="flex items-center justify-center bg-cover bg-center h-[200px] md:h-[450px]"
        style={{
          backgroundImage: "url('/images/about-us.svg')",
          backgroundPosition: "center top", // Align at the top to avoid cutting
          minHeight: "300px", // Adjust based on the design
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-5xl text-black font-bold mb-4">About Us</h1>
          <p className="text-lg font-light text-black">
            Discover Our Story: A Journey in Brief!
          </p>
        </div>
      </div>

      <div className=" pt-[5%] bg-[#F6F7FD] py-5">
        <div className="container mx-auto max-w-screen-xl px-4">
          <h2 className="text-2xl font-semibold mb-4">What is THAMAR?</h2>
          <p className="text-base mb-8">
            THAMAR is a platform that empowers suppliers, customers, and
            shoppers to achieve growth through collaboration, innovation, and
            local content initiatives. We are committed to supporting the Local
            Content and Iktva goals, showcasing Local Content and Iktva Scores,
            and enabling seamless procurement experiences.
          </p>

          {/* Two Columns Layout with White Background */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 my-[100px]">
            {/* Mission Section */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Mission</h3>
              <p className="text-sm">
                We aim to support economic growth and localization initiatives
                in line with Saudi Vision 2030, providing companies with the
                resources and connections they need to meet the Local Content
                and Iktva (In-Kingdom Total Value Add) requirements.
              </p>
            </div>

            {/* Vision Section */}
            <div className="bg-white rounded-lg p-6 ">
              <h3 className="text-xl font-semibold mb-2">Vision</h3>
              <p className="text-sm">
                To become the leading platform in Saudi Arabia for enabling
                local content, achieving Iktva and Local objectives, and
                fostering transparent and innovative procurement processes.
              </p>
            </div>
          </div>

          {/* Our Values Section: Responsive Cards */}
          <div className="flex flex-wrap justify-center md:justify-between gap-8 mt-10 w-full">
            {carouselData.map((item, index) => (
              <div
                className="p-6 bg-white rounded-lg text-center w-full sm:w-[300px] md:w-[350px]"
                key={index}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  height={100}
                  width={50}
                  className="mx-auto mb-4"
                />
                <p className="text-xl font-semibold mb-2">{item.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="py-12 bg-[#F6F7FD] text-left">
            <div className="w-full  bg-white p-8 rounded-lg shadow-md mx-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutUsTemplate;
