import axios from "axios";

// Function to upload file to S3
export const uploadFileToS3 = async (
  file: File,
  token: string,
  type: string = "file"
): Promise<{ url: string; key: string }> => {
  try {
    // Prepare the payload as URL-encoded
    const formData = new URLSearchParams();
    formData.append("file_name", file.name);
    formData.append("file_type", file.type);

    // Call your API to get a pre-signed URL
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/${
        type === "file"
          ? "generate-presigned-url"
          : "generate-profile-picture-presigned-url"
      }`,
      formData.toString(), // Send data as URL-encoded string
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`, // Replace with your actual token
        },
      }
    );
    const { url, key } = response.data;

    // Upload the file to S3 using the pre-signed URL
    await axios.put(url, file, {
      headers: {
        "Content-Type": file.type,
      },
    });

    return { url, key };
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};
