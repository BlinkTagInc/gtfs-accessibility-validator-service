import { NextResponse } from 'next/server';
import gtfsAccessibilityValidator from 'gtfs-accessibility-validator';
import { rm, writeFile } from 'node:fs/promises';
import path from 'path';
import { temporaryDirectory } from 'tempy';

export const maxDuration = 300; // 5 minutes

export const POST = async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file) {
    return NextResponse.json(
      {
        error: 'No files received',
        success: false,
      },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await (file as Blob).arrayBuffer());

  // Replace spaces in the file name with underscores
  const filename = (file as File).name.replaceAll(' ', '_');

  try {
    // Write file to temporary directory
    const tempDir = temporaryDirectory();
    const gtfsPath = path.join(tempDir, filename);

    await writeFile(gtfsPath, buffer);

    const validationResults = await gtfsAccessibilityValidator({
      gtfsPath,
    });

    await rm(tempDir, { recursive: true });

    return NextResponse.json({
      success: true,
      results: validationResults,
    });
  } catch (error) {
    console.log('Error occurred ', error);
    return NextResponse.json(
      {
        error: 'Unable to process GTFS',
        success: false,
      },
      { status: 400 },
    );
  }
};
