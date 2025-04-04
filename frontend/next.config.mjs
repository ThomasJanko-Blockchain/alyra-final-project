/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        RPC_URL: process.env.RPC_URL,
        PINATA_JWT: process.env.PINATA_JWT,
    },
};

export default nextConfig;
