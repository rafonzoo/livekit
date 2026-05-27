'use client'

import type { FC } from 'react'
import type { TabsContentIconKey } from '@/feat/Meeting/const'
import {
  DiceSixIcon,
  NotebookIcon,
  PresentationIcon,
  ProjectorScreenChartIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react'
import { Analytics01Icon, HugeIcon, LiveStreaming03Icon } from '@/components/HugeIcon'

export const TabsIcon: FC<{ name: TabsContentIconKey }> = ({ name }) => {
  // prettier-ignore
  switch (name) {
    case 'phosphor/notebook': return <NotebookIcon />
    case 'hugeicons/anaytics-01': return <HugeIcon icon={Analytics01Icon} />
    case 'phosphor/presentation': return <PresentationIcon />
    case 'phosphor/projector-screen-chart': return <ProjectorScreenChartIcon />
    case 'phosphor/youtube-logo': return <YoutubeLogoIcon />
    case 'hugeicons/live-streaming-03': return <HugeIcon icon={LiveStreaming03Icon} />
    case 'phosphor/dice-six': return <DiceSixIcon />
    default: return null
  }
}
