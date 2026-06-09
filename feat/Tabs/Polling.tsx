'use client'

import type { FC } from 'react'
import { useState } from 'react'
import { Chevron } from '@livekit/components-react'
import { cn, djs } from '@/lib/utils'
import { ButtonTab } from '@/components/Button'

export interface PollingSession {
  question: string
  options: PollingOption[]
  isResult?: boolean
}

export interface PollingOption {
  id: number
  value: string
  votes: { identity: string; name: string }[]
}

const POLLING_OPTION_LENGTH = 5
const INPUT_CLASSES = cn(
  'h-9 inline-flex w-full text-sm items-center px-3 rounded-md border border-muted-foreground/40 shadow'
)

export const PollingResult: FC<PollingSession> = ({ question, options, isResult = false }) => {
  const [checkedId, setCheckedId] = useState(0)
  const Label = isResult ? 'p' : 'label'
  const answers = !isResult
    ? options.filter((option) => !!option.value)
    : [
        ...options,
        { id: -1, value: 'Tidak menjawab', votes: [] },
        { id: -2, value: 'Lewati pendapat', votes: [] },
      ]

  return (
    <div className='mt-4 flex flex-col gap-4 rounded-md border p-5 shadow'>
      <h3 className='text-primary font-semibold'>
        {/* Apakah Bapak/Ibu menyetujui ketentuan rapat ini? */}
        {question}
      </h3>
      {isResult && (
        <div className='flex w-full flex-wrap items-center gap-2 text-xs leading-4'>
          <svg xmlns='http://www.w3.org/2000/svg' width={16} height={16} fill='none'>
            <path
              fill='#A3A3A3'
              d='M4.6.593a.589.589 0 0 0-.176-.42.604.604 0 0 0-.848 0 .589.589 0 0 0-.176.42V1.84c-1.152.09-1.907.314-2.462.863-.556.548-.782 1.295-.875 2.432h15.874c-.093-1.138-.319-1.884-.875-2.432-.555-.55-1.31-.772-2.462-.864V.593a.589.589 0 0 0-.176-.42.604.604 0 0 0-.848 0 .589.589 0 0 0-.176.42v1.195c-.532-.01-1.129-.01-1.8-.01H6.4c-.671 0-1.268 0-1.8.01V.593Z'
            />
            <path
              fill='#A3A3A3'
              fillRule='evenodd'
              d='M0 8.099c0-.663 0-1.253.01-1.778h15.98c.01.525.01 1.115.01 1.778v1.58c0 2.98 0 4.47-.938 5.395-.937.925-2.445.926-5.462.926H6.4c-3.017 0-4.526 0-5.462-.926C0 14.148 0 12.659 0 9.679v-1.58Zm12 1.58a.805.805 0 0 0 .566-.231.785.785 0 0 0 0-1.118.805.805 0 0 0-1.132 0 .785.785 0 0 0 0 1.118c.15.148.354.231.566.231Zm0 3.16a.805.805 0 0 0 .566-.23.785.785 0 0 0 0-1.118.805.805 0 0 0-1.132 0 .785.785 0 0 0 0 1.117c.15.148.354.231.566.231ZM8.8 8.89c0 .21-.084.41-.234.559a.805.805 0 0 1-1.132 0 .785.785 0 0 1 0-1.118.805.805 0 0 1 1.132 0c.15.148.234.35.234.559Zm0 3.16c0 .21-.084.41-.234.56a.805.805 0 0 1-1.132 0 .785.785 0 0 1 0-1.118.805.805 0 0 1 1.132 0c.15.148.234.349.234.558ZM4 9.68a.805.805 0 0 0 .566-.231.785.785 0 0 0 0-1.118.805.805 0 0 0-1.132 0 .785.785 0 0 0 0 1.118c.15.148.354.231.566.231Zm0 3.16a.805.805 0 0 0 .566-.23.785.785 0 0 0 0-1.118.805.805 0 0 0-1.132 0 .785.785 0 0 0 0 1.117c.15.148.354.231.566.231Z'
              clipRule='evenodd'
            />
          </svg>
          <time dateTime={djs().toString()} className='mr-auto translate-y-px'>
            {djs().format('DD MMMM YYYY, H  H.mm WIB')}
          </time>
          <p className='flex items-center gap-2'>
            <svg xmlns='http://www.w3.org/2000/svg' width={15} height={16} fill='none'>
              <path
                fill='#A3A3A3'
                d='M4.019 9.132v5.604A1.264 1.264 0 0 1 2.756 16H1.27A1.262 1.262 0 0 1 0 14.736V9.132a1.264 1.264 0 0 1 1.271-1.271h1.485a1.263 1.263 0 0 1 1.263 1.271Zm5.494-7.86v13.464A1.264 1.264 0 0 1 8.243 16H6.757a1.271 1.271 0 0 1-1.271-1.264V1.272A1.28 1.28 0 0 1 6.757 0h1.485a1.27 1.27 0 0 1 1.271 1.272ZM15 5.522v9.214A1.264 1.264 0 0 1 13.737 16h-1.484a1.262 1.262 0 0 1-1.272-1.264V5.522a1.272 1.272 0 0 1 1.272-1.272h1.517A1.27 1.27 0 0 1 15 5.522Z'
                style={{
                  fill: '#a3a3a3',
                  fillOpacity: 1,
                }}
              />
            </svg>
            <span className='translate-y-0.5'>20/20</span>
          </p>
        </div>
      )}
      <ul className='flex flex-col gap-2'>
        {answers.map(({ id, value, votes }) => (
          <li key={id} className='flex flex-col'>
            <Label
              htmlFor={isResult ? void 0 : `answer-option-${id}`}
              className={cn(
                'flex',
                !isResult &&
                  (checkedId === id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:not-disabled:border-primary hover:not-disabled:text-primary'),
                !isResult ? 'gap-4 rounded-md border p-5' : 'gap-2'
              )}
            >
              {!isResult && (
                <input
                  type='radio'
                  id={`answer-option-${id}`}
                  name={`answer-option-${id}`}
                  checked={checkedId === id}
                  onChange={() => setCheckedId(id)}
                />
              )}
              <span className={cn('text-sm', !isResult && 'font-semibold')}>{value}</span>
            </Label>
            {isResult && (
              <div className='flex items-center gap-2'>
                <div className='relative h-2 grow'>
                  <span className='bg-foreground/10 absolute inset-0 rounded-full'></span>
                  <span
                    style={{ width: `${(1 / 5) * 100}%` }}
                    className={cn(
                      'absolute top-0 bottom-0 left-0 rounded-full',
                      id < 0 ? 'bg-destructive' : 'bg-primary'
                    )}
                  ></span>
                </div>
                <span className='block min-w-7 text-right text-sm'>{`${votes.length}`}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export const TabsPolling: FC = () => {
  const [collapse, setCollapse] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<PollingOption[]>(
    Array.from({ length: POLLING_OPTION_LENGTH }, (_, index) => index + 1).map((id) => ({
      id,
      value: '',
      votes: [],
    }))
  )

  return (
    <div>
      <div>
        <h3 className='mb-4'>
          <button
            className='border-muted-foreground flex h-11 w-full items-center justify-between rounded-md border px-4 text-sm font-semibold'
            onClick={() => setCollapse((prev) => !prev)}
          >
            Buat Pendapat
            <Chevron className={cn(collapse ? 'rotate-90' : '-rotate-90')} />
          </button>
        </h3>
        <div
          className={cn(
            'flex flex-col gap-4 transition-opacity transition-discrete duration-300 starting:opacity-0',
            collapse && 'hidden'
          )}
        >
          <input
            type='seach'
            name='polling-question'
            placeholder='Masukkan pertanyaan Pendapat ...'
            className={cn(INPUT_CLASSES)}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onFocus={(e) => e.target.select()}
            autoComplete='off'
          />
          <ul className='flex flex-col gap-2'>
            {options.map(({ id, value }, index) => (
              <li key={id}>
                <input
                  type='search'
                  autoComplete='off'
                  name={`polling-option-${id}`}
                  placeholder={`Opsi ${index + 1}`}
                  value={value}
                  className={cn(INPUT_CLASSES)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    setOptions((prev) =>
                      prev.map((previous) =>
                        previous.id === id ? { ...previous, value: e.target.value } : previous
                      )
                    )
                  }}
                />
              </li>
            ))}
          </ul>
          <ButtonTab
            isActive
            disabled={!question || options.filter((option) => !!option.value).length < 2}
            className='size-auto h-11 font-semibold'
            onClick={() =>
              console.log(
                question,
                options.filter((option) => !!option.value)
              )
            }
          >
            Buat Pendapat
          </ButtonTab>
        </div>
      </div>

      <PollingResult question={question} options={options} />
    </div>
  )
}
