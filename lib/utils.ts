import type { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { default as clsx } from 'clsx'

export const encoder = new TextEncoder()

export const decoder = new TextDecoder()

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

export function num(value: unknown) {
  return isNaN(Number(value)) ? 0 : Number(value)
}

export function without<T extends object, K extends keyof T>(obj: T, keys: K[]) {
  const clone = { ...obj }
  for (const key of keys) {
    delete clone[key]
  }
  return clone
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  return without(obj, keys)
}

export function qstring<T extends object = object>(
  baseUrl: string,
  obj?: T,
  options: {
    encodeValues?: boolean
    encodeKeys?: boolean
    skipNulls?: boolean
    skipEmpty?: boolean
    arrayFormat?: 'brackets' | 'comma' | 'repeat' | 'indices'
  } = {}
): string {
  // Default options
  const {
    encodeValues = true,
    encodeKeys = true,
    skipNulls = false,
    skipEmpty = false,
    arrayFormat = 'brackets',
  } = options

  // Early return for empty objects
  if (
    !obj ||
    typeof obj !== 'object' ||
    Object.keys(obj).length === 0 ||
    (Array.isArray(obj) && obj.length === 0)
  ) {
    return baseUrl
  }

  // Function to encode value based on options
  const encode = (value: string): string => {
    return encodeValues ? encodeURIComponent(value) : value
  }

  // Function to encode key based on options
  const encodeKey = (key: string): string => {
    return encodeKeys ? encodeURIComponent(key) : key
  }

  // Helper function to handle arrays based on arrayFormat option
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatArray = (key: string, arr: any[]): string[] => {
    if (arr.length === 0) {
      return [`${encodeKey(key)}=`]
    }

    return arr.map((value) => {
      const encodedValue = value === null || value === undefined ? '' : encode(String(value))

      switch (arrayFormat) {
        case 'brackets':
          return `${encodeKey(key)}[]=${encodedValue}`
        case 'comma':
          return arr.length > 1
            ? `${encodeKey(key)}=${arr.map((v) => (v === null || v === undefined ? '' : encode(String(v)))).join(',')}`
            : `${encodeKey(key)}=${encodedValue}`
        case 'indices':
          return `${encodeKey(key)}[${arr.indexOf(value)}]=${encodedValue}`
        case 'repeat':
        default:
          return `${encodeKey(key)}=${encodedValue}`
      }
    })
  }

  // Process the object into key-value pairs
  const pairs: string[] = []
  const url =
    baseUrl !== '/' && baseUrl.endsWith('/') ? baseUrl.slice(0, baseUrl.length - 1) : baseUrl

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]

      // Skip empty string
      if (typeof value === 'string' && !value && skipEmpty) {
        continue
      }

      // Skip null or undefined values if skipNulls is true
      if ((value === null || value === undefined) && skipNulls) {
        continue
      }

      // Handle different value types
      if (Array.isArray(value)) {
        // Handle arrays based on arrayFormat option
        if (arrayFormat === 'comma' && value.length > 0) {
          pairs.push(formatArray(key, value)[0])
        } else {
          pairs.push(...formatArray(key, value))
        }
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects by flattening
        for (const nestedKey in value) {
          if (Object.prototype.hasOwnProperty.call(value, nestedKey)) {
            const nestedValue = value[nestedKey]
            if ((nestedValue === null || nestedValue === undefined) && skipNulls) {
              continue
            }

            const encodedNestedValue =
              nestedValue === null || nestedValue === undefined ? '' : encode(String(nestedValue))
            pairs.push(`${encodeKey(key)}[${encodeKey(nestedKey)}]=${encodedNestedValue}`)
          }
        }
      } else {
        // Handle primitive values
        const encodedValue = value === null || value === undefined ? '' : encode(String(value))
        pairs.push(`${encodeKey(key)}=${encodedValue}`)
      }
    }
  }

  // Join all pairs and prepend with '?'
  return url + (pairs.length > 0 ? `?${pairs.join('&')}` : '')
}

export function loginfo(...data: unknown[]) {
  if (typeof window === 'undefined') return console.log(...data)
  if (!window.location.protocol.startsWith('https')) {
    return console.info(...data)
  }
}
