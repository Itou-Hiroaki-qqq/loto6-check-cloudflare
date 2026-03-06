'use client'

import { formatNumber } from '@/lib/loto6/check'
import { CheckResult } from '@/lib/loto6/types'

type CheckResultWithId = CheckResult & { userNumberId: string }

interface WinningNumbersTableProps {
    results: CheckResultWithId[]
    userNumbersList: Array<{ id: string; numbers: number[] }>
}

const prizeColors: Record<string, string> = {
    '1等': 'bg-yellow-400 text-yellow-900 font-bold text-xl p-3 rounded-lg shadow-lg animate-pulse',
    '2等': 'bg-orange-400 text-orange-900 font-bold text-lg p-2 rounded-lg shadow-md',
    '3等': 'bg-pink-400 text-pink-900 font-bold p-2 rounded-lg shadow-md',
    '4等': 'bg-purple-400 text-purple-900 font-bold p-2 rounded-lg shadow',
    '5等': 'bg-blue-400 text-blue-900 font-bold p-2 rounded-lg shadow',
    はずれ: 'text-gray-600',
}

function formatDate(dateStr: string): string {
    if (dateStr.includes('T')) {
        return dateStr.split('T')[0]
    }
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateStr
    }
    return dateStr
}

export default function WinningNumbersTable({
    results,
    userNumbersList,
}: WinningNumbersTableProps) {
    const groupedResults = results.reduce((acc, result) => {
        const date = result.winningNumbers.drawDate
        if (!acc[date]) {
            acc[date] = []
        }
        acc[date].push(result)
        return acc
    }, {} as Record<string, CheckResultWithId[]>)

    const sortedDates = Object.keys(groupedResults).sort(
        (a, b) => b.localeCompare(a)
    )

    if (sortedDates.length === 0) {
        return (
            <div className="text-gray-500 py-4">当選番号がありません</div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
                <thead>
                    <tr>
                        <th>抽選日</th>
                        <th>当選番号</th>
                        <th>判定結果</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedDates.map((date) => {
                        const dateResults = groupedResults[date]
                        const firstResult = dateResults[0]
                        const { mainNumbers, bonusNumber } = firstResult.winningNumbers

                        return (
                            <tr key={date}>
                                <td className="align-top">{formatDate(date)}</td>
                                <td className="align-top">
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {mainNumbers.map((num, index) => (
                                            <span
                                                key={index}
                                                className="badge badge-primary badge-lg font-mono"
                                            >
                                                {formatNumber(num)}
                                            </span>
                                        ))}
                                        <span className="badge badge-secondary badge-lg font-mono relative">
                                            <span className="text-[10px] absolute -top-3 left-0 right-0 text-center whitespace-nowrap text-pink-600 font-semibold">
                                                ボーナス数字
                                            </span>
                                            {formatNumber(bonusNumber)}
                                        </span>
                                    </div>
                                </td>
                                <td className="align-top">
                                    <div className="space-y-2">
                                        {dateResults.map((result) => {
                                            const userNumber = userNumbersList.find(
                                                (un) => un.id === result.userNumberId
                                            )
                                            if (!userNumber) return null

                                            return (
                                                <div
                                                    key={result.userNumberId}
                                                    className={`${prizeColors[result.prizeLevel]}`}
                                                >
                                                    <div className="text-sm text-gray-600 mb-1">
                                                        {result.userNumbers.map(formatNumber).join(', ')}
                                                    </div>
                                                    <div>
                                                        {result.prizeLevel === 'はずれ'
                                                            ? `はずれ（${result.matchCount}個一致）`
                                                            : result.prizeLevel === '1等'
                                                            ? '1等当選！！！！！（すべて一致）'
                                                            : result.prizeLevel === '2等'
                                                            ? '2等当選！！！！（5個＆ボーナス数字一致）'
                                                            : result.prizeLevel === '3等'
                                                            ? '3等当選！！！（5個一致）'
                                                            : result.prizeLevel === '4等'
                                                            ? '4等当選！！（4個一致）'
                                                            : result.prizeLevel === '5等'
                                                            ? '5等当選！（3個一致）'
                                                            : result.prizeLevel
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
