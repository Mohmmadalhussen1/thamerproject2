import React from "react";
import { useRouter } from "next/navigation";
interface PaymentReceiptProps {
  amount: number;
  date: string;
  orderNumber: string;
  paymentMethod: string;
  currency: string; // Add currency prop
  status: "settled" | "decline";
  reason?: string;
}

const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  amount,
  date,
  orderNumber,
  paymentMethod,
  currency,
  status,
  reason,
}) => {
  const router = useRouter();

  // Format the amount based on currency
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "SAR", // Fallback to SAR if missing
  }).format(amount);

  return (
    <div className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg p-6 text-center">
      {/* Status Icon */}
      <div className="flex justify-center">
        <div
          className={`w-12 h-12 text-white rounded-full flex items-center justify-center ${
            status === "settled" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {status === "settled" ? "✔" : "✖"}
        </div>
      </div>

      {/* Amount and Date */}
      <h2 className="text-3xl font-bold mt-4">{formattedAmount}</h2>
      <p className="text-gray-500">Paid {date}</p>

      {/* Payment Details */}
      <div className="mt-4 border-t border-gray-200 pt-4 text-left">
        <p className="text-gray-600">
          <span className="font-semibold">Order number:</span> {orderNumber}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Payment method:</span>{" "}
          <span className="font-bold">{paymentMethod}</span>
        </p>
        {status === "decline" && (
          <p className="text-red-500 mt-2">
            <span className="font-semibold">Reason:</span> {reason}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6">
        <button
          className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-900 transition"
          onClick={() => router.push("/user/catalogue")}
        >
          Go back to Catalogue
        </button>
      </div>
    </div>
  );
};

export default PaymentReceipt;
