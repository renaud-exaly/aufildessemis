import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Plants } from './collections/Plants'
import { Sowings } from './collections/Sowings'
import { SowingUpdates } from './collections/SowingUpdates'
import { Tips } from './collections/Tips'
import { Comments } from './collections/Comments'
import { Reports } from './collections/Reports'
import { Pages } from './collections/Pages'
import { NewsletterIssues } from './collections/NewsletterIssues'
import { buildResendEmailAdapter } from './lib/email-adapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  csrf: process.env.PAYLOAD_PUBLIC_SERVER_URL
    ? [process.env.PAYLOAD_PUBLIC_SERVER_URL]
    : undefined,
  cors: process.env.PAYLOAD_PUBLIC_SERVER_URL
    ? [process.env.PAYLOAD_PUBLIC_SERVER_URL]
    : undefined,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Au fil des semis',
    },
  },
  endpoints: [
    {
      // Le `/api/users/me` natif de Payload v3 exige une session JWT.
      // L'auth via API key (header `Authorization: users API-Key ...`) ne
      // passe pas par /me. On expose un mini endpoint qui lit `req.user`
      // peuplé par l'auth middleware, peu importe le mode d'auth.
      path: '/whoami',
      method: 'get',
      handler: async (req) => {
        const reqUser = req.user

        // Tentative explicite : payload.auth() avec les headers de la requête.
        let manualAuthResult: Record<string, unknown> = {}
        try {
          const result = await req.payload.auth({ headers: req.headers })
          manualAuthResult = {
            ok: true,
            hasUser: !!result.user,
            userEmail: result.user?.email,
            userCollection: result.user?.collection,
            responseHeaders: Object.fromEntries(
              (result.responseHeaders ?? new Headers()).entries(),
            ),
          }
        } catch (e) {
          manualAuthResult = { ok: false, error: (e as Error).message }
        }

        const cookieHeader = req.headers?.get?.('cookie') ?? null
        return Response.json(
          {
            reqUser: reqUser
              ? { id: reqUser.id, email: reqUser.email }
              : null,
            manualAuth: manualAuthResult,
            cookieHeaderLen: cookieHeader?.length ?? 0,
            serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
          },
          { status: reqUser ? 200 : 401 },
        )
      },
    },
  ],
  collections: [
    Users,
    Media,
    Plants,
    Sowings,
    SowingUpdates,
    Tips,
    Comments,
    Reports,
    Pages,
    NewsletterIssues,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
    // Auto-sync schema on boot. Acceptable while collections evolve.
    // Override with PAYLOAD_DB_PUSH=false once migrations are introduced.
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
  }),
  sharp,
  email: buildResendEmailAdapter(),
  plugins: [],
})
