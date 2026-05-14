import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(dirname),
  experimental: {
    // Default 1 MB est trop petit pour des photos de téléphone (3-10 MB).
    // On laisse de la marge — sharp gère le redimensionnement côté serveur.
    serverActions: { bodySizeLimit: '15mb' },
  },
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
    // Payload renvoie les URLs media en absolu dès que `serverURL` est set.
    // On autorise donc notre propre domaine + localhost (dev).
    remotePatterns: [
      { protocol: 'https', hostname: 'aufildessemis.be' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async headers() {
    return [
      {
        // Les filenames media Payload sont uniques (suffix horodaté). Ils ne
        // changent jamais une fois uploadés → cache long + immutable.
        source: '/api/media/file/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
