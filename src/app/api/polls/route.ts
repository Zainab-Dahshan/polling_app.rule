import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for the request body
const pollSchema = z.object({
  question: z.string().min(5),
  options: z.array(
    z.object({
      text: z.string().min(1)
    })
  ).min(2)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = pollSchema.parse(body);

    // Here you would typically save the poll to your database
    // For now, we'll just return a success response
    
    return NextResponse.json(
      { message: 'Poll created successfully', data: validatedData },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}