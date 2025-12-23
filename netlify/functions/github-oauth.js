/**
 * Netlify Function to exchange GitHub OAuth code for access token
 */

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { code } = JSON.parse(event.body);
    
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing authorization code' })
      };
    }

    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing GitHub OAuth credentials');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'GitHub OAuth not configured' })
      };
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      })
    });

    if (!tokenResponse.ok) {
      console.error('GitHub token exchange failed:', tokenResponse.status, tokenResponse.statusText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to exchange code for token' })
      };
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData.error, tokenData.error_description);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: tokenData.error, 
          error_description: tokenData.error_description 
        })
      };
    }

    // Return the access token
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Adjust for production
      },
      body: JSON.stringify({
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        scope: tokenData.scope
      })
    };

  } catch (error) {
    console.error('GitHub OAuth function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};