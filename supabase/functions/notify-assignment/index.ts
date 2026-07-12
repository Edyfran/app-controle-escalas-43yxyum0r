// Sends a "you've been scheduled" email via Resend when a coordinator assigns/substitutes a
// member on a schedule. Invoked directly from the frontend (supabase.functions.invoke) right
// after a successful write — see src/stores/main.tsx. `verify_jwt` is enabled (project default)
// so only requests carrying a valid Supabase session JWT reach this code.
//
// Beyond the JWT check, we also confirm `to` is actually a member of the caller's own paróquia
// before sending anything — otherwise any authenticated coordinator could invoke this function
// directly (e.g. from devtools) with an arbitrary recipient/body and use this project's Resend
// account as an open email relay. The lookup goes through PostgREST with the caller's own JWT
// (not a service role), so RLS itself restricts the match to the caller's paróquia — no separate
// authorization logic to get wrong here, and no extra dependency to import/bundle.

interface NotifyPayload {
  to: string
  memberName: string
  scheduleTitle: string
  scheduleDate: string // ISO date
  scheduleTime: string // "HH:mm"
  roleName: string
  parishName: string
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_ADDRESS = Deno.env.get('NOTIFY_FROM_ADDRESS') ?? 'onboarding@resend.dev'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Browsers preflight cross-origin POSTs with an OPTIONS request; without these headers on both
// the preflight and the real response, the frontend's fetch is blocked before it even reaches here.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'UTC',
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  if (!RESEND_API_KEY) {
    return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  let payload: NotifyPayload
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const { to, memberName, scheduleTitle, scheduleDate, scheduleTime, roleName, parishName } =
    payload

  if (!to || !memberName || !scheduleTitle || !scheduleDate || !scheduleTime || !roleName) {
    return jsonResponse({ error: 'Missing required fields' }, 400)
  }

  const lookupUrl = `${SUPABASE_URL}/rest/v1/members?select=id&email=eq.${encodeURIComponent(to)}`
  const lookupResponse = await fetch(lookupUrl, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: authHeader },
  })

  if (!lookupResponse.ok) {
    return jsonResponse({ error: 'Failed to verify recipient' }, 500)
  }
  const matches = await lookupResponse.json()
  if (!Array.isArray(matches) || matches.length === 0) {
    return jsonResponse({ error: 'Recipient is not a member of your paróquia' }, 403)
  }

  const dateLabel = formatDate(scheduleDate)

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Você foi escalado(a)!</h2>
      <p>Olá, ${memberName}!</p>
      <p><strong>${parishName ?? 'Sua paróquia'}</strong> acabou de te escalar como <strong>${roleName}</strong>
      na celebração <strong>${scheduleTitle}</strong>.</p>
      <p>📅 ${dateLabel}<br>🕒 ${scheduleTime}</p>
      <p>Entre no portal para confirmar ou recusar sua presença.</p>
    </div>
  `

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to,
      subject: `Você foi escalado(a) em ${scheduleTitle}`,
      html,
    }),
  })

  if (!resendResponse.ok) {
    const errorBody = await resendResponse.text()
    return jsonResponse({ error: 'Failed to send email', details: errorBody }, 502)
  }

  return jsonResponse({ ok: true }, 200)
})
