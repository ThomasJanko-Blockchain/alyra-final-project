/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        RPC_URL: process.env.RPC_URL,
    },
};

export default nextConfig;
