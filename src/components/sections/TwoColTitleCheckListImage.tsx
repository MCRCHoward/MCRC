import Image from 'next/image'
import { cn } from '@/utilities/ui'
import { OptimizedVideoPlayer } from '@/components/Media/VideoMedia/OptimizedVideoPlayer'

import { CheckList } from './CheckList'

interface TwoColImageProps {
  imagePosition?: 'left' | 'right'
  checkListPosition?: 'top' | 'bottom'
  data: {
    icon?: React.ReactNode
    iconColor?: string
    imageUrl: string
    imageAlt: string
    title?: string
    description?: string
    bottomDescription?: string
    checkList?: string[]
    listIcon?: React.ReactNode
    showSeparator?: boolean
    videoSrc?: string
  }
  imageSize?: {
    width?: number
    height?: number
    maxHeight?: string
  }
  className?: string
}

const TwoColTitleCheckListImage = ({
  data,
  imagePosition = 'left',
  checkListPosition = 'bottom',
  imageSize = {
    width: 500,
    height: 500,
    maxHeight: '24rem',
  },
  className = '',
}: TwoColImageProps) => {
  const {
    icon,
    iconColor = 'primary',
    imageUrl,
    imageAlt,
    title,
    description,
    bottomDescription,
    checkList,
    listIcon,
    showSeparator = true,
    videoSrc,
  } = data

  const contentSection = (
    <div className="flex flex-col lg:items-start lg:text-left">
      {icon && (
        <span
          className={cn(
            'flex size-12 items-center justify-center rounded-full',
            `bg-${iconColor} text-${iconColor}-foreground`,
          )}
        >
          <div className="size-6">{icon}</div>
        </span>
      )}
      <h3 className="my-6 text-3xl font-bold text-pretty lg:text-4xl">{title}</h3>
      {checkList && checkListPosition === 'top' && (
        <div className="mb-6 w-full">
          <CheckList items={checkList} customIcon={listIcon} showSeparator={showSeparator} />
        </div>
      )}
      <p
        className={cn(
          'max-w-xl text-muted-foreground lg:text-lg',
          checkList && checkListPosition === 'bottom' ? 'mb-8' : '',
        )}
      >
        {description}
      </p>
      {checkList && checkListPosition === 'bottom' && (
        <CheckList items={checkList} customIcon={listIcon} showSeparator={showSeparator} />
      )}
      {bottomDescription && (
        <p className="mt-8 max-w-xl text-muted-foreground lg:text-lg">{bottomDescription}</p>
      )}
    </div>
  )

  const mediaSection = videoSrc ? (
    <div className="relative w-full">
      <OptimizedVideoPlayer
        resource={videoSrc}
        poster={imageUrl}
        className={cn('w-full rounded-xl object-cover', `max-h-[${imageSize.maxHeight}]`)}
      />
    </div>
  ) : (
    <div className="relative w-full">
      <Image
        src={imageUrl}
        alt={imageAlt}
        className={cn('w-full rounded-xl object-cover', `max-h-[${imageSize.maxHeight}]`)}
        height={imageSize.height}
        width={imageSize.width}
        priority
      />
    </div>
  )

  return (
    <section className={cn('py-32', className)}>
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-2">
          {imagePosition === 'left' ? (
            <>
              {mediaSection}
              {contentSection}
            </>
          ) : (
            <>
              {contentSection}
              {mediaSection}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export { TwoColTitleCheckListImage }
