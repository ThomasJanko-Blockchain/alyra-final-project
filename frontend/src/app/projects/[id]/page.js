'use client'
import { FilmIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useParams } from 'next/navigation';
import React, { useState } from 'react'

export default function ProjectPage() {
  const { id } = useParams();
  const { theme } = useTheme();
  const [project, setProject] = useState({
    title: "First Project",
    description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.",
    owner: "0x1234567890123456789012345678901234567890",
    fundingGoal: 100000,
    duration: 10,
    totalNFTs: 10000,
    totalShares: 20,
    expectedAPY: 5
  });

  return (
    <div className='flex flex-col gap-y-4 justify-center items-center mt-10 text-xl font-bold'>
        <h1>Project Page</h1>
        <div>
          <h2 className='text-4xl font-bold'>{project.title}</h2>
          <p className='text-xl mt-2 text-gray-600'>{project.owner.slice(0, 6)}...{project.owner.slice(-4)}</p>
          <div className='flex justify-center w-full gap-x-6 items-center mt-6'>
            <div className='flex gap-x-4'>
              <div className='flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full'>
                <FilmIcon className='w-6 h-6 text-gray-600' />
              </div>
              <div className='flex flex-col gap-y-1'>
                <p className='text-sm text-gray-600'>Total NFTs</p>
                <p className='text-xl font-bold'>{project.totalNFTs}</p>
              </div>
            </div>
            {/* total shares */}
            <div className='flex gap-x-4'>
              <div className='flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full'>
                <FilmIcon className='w-6 h-6 text-gray-600' />
              </div>
              <div className='flex flex-col gap-y-1'>
                <p className='text-sm text-gray-600'>Total Shares</p>
                <p className='text-xl font-bold'>{project.totalShares}%</p>
              </div>
            </div>

            <div className='flex gap-x-4'>
              <div className='flex justify-center items-center w-12 h-12 bg-gray-100 rounded-full'>
                <FilmIcon className='w-6 h-6 text-gray-600' />
              </div>
              <div className='flex flex-col gap-y-1'>
                <p className='text-sm text-gray-600'>Expected APY</p>
                <p className='text-xl font-bold'>{project.expectedAPY}%</p>
              </div>


            </div>
          </div>
          <h2 className='text-2xl font-bold mt-6'>About the Project</h2>
          <div className={`flex flex-col justify-start gap-6 max-w-[80vw] lg:max-w-[60vw] mt-6 rounded-lg p-4 ${theme === 'dark' ? 'bg-[#23262f]' : 'bg-gray-100'}`}>
            <p className='text-gray-400'>"{project.description}"</p>
            <div className='flex w-full justify-around gap-y-1'>
              <div className={`flex flex-col gap-y-1 rounded-lg p-4 ${theme === 'dark' ? 'bg-[#2d2f38]' : 'bg-[#fbfbfb]'}`}>
                <p className='text-sm text-gray-600'>Funding Goal</p>
                <p className='text-xl font-bold'>{project.fundingGoal}</p>
              </div>
              <div className={`flex flex-col gap-y-1 rounded-lg p-4 ${theme === 'dark' ? 'bg-[#2d2f38]' : 'bg-[#f7f8f9]'}`}>
                <p className='text-sm text-gray-600'>Duration</p>
                <p className='text-xl font-bold'>{project.duration} days</p>
              </div>
              
            </div>
          </div>
        </div>
    </div>
  )
}
