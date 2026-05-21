import { StartMeeting } from '@/components/StartMeeting'

export default function Home() {
  return (
    <main className='flex h-screen flex-col items-center justify-center'>
      <div className='max-w-125'>
        <div className='px-8 text-center'>
          <h2 className='mb-1 text-[56px] leading-[1.12em] font-bold tracking-tight'>
            LiveKit Meet
          </h2>
          <p className='text-lg'>
            Open source video conferencing app built on LiveKit Components, LiveKit Cloud and
            Next.js.
          </p>
          <StartMeeting />
        </div>
      </div>
    </main>
  )
}
