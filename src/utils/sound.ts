/**
 * Sound Utility
 *
 * Utilities for loading and encoding audio files.
 */

import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Read audio file and convert to base64 with data URI prefix
 * @param relativePath - Relative path from public directory
 * @returns Base64-encoded audio string with data URI prefix
 */
export async function readFileBase64(relativePath: string): Promise<string> {
  try {
    // Get the public directory path
    // In Next.js, we need to handle this differently for build vs runtime
    const publicDir = join(process.cwd(), "public");
    const fullPath = join(publicDir, relativePath);

    // Read file
    const buffer = await readFile(fullPath);

    // Encode to Base64
    const base64 = buffer.toString("base64");

    // Determine MIME type based on file extension
    const ext = relativePath.split(".").pop()?.toLowerCase();
    let mimeType = "audio/mpeg"; // Default to mp3

    switch (ext) {
      case "mp3":
        mimeType = "audio/mpeg";
        break;
      case "wav":
        mimeType = "audio/wav";
        break;
      case "ogg":
        mimeType = "audio/ogg";
        break;
      case "m4a":
        mimeType = "audio/mp4";
        break;
    }

    // Return with data URI prefix
    return `data:${mimeType};base64,${base64}`;
  } catch (error: any) {
    throw new Error(`Failed to read audio file: ${error.message}`);
  }
}

/**
 * Load the default alert sound
 * @returns Base64-encoded alert sound with data URI prefix
 */
export async function loadAlertSound(): Promise<string> {
  return "/overlay/sound.mp3";
}
