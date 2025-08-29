'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import GugoButton from './GugoButton'

interface BaseImage {
  id: string
  filename: string
  path: string
  description?: string
  uploadedAt: string
}

interface ImageGalleryProps {
  selectedImage: string | null
  onImageSelect: (imageId: string | null) => void
}

export default function ImageGallery({ selectedImage, onImageSelect }: ImageGalleryProps) {
  const [images, setImages] = useState<BaseImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images')
      const data = await response.json()
      setImages(data.images || [])
    } catch (error) {
      console.error('Failed to fetch images:', error)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('image', file)
    formData.append('description', `Uploaded ${new Date().toLocaleDateString()}`)

    try {
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        fetchImages()
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const generateComposite = async (baseImageId: string) => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseImageId, prompt: 'athletic energy, social media ready' })
      })

      const data = await response.json()
      if (data.imagePath) {
        setGeneratedImage(data.imagePath)
      }
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black uppercase text-sm tracking-wide">BASE IMAGES</h3>
        
        <div className="flex space-x-3">
          <label className="gugo-button-secondary text-xs py-2 px-4 cursor-pointer inline-block">
            {isUploading ? 'UPLOADING...' : 'UPLOAD NEW'}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="gugo-card text-center py-12">
          <div className="text-4xl mb-4">📷</div>
          <h4 className="font-black uppercase mb-2">NO IMAGES YET</h4>
          <p className="text-sm text-gray-600">Upload your first base image to get started</p>
        </div>
      ) : (
        <div className="gugo-grid gugo-grid-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`gugo-image-frame cursor-pointer transition-all duration-200 ${
                selectedImage === image.id ? 'gugo-image-selected' : 'hover:shadow-brutal'
              }`}
              onClick={(e) => {
                if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('button')) {
                  onImageSelect(selectedImage === image.id ? null : image.id)
                }
              }}
            >
              <div className="aspect-square relative">
                <Image
                  src={image.path}
                  alt={image.description || image.filename}
                  fill
                  className="object-cover"
                />
                
                {selectedImage === image.id && (
                  <div className="absolute inset-0 bg-gugo-green bg-opacity-20 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gugo-green border-2 border-gugo-black rounded-full flex items-center justify-center">
                      <span className="text-gugo-black text-lg font-black">✓</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-white border-t-2 border-gugo-black">
                <p className="text-xs font-black uppercase truncate">{image.filename}</p>
                {selectedImage === image.id && (
                  <GugoButton
                    onClick={() => generateComposite(image.id)}
                    disabled={isGenerating}
                    className="text-xs py-1 px-2 mt-2 w-full"
                  >
                    {isGenerating ? 'GENERATING...' : 'GENERATE'}
                  </GugoButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {generatedImage && (
        <div className="space-y-3">
          <h4 className="font-black uppercase text-sm">GENERATED COMPOSITE</h4>
          <div className="gugo-image-frame max-w-md">
            <Image
              src={generatedImage}
              alt="Generated composite"
              width={400}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="p-4 bg-gugo-green border-3 border-gugo-black">
          <p className="font-black text-gugo-black text-sm uppercase">
            IMAGE SELECTED - READY FOR COMPOSITE GENERATION
          </p>
        </div>
      )}
    </div>
  )
}