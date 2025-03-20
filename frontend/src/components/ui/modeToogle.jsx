"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"


export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex justify-center items-center gap-x-2">
      <Sun size={20}/>
      <Switch
        className="data-[state=checked]:bg-blue-500"
        checked={theme === "dark"}
        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
      <Moon size={20}/>
    </div>
  )
}
