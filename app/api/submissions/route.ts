import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, url, description } = body

    if (!title || !url || !description) {
      return NextResponse.json(
        { error: 'Title, URL, and description are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('software_submissions')
      .insert({ title, url, description })
      .select()
      .maybeSingle()

    if (error) {
      if (error.message.includes('valid_url')) {
        return NextResponse.json(
          { error: 'Invalid URL format. URL must start with http:// or https://' },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Software submitted successfully! It will be reviewed soon.',
      data
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('software_submissions')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
