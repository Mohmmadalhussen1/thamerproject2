import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Function to validate JWT token and check expiration
export const isTokenValid = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    console.log("🚀 ~ isTokenValid ~ decoded:", decoded);
    if (!decoded || !decoded.exp) return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
  } catch (err) {
    console.error("🚀 ~ isTokenValid ~ err:", err);
    return false; // Token is invalid or expired
  }
};

// Define protected routes and their respective tokens
const tokenRoutes: Record<string, string> = {
  "/user": "userToken",
  "/admin": "adminToken",
};

// Define public routes explicitly
const publicRoutes = ["/admin/login"];

export async function middleware(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname;
    const cookieStore = await cookies();

    // Check if the path matches any public route
    const isPublicRoute = publicRoutes.some((route) => path === route);
    if (isPublicRoute) {
      return NextResponse.next(); // Allow access to public routes
    }

    // Check if the path starts with a protected prefix
    const matchedRoute = Object.keys(tokenRoutes).find((route) =>
      path.startsWith(route)
    );

    if (!matchedRoute) {
      // If the route is not explicitly protected or public, allow access
      return NextResponse.next();
    }

    // Get the corresponding token name for the matched route
    const requiredToken = tokenRoutes[matchedRoute];

    // Check for the token in cookies
    const token = cookieStore.get(requiredToken)?.value;

    if (!token) {
      // Redirect to `/admin/login` if the token is missing for `/admin` routes
      if (path.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Redirect to `/` for other protected routes
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Validate the token using `isTokenValid`
    if (!isTokenValid(token)) {
      // Redirect to `/admin/login` if the token is invalid or expired
      if (path.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      // Redirect to `/` for other protected routes
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Allow access if the token exists
    return NextResponse.next();
  } catch (error) {
    console.error("🚀 ~ middleware ~ error:", error);
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png|.*\\.svg|.*\\.css|.*\\.js).*)",
  ],
};
