import { render } from '@/plugin/Mermaid'

const svgToPngDataUrl = (svgString: string): Promise<string> => {
  return new Promise((resolve) => {
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.width || 1024
      canvas.height = image.height || 768
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(image, 0, 0)
      }
      URL.revokeObjectURL(svgUrl)
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob))
        } else {
          resolve('')
        }
      }, 'image/png')
    }
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      resolve('')
    }
    image.src = svgUrl
  })
}

export const getDownloadPNG = async (diagram: string) => {
  try {
    const svg = await render(diagram)
    return await svgToPngDataUrl(svg)
  } catch (error) {
    return ''
  }
}


