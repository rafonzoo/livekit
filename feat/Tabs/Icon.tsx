'use client'

import type { FC } from 'react'
import type { TabsContentIconKey, TabsRoomToolsIconKey } from '@/feat/const'
import {
  ChatIcon,
  DiceSixIcon,
  NotebookIcon,
  PresentationIcon,
  ProjectorScreenChartIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react'
import {
  AiMagicFreeIcons,
  Analytics01Icon,
  HugeIcon,
  LiveStreaming03Icon,
  Settings02FreeIcons,
  ToolsFreeIcons,
  UserMultiple02FreeIcons,
} from '@/components/HugeIcon'

export const TabsRoomIcon: FC<{ name: TabsRoomToolsIconKey }> = ({ name }) => {
  // prettier-ignore
  switch (name) {
    case 'tools':     return <HugeIcon size={22} icon={ToolsFreeIcons} />
    case 'multiple':  return <HugeIcon size={22} icon={UserMultiple02FreeIcons} />
    case 'chat':      return <ChatIcon size={22} />
    case 'magic':     return <HugeIcon size={22} icon={AiMagicFreeIcons} />
    case 'settings':  return <HugeIcon size={22} icon={Settings02FreeIcons} />
    default:          return null
  }
}

export const TabsMeetingIcon: FC<{ name: TabsContentIconKey }> = ({ name }) => {
  // prettier-ignore
  switch (name) {
    case 'phosphor/notebook':               return <NotebookIcon />
    case 'hugeicons/anaytics-01':           return <HugeIcon icon={Analytics01Icon} />
    case 'phosphor/presentation':           return <PresentationIcon />
    case 'phosphor/projector-screen-chart': return <ProjectorScreenChartIcon />
    case 'phosphor/youtube-logo':           return <YoutubeLogoIcon />
    case 'hugeicons/live-streaming-03':     return <HugeIcon icon={LiveStreaming03Icon} />
    case 'phosphor/dice-six':               return <DiceSixIcon />
    default:                                return null
  }
}
