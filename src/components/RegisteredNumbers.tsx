'use client'

import { formatNumber } from '@/lib/loto6/check'

interface RegisteredNumber {
    id: string
    numbers: number[]
    created_at: string
}

interface RegisteredNumbersProps {
    numbers: RegisteredNumber[]
    onDelete: (id: string) => void
    deleting?: string
}

export default function RegisteredNumbers({
    numbers,
    onDelete,
    deleting,
}: RegisteredNumbersProps) {
    if (numbers.length === 0) {
        return (
            <div className="text-gray-500 py-4">登録された番号はありません</div>
        )
    }

    return (
        <div className="space-y-2">
            {numbers.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                >
                    <div className="flex gap-2 flex-wrap">
                        {item.numbers.map((num, index) => (
                            <span
                                key={index}
                                className="badge badge-primary badge-lg font-mono"
                            >
                                {formatNumber(num)}
                            </span>
                        ))}
                    </div>
                    <button
                        className="btn btn-sm btn-error"
                        onClick={() => onDelete(item.id)}
                        disabled={deleting === item.id}
                    >
                        {deleting === item.id ? '削除中...' : '削除'}
                    </button>
                </div>
            ))}
        </div>
    )
}
