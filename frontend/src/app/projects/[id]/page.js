'use client'
import { BadgeDollarSignIcon, ChartPie, FilmIcon, LucideDollarSign, Send, SendHorizonal, UserRoundIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { SerieProjectNFTAddress, SerieProjectNFTAbi, ProjectStatus } from '@/utils/constants'
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ProjectPage() {
  const { address, isConnected } = useAccount();
  const { id } = useParams();
  const { theme } = useTheme();

  const [investAmount, setInvestAmount] = useState(0);
  const [projectShare, setProjectShare] = useState(0);
  const [transfer, setTransfer] = useState({
    address: "",
    amount: 0,
  });
  const [investDialogOpen, setInvestDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const [project, setProject] = useState({
    title: "",
    description: "",
    fundingGoal: 0,
    currentFunding: 0,
    duration: 0,
    startTime: 0,
    producer: "",
    status: "",
    copyrightURI: "",
    totalShares: 0,
    tokenURI: "",
  });

  const { data: projectData, refetch: refetchProjectData } = useReadContract({
    address: SerieProjectNFTAddress,
    abi: SerieProjectNFTAbi,
    functionName: 'projects',
    args: [id],
    enabled: isConnected,
  })

  const { data: projectShares, refetch: refetchProjectShares } = useReadContract({
    address: SerieProjectNFTAddress,
    abi: SerieProjectNFTAbi,
    functionName: 'projectShares',
    args: [id, address],
    enabled: isConnected && !!address,
  })

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if(projectShares) {
      console.log("projectShares", projectShares)
      setProjectShare(Number(projectShares))
    }
  }, [projectShares])

  const handleInvest = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }
    try {
      await writeContract({
        address: SerieProjectNFTAddress,
        abi: SerieProjectNFTAbi,
        functionName: 'investInProject',
        args: [id, investAmount],
      })
    } catch (err) {
      console.error("Investment failed:", err)
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }
    try {
      await writeContract({
        address: SerieProjectNFTAddress,
        abi: SerieProjectNFTAbi,
        functionName: 'transferShares',
        args: [id, transfer.address, transfer.amount],
      })
    } catch (err) {
      console.error("Transfer failed:", err)
    }
  }

  const refreshData = async () => {
    if (!isConnected) return
    await Promise.all([
      refetchProjectData(),
      refetchProjectShares()
    ])
  }

  useEffect(() => {
    if(isConfirmed) {
      toast.success("Transaction confirmed", {
        description: `Hash: ${hash}`
      })
      setInvestDialogOpen(false)
      setTransferDialogOpen(false)
      refreshData()
      setInvestAmount(0)
      setTransfer({
        address: "",
        amount: 0,
      })
    }
    if(error) {
      toast.error("Transaction failed", {
        description: error.shortMessage || error.message
      })
    }
  }, [isConfirmed, error])

  const getProjectData = () => {
    if (projectData) {
      console.log("projectData", projectData)
      setProject({
        title: projectData[0],
        description: projectData[1],
        fundingGoal: Number(projectData[2]),
        currentFunding: Number(projectData[3]),
        duration: Number(projectData[4]),
        startTime: Number(projectData[5]),
        producer: projectData[6],
        status: ProjectStatus[projectData[7]],
        copyrightURI: projectData[8],
        totalShares: Number(projectData[9]),
        tokenURI: projectData[10],
      })
    }
  }

  useEffect(() => {
    getProjectData()
  }, [projectData])

  if (!isConnected) {
    return (
      <div className='flex flex-col gap-y-4 justify-center items-center mt-10 text-xl'>
        <p>Please connect your wallet to view project details</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-y-4 justify-center items-center mt-10 text-xl font-bold'>
        {project.title && (
          <div>
            {/* TOP BAR  */}
            <div>
              <img src={project.tokenURI} className='w-32 h-32 rounded-md object-cover' style={{
                backgroundImage: `url("https://placehold.co/600x400")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }} />
              <div className='flex justify-between items-center mt-6'>
                <div>
                  <h2 className='text-4xl font-bold'>{project.title}</h2>
                  <p className='text-xl mt-4 text-gray-400'>{project.producer.slice(0, 6)}...{project.producer.slice(-4)}</p>
                </div>
                <div className='flex justify-center items-center text-center text-lg text-gray-600 rounded-full bg-gray-200 w-fit py-1 px-3'>
                  {project.status}
                </div>
              </div>

            </div>
           
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-y-6 gap-x-12 items-center mt-10'>
            <div className='flex gap-x-4'>
              <div className='flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full'>
                <FilmIcon className='w-6 h-6 text-gray-600' />
              </div>
              <div className='flex flex-col gap-y-1'>
                <p className='text-sm text-gray-600'>Funding Goal</p>
                <p className='text-xl font-bold'>{project.fundingGoal} $</p>
              </div>
            </div>

            {/* current funding */}
            <div className='flex gap-x-4'>
              <div className='flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full'>
                <BadgeDollarSignIcon className='w-6 h-6 text-gray-600' />
              </div>
              <div className='flex flex-col gap-y-1'>
                <p className='text-sm text-gray-600'>Current Funding</p>
                <p className='text-xl font-bold'>{project.currentFunding} $</p>
              </div>
            </div>

            {/* project share */}
            <div className='flex gap-x-4'>
              <div className='flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full'>
                <UserRoundIcon className='w-6 h-6 text-gray-600' />
              </div>
              <div className='flex flex-col gap-y-1'>
                <div className='flex justify-between items-center'>
                  <p className='text-sm text-gray-600'>Your Shares</p>
                  <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                    <DialogTrigger asChild>
                      <Send className='w-6 h-6 text-orange-600 hover:text-blue-800 cursor-pointer' />
                    </DialogTrigger>
                    <DialogContent className={`${theme === 'dark' ? 'bg-[#23262f]' : 'bg-gray-100'}`}>
                      <DialogHeader>
                        <DialogTitle>Transfer Shares</DialogTitle>
                        <DialogDescription>
                          Enter the recipient address and amount of shares to transfer
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4">
                        <div className='flex flex-col gap-y-2'>
                          <Label htmlFor="address">Recipient Address</Label>
                          <Input
                            id="address"
                            type="text"
                            placeholder="Enter recipient address"
                            onChange={(e) => setTransfer({ ...transfer, address: e.target.value })}
                          />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                          <Label htmlFor="shares">Number of Shares</Label>
                          <Input
                            id="shares"
                            type="number"
                            max={projectShare}
                            placeholder="Enter number of shares"
                            onChange={(e) => setTransfer({ ...transfer, amount: e.target.value })}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={handleTransfer}>Confirm Transfer</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className='text-xl font-bold'>{projectShare} / {project.totalShares}</p>
              </div>
            </div>

            <div className='flex gap-x-4'>
              <div className='flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full'>
                <UserRoundIcon className='w-6 h-6 text-gray-600' />
              </div>
              <div className='flex flex-col gap-y-1'>
                <p className='text-sm text-gray-600'>Pourcentage of shares</p>
                <p className='text-xl font-bold'>{((projectShare / project.totalShares) * 100).toFixed(2)}%</p>
              </div>
            </div>
            

            <div className='flex gap-x-4'>
              <div className='flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full'>
                <LucideDollarSign className='w-6 h-6 text-gray-600' />
              </div>
              <div className='flex flex-col gap-y-1'>
                <p className='text-sm text-gray-600'>Expected APY</p>
                <p className='text-xl font-bold'>5 %</p>
              </div>
            </div>
          </div>

          <div className='flex justify-between items-center gap-x-4 mt-16'>
          <h2 className='text-2xl font-bold '>About the Project</h2>
          <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
            <DialogTrigger asChild>
              <Button className='bg-orange-500 rounded-full text-white text-2xl text-center p-6 w-1/3 hover:bg-orange-600'>
                Invest
              </Button>
            </DialogTrigger>
            <DialogContent className={`${theme === 'dark' ? 'bg-[#23262f]' : 'bg-gray-100'}`}>
              <DialogHeader>
                <DialogTitle>Invest in this project</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to invest
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className='flex flex-col gap-y-2'>
                  <Label htmlFor="amount">Amount (in $)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="Enter investment amount"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleInvest}>Confirm Investment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
          <div className={`flex flex-col justify-start gap-6 mt-6 rounded-lg p-6 ${theme === 'dark' ? 'bg-[#23262f]' : 'bg-gray-100'}`}>
            <p className='text-gray-400'>&quot;{project.description}&quot;</p>
            <div className='flex flex-wrap w-full justify-around gap-3'>
              <div className={`flex flex-col gap-y-1 rounded-lg p-4 w-[200px] ${theme === 'dark' ? 'bg-[#2d2f38]' : 'bg-[#fbfbfb]'}`}>
                <p className='text-sm text-gray-600'>Funding Goal</p>
                <p className='text-xl font-bold'>{project.fundingGoal} $</p>
              </div>
              <div className={`flex flex-col gap-y-1 rounded-lg p-4 w-[200px] ${theme === 'dark' ? 'bg-[#2d2f38]' : 'bg-[#f7f8f9]'}`}>
                <p className='text-sm text-gray-600'>Duration</p>
                <p className='text-xl font-bold'>{project.duration} days</p>
              </div>
              <div className={`flex flex-col gap-y-1 rounded-lg p-4 w-[200px] ${theme === 'dark' ? 'bg-[#2d2f38]' : 'bg-[#f7f8f9]'}`}>
                <p className='text-sm text-gray-600'>Copyright</p>
                <p className='text-xl font-bold'>{project.copyrightURI}</p>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
