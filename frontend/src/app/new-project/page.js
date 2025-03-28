"use client";
// import { publicClient } from '@/utils/client';
import React, { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { SerieProjectNFTAbi, SerieProjectNFTAddress } from '@/utils/constants';

export default function NewProjectPage() {
    const { address } = useAccount();
    const [project, setProject] = useState({
        title: "",
        description: "",
        fundingGoal: 0,
        duration: 0,
        tokenURI: "",
        copyrightURI: ""
    });

    const { data: hash, error, isPending, writeContract } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })


    useEffect(() => {
        // if (isPending) {
        //     toast.loading("Creating project...")
        // }
        if (isConfirmed) {
            toast.success(`Project created successfully. 
              Hash: ${hash}`)
            setProject({
                title: "",
                description: "",
                fundingGoal: 0,
                duration: 0,
                tokenURI: "",
                copyrightURI: ""
            })
        }
        if (error) {
          toast.error(error.shortMessage || error.message)
        }
        
    }, [isConfirmed, error])

    if (!address) {
        return <div className='flex flex-col gap-y-4 justify-center items-center mt-10 text-xl font-bold'>Please connect your wallet to create a new project</div>
    }


    const handleSubmit = (e) => {
        e.preventDefault();
        if (!project.title || !project.description || !project.fundingGoal || !project.duration || !project.tokenURI || !project.copyrightURI) {
            toast.error("Please fill all the fields");
            return;
        }
        
         try {
            writeContract({
                address: SerieProjectNFTAddress,
                abi: SerieProjectNFTAbi,
                functionName: 'createProject',
                args: [project.title, project.description, project.fundingGoal, project.duration, project.tokenURI, project.copyrightURI],
            });
         } catch (error) {
            toast.error(error.message);
         }
    }

    
    

  return (
    <div className='flex flex-col gap-y-4 justify-center items-center mt-10'>
        <h1 className='text-2xl font-bold'>Create a new project</h1>
        <p className='text-sm text-muted-foreground'>
            Create a new project to start funding your project.
        </p>
        <form className='flex flex-col gap-y-6 w-full max-w-md mt-6'>
            <div className='flex flex-col gap-y-2'>
                <Label htmlFor='title'>Title</Label>
                <Input 
                    type='text' 
                    id='title' 
                    name='title' 
                    placeholder="Enter project title" 
                    value={project.title} 
                    onChange={(e) => setProject({ ...project, title: e.target.value })} 
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea 
                    id='description' 
                    name='description' 
                    placeholder="Describe your project"
                    className="min-h-[100px]"
                    value={project.description}
                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <Label htmlFor='fundingGoal'>Funding Goal (in SRC)</Label>
                <Input 
                    type='number' 
                    id='fundingGoal' 
                    name='fundingGoal' 
                    placeholder="Enter amount in SRC"
                    value={project.fundingGoal}
                    onChange={(e) => setProject({ ...project, fundingGoal: e.target.value })}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <Label htmlFor='duration'>Duration</Label>
                <Input 
                    type='number' 
                    id='duration' 
                    name='duration' 
                    placeholder="Enter duration in days"
                    value={project.duration}
                    onChange={(e) => setProject({ ...project, duration: e.target.value })}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <Label htmlFor='tokenURI'>Token URI</Label>
                <Input 
                    type='text' 
                    id='tokenURI' 
                    name='tokenURI' 
                    placeholder="Enter IPFS URI for project metadata"
                    value={project.tokenURI}
                    onChange={(e) => setProject({ ...project, tokenURI: e.target.value })}
                />
            </div>
            <div className='flex flex-col gap-y-2'>
                <Label htmlFor='copyrightURI'>Copyright URI</Label>
                <Input 
                    type='text' 
                    id='copyrightURI' 
                    name='copyrightURI' 
                    placeholder="Enter IPFS URI for copyright metadata"
                    value={project.copyrightURI}
                    onChange={(e) => setProject({ ...project, copyrightURI: e.target.value })}
                />
            </div>
            <Button 
                type='submit' 
                className="w-full bg-blue-500 text-white" 
                onClick={handleSubmit}
                disabled={isPending}
            >
                {isPending ? "Creating Project..." : "Create Project"}
            </Button>
        </form>
    </div>
  )
}
