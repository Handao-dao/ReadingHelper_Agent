import { toPng } from 'html-to-image'
import { formatAnnotatedText } from './formatText'

const PAGE_WIDTH = 1440
const PAGE_HEIGHT = 2160
const OVERLAP_HEIGHT = 120
const EXPORT_PIXEL_RATIO = 1

function waitForFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

async function waitForLayout() {
  if (document.fonts?.ready) {
    await document.fonts.ready
  }
  await waitForFrame()
  await waitForFrame()
}

function createExportRoot() {
  const root = document.createElement('div')
  root.style.cssText = `
    position: fixed;
    left: -12000px;
    top: 0;
    width: ${PAGE_WIDTH}px;
    pointer-events: none;
    opacity: 1;
    z-index: -1;
  `
  document.body.appendChild(root)
  return root
}

function createPageShell(title, pageNumber = 1, totalPages = 1) {
  const page = document.createElement('section')
  page.className = 'share-page'
  page.style.width = `${PAGE_WIDTH}px`
  page.style.height = `${PAGE_HEIGHT}px`
  page.innerHTML = `
    <header class="share-page-header">
      <div>
        <div class="share-kicker">Reading Helper</div>
        <h1></h1>
      </div>
      <div class="share-page-number">${pageNumber} / ${totalPages}</div>
    </header>
    <main class="share-page-viewport">
      <div class="share-page-flow"></div>
    </main>
    <footer class="share-page-footer">HP 阅读助手</footer>
  `
  page.querySelector('h1').textContent = title || 'Reading Helper'
  return page
}

function getViewport(page) {
  return page.querySelector('.share-page-viewport')
}

function getFlow(page) {
  return page.querySelector('.share-page-flow')
}

function injectExportStyles(root) {
  const style = document.createElement('style')
  style.textContent = `
    .share-page {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      padding: 54px 72px 38px;
      overflow: hidden;
      background:
        radial-gradient(circle at 16% 8%, rgba(255, 255, 255, 0.34), transparent 18%),
        radial-gradient(circle at 84% 18%, rgba(120, 74, 34, 0.13), transparent 20%),
        linear-gradient(135deg, #f3dfae 0%, #ead19a 45%, #dec184 100%);
      color: #2f2112;
      font-family: Bookerly, Georgia, 'Times New Roman', serif;
    }
    .share-page-header {
      flex: 0 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 32px;
      padding-bottom: 22px;
      border-bottom: 1px solid rgba(91, 57, 24, 0.24);
    }
    .share-kicker {
      margin-bottom: 8px;
      color: #8a612d;
      font: 700 20px system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .share-page h1 {
      max-width: 1040px;
      margin: 0;
      color: #3c2915;
      font-size: 38px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: 0;
    }
    .share-page-number {
      color: #7c5a30;
      font: 700 24px system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      white-space: nowrap;
      padding-top: 30px;
    }
    .share-page-viewport {
      position: relative;
      flex: 1 1 auto;
      overflow: hidden;
      padding: 30px 0 24px;
    }
    .share-page-flow {
      width: 100%;
      font-size: 30px;
      line-height: 1.72;
      word-break: normal;
      overflow-wrap: break-word;
    }
    .share-page-flow p {
      margin: 0 0 1.05em;
      text-align: left;
    }
    .share-page-flow p:last-child {
      margin-bottom: 0;
    }
    .share-page-footer {
      flex: 0 0 auto;
      padding-top: 16px;
      border-top: 1px solid rgba(91, 57, 24, 0.18);
      color: #7c5a30;
      font: 700 20px system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    }
    .share-page .vocab-word {
      color: #B8860B;
      font-weight: 700;
    }
    .share-page .translation {
      color: #2C2825;
      font-size: 0.82em;
      margin-left: 4px;
      opacity: 0.82;
    }
    .share-page .text-word {
      color: inherit;
    }
  `
  root.appendChild(style)
}

function getVisibleContentHeight(viewport) {
  const style = window.getComputedStyle(viewport)
  const paddingTop = Number.parseFloat(style.paddingTop) || 0
  const paddingBottom = Number.parseFloat(style.paddingBottom) || 0
  return Math.max(viewport.clientHeight - paddingTop - paddingBottom, 1)
}

function makeOffsets(contentHeight, visibleHeight) {
  if (contentHeight <= visibleHeight) return [0]

  const step = visibleHeight - OVERLAP_HEIGHT
  const offsets = [0]

  while (offsets.at(-1) + visibleHeight < contentHeight) {
    offsets.push(Math.round(offsets.at(-1) + step))
  }

  return offsets
}

function buildPages({ root, title, html }) {
  const measurePage = createPageShell(title)
  root.appendChild(measurePage)
  getFlow(measurePage).innerHTML = html

  const viewportHeight = getVisibleContentHeight(getViewport(measurePage))
  const contentHeight = getFlow(measurePage).scrollHeight
  const offsets = makeOffsets(contentHeight, viewportHeight)
  measurePage.remove()

  return offsets.map((offset, index) => {
    const page = createPageShell(title, index + 1, offsets.length)
    const flow = getFlow(page)
    flow.innerHTML = html
    flow.style.transform = `translateY(-${offset}px)`
    root.appendChild(page)
    return page
  })
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export async function exportHistoryShareImages({
  title,
  annotatedText,
  masteredWords,
  filenamePrefix = 'reading-share',
}) {
  const root = createExportRoot()
  try {
    injectExportStyles(root)
    const html = formatAnnotatedText(annotatedText, masteredWords)
    await waitForLayout()
    const pages = buildPages({ root, title, html })
    await waitForLayout()

    for (let i = 0; i < pages.length; i += 1) {
      const dataUrl = await toPng(pages[i], {
        pixelRatio: EXPORT_PIXEL_RATIO,
        cacheBust: true,
        backgroundColor: '#ead19a',
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        style: {
          width: `${PAGE_WIDTH}px`,
          height: `${PAGE_HEIGHT}px`,
        },
      })
      downloadDataUrl(dataUrl, `${filenamePrefix}-${i + 1}.png`)
      await waitForFrame()
    }

    return pages.length
  } finally {
    root.remove()
  }
}
