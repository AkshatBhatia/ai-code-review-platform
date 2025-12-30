/**
 * Tests for update-scenario-status Netlify function
 */

const { handler } = require('../update-scenario-status');

// Mock the shared supabase module
jest.mock('../_shared/supabase', () => {
  const mockSupabaseClient = {
    from: jest.fn(),
  };

  return {
    getSupabaseClient: jest.fn(() => mockSupabaseClient),
    responses: {
      success: (data, statusCode = 200) => ({
        statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        },
        body: JSON.stringify(data),
      }),
      error: (message, statusCode = 400) => ({
        statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        },
        body: JSON.stringify({ error: message }),
      }),
      cors: () => ({
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        },
        body: '',
      }),
    },
  };
});

describe('update-scenario-status', () => {
  let mockSupabase;

  beforeEach(() => {
    jest.clearAllMocks();
    const { getSupabaseClient } = require('../_shared/supabase');
    mockSupabase = getSupabaseClient();
  });

  describe('CORS preflight', () => {
    it('should handle OPTIONS request', async () => {
      const event = {
        httpMethod: 'OPTIONS',
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('PATCH');
      expect(response.body).toBe('');
    });
  });

  describe('Method validation', () => {
    it('should reject non-PATCH requests', async () => {
      const event = {
        httpMethod: 'GET',
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(405);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Method Not Allowed');
    });
  });

  describe('Request validation', () => {
    it('should reject requests missing scenario_id', async () => {
      const event = {
        httpMethod: 'PATCH',
        body: JSON.stringify({
          validation_status: 'active',
        }),
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing required fields');
    });

    it('should reject requests missing validation_status', async () => {
      const event = {
        httpMethod: 'PATCH',
        body: JSON.stringify({
          scenario_id: '123',
        }),
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Missing required fields');
    });

    it('should reject invalid validation_status values', async () => {
      const event = {
        httpMethod: 'PATCH',
        body: JSON.stringify({
          scenario_id: '123',
          validation_status: 'invalid_status',
        }),
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Invalid validation_status');
    });
  });

  describe('Successful updates', () => {
    it('should successfully update status from validated to active', async () => {
      const mockScenario = {
        id: '123',
        repo: 'owner/repo',
        canonical_pr_number: 1,
        title: 'Test Scenario',
        validation_status: 'active',
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockScenario,
                error: null,
              }),
            }),
          }),
        }),
      });

      const event = {
        httpMethod: 'PATCH',
        body: JSON.stringify({
          scenario_id: '123',
          validation_status: 'active',
        }),
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scenario).toEqual(mockScenario);
      expect(body.scenario.validation_status).toBe('active');

      // Verify Supabase was called correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('scenarios');
    });

    it('should successfully update status from validated to archived', async () => {
      const mockScenario = {
        id: '456',
        repo: 'owner/repo',
        canonical_pr_number: 2,
        title: 'Test Scenario 2',
        validation_status: 'archived',
      };

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockScenario,
                error: null,
              }),
            }),
          }),
        }),
      });

      const event = {
        httpMethod: 'PATCH',
        body: JSON.stringify({
          scenario_id: '456',
          validation_status: 'archived',
        }),
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scenario.validation_status).toBe('archived');
    });
  });

  describe('Error handling', () => {
    it('should handle scenario not found', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const event = {
        httpMethod: 'PATCH',
        body: JSON.stringify({
          scenario_id: 'nonexistent',
          validation_status: 'active',
        }),
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Scenario not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      const event = {
        httpMethod: 'PATCH',
        body: JSON.stringify({
          scenario_id: '123',
          validation_status: 'active',
        }),
      };

      const response = await handler(event, {});

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Failed to update scenario status');
    });
  });

  describe('CORS headers', () => {
    it('should include PATCH in allowed methods', async () => {
      const event = {
        httpMethod: 'OPTIONS',
      };

      const response = await handler(event, {});

      expect(response.headers['Access-Control-Allow-Methods']).toContain('PATCH');
    });

    it('should include CORS headers in success responses', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: '123', validation_status: 'active' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const event = {
        httpMethod: 'PATCH',
        body: JSON.stringify({
          scenario_id: '123',
          validation_status: 'active',
        }),
      };

      const response = await handler(event, {});

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('PATCH');
    });
  });
});
