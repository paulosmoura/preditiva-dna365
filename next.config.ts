import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/dashboard": ["./.data/notas.xlsx"],
    "/dashboard/equipamentos-criticos": ["./.data/notas.xlsx"],
    "/dashboard/notas/*": ["./.data/notas.xlsx"],
    "/api/*": ["./.data/notas.xlsx"],
  },
};

export default nextConfig;
