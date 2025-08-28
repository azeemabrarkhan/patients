/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    FHIR_BASE_URL: process.env.FHIR_BASE_URL || 'http://localhost:3000/api/fhir',
  },
}

module.exports = nextConfig
