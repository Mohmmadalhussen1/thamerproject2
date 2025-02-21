"use client";
import React from "react";
import Image from "next/image";

function HowItWorksTemplate() {
  return (
    <div>
      <div
        className="flex items-center justify-center bg-cover bg-center h-[200px] md:h-[500px]"
        style={{
          backgroundImage: "url('/images/how-it-works.svg')",
          backgroundPosition: "center top", // Align at the top to avoid cutting
          minHeight: "300px", // Adjust based on the design
        }}
      >
        <div className="text-center text-white">
          <h1 className="text-5xl text-black font-bold mb-4">How It Works</h1>
          <p className="text-lg font-light text-black">
            Seamlessly Simple from Day One, Crafted for Effortless User
            Experience
          </p>
        </div>
      </div>

      <div className="bg-[#F6F7FD] py-10">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Header Section */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-normal mb-4 sm:mb-6">
            At THAMER, we provide comprehensive support for companies to
            showcase their achievements and for businesses seeking qualified
            local suppliers. Whether you&apos;re a supplier wanting to register
            your company or a shopper wanting to discover local companies,
            THAMER simplifies the connection process and ensures seamless
            collaboration.
          </h1>

          {/* Two Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Contractors Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Showcase Your Expertise and Expand Your Reach
              </h2>
              <p className="text-gray-600 mb-6">
                Create a professional company profile to highlight your Local
                Content and Iktva Scores of current year and the last year
                scores . Share your certifications, achievements, and
                performance history to attract potential customers. Secure new
                projects by connecting with interested buyers.
              </p>
              <div>
                {[...Array(7)].map((_, index) => (
                  <div key={index} className="flex items-start mb-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-black font-semibold rounded-full mr-3">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-800">
                      {
                        [
                          "Sign Up",
                          "Set Up Your Profile",
                          "Upload Certifications",
                          "List Services and Achievements",
                          "Receive Customer Inquiries",
                          "Submit Proposals",
                          "Secure Projects",
                        ][index]
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vendors Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Discover Trusted Local Suppliers Effortlessly
              </h2>
              <p className="text-gray-600 mb-6">
                Explore detailed company catalogs, find qualified suppliers, and
                streamline your procurement process. Connect securely with local
                suppliers to meet your business needs.
              </p>
              <div>
                {[...Array(7)].map((_, index) => (
                  <div key={index} className="flex items-start mb-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-100 text-black font-semibold rounded-full mr-3">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-800">
                      {
                        [
                          "Sign Up",
                          "Browse Company Catalogs",
                          "Filter and Discover",
                          "Express Interest",
                          "Add your estimation.",
                          "Secure Agreements",
                          "Receive Services",
                          "Share Feedback",
                        ][index]
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Image Section */}
          {/* <div className="py-8 my-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Can&apos;t find what you need in our Product Catalog?
            </h2>
            <p className="mb-6">
              Easily upload an image or description of the product you require,
              and our advanced AI technology will swiftly identify it and source
              it from our extensive network of trusted vendors.
            </p>
            <div className="flex justify-center">
              <button className="p-3 bg-black text-white rounded-xl">
                Try Now
              </button>
            </div>
          </div> */}
          <div className="flex flex-col md:flex-row py-8 items-center">
            <div className="py-4 my-8 md:w-2/3 w-full text-center md:text-left">
              <h2 className="text-2xl font-semibold mb-4">
                Can&apos;t find what you need in Thamer Catalog?
              </h2>
              <p className="mb-6">
                Easily upload your Local Content and IKTVA certification score,
                along with a description of your company. Our platform helps you
                showcase your business, connect with potential customers
                effortlessly, and explore a diverse catalog of companies across
                various sectors, providing valuable insights into their Local
                Content and IKTVA scores.
              </p>
              <div className="flex justify-center md:justify-start">
                <button
                  className="p-3 bg-black text-white rounded-xl"
                  onClick={() => (window.location.href = "/sign-up")}
                >
                  Start Now
                </button>
              </div>
            </div>
            <div className="w-full md:w-1/3 py-5 flex justify-center">
              <Image
                src={"/images/idea.svg"}
                height={100}
                width={350}
                alt="Product Idea"
                className="max-w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HowItWorksTemplate;
