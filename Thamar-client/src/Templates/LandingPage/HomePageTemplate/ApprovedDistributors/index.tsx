"use client";
import React from "react";
// import { LeftOutlined, RightOutlined } from "@ant-design/icons";

const ApprovedCarouselAntd: React.FC = () => {
  /* uncomment it here
  const SampleNextArrow = (props) => {
    const { onClick } = props;
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          top: "50%",
          right: "10px",
          transform: "translateY(-50%)",
          fontSize: "30px",
          color: "black",
          cursor: "pointer",
          zIndex: 10,
        }}
        onClick={onClick}
      >
        <RightOutlined />
      </div>
    );
  };

  const SamplePrevArrow = (props) => {
    const { onClick } = props;
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          top: "50%",
          left: "10px",
          transform: "translateY(-50%)",
          fontSize: "30px",
          color: "black",
          cursor: "pointer",
          zIndex: 10,
        }}
        onClick={onClick}
      >
        <LeftOutlined />
      </div>
    );
  };

  const settings = {
    // infinite: true,
    speed: 400,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true, // Enable custom arrows
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
  };
*/
  return (
    <>
      <h1 className="text-5xl text-center py-3 mt-8">
        Approved Partners and Trusted Supplier
      </h1>
      {/* Un-comment Carousel once given by client */}
      {/* <Carousel afterChange={onChange} {...settings}>
        <div>
          <Image
            src="/images/tahweel.png"
            alt="Main Banner"
            width={400}
            height={100}
          />
        </div>
        <div>
          <Image
            src="/images/hbmc.png"
            alt="Main Banner"
            width={400}
            height={100}
          />
        </div>
        <div>
          <Image
            src="/images/islam-khairi-kabbani.png"
            alt="Main Banner"
            width={400}
            height={100}
          />
        </div>
        <div>
          <Image
            src="/images/national-marketing.png"
            alt="Main Banner 2"
            width={800}
            height={450}
          />
        </div>
      </Carousel> */}
    </>
  );
};

export default ApprovedCarouselAntd;
