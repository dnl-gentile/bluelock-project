import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY não configurada.' }, { status: 500 });
  }

  let audioBlob: Blob;
  try {
    const formData = await request.formData();
    const file = formData.get('audio');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Nenhum arquivo de áudio recebido.' }, { status: 400 });
    }
    audioBlob = file as Blob;
  } catch {
    return NextResponse.json({ error: 'Falha ao processar o áudio.' }, { status: 400 });
  }

  // Forward to OpenAI Whisper
  const whisperForm = new FormData();
  whisperForm.append('file', audioBlob, 'audio.webm');
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('language', 'pt');

  const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: whisperForm,
  });

  if (!whisperResp.ok) {
    const errText = await whisperResp.text();
    return NextResponse.json({ error: `Whisper falhou: ${errText}` }, { status: 502 });
  }

  const result = await whisperResp.json();
  return NextResponse.json({ text: result.text ?? '' });
}
