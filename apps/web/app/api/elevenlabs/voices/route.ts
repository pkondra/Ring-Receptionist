import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: {
      "xi-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ElevenLabs voices error:", errorText);
    return NextResponse.json(
      { error: "Failed to load voices" },
      { status: 502 }
    );
  }

  const data = (await response.json()) as {
    voices?: Array<Record<string, unknown>>;
  };

  return NextResponse.json({ voices: data.voices ?? [] });
}
