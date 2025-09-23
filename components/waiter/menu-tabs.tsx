"use client"

import { Button } from "@/components/ui/button"
import { Wine, Utensils } from "lucide-react"

interface MenuTabsProps {
  activeTab: "bar" | "food"
  onTabChange: (tab: "bar" | "food") => void
}

export function MenuTabs({ activeTab, onTabChange }: MenuTabsProps) {
  return (
    <div className="flex gap-2 w-full sm:w-auto">
      <Button
        variant={activeTab === "bar" ? "default" : "ghost"}
        onClick={() => onTabChange("bar")}
        className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
        size="sm"
      >
        <Wine className="w-4 h-4" />
        <span className="hidden xs:inline">Bar Menu</span>
        <span className="xs:hidden">Bar</span>
      </Button>
      <Button
        variant={activeTab === "food" ? "default" : "ghost"}
        onClick={() => onTabChange("food")}
        className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm"
        size="sm"
      >
        <Utensils className="w-4 h-4" />
        <span className="hidden xs:inline">Food Menu</span>
        <span className="xs:hidden">Food</span>
      </Button>
    </div>
  )
}