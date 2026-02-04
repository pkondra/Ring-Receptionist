import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body: { title: string; content: string } = await req.json();
  if (!body.title || !body.content) {
    return NextResponse.json(
      { error: "Missing title or content" },
      { status: 400 }
    );
  }

  const formData = new FormData();
  const textBlob = new Blob([body.content], { type: "text/plain" });
  formData.append("file", textBlob, `${body.title}.txt`);
  formData.append("name", body.title);

  const res = await fetch(
    "https://api.elevenlabs.io/v1/convai/knowledge-base",
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("ElevenLabs create KB entry error:", errorText);
    return NextResponse.json(
      { error: "Failed to create knowledge base entry in ElevenLabs" },
      { status: 502 }
    );
  }

  const data: { id: string } = await res.json();
  return NextResponse.json({ id: data.id });
}

export async function DELETE(req: NextRequest) {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body: { kbDocId: string } = await req.json();
  if (!body.kbDocId) {
    return NextResponse.json(
      { error: "Missing kbDocId" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/knowledge-base/${encodeURIComponent(body.kbDocId)}?force=true`,
    {
      method: "DELETE",
      headers: {
        "xi-api-key": apiKey,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("ElevenLabs delete KB entry error:", errorText);
    return NextResponse.json(
      { error: "Failed to delete knowledge base entry from ElevenLabs" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
