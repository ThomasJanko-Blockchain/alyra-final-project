"use client";
import Link from "next/link";
import { useWatchContractEvent } from "wagmi";
import { SerieProjectNFTAddress, SerieProjectNFTAbi } from "../utils/constants";
import { useState, useEffect } from "react";
import { publicClient } from "@/utils/client";
import { parseAbiItem } from "viem";

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);

  const getProjectsEvents = async () => {
    const projectCreatedEvents = await publicClient.getLogs({
      address: SerieProjectNFTAddress,
      event: parseAbiItem(
        "event ProjectCreated(uint256 indexed projectId, string title, address indexed producer, string tokenURI)"
        // "event ProjectCreated(uint256 indexed projectId, string title, address producer, string tokenURI)"
      ),
      fromBlock: 0n,
      toBlock: "latest",
    });
    console.log("projectCreatedEvents", projectCreatedEvents);
    setProjects(
      projectCreatedEvents.map((event) => ({
        projectId: event.args.projectId,
        title: event.args.title,
        producer: event.args.producer,
        tokenURI: event.args.tokenURI,
      }))
    );
  };

  useEffect(() => {
    getProjectsEvents();
  }, []);

  useWatchContractEvent({
    address: SerieProjectNFTAddress,
    abi: SerieProjectNFTAbi,
    eventName: "ProjectCreated",
    onLogs: (logs) => {
      console.log(logs);
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
          className="bg-white dark:bg-gray-800 rounded-md shadow-md p-2 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          <img
            src={project.tokenURI}
            className="w-full h-48 rounded-md object-cover"
            style={{
              backgroundImage: `url("https://placehold.co/600x400")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <h3 className="text-lg font-bold mt-2">{project.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Producer: {project.producer.slice(0, 6)}...
            {project.producer.slice(-6)}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            {project.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
