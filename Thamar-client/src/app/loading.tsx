import { Spin } from "antd";

export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.75)",
        zIndex: 9999,
      }}
    >
      <Spin size="large" style={{ color: "red" }} />
    </div>
  );
}
