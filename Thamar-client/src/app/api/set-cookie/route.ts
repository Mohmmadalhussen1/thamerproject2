import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  try {
    const val = await request.json();

    if (val) {
      if (val.userId) {
        cookieStore.set("userId", val?.userId);
      }
      if (val?.tokenName && val?.tokenValue) {
        cookieStore.set(val?.tokenName, val?.tokenValue, {
          httpOnly: true, // Makes it inaccessible to client-side JS
          secure: true, // Works only on HTTPS
          path: "/", // Available site-wide
        });
      }
      if (val?.user) {
        cookieStore.set("user", JSON.stringify(val?.user));
      }
      if (val?.userType) {
        cookieStore.set("userType", JSON.stringify(val?.userType));
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Login successful!",
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error,
    });
  }
}
