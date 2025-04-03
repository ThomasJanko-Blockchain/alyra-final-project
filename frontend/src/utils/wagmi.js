import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'viem';
import {
  sepolia,
  polygon,
  hardhat
} from 'wagmi/chains';


export const config = getDefaultConfig({
    appName: 'SerieCoin',
    projectId: 'fbb8ae282404605a25bbbdc0f61a1d4c',
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(process.env.RPC_URL),
    },
    ssr: true, // If your dApp uses server side rendering (SSR)
  });
