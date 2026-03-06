export type PrizeLevel = '1等' | '2等' | '3等' | '4等' | '5等' | 'はずれ'

export interface WinningNumbers {
    drawDate: string // YYYY-MM-DD
    mainNumbers: number[] // 本数字6個
    bonusNumber: number // ボーナス数字
    drawNumber?: number // 回号
}

export interface CheckResult {
    prizeLevel: PrizeLevel
    matchCount: number
    bonusMatch: boolean
    userNumbers: number[]
    winningNumbers: WinningNumbers
}
