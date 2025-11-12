'use client'

import Link from 'next/link'
import {
  Bot,
  BookOpen,
  Calendar,
  FileText,
  Frame,
  GalleryVerticalEnd,
  Heart,
  Map,
  Mail,
  PieChart,
  SquareTerminal,
  type LucideIcon,
} from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

const iconMap: Record<string, LucideIcon> = {
  squareTerminal: SquareTerminal,
  calendar: Calendar,
  bookOpen: BookOpen,
  bot: Bot,
  frame: Frame,
  pieChart: PieChart,
  map: Map,
  galleryVerticalEnd: GalleryVerticalEnd,
  heart: Heart,
  fileText: FileText,
  mail: Mail,
  mailbox: Mail,
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    iconKey?: keyof typeof iconMap | string
    isActive?: boolean
    items?: { title: string; url: string }[]
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Manage Content</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.iconKey ? iconMap[item.iconKey as string] : undefined
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title} asChild>
                    <Link href={item.url}>
                      {Icon ? <Icon /> : null}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </Link>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {item.items?.length ? (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
