/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // pg-native is an optional C++ addon — ignore it for webpack builds
    config.resolve.alias["pg-native"] = false;

    // canvas is required by some PDF libs but not needed server-side
    if (isServer) {
      config.resolve.alias.canvas = false;
    }

    return config;
  },
  // Exclude heavy server-only packages from edge runtime
  experimental: {
    serverComponentsExternalPackages: ["@react-pdf/renderer", "pg"],
  },
};

export default nextConfig;
