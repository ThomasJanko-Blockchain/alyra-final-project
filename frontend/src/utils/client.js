
import { createPublicClient, http } from 'viem'
import { sepolia, hardhat } from 'viem/chains'


export const publicClient = createPublicClient({ 
  chain: hardhat,
  transport: http()
//   transport: http(process.env.RPC_URL)
})