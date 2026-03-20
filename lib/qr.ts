import QRCode from "qrcode";

export async function generateQRDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 256,
    margin: 2,
    color: {
      dark: "#271219",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}
