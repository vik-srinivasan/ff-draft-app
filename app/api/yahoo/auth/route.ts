import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.YAHOO_CLIENT_ID;
  const redirectUri = process.env.YAHOO_REDIRECT_URI || 'http://localhost:3000/api/yahoo/callback';

  if (!clientId) {
    return NextResponse.json(
      { error: 'YAHOO_CLIENT_ID not configured in .env.local' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'fspt-r',
  });

  return NextResponse.redirect(`https://api.login.yahoo.com/oauth2/request_auth?${params}`);
}
