import React from "react";

const pricingPlans = [
  {
    id: 1,
    title: "THAMER Features and Benefits",
    subtitle: "Company Registration (Free)",
    price: "Join THAMER at no cost",
    features: [
      "Professional profile creation with Local Content and Iktva Scores.",
      "Easy upload of certifications, achievements, and performance records.",
      "Direct connection with businesses seeking qualified local suppliers.",
    ],
    benefits: [
      "Enhanced Visibility: Stand out with a professional profile showcasing your achievements and scores.",
      "New Opportunities: Attract trusted buyers and secure projects effortlessly.",
      "Streamlined Networking: Connect with businesses actively searching for suppliers.",
    ],
    bgColor: "bg-white",
    textColor: "text-gray-700",
  },
  {
    id: 2,
    title: "Discover Local Companies",
    subtitle: "Price: SAR 5099 per Year",
    price: "SAR 5099 per Year",
    features: [
      "Access to verified profiles of Local Content and Iktva-certified suppliers.",
      "Advanced filtering options for tailored searches by sector, certifications, or services.",
      "Direct communication and secure partnerships with local suppliers.",
    ],
    benefits: [
      "Efficient Procurement: Simplify the process of finding qualified suppliers.",
      "Trusted Connections: Work with certified suppliers verified by THAMER.",
      "Streamlined Operations: Manage procurement with confidence and clarity.",
    ],
    bgColor: "bg-black",
    textColor: "text-gray-300",
  },
  {
    id: 3,
    title: "Schedule a Consultation",
    subtitle: "Get Expert Advice to Achieve Your Goals",
    price: "Talk to Sales Team for Prices",
    features: [
      "Personalized consulting tailored to your business needs.",
      "Expert strategies to improve compliance and enhance performance.",
      "Support in identifying and connecting with the right partners.",
    ],
    benefits: [
      "Customized Guidance: Receive actionable advice specific to your goals.",
      "Enhanced Performance: Improve Iktva scores and align with local content standards.",
      "Strategic Partnerships: Connect with valuable partners to grow your business.",
    ],
    bgColor: "bg-white",
    textColor: "text-gray-700",
  },
];

function Pricing() {
  return (
    <div
      className="min-h-screen bg-cover bg-center py-16 bg-[#FFDF00]"
      style={{
        backgroundImage: "url('/images/Plans.svg')",
      }}
    >
      <h1 className="text-3xl md:text-4xl font-medium text-center text-black mb-4">
        Pick Your Perfect Plan
      </h1>
      <p className="text-lg text-center text-gray-800 mb-12">
        Find the perfect plan for your business with our flexible pricing
        options.
      </p>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-24 px-6 lg:px-16">
        {pricingPlans.map((plan, index) => (
          <div
            key={plan.id}
            className={`${plan.bgColor} rounded-lg shadow-lg p-8 ${
              index === 1
                ? "md:h-[650px] lg:h-[750px]"
                : "md:h-[550px] lg:h-[700px]"
            } flex flex-col justify-between`}
          >
            <p className={`text-sm text-center mb-2 ${plan.textColor}`}>
              {plan.subtitle}
            </p>
            <h2
              className={`${
                plan.bgColor === "bg-black" ? "text-[#fff]" : "text-[#000]"
              } text-xl font-bold text-center mb-4`}
            >
              {plan.title}
            </h2>

            <p
              className={`${
                plan.bgColor === "bg-black" ? "text-[#fff]" : "text-[#000]"
              } ${
                plan.bgColor === "bg-black" ? "text-center" : "text-left"
              } text-lg font-bold mb-4`}
            >
              {plan.price}
            </p>

            <h3
              className={`text-lg font-bold ${
                plan.bgColor === "bg-black" ? "text-[#fff]" : "text-[#000]"
              } mb-2`}
            >
              Features:
            </h3>
            <ul className={`space-y-2 mb-4`}>
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span
                    className={`${
                      plan.bgColor === "bg-black"
                        ? "text-green-600"
                        : "text-green-600"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={`${plan.textColor}`}>{feature}</span>
                </li>
              ))}
            </ul>
            <h3
              className={`text-lg font-bold ${
                plan.bgColor === "bg-black" ? "text-[#fff]" : "text-[#000]"
              } mb-2`}
            >
              Benefits:
            </h3>
            <ul className={`space-y-2 mb-6`}>
              {plan.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span
                    className={`${
                      plan.bgColor === "bg-black"
                        ? "text-green-600"
                        : "text-green-600"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={`${plan.textColor}`}>{benefit}</span>
                </li>
              ))}
            </ul>
            {/* <button className="w-full bg-[#d9e0c8] hover:bg-yellow-500 text-black py-2 rounded transition-colors duration-300 cursor-pointer">
              Buy Now
            </button> */}

            <button
              className={`w-full border-2 ${
                plan.bgColor === "bg-black"
                  ? "border-white bg-white text-black"
                  : "border-black bg-black text-white"
              } py-2 rounded transition-colors duration-300 cursor-pointer `}
              onClick={() => (window.location.href = "/sign-up")}
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Pricing;
