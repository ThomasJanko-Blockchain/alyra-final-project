
import { createPublicClient, http } from 'viem'
import { hardhat, sepolia } from 'viem/chains'


export const publicClient = createPublicClient({ 
  chain: sepolia,
  transport: http(process.env.RPC_URL)
})
// export const publicClient = createPublicClient({ 
//   chain: hardhat,
//   transport: http()
// })