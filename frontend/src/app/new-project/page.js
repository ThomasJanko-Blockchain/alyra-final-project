"use client";
// import { publicClient } from '@/utils/client';
// import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react'
import { useAccount } from 'wagmi';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function page() {

    const { address } = useAccount();
    const [project, setProject] = useState({
        title: "",
        description: "",
        fundingGoal: 0,
        duration: 0,
    });

    if (!address) {
        return <div className='flex flex-col gap-y-4 justify-center items-center mt-10 text-xl font-bold'>Please connect your wallet to create a new project</div>
    }

    // const { mutate: createProject } = useMutation({
    //     mutationFn: async (data) => {
    //         const { title, description, fundingGoal, duration } = data;
    //         const { data: project } = await publicClient.writeContract({
    //             address: projectRegistryAddress,
    //             abi: projectRegistryAbi,
    //             functionName: 'submitProject',
    //             args: [title, description, fundingGoal, duration],
    //         });
    //         return project;
    //     },
    // });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(project);
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
                <Input type='text' id='title' name='title' placeholder="Enter project title" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} />
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
                <Label htmlFor='fundingGoal'>Funding Goal</Label>
                <Input 
                    type='number' 
                    id='fundingGoal' 
                    name='fundingGoal' 
                    placeholder="Enter amount in USDC"
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
            <Button type='submit' className="w-full bg-blue-500 text-white" onClick={handleSubmit}>Create Project</Button>
        </form>
    </div>
  )
}
