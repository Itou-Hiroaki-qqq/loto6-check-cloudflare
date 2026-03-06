import * as cheerio from 'cheerio'

export interface ScrapedWinningNumbers {
    drawDate: string // YYYY-MM-DD
    mainNumbers: number[]
    bonusNumber: number
    drawNumber?: number
}

/**
 * fetch + cheerio でロト6の公式サイトから当選番号をスクレイピング
 * Cloudflare Workers対応（Puppeteer不要）
 */
export async function scrapeWinningNumbers(url: string): Promise<ScrapedWinningNumbers[]> {
    console.log(`[Scraper] Fetching URL: ${url}`)

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    })

    if (!response.ok) {
        throw new Error(`[Scraper] HTTP error: ${response.status}`)
    }

    const html = await response.text()
    console.log(`[Scraper] HTML length: ${html.length} characters`)

    const $ = cheerio.load(html)
    const results: ScrapedWinningNumbers[] = []

    // 回号を含むテーブルを取得
    const issueElement = $('.js-lottery-issue-pc').first()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let $table: cheerio.Cheerio<any>
    if (issueElement.length > 0) {
        $table = issueElement.closest('table')
        if ($table.length === 0) {
            console.warn('[Scraper] Table not found via .closest(), trying fallback')
            $table = $('table').first()
        }
    } else {
        console.warn('[Scraper] .js-lottery-issue-pc not found, trying fallback')
        $table = $('table').first()
    }

    if ($table.length === 0) {
        console.error('[Scraper] No tables found')
        return results
    }

    // 抽選日を取得
    const dateText = $table.find('.js-lottery-date-pc').first().text().trim()
    let drawDate = ''
    if (dateText) {
        const match = dateText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
        if (match) {
            const [, year, month, day] = match
            drawDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        }
    }

    // 回号を取得
    const issueText = $table.find('.js-lottery-issue-pc').first().text().trim()
    let drawNumber: number | undefined
    if (issueText) {
        const drawMatch = issueText.match(/第(\d+)回/)
        if (drawMatch) {
            drawNumber = parseInt(drawMatch[1], 10)
        }
    }

    // 本数字を取得
    const numbers: number[] = []
    $table.find('.js-lottery-number-pc').each((_, elem) => {
        const numText = $(elem).text().trim()
        const num = parseInt(numText, 10)
        if (!isNaN(num) && num >= 1 && num <= 43) {
            numbers.push(num)
        }
    })

    // ボーナス数字を取得
    const bonusText = $table.find('.js-lottery-bonus-pc').first().text().trim()
    const bonusMatch = bonusText.match(/\((\d+)\)/)
    const bonusNumber = bonusMatch
        ? parseInt(bonusMatch[1], 10)
        : parseInt(bonusText.replace(/[()]/g, ''), 10)

    // データの検証
    if (!drawDate || numbers.length !== 6 || isNaN(bonusNumber)) {
        console.warn(`[Scraper] Invalid data - date: "${dateText}", numbers: ${numbers.length}, bonus: ${bonusNumber}`)
        return results
    }

    results.push({
        drawDate,
        mainNumbers: numbers.sort((a, b) => a - b),
        bonusNumber,
        drawNumber,
    })

    console.log(`[Scraper] Found: ${drawDate} (第${drawNumber || 'N/A'}回), 本数字: [${numbers.join(',')}], ボーナス: ${bonusNumber}`)
    return results
}
