"use client";
import React, { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { SerieProjectNFTAbi, SerieProjectNFTAddress } from '@/utils/constants';
import { PlusCircle, Type, FileText, Coins, Calendar, Copyright, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import axios from 'axios';

export default function NewProjectPage() {
    const { address } = useAccount();
    const [project, setProject] = useState({
        title: "",
        description: "",
        fundingGoal: 0,
        duration: 0,
        copyrightURI: "",
        tokenURI: "",
        image: null
    });
    const [isUploading, setIsUploading] = useState(false);

    const { data: hash, error, isPending, writeContract } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

    useEffect(() => {
        
        if (isConfirmed) {
            toast.success(`Project created successfully. 
              Hash: ${hash}`)
            setProject({
                title: "",
                description: "",
                fundingGoal: 0,
                duration: 0,
                copyrightURI: "",
                tokenURI: "",
                image: null
            })
        }
        if (error) {
          toast.error(error.shortMessage || error.message)
        }
    }, [isConfirming, isConfirmed, error])

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProject({ ...project, image: file });
        }
    };

    const uploadToIPFS = async () => {
        if (!project.image) {
            toast.error("Please upload an image first");
            return;
        }

        setIsUploading(true);
        try {
            // First upload the image
            const formData = new FormData();
            formData.append('file', project.image);

            const imageResponse = await axios.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            const imageHash = imageResponse.data.IpfsHash;
            const imageURI = `ipfs://${imageHash}`;

            // Create metadata object
            const metadata = {
                name: project.title,
                description: project.description,
                image: imageURI,
                attributes: [
                    {
                        trait_type: "Status",
                        value: "WaitingForFunds"
                    },
                    {
                        trait_type: "Funding Goal",
                        value: project.fundingGoal.toString()
                    },
                    {
                        trait_type: "Duration",
                        value: project.duration.toString()
                    }
                ]
            };

            // Upload metadata
            const metadataResponse = await axios.post(
                'https://api.pinata.cloud/pinning/pinJSONToIPFS',
                metadata,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.PINATA_JWT}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            
            return `https://ipfs.io/ipfs/${metadataResponse.data.IpfsHash}`;
        } catch (error) {
            toast.error("Failed to upload to IPFS: " + error.message);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!project.title || !project.description || !project.fundingGoal || !project.duration || !project.image) {
            toast.error("Please fill all the fields and upload an image");
            return;
        }
        
        try {
            // Upload to IPFS first
            const tokenURI = await uploadToIPFS();
            if (!tokenURI) return;

            // Create project with the IPFS URI
            writeContract({
                address: SerieProjectNFTAddress,
                abi: SerieProjectNFTAbi,
                functionName: 'createProject',
                args: [
                    project.title, 
                    project.description, 
                    project.fundingGoal, 
                    project.duration, 
                    project.copyrightURI, 
                    tokenURI
                ],
            });
        } catch (error) {
            toast.error(error.message);
        }
    }

    if (!address) {
        return (
            <Card className="w-full max-w-md mx-auto mt-10">
                <CardContent className="flex flex-col items-center justify-center p-6">
                    <PlusCircle className="w-12 h-12 text-gray-400 mb-4" />
                    <p className='text-xl font-bold text-center'>Please connect your wallet to create a new project</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className='container mx-auto px-4 py-8'>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlusCircle className="w-6 h-6" />
                        Create a new project
                    </CardTitle>
                    <CardDescription>
                        Create a new project to start funding your project.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className='flex flex-col gap-y-6'>
                        <div className='flex flex-col gap-y-2'>
                            <Label htmlFor='title' className="flex items-center gap-2">
                                <Type className="w-4 h-4" />
                                Title
                            </Label>
                            <Input 
                                type='text' 
                                id='title' 
                                name='title' 
                                placeholder="Enter project title" 
                                value={project.title} 
                                onChange={(e) => setProject({ ...project, title: e.target.value })}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500" 
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <Label htmlFor='description' className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Description
                            </Label>
                            <Textarea 
                                id='description' 
                                name='description' 
                                placeholder="Describe your project"
                                className="min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                value={project.description}
                                onChange={(e) => setProject({ ...project, description: e.target.value })}
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <Label htmlFor='fundingGoal' className="flex items-center gap-2">
                                <Coins className="w-4 h-4" />
                                Funding Goal (in SRC)
                            </Label>
                            <Input 
                                type='number' 
                                id='fundingGoal' 
                                name='fundingGoal' 
                                placeholder="Enter amount in SRC"
                                value={project.fundingGoal}
                                onChange={(e) => setProject({ ...project, fundingGoal: e.target.value })}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <Label htmlFor='duration' className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Duration
                            </Label>
                            <Input 
                                type='number' 
                                id='duration' 
                                name='duration' 
                                placeholder="Enter duration in days"
                                value={project.duration}
                                onChange={(e) => setProject({ ...project, duration: e.target.value })}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className='flex flex-col gap-y-2'>
                            <Label htmlFor='copyrightURI' className="flex items-center gap-2">
                                <Copyright className="w-4 h-4" />
                                Copyright URI
                            </Label>
                            <Input 
                                type='text' 
                                id='copyrightURI' 
                                name='copyrightURI' 
                                placeholder="Enter IPFS URI for copyright metadata"
                                value={project.copyrightURI}
                                onChange={(e) => setProject({ ...project, copyrightURI: e.target.value })}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className='flex flex-col justify-center items-center gap-y-2'>
                            <Label htmlFor='image' className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Project Image
                            </Label>
                            <Input 
                                type='file' 
                                id='image' 
                                name='image' 
                                accept="image/*"
                                onChange={handleImageChange}
                                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                            />
                            {project.image && (
                                <div className="mt-2">
                                    <img 
                                        src={URL.createObjectURL(project.image)} 
                                        alt="Preview" 
                                        className="max-h-32 rounded-md"
                                    />
                                </div>
                            )}
                        </div>
                        <Button 
                            type='submit' 
                            className={`w-full ${isPending || isUploading || isConfirming ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200 flex items-center justify-center gap-2`}
                            onClick={handleSubmit}
                            disabled={isPending || isUploading || isConfirming}
                        >
                            {isConfirming ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <PlusCircle className="w-5 h-5" />
                            )}
                            {isUploading ? "Uploading to IPFS..." : isConfirming ? "Confirming Transaction..." : isPending ? "Creating Project..." : "Create Project"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
