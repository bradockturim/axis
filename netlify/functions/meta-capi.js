const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS'
};

const getClientIp = (headers) => {
    const nfIp = headers['x-nf-client-connection-ip'];
    if (nfIp) return nfIp;
    const forwardedFor = headers['x-forwarded-for'];
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    return null;
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { ...corsHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const pixelId = process.env.META_PIXEL_ID || process.env.FB_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const testEventCode = process.env.META_TEST_EVENT_CODE;

    if (!pixelId || !accessToken) {
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ error: 'Missing META_PIXEL_ID/FB_PIXEL_ID or META_ACCESS_TOKEN env vars' })
        };
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return {
            statusCode: 400,
            headers: { ...corsHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid JSON body' })
        };
    }

    const eventName = body.event_name;
    if (!eventName) {
        return {
            statusCode: 400,
            headers: { ...corsHeaders, 'content-type': 'application/json' },
            body: JSON.stringify({ error: 'Missing event_name' })
        };
    }

    const ip = getClientIp(event.headers || {});
    const userAgent = (event.headers && (event.headers['user-agent'] || event.headers['User-Agent'])) || null;

    const payload = {
        data: [
            {
                event_name: eventName,
                event_time: body.event_time || Math.floor(Date.now() / 1000),
                event_id: body.event_id,
                action_source: 'website',
                event_source_url: body.event_source_url,
                user_data: {
                    client_ip_address: ip,
                    client_user_agent: userAgent,
                    fbp: body.fbp,
                    fbc: body.fbc
                },
                custom_data: body.custom_data
            }
        ],
        access_token: accessToken
    };

    if (testEventCode) {
        payload.test_event_code = testEventCode;
    }

    const response = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    const responseBody = responseText && responseText.trim().startsWith('{')
        ? responseText
        : JSON.stringify({ raw: responseText });

    return {
        statusCode: response.ok ? 200 : response.status,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
        body: responseBody
    };
};
