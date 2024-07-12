import { NextResponse } from 'next/server';
import gtfsAccessibilityValidator from 'gtfs-accessibility-validator';

export const maxDuration = 60 * 5; // 5 minutes

export const POST = async (request: Request) => {
  const body = await request.json();
  const gtfsUrl = body.url;

  if (!gtfsUrl) {
    return NextResponse.json(
      {
        error: 'Missing URL',
        success: false,
      },
      { status: 400 },
    );
  }

  try {
    const validationResults = await gtfsAccessibilityValidator({
      gtfsUrl,
    });

    return NextResponse.json({
      success: true,
      results: validationResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unable to process GTFS',
        success: false,
      },
      { status: 400 },
    );
  }
};
