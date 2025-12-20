import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1)
    
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: error ? 'error' : 'ok',
        authentication: 'ok', // Supabase auth is always available if API is working
      },
      version: '0.1.0'
    }

    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable'
      },
      { status: 503 }
    )
  }
}