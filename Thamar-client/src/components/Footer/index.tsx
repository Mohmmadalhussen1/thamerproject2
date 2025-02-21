import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FacebookFilled,
  TwitterCircleFilled,
  LinkedinFilled,
  InstagramFilled,
} from "@ant-design/icons";

function Footer() {
  return (
    <div
      className="bg-cover bg-center bg-no-repeat py-16"
      style={{
        backgroundImage: "url('/images/footer.svg')",
        // backgroundSize: "contain", // Ensure the entire SVG fits
        // backgroundRepeat: "no-repeat", // Avoid repetition
        backgroundPosition: "center top", // Align at the top to avoid cutting
        minHeight: "300px", // Adjust based on the design
      }}
    >
      <div className="container mx-auto px-4">
        {/* Header Text */}
        {/* <p
          className="text-center font-bold text-lg py-3"
          style={{ letterSpacing: "0.6rem" }}
        >
          B U I L D | C O N N E C T | I N N O V A T E
        </p> */}

        {/* Footer Content */}
        <div className="flex flex-col md:flex-row  gap-[7%]">
          {/* Logo and Description */}
          <div className="max-w-[35%]">
            <Image
              src={"/images/Thamer-logo.png"}
              alt="logo.png"
              height={200}
              width={100}
            />
            <p className="mt-4 text-sm md:text-base text-gray-700">
              Together, we are building a future of growth, collaboration, and
              sustainable success for all.
            </p>
          </div>

          {/* Links: RFQs and RFPs */}
          {/* <div className="flex flex-col max-w-[21.6%]">
            <Link href={"#"} className="text-sm md:text-base mb-2">
              Send RFQs
            </Link>
            <Link href={"#"} className="text-sm md:text-base mb-2">
              Send RFPs
            </Link>
          </div> */}

          {/* Contact Us */}
          <div className="flex flex-col max-w-[21.6%]">
            <h2 className="font-bold text-lg md:text-xl mb-4">Contact Us</h2>
            <Link
              href={"http://wa.me/966548344866"}
              className="text-sm md:text-base mb-2"
            >
              Contact Support
            </Link>
          </div>

          {/* Thamar Links */}
          <div className="flex flex-col max-w-[21.6%]">
            <h2 className="font-bold text-lg md:text-xl mb-4">Thamar</h2>
            <Link href={"/sign-up"} className="text-sm md:text-base mb-2">
              Sign Up
            </Link>
            <Link href={"/login"} className="text-sm md:text-base mb-2">
              Log in
            </Link>
            <Link href={"/about-us"} className="text-sm md:text-base mb-2">
              About Us
            </Link>
            {/* <Link href={"/privacy"} className="text-sm md:text-base mb-2">
              Privacy & Terms
            </Link> */}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-8">
          {/* Footer Text */}
          <p className="text-sm md:text-base text-center md:text-left">
            {`Thamar @ ${new Date().getFullYear()} - All rights reserved`}
          </p>

          {/* Social Media Icons */}
          <div className="flex justify-center md:justify-end space-x-4 mt-4 md:mt-0">
            <Link href="https://facebook.com">
              <FacebookFilled className="text-black text-xl hover:text-blue-500" />
            </Link>
            <Link href="https://twitter.com">
              <TwitterCircleFilled className="text-black text-xl hover:text-blue-400" />
            </Link>
            <Link href="https://linkedin.com">
              <LinkedinFilled className="text-black text-xl hover:text-blue-600" />
            </Link>
            <Link href="https://instagram.com">
              <InstagramFilled className="text-black text-xl hover:text-pink-500" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
