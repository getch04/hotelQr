const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function deterministicRoomId(roomNumber) {
  const hex = roomNumber.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex.slice(-12)}`;
}

const roomNumbers = [101, 102, 103, 201, 202, 203, 301, 302];
const rooms = roomNumbers.map((n) => ({
  id: deterministicRoomId(n),
  number: String(n),
}));

async function generate() {
  const outDir = path.join(__dirname, 'qr-codes');

  for (const room of rooms) {
    const url = `${BASE_URL}/room/${room.id}`;
    const filePath = path.join(outDir, `room-${room.number}.png`);

    await QRCode.toFile(filePath, url, {
      width: 400,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });

    console.log(`Room ${room.number}: ${filePath}`);
    console.log(`  -> ${url}`);
  }

  // Also generate a combined HTML page for easy printing
  let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Hotel QR Codes</title>
<style>
  body { font-family: system-ui, sans-serif; text-align: center; }
  .card { display: inline-block; margin: 24px; padding: 32px; border: 2px solid #e5e5e5; border-radius: 16px; }
  .card img { display: block; margin: 0 auto 16px; }
  .room { font-size: 28px; font-weight: 700; }
  .hotel { font-size: 14px; color: #888; margin-top: 4px; }
  .instructions { font-size: 12px; color: #aaa; margin-top: 12px; }
  @media print { .card { break-inside: avoid; border: 1px solid #ccc; } }
</style></head><body>
<h1 style="margin: 32px 0 8px;">Skylight Hotel</h1>
<p style="color: #888; margin-bottom: 24px;">Scan to order room service</p>`;

  for (const room of rooms) {
    const url = `${BASE_URL}/room/${room.id}`;
    const imgData = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
      errorCorrectionLevel: 'H',
    });
    html += `
<div class="card">
  <img src="${imgData}" width="200" height="200" />
  <div class="room">Room ${room.number}</div>
  <div class="hotel">Skylight Hotel</div>
  <div class="instructions">Scan with your phone camera</div>
</div>`;
  }

  html += `\n</body></html>`;
  const htmlPath = path.join(outDir, 'print-qr-codes.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`\nPrintable page: ${htmlPath}`);
}

generate().catch(console.error);
