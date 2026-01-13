/**
 * Text-to-Speech Service
 *
 * Converts text to audio using Google TTS API.
 * Returns URL to audio file or base64-encoded audio data.
 */



/**
 * Text-to-Speech function (URL version - recommended for Pusher)
 * @param message - The text to convert to speech
 * @param lang - Language code (default: "id" for Indonesian)
 * @returns URL to the audio file
 */
export async function textToSpeechUrl(
  message: string,
  lang: string = "id"
): Promise<string> {
  if (!message || message.trim() === "") {
    throw new Error("Message cannot be empty");
  }

  if (lang === "") {
    lang = "id";
  }

  const params = new URLSearchParams({
    text: message,
    lang: lang
  });

  // Return the relative URL to our proxy API
  // Frontend/Client will handle the domain
  return `/api/tts?${params.toString()}`;
}

/**
 * Text-to-Speech function (Base64 version - legacy, may exceed Pusher limit)
 * @param message - The text to convert to speech
 * @param lang - Language code (default: "id" for Indonesian)
 * @returns Base64-encoded audio string with data URI prefix
 */
export async function textToSpeechBase64(
  message: string,
  lang: string = "id"
): Promise<string> {
  if (!message || message.trim() === "") {
    throw new Error("Message cannot be empty");
  }

  if (lang === "") {
    lang = "id"; // Default to Indonesian
  }

  try {
    // Encode message for URL
    const escapedMessage = encodeURIComponent(message);

    // Build Google TTS URL
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${escapedMessage}&tl=${lang}&client=tw-ob`;

    // Fetch audio with headers
    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://translate.google.com/"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }

    // Get audio buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Encode to Base64
    const base64Audio = buffer.toString("base64");

    // Return with data URI prefix
    return `data:audio/mp3;base64,${base64Audio}`;
  } catch (error: any) {
    throw new Error(`Failed to convert text to speech: ${error.message}`);
  }
}

/**
 * Generate donation notification message
 * @param donorName - Name of the donor
 * @param amount - Donation amount
 * @param tokenSymbol - Token symbol
 * @returns Formatted message
 */
export function generateDonationMessage(
  donorName: string,
  amount: string,
  tokenSymbol: string
): string {
  return `${donorName} has given you ${amount} ${tokenSymbol}`;
}

