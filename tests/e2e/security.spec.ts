import { expect, test } from '@playwright/test'

/**
 * Garantit que les champs PII / secrets ne fuitent jamais dans les réponses API
 * pour un visiteur anonyme. Régression critique à attraper si quelqu'un retire
 * le hook afterRead sur la collection Users.
 */
test('anonymous user cannot see PII or secrets on owner relation', async ({
  request,
}) => {
  // On essaie de récupérer le premier Sowing public, qui expose `owner` (User)
  // en relation. Si pas de Sowing en base, on skip.
  const list = await request.get('/api/sowings?limit=1&depth=0')
  const listJson = await list.json()
  if (!listJson.docs?.length) {
    test.skip(true, 'No Sowing in DB to probe — skip')
    return
  }
  const id = listJson.docs[0].id

  const res = await request.get(`/api/sowings/${id}?depth=2`)
  expect(res.status()).toBe(200)
  const body = await res.json()
  const owner = body.owner
  expect(typeof owner).toBe('object')

  const FORBIDDEN = [
    'email',
    'apiKey',
    'sessions',
    'bannedAt',
    'deletedAt',
    'enableAPIKey',
    'newsletterOptIn',
    'reminderOptIn',
    '_verified',
    '_verificationToken',
    'loginAttempts',
    'lockUntil',
  ]
  for (const field of FORBIDDEN) {
    expect(owner, `owner should not expose "${field}" to anonymous`).not.toHaveProperty(field)
  }

  // Champs sains qu'on garde publics.
  expect(owner).toHaveProperty('displayName')
  expect(owner).toHaveProperty('id')
})

test('GET /api/users/<id> hides sensitive fields for anonymous', async ({
  request,
}) => {
  const res = await request.get('/api/users/2')
  if (res.status() === 404) {
    test.skip(true, 'No user id=2 in DB — skip')
    return
  }
  expect(res.status()).toBe(200)
  const user = await res.json()
  for (const field of ['email', 'apiKey', 'sessions', 'bannedAt']) {
    expect(user, `${field} must be stripped`).not.toHaveProperty(field)
  }
})
