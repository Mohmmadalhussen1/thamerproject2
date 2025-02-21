import React from "react";
import { Carousel } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

interface CustomCarouselProps {
  children: React.ReactNode;
}

function CustomCarousel({ children }: CustomCarouselProps) {
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
          right: "15px", // Adjusted position inside the container
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
          left: "15px", // Adjusted position inside the container
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
    dots: false,
    speed: 400,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <SampleNextArrow />,
    prevArrow: <SamplePrevArrow />,
    centerMode: true,
    centerPadding: "60px",
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          centerMode: false,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
          centerMode: true,
          centerPadding: "20px",
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          centerMode: true,
          centerPadding: "10px",
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          centerMode: true,
          centerPadding: "5px",
        },
      },
    ],
  };

  return (
    <div className="relative max-w-[90%] mx-auto overflow-hidden">
      <Carousel {...settings}>{children}</Carousel>
    </div>
  );
}

export default CustomCarousel;
