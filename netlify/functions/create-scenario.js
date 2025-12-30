/**
 * Create a new scenario
 * POST /api/create-scenario
 * Body: { repo, canonical_pr_number, commit_sha, title, difficulty, tags, created_by }
 */
const { getSupabaseClient, responses } = require('./_shared/supabase');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return responses.cors();
  }

  if (event.httpMethod !== 'POST') {
    return responses.error('Method Not Allowed', 405);
  }

  try {
    const supabase = getSupabaseClient();

    // Parse request body
    const body = JSON.parse(event.body);
    const {
      repo,
      canonical_pr_number,
      commit_sha,
      title,
      difficulty,
      tags,
      created_by,
      company_id,
      validation_status
    } = body;

    // Validate required fields
    if (!repo || !canonical_pr_number || !commit_sha || !title || !difficulty) {
      return responses.error('Missing required fields: repo, canonical_pr_number, commit_sha, title, difficulty', 400);
    }

    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return responses.error('Invalid difficulty. Must be: easy, medium, or hard', 400);
    }

    // Create scenario with validation status
    // Defaults to 'validated' if validation was performed on client
    const scenarioData = {
      repo,
      canonical_pr_number: parseInt(canonical_pr_number),
      commit_sha,
      title,
      difficulty,
      tags: tags || [],
      validation_status: validation_status || 'validated',
      created_by,
      company_id
    };

    const { data, error } = await supabase
      .from('scenarios')
      .insert([scenarioData])
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return responses.error('Scenario already exists for this PR', 409);
      }
      console.error('Supabase insert error:', error);
      return responses.error('Failed to create scenario', 500);
    }

    return responses.success({ scenario: data }, 201);

  } catch (error) {
    console.error('Create scenario error:', error);
    return responses.error('Internal server error', 500);
  }
};
