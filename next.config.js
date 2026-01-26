/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: [], // Add image domains if needed in future
  },
  
  // Environment variables that should be available on client side
  env: {
    // Add client-side env vars here if needed
  },
};

module.exports = nextConfig;
