import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "../ui/modeToogle";
import Menu from "./Menu";

export default function NavBar() {
  return (
    <nav className="flex justify-evenly items-center p-4 sticky top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm">
        <Link className="flex justify-center items-center gap-x-4" href="/">
            <Image src="/favicon.ico" alt="logo" width={60} height={60} />
            <p className="text-2xl font-bold">SerieCoin</p>
        </Link>
        <div className="flex justify-evenly items-center gap-x-8 text-lg font-semibold">
            <Link href="/">Home</Link>
            <Link href="/">About</Link>
            <Link href="/">Contact</Link>
        </div>
        <div className="flex justify-evenly items-center gap-x-6">
            <ModeToggle />
            <Menu />
        </div>
    </nav>
  )
}
