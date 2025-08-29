import Image from 'next/image'

export default function GugoDuck({ size = 40 }: { size?: number }) {
  return (
    <Image 
      src="/images/gugo-duck.png" 
      alt="GUGO Duck" 
      width={size} 
      height={size}
      className="inline-block"
      style={{animation: 'subtle-bounce 2s ease-in-out infinite'}}
    />
  )
}