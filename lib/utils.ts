import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { default as clsx } from 'clsx'

export function encodePassphrase(passphrase: string) {
  return encodeURIComponent(passphrase)
}

export function decodePassphrase(base64String: string) {
  return decodeURIComponent(base64String)
}

export function generateRoomId(): string {
  return `${randomString(4)}-${randomString(4)}`
}

export function randomString(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length

  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }

  return result
}

export function isLowPowerDevice() {
  return navigator.hardwareConcurrency < 6
}

export function isMeetStaging() {
  return new URL(location.origin).host === 'meet.staging.livekit.io'
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
