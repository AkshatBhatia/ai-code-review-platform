/**
 * List scenarios with optional filtering
 * GET /api/list-scenarios?difficulty=medium&status=active
 */
const { getSupabaseClient, responses } = require('./_shared/supabase');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return responses.cors();
  }

  if (event.httpMethod !== 'GET') {
    return responses.error('Method Not Allowed', 405);
  }

  try {
    const supabase = getSupabaseClient();

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const { difficulty, status, tags, company_id } = params;

    // Build query
    let query = supabase
      .from('scenarios')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (status) {
      query = query.eq('validation_status', status);
    }
    if (company_id) {
      query = query.eq('company_id', company_id);
    }
    if (tags) {
      // Tags can be comma-separated
      const tagArray = tags.split(',').map(t => t.trim());
      query = query.contains('tags', tagArray);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return responses.error('Failed to fetch scenarios', 500);
    }

    return responses.success({ scenarios: data });

  } catch (error) {
    console.error('List scenarios error:', error);
    return responses.error('Internal server error', 500);
  }
};
