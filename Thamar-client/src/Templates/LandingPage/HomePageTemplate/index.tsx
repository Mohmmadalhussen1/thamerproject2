"use client";

import React from "react";
import CarouselAntd from "@/components/Carousel";
// import ApprovedCarouselAntd from "./ApprovedDistributors";
import Image from "next/image";
import CustomCarousel from "../CustomCarousel";
import Pricing from "./Pricing";
import { Rate } from "antd";
import { PhoneFilled, MailFilled } from "@ant-design/icons";
import FAQSection from "./Faq";
import { useRouter } from "next/navigation";

function HomePageTemplate() {
  const router = useRouter();
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

  const feedbackData = [
    {
      title: "Ahmed, Project Manager",
      description:
        "“With THAMER, connecting with verified suppliers has never been easier. The platform is intuitive and reliable!”",
      rating: 5,
    },
    {
      title: "Fatimah, Procurement Specialist",
      description:
        "“The Local Content scores and supplier profiles are detailed and transparent. A great tool for efficient procurement.”",
      rating: 5,
    },
    {
      title: "Omar, Supplier",
      description:
        "“THAMER helped me showcase my certifications and win new projects seamlessly. Highly recommend!”",
      rating: 5,
    },
  ];
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
    <div>
      <CarouselAntd />
      {/* Approved Distributers */}
      {/* <ApprovedCarouselAntd /> */}

      <div className="bg-[#F6F7FD]">
        {/* Top Section */}
        <div className="container mx-auto px-4 md:px-8 py-16 text-left">
          <h1 className="text-2xl font-bold text-black">
            Empowering Local Content and Iktva Growth and Seamless Connections
            Seamlessly Simple from Day One
          </h1>
          {/* <p className="text-2xl mt-2 text-gray-700">
            Crafted for Effortless User Experience
          </p> */}
          <p className="mt-4 text-lg text-gray-600">
            At THAMER, we bridge the gap between local suppliers, buyers, and
            businesses by offering a smart, B2B platform designed to simplify
            procurement and enhance Iktva and Local Content that required from
            the Local Content and compliance. Our mission is to empower
            companies to thrive by enabling access to trusted, certified
            suppliers and tools to improve their Local Content and Iktva Scores.
          </p>
          <button
            className="mt-6 px-6 py-3 bg-black text-white rounded hover:bg-gray-800"
            onClick={() => router.push("/how-it-works")}
          >
            Learn More
          </button>
        </div>

        {/* Steps Section */}
        <div className="relative bg-gray-50 py-16 bg-[url('https://builtopv2.blob.core.windows.net/builtop-application-files-dev/sec4Background.svg')] bg-cover bg-center">
          <p className="text-center text-4xl font-extrabold text-gray-800 mb-8">
            How It Works
          </p>

          <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-start relative">
              <div className="flex-none w-14 h-14 flex items-center justify-center bg-black text-white rounded-full text-xl font-bold">
                01
              </div>
              <div className="ml-6">
                <h3 className="text-lg font-bold text-gray-800">Join THAMER</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Sign up and create your account to access trusted suppliers,
                  explore catalogs, and showcase your company.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-start relative">
              <div className="flex-none w-14 h-14 flex items-center justify-center bg-black text-white rounded-full text-xl font-bold">
                02
              </div>
              <div className="ml-6">
                <h3 className="text-lg font-bold text-gray-800">
                  Showcase or Browse
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Suppliers can upload Local Content and Iktva scores,
                  certifications, and catalogs. Customers and shoppers can
                  browse detailed company profiles.
                  <br />
                  <span className="text-black font-semibold">
                    Just in a few minutes
                  </span>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl shadow-lg p-6 flex items-start relative">
              <div className="flex-none w-14 h-14 flex items-center justify-center bg-black text-white rounded-full text-xl font-bold">
                03
              </div>
              <div className="ml-6">
                <h3 className="text-lg font-bold text-gray-800">
                  Connect and Collaborate
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Send RFQs, secure deals, and complete transactions seamlessly.
                  Track your projects and grow with confidence.
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition duration-300 text-sm"
                  onClick={() => router.push("/login")}
                >
                  Get Started Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About Us Section */}
        <div className="bg-gray-100 py-16">
          {/* <div className="container mx-auto"> */}
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-3xl font-bold text-gray-800">About Us</h2>
            <h3 className="text-xl font-semibold mt-4 text-gray-700">
              What is THAMAR?
            </h3>
            <p className="mt-4 text-lg text-gray-600">
              THAMER is an innovative platform that connects companies with
              Local Content and Iktva-certified suppliers to promote local
              content and support Saudi Vision 2030. We streamline procurement,
              improve compliance with Local Content requirements, and foster
              collaboration to drive business growth.
            </p>
            <div className="mt-8">
              <button
                className="px-8 py-3 bg-black text-white rounded hover:bg-gray-800 transition duration-300"
                onClick={() => router.push("/about-us")}
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="my-8">
          <h2 className="text-3xl text-center">Our Values</h2>
          <CustomCarousel>
            {carouselData.map((item, index) => (
              <div className="p-4 bg-[#F6F7FD]" key={index}>
                <div className="p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl text-center bg-white">
                  <Image
                    src={item.image}
                    alt={item.alt}
                    height={100}
                    width={50}
                    className="mx-auto mb-4"
                  />
                  <p className="text-xl sm:text-2xl font-semibold">
                    {item.title}
                  </p>
                  <p className="text-sm sm:text-lg text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="font-medium text-sm sm:text-lg cursor-pointer mt-2">
                    {item.linkText} <span className="ml-4">&gt;</span>
                  </p>
                </div>
              </div>
            ))}
          </CustomCarousel>
        </div>
      </div>

      <Pricing />

      <div className="py-8 bg-[#F6F7FD] text-center space-y-3">
        <h2 className="text-3xl text-center">
          Real Stories from Satisfied Customers
        </h2>
        <p>See how Thamer is making an impact.</p>
        <CustomCarousel>
          {feedbackData.map((item, index) => (
            <div className="p-3 bg-[#F6F7FD]" key={index}>
              <div className="p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl text-center bg-white space-y-4">
                <p className="text-lg font-normal">{item.title}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                <Rate
                  disabled
                  defaultValue={item.rating}
                  className="text-yellow-500"
                />
              </div>
            </div>
          ))}
        </CustomCarousel>

        {/* Let's get in Touch */}

        {/* Let's get in Touch */}
        <div className="py-12 bg-[#F6F7FD] text-left">
          <div className="w-2/3 mx-auto bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-4">Let’s get in touch!</h1>
            <p className="text-lg mb-6">
              Got questions about the Landing THAMER? Our team is here to help.
              Contact us for quick and friendly support.
            </p>
            <div className="space-y-4">
              {/* Phone Number */}
              <div className="flex items-center space-x-3">
                <PhoneFilled className="text-black text-xl" />
                <span className="text-lg truncate">+966 54 83 44 866</span>
              </div>

              {/* Email */}
              <div className="flex items-center space-x-3">
                <MailFilled className="text-black text-xl" />
                <span className="text-lg truncate overflow-hidden whitespace-nowrap">
                  admin@thamerweb.com
                </span>
              </div>
            </div>

            <button
              className="mt-6 px-6 py-2 bg-black text-sm text-white rounded hover:bg-gray-800 transition duration-300"
              onClick={() =>
                (window.location.href = "http://wa.me/966548344866")
              }
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

      <FAQSection faqs={faqData} />
    </div>
  );
}

export default HomePageTemplate;
