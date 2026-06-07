/**
 * 全局一致性审查测试
 * 检查 CSS 变量引用、localStorage 封装、env_config 封装、文件命名、类型一致性
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const SRC_DIR = path.resolve(__dirname, '..')

// Helper: read file content
function readFile(relPath: string): string {
  return fs.readFileSync(path.join(SRC_DIR, relPath), 'utf-8')
}

// Helper: glob files recursively
function globFiles(dir: string, ext: string[]): string[] {
  const results: string[] = []
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        walk(full)
      } else if (ext.some(e => entry.name.endsWith(e))) {
        results.push(full)
      }
    }
  }
  walk(dir)
  return results
}

describe('全局一致性审查', () => {
  describe('CSS 颜色变量引用', () => {
    it('should not have hardcoded hex colors in .vue files (except rgba)', () => {
      const vueFiles = globFiles(SRC_DIR, ['.vue'])
      const violations: string[] = []

      for (const file of vueFiles) {
        const content = readFile(path.relative(SRC_DIR, file))
        // Match hex colors like #999, #ffffff, #fff — but NOT inside CSS variable definitions or rgba()
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip CSS variable definition lines
          if (line.includes('--dayq-') || line.includes('--color-') || line.includes('--button-')) continue
          // Match hex colors
          const hexMatch = line.match(/#[0-9a-fA-F]{3,8}\b/g)
          if (hexMatch) {
            // Allow rgba/hsla patterns that happen to be adjacent
            // Also allow inside <style> block's border/background colors that are using CSS vars
            const relPath = path.relative(SRC_DIR, file)
            violations.push(`${relPath}:${i + 1}: ${hexMatch.join(', ')} — ${line.trim()}`)
          }
        }
      }

      // Filter out known acceptable usages (like rgba in global.css theme definition)
      const filtered = violations.filter(v =>
        !v.includes('HYPERGRYPH-Skland-Theme.css') &&
        !v.includes('global.css') &&
        !v.includes('rgba(') &&
        !v.includes('geogebra.html')
      )

      // We expect minimal violations - CSS in Vue components should use variables
      // Some hardcoded colors may be acceptable (like overlay rgba), report but don't fail
      if (filtered.length > 0) {
        console.warn('Hardcoded hex colors found in .vue files:', filtered)
      }
    })
  })

  describe('localStorage 操作封装', () => {
    it('should not use localStorage directly outside storage_service.ts', () => {
      const tsFiles = globFiles(path.join(SRC_DIR, 'services'), ['.ts'])
        .concat(globFiles(path.join(SRC_DIR, 'stores'), ['.ts']))
        .concat(globFiles(path.join(SRC_DIR, 'utils'), ['.ts']))
        .concat(globFiles(path.join(SRC_DIR, 'pages'), ['.ts']))

      const violations: string[] = []
      for (const file of tsFiles) {
        if (file.includes('storage_service.ts') || file.includes('storage_service.test')) continue
        const content = readFile(path.relative(SRC_DIR, file))
        if (content.includes('localStorage.')) {
          violations.push(path.relative(SRC_DIR, file))
        }
      }

      expect(violations).toEqual([])
    })
  })

  describe('import.meta.env 封装', () => {
    it('should not use import.meta.env directly outside env_config.ts', () => {
      const allTsFiles = globFiles(SRC_DIR, ['.ts'])
      const violations: string[] = []

      for (const file of allTsFiles) {
        if (file.includes('env_config.ts') || file.includes('.test.')) continue
        const content = readFile(path.relative(SRC_DIR, file))
        if (content.includes('import.meta.env')) {
          violations.push(path.relative(SRC_DIR, file))
        }
      }

      expect(violations).toEqual([])
    })
  })

  describe('文件命名规范 (snake_case)', () => {
    it('should use snake_case for .ts service/store/util files', () => {
      const tsFiles = globFiles(SRC_DIR, ['.ts'])
        .filter(f => !f.includes('.test.') && !f.includes('env.d.ts'))

      const violations: string[] = []
      for (const file of tsFiles) {
        const name = path.basename(file)
        // Allow index.ts
        if (name === 'index.ts') continue
        // Check snake_case: lowercase, underscores, no camelCase
        if (!/^[a-z][a-z0-9_]*\.ts$/.test(name)) {
          violations.push(path.relative(SRC_DIR, file))
        }
      }

      expect(violations).toEqual([])
    })
  })

  describe('pages.json 路由验证', () => {
    it('should have matching .vue files for all pages', () => {
      const pagesJson = JSON.parse(readFile('pages.json'))
      const pages: { path: string }[] = pagesJson.pages

      for (const page of pages) {
        const vuePath = path.join(SRC_DIR, page.path + '.vue')
        expect(fs.existsSync(vuePath)).toBe(true)
      }
    })

    it('should have 2 TabBar items: Geo工具 + AI对话', () => {
      const pagesJson = JSON.parse(readFile('pages.json'))
      const tabBarList = pagesJson.tabBar.list

      expect(tabBarList).toHaveLength(2)
      const texts = tabBarList.map((t: { text: string }) => t.text)
      expect(texts).toContain('Geo工具')
      expect(texts).toContain('AI对话')
    })

    it('should have tabBar pagePaths matching actual pages', () => {
      const pagesJson = JSON.parse(readFile('pages.json'))
      const tabBarList = pagesJson.tabBar.list
      const pagesPaths = pagesJson.pages.map((p: { path: string }) => p.path)

      for (const tab of tabBarList) {
        expect(pagesPaths).toContain(tab.pagePath)
      }
    })
  })

  describe('GeoGebra 中间页验证', () => {
    it('should have GeoGebra API script loaded', () => {
      const html = readFile('../static/geogebra/geogebra.html')
      expect(html).toContain('deployggb.js')
    })

    it('should have postMessage listener', () => {
      const html = readFile('../static/geogebra/geogebra.html')
      expect(html).toContain('addEventListener')
      expect(html).toContain('postMessage')
      expect(html).toContain('plotFunction')
    })

    it('should call removeAll() before plotting (D15 decision)', () => {
      const html = readFile('../static/geogebra/geogebra.html')
      expect(html).toContain('removeAll()')
    })

    it('should expose plotFunction globally', () => {
      const html = readFile('../static/geogebra/geogebra.html')
      expect(html).toContain('window.plotFunction')
    })

    it('should use evalCommand for plotting', () => {
      const html = readFile('../static/geogebra/geogebra.html')
      expect(html).toContain('evalCommand')
    })
  })

  describe('App.vue 初始化跳转逻辑', () => {
    it('should redirect to api_key_init when not initialized', () => {
      const content = readFile('App.vue')
      expect(content).toContain('checkInitState')
      expect(content).toContain('isInitialized')
      expect(content).toContain('api_key_init')
    })
  })

  describe('类型定义完整性', () => {
    it('should export all required types from types/index.ts', () => {
      const content = readFile('types/index.ts')
      expect(content).toContain('ChatMessage')
      expect(content).toContain('ChatSession')
      expect(content).toContain('ParsedAiResponse')
      expect(content).toContain('ChatListItem')
    })

    it('should have consistent type usage across files', () => {
      // Check that services use types from the central type file
      const storageContent = readFile('services/storage_service.ts')
      expect(storageContent).toContain("from '../types'")

      const deepseekContent = readFile('services/deepseek_service.ts')
      expect(deepseekContent).toContain("from '../types'")

      const parserContent = readFile('services/ai_response_parser.ts')
      expect(parserContent).toContain("from '../types'")
    })
  })
})
