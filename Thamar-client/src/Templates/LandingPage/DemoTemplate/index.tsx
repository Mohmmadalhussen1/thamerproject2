"use client"; // For Next.js App Router
import { useState } from "react";

const embeds = [
  {
    id: "register",
    title: "Account Registration",
    url: "https://demo.arcade.software/QY8xBLSkX9w12Ts12ux9?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
  },
  {
    id: "business",
    title: "Supplier(Register your Business)",
    url: "https://demo.arcade.software/i2VXtdQ23FLyKtUdK4U7?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
  },
  {
    id: "checkout",
    title: "Contractor(Payment Process)",
    url: "https://demo.arcade.software/jAGcYkGcJL2pl1W3m3O3?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true",
  },
];

export default function ArcadeEmbedPage() {
  const [selectedEmbed, setSelectedEmbed] = useState(embeds[0]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      {/* Buttons Section */}
      <div className="mb-4 flex flex-wrap justify-center gap-2 sm:gap-4">
        {embeds.map((embed) => (
          <button
            // className=""
            key={embed.id}
            onClick={() => setSelectedEmbed(embed)}
            className={`text-xs sm:text-sm md:text-base lg:text-lg px-3 py-2 rounded transition duration-300 ease-in-out 
              ${
                selectedEmbed.id === embed.id
                  ? "bg-black text-white font-semibold shadow-md" // Selected: Strong contrast, readable
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 hover:text-black" // Unselected: Subtle contrast with hover effect
              }`}
          >
            {embed.title}
          </button>
        ))}
      </div>

      {/* Embed Section */}
      <div className="relative w-full max-w-5xl mx-auto">
        <div
          className="relative w-full h-0"
          style={{ paddingBottom: "calc(56.22254758418741% + 41px)" }}
        >
          <iframe
            src={selectedEmbed.url}
            title={selectedEmbed.title}
            loading="lazy"
            allowFullScreen
            allow="clipboard-write"
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
