'use client'

import { useState } from 'react'

interface Loto6NumberInputProps {
    onRegister: (numbers: number[]) => void
    loading?: boolean
}

export default function Loto6NumberInput({ onRegister, loading }: Loto6NumberInputProps) {
    const [numbers, setNumbers] = useState<string[]>(['', '', '', '', '', ''])

    const handleNumberChange = (index: number, value: string) => {
        const numValue = value.replace(/[^0-9]/g, '')

        if (numValue === '' || (parseInt(numValue, 10) >= 1 && parseInt(numValue, 10) <= 43)) {
            const newNumbers = [...numbers]
            newNumbers[index] = numValue
            setNumbers(newNumbers)
        }
    }

    const handleRegister = () => {
        const numArray = numbers.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n))

        if (numArray.length !== 6) {
            alert('6個すべての数字を入力してください')
            return
        }

        const uniqueNumbers = new Set(numArray)
        if (uniqueNumbers.size !== 6) {
            alert('同じ数字は入力できません')
            return
        }

        if (numArray.some((n) => n < 1 || n > 43)) {
            alert('数字は1～43の範囲で入力してください')
            return
        }

        onRegister(numArray)
        setNumbers(['', '', '', '', '', ''])
    }

    return (
        <div className="space-y-4">
            <div className="text-lg font-semibold">チェックしたい番号</div>
            <div className="flex flex-wrap gap-2 items-center">
                {numbers.map((num, index) => (
                    <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        className="input input-bordered w-16 text-center"
                        placeholder="1-43"
                        value={num}
                        onChange={(e) => handleNumberChange(index, e.target.value)}
                        maxLength={2}
                    />
                ))}
                <button
                    className="btn btn-primary"
                    onClick={handleRegister}
                    disabled={loading}
                >
                    {loading ? '登録中...' : '登録'}
                </button>
            </div>
        </div>
    )
}
