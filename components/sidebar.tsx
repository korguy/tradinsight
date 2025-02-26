"use client"

import { BarChart3, ChevronRight, PieChart } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
  } from "@/components/ui/sidebar"

  interface StrategySidebarProps {
    strategies: {
        name: string
        description: string
        short_description: string
        created: any,
        config: any
    }[],
    selectedStrategy: string
    onStrategyChange: (strategy: string) => void
  }

  export function StrategySidebar({ strategies, selectedStrategy, onStrategyChange }: StrategySidebarProps) {
    return (
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BarChart3 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Portfolio Strategies</span>
                  <span className="text-xs text-muted-foreground">Select a strategy to view</span>
                </div>
                <ChevronRight className="ml-auto size-4" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Available Strategies</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {strategies.map((strategy) => (
                  <SidebarMenuItem key={strategy.name}>
                    <SidebarMenuButton
                      isActive={selectedStrategy === strategy.name}
                      onClick={() => onStrategyChange(strategy.name)}
                      
                    >
                      <PieChart className="size-4" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs">{strategy.name}</span>
                        <span className="text-xs text-muted-foreground">{strategy.short_description}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    )
  }
  