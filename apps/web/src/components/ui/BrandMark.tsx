import { Wallet } from 'lucide-react'

type BrandMarkProps = {
  size?: 'sm' | 'lg'
}

export function BrandMark({ size = 'lg' }: BrandMarkProps) {
  const iconSize = size === 'sm' ? 18 : 28

  return (
    <div className={`brand-mark brand-mark--${size}`} aria-hidden="true">
      <Wallet size={iconSize} strokeWidth={2.4} />
    </div>
  )
}
