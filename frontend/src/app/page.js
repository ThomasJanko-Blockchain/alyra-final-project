import ProjectsList from "@/components/ProjectsList";
import Welcome from "@/components/Welcome";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-y-8">
      <Welcome />
      <ProjectsList />
    </div>
  );
}
