"use client"

import { Button } from "@/components/ui/button"
import { Wine, Utensils } from "lucide-react"

interface MenuTabsProps {
  activeTab: "bar" | "food"
  onTabChange: (tab: "bar" | "food") => void
}

export function MenuTabs({ activeTab, onTabChange }: MenuTabsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={activeTab === "bar" ? "default" : "ghost"}
        onClick={() => onTabChange("bar")}
        className="gap-2"
      >
        <Wine className="w-4 h-4" />
        Bar Menu
      </Button>
      <Button
        variant={activeTab === "food" ? "default" : "ghost"}
        onClick={() => onTabChange("food")}
        className="gap-2"
      >
        <Utensils className="w-4 h-4" />
        Food Menu
      </Button>
    </div>
  )
}