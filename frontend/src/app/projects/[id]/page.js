"use client";
import {
  BadgeDollarSignIcon,
  FilmIcon,
  LucideDollarSign,
  Send,
  UserRoundIcon,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  SerieProjectNFTAddress,
  SerieProjectNFTAbi,
  ProjectStatus,
  SerieCoinAddress,
  SerieCoinAbi,
} from "@/utils/constants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from 'axios';

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
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    refreshData();
  }, [address, isConnected]);

  const { data: projectData, refetch: refetchProjectData } = useReadContract({
    address: SerieProjectNFTAddress,
    abi: SerieProjectNFTAbi,
    functionName: "projects",
    args: [id],
    enabled: isConnected,
  });

  const { data: srcBalance, refetch: refetchSrcBalance } = useReadContract({
    address: SerieCoinAddress,
    abi: SerieCoinAbi,
    functionName: "balanceOf",
    args: [address],
    enabled: isConnected,
  });

  const { data: projectShares, refetch: refetchProjectShares } =
    useReadContract({
      address: SerieProjectNFTAddress,
      abi: SerieProjectNFTAbi,
      functionName: "projectShares",
      args: [id, address],
      enabled: !!address,
    });

  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (projectShares) {
      setProjectShare(Number(projectShares));
    }
  }, [projectShares]);

  const fetchMetadata = async (tokenURI) => {
    try {
      console.log("httpURI", tokenURI);
      const response = await axios.get(tokenURI);
      if (response.data.image) {
        response.data.image = response.data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
      }
      setMetadata(response.data);
    } catch (error) {
      console.error("Error fetching metadata:", error);
      toast.error("Failed to load project metadata");
    }
  };

  const getProjectData = () => {
    if (projectData) {
      console.log("projectData", projectData);
      const newProject = {
        fundingGoal: Number(projectData[0]),
        currentFunding: Number(projectData[1]),
        duration: Number(projectData[2]),
        startTime: Number(projectData[3]),
        totalShares: Number(projectData[4]),
        producer: projectData[6],
        status: ProjectStatus[projectData[7]],
        title: projectData[8],
        description: projectData[9],
        copyrightURI: projectData[10],
        tokenURI: projectData[11],
      };
      setProject(newProject);
      fetchMetadata(newProject.tokenURI);
    }
  };

  useEffect(() => {
    getProjectData();
  }, [projectData]);

  const handleInvest = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (investAmount <= 0) {
      toast.error("Investment amount must be greater than 0");
      return;
    }

    try {
      setIsLoading(true);
      await refetchSrcBalance();
      if (srcBalance < investAmount) {
        toast.error("You don't have enough $SRC to invest");
        return;
      }
      // First approve the contract to spend tokens
      writeContract({
        address: SerieCoinAddress,
        abi: SerieCoinAbi,
        functionName: "approve",
        args: [SerieProjectNFTAddress, investAmount],
      });

      // Then invest in the project
      writeContract({
        address: SerieProjectNFTAddress,
        abi: SerieProjectNFTAbi,
        functionName: "investInProject",
        args: [id, investAmount],
      });
    } catch (err) {
      toast.error("Investment failed");
      setIsLoading(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    try {
      setIsLoading(true);
      writeContract({
        address: SerieProjectNFTAddress,
        abi: SerieProjectNFTAbi,
        functionName: "transferShares",
        args: [id, transfer.address, transfer.amount],
      });
    } catch (err) {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    console.log("refreshing data");
    if (!address) return;
    await Promise.all([
      refetchProjectData(),
      refetchProjectShares(),
      refetchSrcBalance(),
    ]);
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Funds claimed successfully", {
        description: `Transaction hash: ${hash}`,
      });
      refreshData();
      setIsLoading(false);
    }
    if (error) {
      toast.error("Transaction failed", {
        description: error.shortMessage || error.message || "An error occurred during the transaction",
      });
      setIsLoading(false);
    }
  }, [isConfirmed, error, hash]);

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      writeContract({
        address: SerieProjectNFTAddress,
        abi: SerieProjectNFTAbi,
        functionName: "claimRefund",
        args: [id],
      });
    } catch (err) {
      console.error("Claim failed:", err);
      toast.error("Failed to claim funds", {
        description: err.shortMessage || err.message || "An error occurred while claiming funds",
      });
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-y-4 justify-center items-center mt-10 text-xl">
        <p>Please connect your wallet to view project details</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4 justify-center items-center mt-10 text-xl font-bold max-w-[70vw] mx-auto">
      {project.title && (
        <div>
          {/* TOP BAR  */}
          <div>
            <img
              src={metadata?.image || project.tokenURI}
              className="w-32 h-32 rounded-md object-cover"
              onError={(e) => {
                e.target.src = "https://placehold.co/600x400";
              }}
            />
            <div className="flex justify-between items-center mt-6">
              <div>
                <h2 className="text-4xl font-bold">{metadata?.name || project.title}</h2>
                <p className="text-xl mt-4 text-gray-400">
                  {project.producer.slice(0, 6)}...{project.producer.slice(-4)}
                </p>
              </div>
              <div className="flex justify-center items-center text-center text-lg text-gray-600 rounded-full bg-gray-200 w-fit py-1 px-3">
                {project.status}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-y-6 gap-x-12 items-center mt-10">
            <div className="flex gap-x-4">
              <div className="flex justify-center items-center w-12 h-12 min-w-12 min-h-12 bg-gray-100 rounded-full">
                <FilmIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex flex-col gap-y-1">
                <p className="text-sm text-gray-600 text-nowrap">
                  Funding Goal
                </p>
                <p className="text-xl font-bold">
                  {metadata?.attributes?.find(attr => attr.trait_type === "Funding Goal")?.value || project.fundingGoal} $
                </p>
              </div>
            </div>

            {/* current funding */}
            <div className="flex gap-x-4">
              <div className="flex justify-center items-center w-12 h-12 min-w-12 min-h-12 bg-gray-100 rounded-full">
                <BadgeDollarSignIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex flex-col gap-y-1">
                <p className="text-sm text-gray-600 text-nowrap">
                  Current Funding
                </p>
                <p className="text-xl font-bold">{project.currentFunding} $</p>
              </div>
            </div>

            {/* project share */}
            <div className="flex gap-x-4">
              <div className="flex justify-center items-center w-12 h-12 min-w-12 min-h-12 bg-gray-100 rounded-full">
                <UserRoundIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex flex-col gap-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 text-nowrap">
                    Your Shares
                  </p>
                  <Dialog
                    open={transferDialogOpen}
                    onOpenChange={setTransferDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Send className="w-6 h-6 text-orange-600 hover:text-blue-800 cursor-pointer" />
                    </DialogTrigger>
                    <DialogContent
                      className={`${
                        theme === "dark" ? "bg-[#23262f]" : "bg-gray-100"
                      }`}
                    >
                      <DialogHeader>
                        <DialogTitle>Transfer Shares</DialogTitle>
                        <DialogDescription>
                          Enter the recipient address and amount of shares to
                          transfer
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4">
                        <div className="flex flex-col gap-y-2">
                          <Label htmlFor="address">Recipient Address</Label>
                          <Input
                            id="address"
                            type="text"
                            placeholder="Enter recipient address"
                            onChange={(e) =>
                              setTransfer({
                                ...transfer,
                                address: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-y-2">
                          <Label htmlFor="shares">Number of Shares</Label>
                          <Input
                            id="shares"
                            type="number"
                            max={projectShare}
                            placeholder="Enter number of shares"
                            onChange={(e) =>
                              setTransfer({
                                ...transfer,
                                amount: e.target.value,
                              })
                            }
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit" onClick={handleTransfer}>
                            Confirm Transfer
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-xl font-bold text-nowrap">
                  {projectShare} / {project.totalShares}
                </p>
              </div>
            </div>

            <div className="flex gap-x-4">
              <div className="flex justify-center items-center w-12 h-12 min-w-12 min-h-12 bg-gray-100 rounded-full">
                <UserRoundIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex flex-col gap-y-1">
                <p className="text-sm text-gray-600 text-nowrap">
                  Pourcentage of shares
                </p>
                <p className="text-xl font-bold">
                  {((projectShare / project.totalShares) * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="flex gap-x-4">
              <div className="flex justify-center items-center w-12 h-12 min-w-12 min-h-12 bg-gray-100 rounded-full">
                <LucideDollarSign className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex flex-col gap-y-1">
                <p className="text-sm text-gray-600 text-nowrap">
                  Expected APY
                </p>
                <p className="text-xl font-bold">5 %</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-x-4 mt-16">
            <h2 className="text-2xl font-bold ">About the Project</h2>
            {project.status === "Waiting for funds" && (
              <Dialog open={investDialogOpen} onOpenChange={setInvestDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-orange-500 rounded-full text-white text-2xl text-center p-6 w-1/3 hover:bg-orange-600"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      "Invest"
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className={`${
                    theme === "dark" ? "bg-[#23262f]" : "bg-gray-100"
                  }`}
                >
                  <DialogHeader>
                    <DialogTitle>Invest in this project</DialogTitle>
                    <DialogDescription>
                      Enter the amount you want to invest
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4">
                    <div className="flex flex-col gap-y-2">
                      <Label htmlFor="amount">Amount (in $SRC)</Label>
                      <div className="flex gap-x-2">
                        <Input
                          id="amount"
                          type="number"
                          value={investAmount}
                          onChange={(e) => setInvestAmount(e.target.value)}
                          placeholder="Enter investment amount"
                          max={project.fundingGoal - project.currentFunding}
                        />

                        <Button
                          type="button"
                          onClick={() =>
                            setInvestAmount(
                              project.fundingGoal - project.currentFunding
                            )
                          }
                          className="whitespace-nowrap bg-orange-500 text-white"
                        >
                          Max
                        </Button>
                      </div>
                      {project.fundingGoal - project.currentFunding <
                        investAmount && (
                        <p className="text-red-500">
                          You can&apos;t invest more than the funding goal
                        </p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleInvest}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          "Confirm Investment"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {project.status === "Completed" && projectShare > 0 && (
              <Button 
                className="bg-green-500 rounded-full text-white text-2xl text-center p-6 w-1/3 hover:bg-orange-600"
                onClick={handleClaim}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Claim Funds"
                )}
              </Button>
            )}
          </div>
          <div
            className={`flex flex-col justify-start gap-6 mt-6 rounded-lg p-6 ${
              theme === "dark" ? "bg-[#23262f]" : "bg-gray-100"
            }`}
          >
            <p className="text-gray-600 dark:text-gray-300">{(metadata?.description || project.description)?.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < (metadata?.description || project.description)?.split('\n').length - 1 && <br />}
              </span>
            ))}</p>
            <div className="flex flex-wrap w-full justify-around gap-3">
              <div
                className={`flex flex-col gap-y-1 rounded-lg p-4 w-[200px] ${
                  theme === "dark" ? "bg-[#2d2f38]" : "bg-[#fbfbfb]"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">Funding Goal</p>
                <p className="text-xl font-bold text-green-800 dark:text-green-200">
                  {metadata?.attributes?.find(attr => attr.trait_type === "Funding Goal")?.value || project.fundingGoal} SRC
                </p>
              </div>
              <div
                className={`flex flex-col gap-y-1 rounded-lg p-4 w-[200px] ${
                  theme === "dark" ? "bg-[#2d2f38]" : "bg-[#f7f8f9]"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">Duration</p>
                <p className="text-xl font-bold text-purple-800 dark:text-purple-200">
                  {metadata?.attributes?.find(attr => attr.trait_type === "Duration")?.value || project.duration} days
                </p>
              </div>
              <div
                className={`flex flex-col gap-y-1 rounded-lg p-4 w-[200px] ${
                  theme === "dark" ? "bg-[#2d2f38]" : "bg-[#f7f8f9]"
                }`}
              >
                <p className="text-sm text-gray-600 dark:text-gray-300">Status</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">
                  {project.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
