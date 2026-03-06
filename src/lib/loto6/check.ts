import { PrizeLevel, CheckResult, WinningNumbers } from './types'

export function checkLoto6(
    userNumbers: number[],
    winningNumbers: WinningNumbers
): CheckResult {
    const mainNumbers = winningNumbers.mainNumbers
    const bonusNumber = winningNumbers.bonusNumber

    const matchCount = userNumbers.filter((num) => mainNumbers.includes(num)).length
    const bonusMatch = userNumbers.includes(bonusNumber)

    let prizeLevel: PrizeLevel = 'はずれ'

    if (matchCount === 6) {
        prizeLevel = '1等'
    } else if (matchCount === 5 && bonusMatch) {
        prizeLevel = '2等'
    } else if (matchCount === 5) {
        prizeLevel = '3等'
    } else if (matchCount === 4) {
        prizeLevel = '4等'
    } else if (matchCount === 3) {
        prizeLevel = '5等'
    }

    return {
        prizeLevel,
        matchCount,
        bonusMatch,
        userNumbers: [...userNumbers].sort((a, b) => a - b),
        winningNumbers,
    }
}

export function formatNumber(num: number): string {
    return num.toString().padStart(2, '0')
}
