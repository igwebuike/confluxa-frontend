import { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://confluxa-core.onrender.com";

const ADMIN_SECRET = process.env.CONFLUXA_ADMIN_SECRET || "";

async function proxy(req: NextRequest, pathParts: string[]) {
  const joinedPath = pathParts.join("/");
  const upstreamUrl = new URL(`${API_BASE_URL}/${joinedPath}`);

  req.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.set(key, value);
  });

  const headers = new Headers(req.headers);
  headers.delete("host");

  if (ADMIN_SECRET) {
    headers.set("X-Admin-Secret", ADMIN_SECRET);
  }

  let body: BodyInit | undefined = undefined;

  if (req.method !== "GET" && req.method !== "HEAD") {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.text();
    } else {
      body = await req.arrayBuffer();
    }
  }

  const upstream = await fetch(upstreamUrl.toString(), {
    method: req.method,
    headers,
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(req, path);
}