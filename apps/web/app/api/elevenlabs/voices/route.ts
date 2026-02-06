import { NextResponse } from "next/server";

type RawVoice = {
  voice_id?: string;
  name?: string;
  category?: string;
  preview_url?: string;
  labels?: Record<string, string>;
};

export async function GET() {
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
    next: { revalidate: 300 },
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
    voices?: RawVoice[];
  };

  const voices = (data.voices ?? [])
    .filter((voice) => Boolean(voice.voice_id))
    .map((voice) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      preview_url: voice.preview_url,
      labels: voice.labels,
    }));

  return NextResponse.json({ voices });
}
