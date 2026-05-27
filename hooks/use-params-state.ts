import type { Params } from 'next/dist/server/request/params'
import { useRouter, useParams, usePathname, useSearchParams } from 'next/navigation'
import { num, omit, qstring } from '@/lib/utils'
import { SearchParamsKey, PanelCode, ScreenCode, TabsCode } from '@/feat/Meeting/enum'

export function useParamsState<P extends Params = Params>() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams<P>()
  const searchParams = useSearchParams()
  const currentParams = Object.fromEntries(searchParams)

  // ─── Raw codes ────────────────────────────────────────────────
  const panelCode = num(searchParams.get(SearchParamsKey.PanelCode))
  const screenCode = num(searchParams.get(SearchParamsKey.ScreenCode))
  const tabsCode = num(searchParams.get(SearchParamsKey.TabsCode))

  // ─── PanelState ───────────────────────────────────────────────
  const isPanelOpen = panelCode === PanelCode.Open
  const isPanelSideOpen = panelCode === PanelCode.SideOpen
  const isPanelActive = panelCode > 0

  const closePanel = () => router.replace(qstring(pathname, omit({ ...currentParams }, [SearchParamsKey.PanelCode]))) // prettier-ignore
  const openPanel = (target: PanelCode) => router.replace(qstring(pathname, { ...currentParams, [SearchParamsKey.PanelCode]: target })) // prettier-ignore
  const togglePanel = (target: PanelCode) => (isScreenActive ? closePanel() : openPanel(target))
  const openPanelOpen = () => openPanel(PanelCode.Open)
  const openPanelSideOpen = () => openPanel(PanelCode.SideOpen)

  // ─── ScreenCode ───────────────────────────────────────────────
  const isWhiteboard = screenCode === ScreenCode.Whiteboard
  const isPresentation = screenCode === ScreenCode.Presentation
  const isWatchYoutube = screenCode === ScreenCode.WatchYoutube
  const isScreenActive = screenCode > 0

  const closeScreen = () => router.replace(qstring(pathname, omit({ ...currentParams }, [SearchParamsKey.ScreenCode]))) // prettier-ignore
  const openScreen = (target: ScreenCode) => router.replace(qstring(pathname, { ...currentParams, [SearchParamsKey.ScreenCode]: target })) // prettier-ignore
  const toggleScreen = (target: ScreenCode) => (isScreenActive ? closeScreen() : openScreen(target))

  const openWhiteboard = () => openScreen(ScreenCode.Whiteboard)
  const openPresentation = () => openScreen(ScreenCode.Presentation) // prettier-ignore
  const openWatchYoutube = () => openScreen(ScreenCode.WatchYoutube) // prettier-ignore

  // ─── TabsCode ─────────────────────────────────────────────────
  const isTabsMeeting = tabsCode === TabsCode.TabsMeeting
  const isTabsMeetingSharedNotes = tabsCode === TabsCode.TabsMeetingSharedNotes
  const isTabsMeetingPolling = tabsCode === TabsCode.TabsMeetingPolling
  const isTabsMeetingWatchYoutube = tabsCode === TabsCode.TabsMeetingWatchYoutube
  const isTabsParticipant = tabsCode === TabsCode.TabsParticipant
  const isTabsChats = tabsCode === TabsCode.TabsChats
  const isTabsPersonalize = tabsCode === TabsCode.TabsPersonalize
  const isTabsSettings = tabsCode === TabsCode.TabsSettings
  const isTabsActive = tabsCode > 0

  const openTab = (target: TabsCode) => router.replace(qstring(pathname, { ...currentParams, [SearchParamsKey.TabsCode]: target })) // prettier-ignore
  const closeTab = () => router.replace(qstring(pathname, omit({ ...currentParams }, [SearchParamsKey.TabsCode]))) // prettier-ignore
  const toggleTab = (target: TabsCode) => (isScreenActive ? closeTab() : openTab(target))
  const openTabsMeeting = () => openTab(TabsCode.TabsMeeting)
  const openTabsSharedNotes = () => openTab(TabsCode.TabsMeetingSharedNotes)
  const openTabsPolling = () => openTab(TabsCode.TabsMeetingPolling)
  const openTabsWatchYoutube = () => openTab(TabsCode.TabsMeetingWatchYoutube)
  const openTabsParticipant = () => openTab(TabsCode.TabsParticipant)
  const openTabsChats = () => openTab(TabsCode.TabsChats)
  const openTabsPersonalize = () => openTab(TabsCode.TabsPersonalize)
  const openTabsSettings = () => openTab(TabsCode.TabsSettings)

  return {
    // router primitives
    router,
    pathname,
    params,
    searchParams,
    currentParams,

    // raw codes
    panelCode,
    screenCode,
    tabsCode,

    // PanelState checks
    isPanelOpen,
    isPanelSideOpen,
    isPanelActive,

    // PanelState toggles
    togglePanel,
    closePanel,
    openPanel,
    openPanelOpen,
    openPanelSideOpen,

    // ScreenCode checks
    isWhiteboard,
    isPresentation,
    isWatchYoutube,
    isScreenActive,

    // ScreenCode toggles
    toggleScreen,
    closeScreen,
    openWhiteboard,
    openPresentation,
    openWatchYoutube,

    // TabsCode checks
    isTabsMeeting,
    isTabsMeetingSharedNotes,
    isTabsMeetingPolling,
    isTabsMeetingWatchYoutube,
    isTabsParticipant,
    isTabsChats,
    isTabsPersonalize,
    isTabsSettings,
    isTabsActive,

    // TabsCode toggles
    toggleTab,
    closeTab,
    openTab,
    openTabsMeeting,
    openTabsSharedNotes,
    openTabsPolling,
    openTabsWatchYoutube,
    openTabsParticipant,
    openTabsChats,
    openTabsPersonalize,
    openTabsSettings,
  }
}
