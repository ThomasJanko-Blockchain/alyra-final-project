import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
  hardhat
} from 'wagmi/chains';


export const config = getDefaultConfig({
    appName: 'SerieCoin',
    projectId: 'fbb8ae282404605a25bbbdc0f61a1d4c',
    chains: [mainnet, polygon, optimism, arbitrum, base, hardhat],
    ssr: true, // If your dApp uses server side rendering (SSR)
  });
