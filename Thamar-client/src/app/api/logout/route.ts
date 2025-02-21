import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  try {
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json(
        {
          ok: false,
          error: "Role is required.",
        },
        { status: 400 }
      );
    }

    // Determine the token name based on role
    const tokenName = role;

    // Remove only the relevant token
    cookieStore.delete(tokenName);

    return NextResponse.json({
      ok: true,
      message: `${role} logged out successfully!`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: error,
      },
      { status: 500 }
    );
  }
}
