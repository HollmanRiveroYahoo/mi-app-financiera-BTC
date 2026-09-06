// app/api/upload/route.js - HÅNDTERER OPPLASTING AV INDEX.PHP / HTML / DOKUMENTER
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In-Memory storage fallback (for Vercel serverless environment)
let uploadedFilesStore = [
  {
    id: 'sample-1',
    name: 'index.php',
    size: 1024,
    type: 'application/x-httpd-php',
    uploadedAt: new Date().toISOString(),
    content: '<?php\n  echo "<h1>Velkommen til Finans Portalen</h1>";\n  echo "<p>Dette er en PHP-simulering på serveren.</p>";\n?>'
  },
  {
    id: 'sample-2',
    name: 'index.html',
    size: 512,
    type: 'text/html',
    uploadedAt: new Date().toISOString(),
    content: '<!DOCTYPE html>\n<html>\n<head><title>Min Finans Side</title></head>\n<body>\n  <h1>Finans Dashboard</h1>\n  <p>HTML rapport generert fra aksje-scanneren.</p>\n</body>\n</html>'
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    files: uploadedFilesStore
  });
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ success: false, message: 'Ingen fil valgt.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const textContent = buffer.toString('utf-8');

    const fileRecord = {
      id: Date.now().toString(),
      name: file.name || 'unnamed_file',
      size: file.size,
      type: file.type || 'text/plain',
      uploadedAt: new Date().toISOString(),
      content: textContent
    };

    // Store in-memory
    uploadedFilesStore.unshift(fileRecord);

    // Try saving to disk if local filesystem is writable
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, fileRecord.name), buffer);
    } catch (err) {
      console.log('Skipping disk write (Read-only environment like Vercel):', err.message);
    }

    return NextResponse.json({
      success: true,
      message: `Filen "${fileRecord.name}" ble lastet opp!`,
      file: fileRecord
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json({ success: false, message: 'Kunne ikke laste opp filen.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'Id mangler.' }, { status: 400 });
    }

    uploadedFilesStore = uploadedFilesStore.filter(f => f.id !== id);
    return NextResponse.json({ success: true, message: 'Filen ble slettet.' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Kunne ikke slette.' }, { status: 500 });
  }
}
