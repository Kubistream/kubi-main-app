/**
 * Audio Storage Utility
 *
 * Handles temporary storage of audio files with TTL for Pusher optimization.
 * Instead of sending base64 audio via Pusher (>10KB limit), we save files
 * and send URLs.
 */

import { mkdir, writeFile, readdir, unlink, stat, readFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// Audio storage directory (inside public for direct access)
const AUDIO_TEMP_DIR = join(process.cwd(), "public", "audio-temp");

// TTL for audio files (5 minutes)
const AUDIO_TTL_MS = 5 * 60 * 1000;

export interface AudioFile {
  id: string;
  path: string;
  url: string;
  expiresAt: Date;
}

/**
 * Ensure audio temp directory exists
 */
async function ensureAudioDir(): Promise<void> {
  try {
    await mkdir(AUDIO_TEMP_DIR, { recursive: true });
  } catch (error: any) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }
}

/**
 * Save audio buffer to temp file and return URL
 * @param buffer - Audio buffer to save
 * @param extension - File extension (default: mp3)
 * @returns AudioFile with URL and metadata
 */
export async function saveAudioFile(
  buffer: Buffer,
  extension: string = "mp3"
): Promise<AudioFile> {
  await ensureAudioDir();

  const id = randomUUID();
  const filename = `${id}.${extension}`;
  const path = join(AUDIO_TEMP_DIR, filename);
  const url = `/audio-temp/${filename}`;

  await writeFile(path, buffer);

  const expiresAt = new Date(Date.now() + AUDIO_TTL_MS);

  console.log(`[Audio] Saved: ${url} (${buffer.length} bytes, expires: ${expiresAt.toISOString()})`);

  return {
    id,
    path,
    url,
    expiresAt,
  };
}

/**
 * Get audio file by ID
 * @param id - Audio file ID (UUID)
 * @returns Buffer if found and not expired, null otherwise
 */
export async function getAudioFile(id: string): Promise<Buffer | null> {
  try {
    // Find file with matching ID
    const files = await readdir(AUDIO_TEMP_DIR);
    const audioFile = files.find((f) => f.startsWith(id));

    if (!audioFile) {
      return null;
    }

    const filePath = join(AUDIO_TEMP_DIR, audioFile);
    const fileStat = await stat(filePath);

    // Check if expired based on modification time
    const expiresAt = new Date(fileStat.mtimeMs + AUDIO_TTL_MS);
    if (new Date() > expiresAt) {
      // File is expired, delete it
      await unlink(filePath);
      return null;
    }

    return await readFile(filePath);
  } catch (error: any) {
    console.warn(`[Audio] Failed to get file ${id}:`, error.message);
    return null;
  }
}

/**
 * Cleanup expired audio files
 * @returns Number of files cleaned up
 */
export async function cleanupExpiredAudioFiles(): Promise<number> {
  try {
    await ensureAudioDir();

    const files = await readdir(AUDIO_TEMP_DIR);
    let cleanedCount = 0;

    for (const filename of files) {
      try {
        const filePath = join(AUDIO_TEMP_DIR, filename);
        const fileStat = await stat(filePath);

        // Check if expired based on modification time
        const expiresAt = new Date(fileStat.mtimeMs + AUDIO_TTL_MS);
        if (new Date() > expiresAt) {
          await unlink(filePath);
          cleanedCount++;
        }
      } catch (error: any) {
        // File may have been deleted by another process
        console.warn(`[Audio] Cleanup error for ${filename}:`, error.message);
      }
    }

    if (cleanedCount > 0) {
      console.log(`[Audio] Cleanup: Removed ${cleanedCount} expired files`);
    }

    return cleanedCount;
  } catch (error: any) {
    console.error("[Audio] Cleanup error:", error.message);
    return 0;
  }
}
