"use client";
import React from "react";
import { Carousel } from "antd";
import "./styles.css";
import Image from "next/image";

const CarouselAntd: React.FC = () => {
  const onChange = (currentSlide: number) => {
    console.log(currentSlide);
  };

  return (
    <Carousel
      afterChange={onChange}
      autoplay={true}
      className="custom-carousel"
    >
      <div className="">
        <Image
          src={"/images/home-page.svg"}
          alt="img.png"
          layout="responsive"
          width={800}
          height={450}
          objectFit="cover"
        ></Image>
      </div>
      {/* Video 1 */}
      {/* <div>
        <video
          src="https://builtopv2.blob.core.windows.net/builtop-application-files-dev/Coming_Soon.webm"
          controls
          autoPlay
          loop
          muted
          style={{ width: "100%", height: "auto" }}
        />
      </div> */}

      {/* Video 2 */}
      {/* <div>
        <video
          src="https://builtopv2.blob.core.windows.net/builtop-application-files-dev/Public_Tendering_video.mp4"
          controls
          autoPlay
          loop
          muted
          style={{ width: "100%", height: "auto" }}
        />
      </div> */}

      {/* Video 3 */}
      {/* <div>
        <video
          src="https://builtopv2.blob.core.windows.net/builtop-application-files-dev/Pay_Later_V01.webm"
          controls
          autoPlay
          loop
          muted
          style={{ width: "100%", height: "auto" }}
        />
      </div> */}

      {/* Video 4 */}
      {/* <div>
        <video
          src="https://builtopv2.blob.core.windows.net/builtop-application-files-dev/Coming_Soon.webm"
          controls
          autoPlay
          loop
          muted
          style={{ width: "100%", height: "auto" }}
        />
      </div> */}
    </Carousel>
  );
};

export default CarouselAntd;
