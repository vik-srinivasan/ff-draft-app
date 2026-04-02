import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/?yahoo_error=no_code', request.url));
  }

  const clientId = process.env.YAHOO_CLIENT_ID;
  const clientSecret = process.env.YAHOO_CLIENT_SECRET;
  const redirectUri = process.env.YAHOO_REDIRECT_URI || 'http://localhost:3000/api/yahoo/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/?yahoo_error=no_credentials', request.url));
  }

  try {
    const tokenRes = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('Yahoo token error:', text);
      return NextResponse.redirect(new URL('/?yahoo_error=token_failed', request.url));
    }

    const tokens = await tokenRes.json();

    // Redirect back to the app with the access token in the URL hash
    // In production, you'd want to store this in an httpOnly cookie instead
    return NextResponse.redirect(
      new URL(`/?yahoo_token=${tokens.access_token}`, request.url)
    );
  } catch (err) {
    console.error('Yahoo OAuth error:', err);
    return NextResponse.redirect(new URL('/?yahoo_error=exchange_failed', request.url));
  }
}
