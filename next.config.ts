import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['imapflow', 'mailparser', 'googleapis']
};

export default nextConfig;
