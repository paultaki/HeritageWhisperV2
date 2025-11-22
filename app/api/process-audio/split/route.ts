import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('audio') as File;
        const segmentsJson = formData.get('segments') as string;

        if (!file || !segmentsJson) {
            return NextResponse.json({ error: 'Audio file and segments are required' }, { status: 400 });
        }

        const segments = JSON.parse(segmentsJson);

        // Setup temp directory
        const tempDir = join(process.cwd(), 'tmp', 'audio-processing');
        if (!existsSync(tempDir)) {
            await mkdir(tempDir, { recursive: true });
        }

        // Save uploaded file
        const buffer = Buffer.from(await file.arrayBuffer());
        const inputFileName = `${uuidv4()}-${file.name}`;
        const inputFilePath = join(tempDir, inputFileName);
        await writeFile(inputFilePath, buffer);

        const processedFiles: { index: number; path: string; url: string; duration: number }[] = [];

        // Process each segment
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const outputFileName = `split-${i}-${inputFileName}`;
            const outputFilePath = join(tempDir, outputFileName);

            // Calculate duration
            const duration = segment.end - segment.start;

            // ffmpeg command to slice
            // -ss: start time
            // -t: duration
            // -c copy: fast copy without re-encoding (might be less accurate for non-keyframes)
            // OR re-encode for accuracy. Let's re-encode to ensure clean cuts.
            const command = `ffmpeg -i "${inputFilePath}" -ss ${segment.start} -t ${duration} -c:a libopus -b:a 128k "${outputFilePath}"`;

            console.log(`Processing segment ${i}: ${command}`);
            await execAsync(command);

            // In a real app, we would upload this to S3/Supabase Storage here.
            // For this implementation, we'll return a local path that needs to be handled 
            // (e.g., read by the client or uploaded immediately).
            // Since we can't easily serve files from tmp in Next.js App Router without a route,
            // we will read the file back into a buffer and return base64 or upload it.

            // Let's upload to Supabase Storage if possible, or return base64.
            // Returning base64 for simplicity in this "local" context, 
            // but ideally we should upload to the cloud.

            // Actually, let's just return the base64 of the split clips so the client can upload them 
            // using the existing upload flow.

            const splitBuffer = await import('fs').then(fs => fs.readFileSync(outputFilePath));
            const base64Audio = splitBuffer.toString('base64');
            const mimeType = 'audio/webm'; // Assuming we output webm/opus

            processedFiles.push({
                index: i,
                path: outputFilePath,
                url: `data:${mimeType};base64,${base64Audio}`,
                duration: duration
            });

            // Cleanup split file
            await unlink(outputFilePath);
        }

        // Cleanup input file
        await unlink(inputFilePath);

        return NextResponse.json({ files: processedFiles });

    } catch (error) {
        console.error('Error splitting audio:', error);
        return NextResponse.json(
            { error: 'Failed to split audio' },
            { status: 500 }
        );
    }
}
