/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        RPC_URL: process.env.RPC_URL,
        NEXT_PUBLIC_PINATA_JWT: process.env.NEXT_PUBLIC_PINATA_JWT,
    },
};

export default nextConfig;
