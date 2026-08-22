import QRCode from "qrcode";

export async function bookingQrPng(reference: string) {
  return QRCode.toBuffer(reference, { type: "png", width: 320, margin: 1 });
}

export async function bookingQrDataUrl(reference: string) {
  return QRCode.toDataURL(reference, { width: 280, margin: 1 });
}
