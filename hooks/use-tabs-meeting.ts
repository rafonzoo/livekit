import type { TabsContentList } from '@/feat/const'
import { useParamsState } from '@/hooks'
import { useRoomState } from '@/feat/Room'
import { GroupCode, ScreenCode } from '@/feat/enum'
import { TabsContents } from '@/feat/const'

export function useTabsMeeting() {
  const { screen, record, startRecording, stopRecording, startActiveScreen, stopActiveScreen } =
    useRoomState()
  const { openTabsSharedNotes, openTabsPolling } = useParamsState()

  function handleToggleActiveScreen(id: Exclude<ScreenCode, ScreenCode.Recording>) {
    return () => {
      if (screen?.id === id) {
        return stopActiveScreen()
      }

      return startActiveScreen(id)
    }
  }

  function remapContent(list: TabsContentList) {
    let prop: { code: 0 | ScreenCode; handle: () => void; isRecording?: boolean } = {
      code: 0,
      handle: () => console.warn('one of "TabsContentList" is not been handle'),
    }

    switch (list.id) {
      case GroupCode.ShareNote:
        prop = { ...prop, handle: openTabsSharedNotes }
        break
      case GroupCode.Polling:
        prop = { ...prop, handle: openTabsPolling }
        break
      case GroupCode.Whiteboard:
        prop = {
          ...prop,
          code: ScreenCode.Whiteboard,
          handle: handleToggleActiveScreen(ScreenCode.Whiteboard),
        }
        break
      case GroupCode.Presentation:
        prop = {
          ...prop,
          code: ScreenCode.Presentation,
          handle: handleToggleActiveScreen(ScreenCode.Presentation),
        }
        break
      case GroupCode.WatchYoutube:
        prop = {
          ...prop,
          code: ScreenCode.WatchYoutube,
          handle: handleToggleActiveScreen(ScreenCode.WatchYoutube),
        }
        break
      case GroupCode.Recording:
        prop = {
          ...prop,
          code: ScreenCode.Recording,
          isRecording: !!record,
          handle: record ? stopRecording : startRecording,
        }
        break
      case GroupCode.PickRandom:
        // Not defined yet
        break
      default: {
        const _exhaustiveCheck: never = list.id
        return _exhaustiveCheck
      }
    }

    return { ...list, ...prop }
  }

  return {
    activeScreen: screen?.id,
    items: TabsContents.filter(({ hide }) => !hide).map((content) => ({
      ...content,
      lists: content.lists.filter((list) => !list.hide).map(remapContent),
    })),
  }
}
