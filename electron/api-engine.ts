import axios from 'axios';

interface RequestPayload {
  url: string;
  method: string;
  headers: Array<{ key: string; value: string; enabled?: boolean }>;
  params: Array<{ key: string; value: string; enabled?: boolean }>;
  body_type: string;
  body_content: string;
  auth_type: string;
  auth_config: any;
}

export async function executeRequest(payload: RequestPayload, variables: Array<{ key: string; value: string; is_enabled: number }>) {
  // Helper to replace environment variables like {{base_url}}
  const replaceVars = (str: string): string => {
    if (!str) return '';
    let replaced = str;
    variables.forEach(v => {
      if (v.is_enabled) {
        // Replace all occurrences of {{key}}
        const regex = new RegExp(`{{\\s*${v.key}\\s*}}`, 'g');
        replaced = replaced.replace(regex, v.value);
      }
    });
    return replaced;
  };

  const finalUrl = replaceVars(payload.url);

  // Compile headers
  const headersObj: Record<string, string> = {};
  payload.headers.forEach(h => {
    if (h.enabled !== false && h.key) {
      headersObj[h.key] = replaceVars(h.value);
    }
  });

  // Compile query parameters
  const paramsObj: Record<string, string> = {};
  payload.params.forEach(p => {
    if (p.enabled !== false && p.key) {
      paramsObj[p.key] = replaceVars(p.value);
    }
  });

  // Authorization setup
  if (payload.auth_type === 'bearer' && payload.auth_config?.token) {
    headersObj['Authorization'] = `Bearer ${replaceVars(payload.auth_config.token)}`;
  } else if (payload.auth_type === 'basic' && (payload.auth_config?.username || payload.auth_config?.password)) {
    const username = replaceVars(payload.auth_config.username || '');
    const password = replaceVars(payload.auth_config.password || '');
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    headersObj['Authorization'] = `Basic ${credentials}`;
  } else if (payload.auth_type === 'apikey' && payload.auth_config?.key && payload.auth_config?.value) {
    const key = replaceVars(payload.auth_config.key);
    const value = replaceVars(payload.auth_config.value);
    if (payload.auth_config.addTo === 'headers') {
      headersObj[key] = value;
    } else {
      paramsObj[key] = value;
    }
  }

  // Request Body config
  let data: any = null;
  if (payload.method !== 'GET') {
    if (payload.body_type === 'json' && payload.body_content) {
      try {
        data = JSON.parse(replaceVars(payload.body_content));
        headersObj['Content-Type'] = 'application/json';
      } catch (err) {
        data = replaceVars(payload.body_content); // Send raw if invalid JSON
        headersObj['Content-Type'] = 'text/plain';
      }
    } else if (payload.body_type === 'x-www-form-urlencoded' && payload.body_content) {
      try {
        const parsed = JSON.parse(payload.body_content);
        const searchParams = new URLSearchParams();
        Object.entries(parsed).forEach(([key, val]) => {
          searchParams.append(key, replaceVars(String(val)));
        });
        data = searchParams.toString();
        headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
      } catch {
        data = replaceVars(payload.body_content);
        headersObj['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    } else if (payload.body_type === 'raw' || payload.body_type === 'raw text') {
      data = replaceVars(payload.body_content);
      headersObj['Content-Type'] = 'text/plain';
    }
  }

  const startTime = Date.now();

  try {
    const response = await axios({
      url: finalUrl,
      method: payload.method as any,
      headers: headersObj,
      params: paramsObj,
      data: data,
      transformResponse: [(res) => res], // Keep response as raw string to avoid custom JSON parses
      validateStatus: () => true // Resolve promise for all status codes
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    const bodyStr = response.data || '';
    const size = Buffer.byteLength(bodyStr, 'utf8');

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      duration,
      size,
      body: bodyStr
    };
  } catch (error: any) {
    const endTime = Date.now();
    return {
      success: false,
      status: 0,
      statusText: error.message || 'Network Error',
      headers: {},
      duration: endTime - startTime,
      size: 0,
      body: JSON.stringify({ error: error.message, stack: error.stack })
    };
  }
}
