"use client";
import Link from "next/link";
import { useWatchContractEvent } from "wagmi";
import { SerieProjectNFTAddress, SerieProjectNFTAbi } from "../utils/constants";
import { useState, useEffect } from "react";
import { publicClient } from "@/utils/client";
import { parseAbiItem } from "viem";
import axios from 'axios';

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);

  const getProjectsEvents = async () => {
    const projectCreatedEvents = await publicClient.getLogs({
      address: SerieProjectNFTAddress,
      event: parseAbiItem(
        "event ProjectCreated(uint256 indexed projectId, string title, address indexed producer, string tokenURI)"
      ),
      fromBlock: 8043496n,
      toBlock: "latest",
    });

    // Fetch metadata for each project
    const projectsWithMetadata = await Promise.all(
      projectCreatedEvents.map(async (event) => {
        try {
          // Convert IPFS URI to HTTP URL
          const httpURI = event.args.tokenURI;
          const response = await axios.get(httpURI);
          const metadata = response.data;
          // Also convert image IPFS URI to HTTP URL if it exists
          if (metadata.image) {
            metadata.image = metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
          }

          return {
            projectId: event.args.projectId,
            title: metadata.name,
            description: metadata.description,
            producer: event.args.producer,
            image: metadata.image,
            status: metadata.attributes.find(attr => attr.trait_type === "Status")?.value,
            fundingGoal: metadata.attributes.find(attr => attr.trait_type === "Funding Goal")?.value,
            duration: metadata.attributes.find(attr => attr.trait_type === "Duration")?.value
          };
        } catch (error) {
          console.error(`Error fetching metadata for project ${event.args.projectId}:`, error);
          return {
            projectId: event.args.projectId,
            title: event.args.title,
            producer: event.args.producer,
            image: event.args.tokenURI,
            description: "Error loading metadata",
            status: "Unknown",
            fundingGoal: "Unknown",
            duration: "Unknown"
          };
        }
      })
    );

    setProjects(projectsWithMetadata);
  };

  useEffect(() => {
    getProjectsEvents();
  }, []);

  useWatchContractEvent({
    address: SerieProjectNFTAddress,
    abi: SerieProjectNFTAbi,
    eventName: "ProjectCreated",
    onLogs: (logs) => {
      // When a new project is created, fetch its metadata and add it to the list
      Promise.all(
        logs.map(async (log) => {
          try {
            const httpURI = log.args.tokenURI;
            const response = await axios.get(httpURI);
            if (response.data.image) {
              response.data.image = response.data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            const metadata = response.data;

            return {
              projectId: log.args.projectId,
              title: metadata.name,
              description: metadata.description,
              producer: log.args.producer,
              image: metadata.image,
              status: metadata.attributes.find(attr => attr.trait_type === "Status")?.value,
              fundingGoal: metadata.attributes.find(attr => attr.trait_type === "Funding Goal")?.value,
              duration: metadata.attributes.find(attr => attr.trait_type === "Duration")?.value
            };
          } catch (error) {
            console.error(`Error fetching metadata for new project ${log.args.projectId}:`, error);
            return {
              projectId: log.args.projectId,
              title: log.args.title,
              producer: log.args.producer,
              image: log.args.tokenURI,
              description: "Error loading metadata",
              status: "Unknown",
              fundingGoal: "Unknown",
              duration: "Unknown"
            };
          }
        })
      ).then(newProjects => {
        setProjects(prevProjects => [...newProjects, ...prevProjects]);
      });
    },
    onError: (error) => {
      console.error(error);
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 col-span-1 md:col-span-2 lg:col-span-3 w-[80%] mx-auto">
      {projects.map((project) => (
        <Link
          href={`/projects/${project.projectId}`}
          key={project.projectId}
          className="bg-white dark:bg-gray-800 rounded-md shadow-md p-4 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <div className="relative pb-[56.25%] overflow-hidden rounded-md">
            <img
              src={project.image}
              alt={project.title}
              className="absolute top-0 left-0 w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://placehold.co/600x400";
              }}
            />
          </div>
          <h3 className="text-lg font-bold mt-4">{project.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Producer: {project.producer.slice(0, 6)}...{project.producer.slice(-6)}
          </p>
          <p className="text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
            {project.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
              {project.status}
            </span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
              Goal: {project.fundingGoal} SRC
            </span>
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">
              {project.duration} days
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
