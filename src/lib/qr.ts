import QRCode from "qrcode";
import { loadImage } from "./canvas";

export async function makeQrImage(
  url: string,
  size = 200,
): Promise<HTMLImageElement> {
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: {
      dark: "#0B6839",
      light: "#FFFBE8",
    },
  });
  return loadImage(dataUrl);
}
