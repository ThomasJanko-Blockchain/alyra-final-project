import Link from "next/link"

export default function ProjectsList() {

    const projects = [
        {title: "Project 1", description: "Description 1", image: "https://placehold.co/600x400"},
        {title: "Project 2", description: "Description 2", image: "https://placehold.co/600x400"},
        {title: "Project 3", description: "Description 3", image: "https://placehold.co/600x400"},
        {title: "Project 4", description: "Description 4", image: "https://placehold.co/600x400"},
        {title: "Project 5", description: "Description 5", image: "https://placehold.co/600x400"},
        {title: "Project 6", description: "Description 6", image: "https://placehold.co/600x400"},
    ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 col-span-1 md:col-span-2 lg:col-span-3 w-[80%] mx-auto">
        {projects.map((project) => (
            <Link href={`/projects/${project.title}`} key={crypto.randomUUID()} className="bg-white dark:bg-gray-800 rounded-md shadow-md p-2 hover:scale-105 transition-all duration-300 cursor-pointer">
                <img src={project.image} alt={project.title} className="w-full h-48 object-cover rounded-md mb-4" />
                <h3 className="text-lg font-bold">{project.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
            </Link>
        ))}
    </div>
  )
}
