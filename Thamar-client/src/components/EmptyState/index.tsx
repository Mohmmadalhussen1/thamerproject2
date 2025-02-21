import React from "react";
import { Card, Empty } from "antd";

interface EmptyStateProps {
  text?: string; // Optional text prop for customization
}

const EmptyState: React.FC<EmptyStateProps> = ({
  text = "No data available",
}) => {
  return (
    <Card
      style={{
        textAlign: "center",
        marginTop: "50px",
        height: "70vh", // Adjust height as needed
        display: "flex", // Center the content
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Empty
        description={
          <span style={{ fontSize: "18px", color: "#8c8c8c" }}>{text}</span>
        }
      />
    </Card>
  );
};

export default EmptyState;
