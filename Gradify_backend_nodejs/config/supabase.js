require("dotenv").config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertSupabaseConfigured() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }
}

function buildHeaders(prefer = "return=representation") {
    assertSupabaseConfigured();

    return {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: prefer,
    };
}

function buildQueryString(filters = {}, options = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            params.append(key, `eq.${value}`);
        }
    });

    params.append("select", options.select || "*");

    if (options.limit) {
        params.append("limit", String(options.limit));
    }

    if (options.order) {
        params.append("order", options.order);
    }

    return params.toString();
}

async function requestSupabase(table, { method = "GET", filters = {}, body, prefer, options = {} } = {}) {
    assertSupabaseConfigured();

    const url = new URL(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${table}`);
    const query = buildQueryString(filters, options);
    if (query) {
        url.search = query;
    }

    const response = await fetch(url, {
        method,
        headers: buildHeaders(prefer),
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : null;

    if (!response.ok) {
        const errorMessage = Array.isArray(data) ? JSON.stringify(data) : responseText || response.statusText;
        throw new Error(errorMessage);
    }

    return data;
}

async function selectRows(table, filters = {}, options = {}) {
    const data = await requestSupabase(table, {
        method: "GET",
        filters,
        options,
        prefer: "return=representation",
    });

    if (options.single) {
        return Array.isArray(data) ? data[0] || null : data || null;
    }

    return data || [];
}

async function insertRows(table, rows) {
    const data = await requestSupabase(table, {
        method: "POST",
        body: rows,
        prefer: "return=representation",
    });

    return Array.isArray(data) ? data : data ? [data] : [];
}

async function updateRows(table, values, filters = {}) {
    return requestSupabase(table, {
        method: "PATCH",
        filters,
        body: values,
        prefer: "return=representation",
    });
}

async function deleteRows(table, filters = {}) {
    return requestSupabase(table, {
        method: "DELETE",
        filters,
        prefer: "return=representation",
    });
}

function bufferToDataUrl(buffer, mimeType = "application/octet-stream") {
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function dataUrlToBuffer(dataUrl) {
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.includes(",")) {
        return null;
    }

    const base64Part = dataUrl.split(",")[1];
    return Buffer.from(base64Part, "base64");
}

module.exports = {
    assertSupabaseConfigured,
    requestSupabase,
    selectRows,
    insertRows,
    updateRows,
    deleteRows,
    bufferToDataUrl,
    dataUrlToBuffer,
};