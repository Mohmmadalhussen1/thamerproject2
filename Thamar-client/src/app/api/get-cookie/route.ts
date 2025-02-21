import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();

  try {
    // const userCookie = cookieStore.get("accessToken")?.value;
    // let user = null;
    // if (userCookie) {
    //   user = JSON.parse(userCookie);
    // }

    const tokenName = req.nextUrl.searchParams.get("tokenName"); // Retrieve tokenName from query params

    if (!tokenName) {
      return NextResponse.json(
        { ok: false, message: "Token name is required" },
        { status: 400 }
      );
    }

    const tokenValue = cookieStore.get(tokenName)?.value;

    if (!tokenValue) {
      return NextResponse.json(
        { ok: false, message: `${tokenName} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Get user session successful!",
      cookies: {
        tokenName,
        accessToken: tokenValue,
      },
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error,
    });
  }
}
