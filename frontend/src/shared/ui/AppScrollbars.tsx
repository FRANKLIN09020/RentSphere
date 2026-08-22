import { useEffect, type ReactNode } from 'react'
import { OverlayScrollbars } from 'overlayscrollbars'
import { useOverlayScrollbars } from 'overlayscrollbars-react'

const options = {
  overflow: { x: 'hidden' as const, y: 'scroll' as const },
  scrollbars: {
    theme: 'os-theme-rentsphere',
    visibility: 'auto' as const,
    autoHide: 'scroll' as const,
    autoHideDelay: 650,
    dragScroll: true,
    clickScroll: true,
  },
}

export function AppScrollbars({ children }: { children: ReactNode }) {
  const [initializeBody] = useOverlayScrollbars({ options, defer: true })

  useEffect(() => {
    initializeBody(document.body)

    const instances = new Map<Element, ReturnType<typeof OverlayScrollbars>>()

    const initializeMarkedAreas = (root: ParentNode) => {
      const areas = root instanceof Element && root.matches('[data-app-scrollbars]')
        ? [root]
        : Array.from(root.querySelectorAll('[data-app-scrollbars]'))

      areas.forEach((area) => {
        if (instances.has(area)) return
        instances.set(area, OverlayScrollbars(area as HTMLElement, {
          ...options,
          overflow: {
            x: area.getAttribute('data-scroll-axis') === 'x' ? 'scroll' : 'hidden',
            y: area.getAttribute('data-scroll-axis') === 'x' ? 'hidden' : 'scroll',
          },
        }))
      })
    }

    initializeMarkedAreas(document)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) initializeMarkedAreas(node)
        })
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      instances.forEach((instance) => instance.destroy())
      instances.clear()
    }
  }, [initializeBody])

  return children
}
