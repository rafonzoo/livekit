import type { VideoCodec } from 'livekit-client'
import { videoCodecs } from 'livekit-client'

export function roomOptionsStringifyReplacer(key: string, val: unknown) {
  if (key === 'processor' && val && typeof val === 'object' && 'name' in val) {
    return val.name
  }
  if ((key === 'e2ee' || key === 'encryption') && val) {
    return 'e2ee-enabled'
  }
  return val
}

export function getLiveKitURL(projectUrl: string, region: string | null): string {
  const url = new URL(projectUrl)

  if (region && url.hostname.includes('livekit.cloud')) {
    let [projectId, ...hostParts] = url.hostname.split('.')

    if (hostParts[0] !== 'staging') {
      hostParts = ['production', ...hostParts]
    }

    url.hostname = [projectId, region, ...hostParts].join('.')
  }

  return url.toString()
}

export function isVideoCodec(codec?: string): codec is VideoCodec {
  return !!codec && videoCodecs.includes(codec as VideoCodec)
}

export function parseYoutubeURL(url?: string) {
  if (!url) return ''

  // Accept full YouTube URL or bare video ID
  const match = /(?:youtube\.com\/watch\?v=|youtu\.be\/|embed\/)([^&?/]+)/.exec(url.trim())
  const youtubeVideoID = match?.[1] ?? url.trim()

  return youtubeVideoID
}

export async function unsecuredCopyToClipboard(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text

  document.body.appendChild(textArea)

  textArea.focus()
  textArea.select()

  try {
    document.execCommand('copy')
  } catch (err) {
    console.error('Unable to copy to clipboard', err)
  }

  document.body.removeChild(textArea)
}

export async function copyHandler(text = '') {
  try {
    await navigator.clipboard.writeText(text)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    await unsecuredCopyToClipboard(text)
  }
}
