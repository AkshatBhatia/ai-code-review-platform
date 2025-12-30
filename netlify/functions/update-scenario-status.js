/**
 * Update scenario validation status
 * PATCH /api/update-scenario-status
 * Body: { scenario_id, validation_status }
 */
const { getSupabaseClient, responses } = require('./_shared/supabase');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return responses.cors();
  }

  if (event.httpMethod !== 'PATCH') {
    return responses.error('Method Not Allowed', 405);
  }

  try {
    const supabase = getSupabaseClient();

    // Parse request body
    const body = JSON.parse(event.body);
    const { scenario_id, validation_status } = body;

    // Validate required fields
    if (!scenario_id || !validation_status) {
      return responses.error('Missing required fields: scenario_id, validation_status', 400);
    }

    // Validate status value
    const validStatuses = ['draft', 'validated', 'active', 'archived'];
    if (!validStatuses.includes(validation_status)) {
      return responses.error(`Invalid validation_status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Update scenario status
    const { data, error } = await supabase
      .from('scenarios')
      .update({ validation_status })
      .eq('id', scenario_id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return responses.error('Failed to update scenario status', 500);
    }

    if (!data) {
      return responses.error('Scenario not found', 404);
    }

    return responses.success({ scenario: data });

  } catch (error) {
    console.error('Update scenario status error:', error);
    return responses.error('Internal server error', 500);
  }
};
