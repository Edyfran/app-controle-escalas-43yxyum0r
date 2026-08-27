// Emails the coordinator when a member self-registers with a paróquia join code and lands as
// approval_status = 'Pendente'. Invoked right after a successful signUpMember() — see
// src/stores/main.tsx. `verify_jwt` is enabled, so only the newly-created member's own session
// can trigger this (no arbitrary caller can ask us to email an arbitrary coordinator).
//
// The caller's JWT is used (via PostgREST + RLS) only to look up THEIR OWN pending member row —
// we never trust a client-supplied parish/member id. Finding the coordinator's email does need
// elevated access (a member can't read another parish's profile via RLS), so that one lookup
// uses the service role key, which is only ever applied to the parish_id we already derived from
// the caller's own authenticated row.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_ADDRESS = Deno.env.get('NOTIFY_FROM_ADDRESS') ?? 'onboarding@resend.dev'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

function getUserIdFromJwt(authHeader: string): string | null {
  try {
    const token = authHeader.replace(/^Bearer\s+/i, '')
    const payloadSegment = token.split('.')[1]
    const payload = JSON.parse(atob(payloadSegment.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
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

  const callerId = getUserIdFromJwt(authHeader)
  if (!callerId) {
    return jsonResponse({ error: 'Invalid token' }, 401)
  }

  // Only the caller's own pending row, scoped by RLS via their own JWT.
  const ownRowUrl =
    `${SUPABASE_URL}/rest/v1/members?select=id,name,email,parish_id` +
    `&user_id=eq.${encodeURIComponent(callerId)}&approval_status=eq.Pendente`
  const ownRowResponse = await fetch(ownRowUrl, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: authHeader },
  })
  if (!ownRowResponse.ok) {
    return jsonResponse({ error: 'Failed to look up registration' }, 500)
  }
  const ownRows = await ownRowResponse.json()
  const memberRow = Array.isArray(ownRows) ? ownRows[0] : null

  // Not pending (e.g. auto-linked to an already-approved roster row) — nothing to notify.
  if (!memberRow) {
    return jsonResponse({ ok: true, skipped: true }, 200)
  }

  const coordinatorUrl =
    `${SUPABASE_URL}/rest/v1/profiles?select=name,email` +
    `&parish_id=eq.${encodeURIComponent(memberRow.parish_id)}`
  const coordinatorResponse = await fetch(coordinatorUrl, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  if (!coordinatorResponse.ok) {
    return jsonResponse({ error: 'Failed to look up coordinator' }, 500)
  }
  const coordinatorsJson = await coordinatorResponse.json()
  const coordinators: { name: string | null; email: string }[] = Array.isArray(coordinatorsJson)
    ? coordinatorsJson
    : []
  if (coordinators.length === 0) {
    return jsonResponse({ error: 'Coordinator not found' }, 404)
  }

  // A paróquia can have more than one coordinator — notify all of them, not just one.
  const sendResults = await Promise.all(
    coordinators.map((coordinator) => {
      const html = `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Novo cadastro pendente de aprovação</h2>
          <p>Olá, ${coordinator.name ?? 'coordenador(a)'}!</p>
          <p><strong>${memberRow.name}</strong> (${memberRow.email}) se cadastrou no portal usando o
          código de convite da sua paróquia e está aguardando sua aprovação.</p>
          <p>Acesse Membros no seu painel para aprovar ou rejeitar esse cadastro.</p>
        </div>
      `
      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: coordinator.email,
          subject: `Novo cadastro pendente: ${memberRow.name}`,
          html,
        }),
      })
    }),
  )

  if (sendResults.every((r) => !r.ok)) {
    return jsonResponse({ error: 'Failed to send email to any coordinator' }, 502)
  }

  return jsonResponse({ ok: true }, 200)
})
