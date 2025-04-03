import { http, createConfig } from '@wagmi/core'
import { hardhat, mainnet, sepolia } from '@wagmi/core/chains'

export const config = createConfig({
  
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
    // [hardhat.id]: http(),
  },
})