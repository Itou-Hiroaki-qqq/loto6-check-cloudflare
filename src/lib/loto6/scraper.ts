export interface ScrapedWinningNumbers {
    drawDate: string // YYYY-MM-DD
    mainNumbers: number[]
    bonusNumber: number
    drawNumber?: number
}

const NAME_TXT_URL = 'https://www.mizuhobank.co.jp/takarakuji/apl/txt/loto6/name.txt'
const CSV_BASE_URL = 'https://www.mizuhobank.co.jp/retail/takarakuji/loto/loto6/csv/'

// 令和を西暦に変換
function convertWareki(text: string): string | null {
    const match = text.match(/令和(\d+)年(\d{1,2})月(\d{1,2})日/)
    if (!match) return null
    const year = 2018 + parseInt(match[1], 10)
    const month = match[2].padStart(2, '0')
    const day = match[3].padStart(2, '0')
    return `${year}-${month}-${day}`
}

// Shift-JISのレスポンスをテキストに変換
async function fetchShiftJIS(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        },
    })
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} for ${url}`)
    }
    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('shift_jis')
    return decoder.decode(buffer)
}

/**
 * みずほ銀行のCSVデータから最新の当選番号を取得
 * Cloudflare Workers対応
 */
export async function scrapeWinningNumbers(): Promise<ScrapedWinningNumbers[]> {
    console.log('[Scraper] Fetching name.txt to find latest CSV...')

    const nameText = await fetchShiftJIS(NAME_TXT_URL)
    const lines = nameText.split(/\r?\n/)

    // 最新のCSVファイル名を取得
    const nameLine = lines.find(line => line.startsWith('NAME'))
    if (!nameLine) {
        console.error('[Scraper] No CSV filename found in name.txt')
        return []
    }

    const csvFile = nameLine.split('\t')[1]?.trim()
    if (!csvFile) {
        console.error('[Scraper] Could not parse CSV filename')
        return []
    }

    console.log(`[Scraper] Fetching CSV: ${csvFile}`)
    const csvText = await fetchShiftJIS(CSV_BASE_URL + csvFile)
    const csvLines = csvText.split(/\r?\n/).filter(line => line.trim())

    // CSVフォーマット:
    // Line 0: A52
    // Line 1: 第2082回ロト６,数字選択式全国自治宝くじ,令和8年3月5日,...
    // Line 2: 支払期間,...
    // Line 3: 本数字,05,11,14,19,25,40,ボーナス数字,17

    if (csvLines.length < 4) {
        console.error('[Scraper] CSV data too short')
        return []
    }

    // 回号と日付を取得
    const infoLine = csvLines[1]
    const drawMatch = infoLine.match(/第(\d+)回/)
    const drawNumber = drawMatch ? parseInt(drawMatch[1], 10) : undefined

    const dateMatch = infoLine.match(/令和\d+年\d{1,2}月\d{1,2}日/)
    const drawDate = dateMatch ? convertWareki(dateMatch[0]) : null

    if (!drawDate) {
        console.error(`[Scraper] Could not parse date from: ${infoLine}`)
        return []
    }

    // 本数字とボーナス数字を取得
    const numbersLine = csvLines[3]
    const parts = numbersLine.split(',')
    // "本数字,05,11,14,19,25,40,ボーナス数字,17"
    const mainNumbers: number[] = []
    let bonusNumber = NaN

    const bonusIndex = parts.indexOf('ボーナス数字')
    if (bonusIndex === -1) {
        console.error(`[Scraper] Could not find bonus number marker in: ${numbersLine}`)
        return []
    }

    // 本数字: index 1 ~ bonusIndex-1
    for (let i = 1; i < bonusIndex; i++) {
        mainNumbers.push(parseInt(parts[i], 10))
    }
    // ボーナス数字: bonusIndex+1
    bonusNumber = parseInt(parts[bonusIndex + 1], 10)

    if (mainNumbers.length !== 6 || isNaN(bonusNumber)) {
        console.warn(`[Scraper] Invalid data - numbers: ${mainNumbers.length}, bonus: ${bonusNumber}`)
        return []
    }

    const result: ScrapedWinningNumbers = {
        drawDate,
        mainNumbers: mainNumbers.sort((a, b) => a - b),
        bonusNumber,
        drawNumber,
    }

    console.log(`[Scraper] Found: ${drawDate} (第${drawNumber || 'N/A'}回), 本数字: [${mainNumbers.join(',')}], ボーナス: ${bonusNumber}`)
    return [result]
}
