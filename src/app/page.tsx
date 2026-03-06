'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Loto6NumberInput from '@/components/Loto6NumberInput'
import RegisteredNumbers from '@/components/RegisteredNumbers'
import WinningNumbersTable from '@/components/WinningNumbersTable'
import { CheckResult } from '@/lib/loto6/types'

interface RegisteredNumber {
  id: string
  numbers: number[]
  created_at: string
}

type CheckResultWithId = CheckResult & { userNumberId: string }

export default function Home() {
  const [registeredNumbers, setRegisteredNumbers] = useState<RegisteredNumber[]>([])
  const [checkResults, setCheckResults] = useState<CheckResultWithId[]>([])
  const [registerLoading, setRegisterLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      loadRegisteredNumbers()
    }
  }, [user, loading])

  useEffect(() => {
    if (registeredNumbers.length > 0) {
      loadDefaultCheckResults()
    }
  }, [registeredNumbers.length])

  const loadRegisteredNumbers = async () => {
    try {
      const response = await fetch('/api/loto6/list')
      if (response.ok) {
        const data = (await response.json()) as { numbers: RegisteredNumber[] }
        setRegisteredNumbers(data.numbers || [])
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error loading registered numbers:', error)
    }
  }

  const loadDefaultCheckResults = async () => {
    if (registeredNumbers.length === 0) {
      setCheckResults([])
      return
    }

    setChecking(true)
    try {
      const response = await fetch('/api/loto6/from-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        const data = (await response.json()) as { error?: string; results?: CheckResultWithId[] }
        if (data.error && data.results?.length === 0) {
          setCheckResults([])
        } else {
          setCheckResults(data.results || [])
        }
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error loading check results:', error)
    } finally {
      setChecking(false)
    }
  }

  const handleRegister = async (numbers: number[]) => {
    setRegisterLoading(true)
    try {
      const response = await fetch('/api/loto6/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numbers }),
      })

      if (response.ok) {
        await loadRegisteredNumbers()
        await loadDefaultCheckResults()
      } else if (response.status === 401) {
        router.push('/login')
      } else {
        const errorData = (await response.json()) as { error?: string }
        alert(errorData.error || '登録に失敗しました')
      }
    } catch (error) {
      console.error('Error registering numbers:', error)
      alert('登録に失敗しました')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const response = await fetch(`/api/loto6/delete?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadRegisteredNumbers()
        await loadDefaultCheckResults()
      }
    } catch (error) {
      console.error('Error deleting numbers:', error)
      alert('削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  const handleCheck = async () => {
    if (registeredNumbers.length === 0) {
      alert('まず番号を登録してください')
      return
    }

    setChecking(true)
    try {
      const response = await fetch('/api/loto6/from-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as { error?: string; results?: CheckResultWithId[] }
        if (data.error && data.results?.length === 0) {
          alert(data.error)
          setCheckResults([])
        } else {
          setCheckResults(data.results || [])
        }
      } else if (response.status === 401) {
        router.push('/login')
      } else {
        const errorData = (await response.json()) as { error?: string }
        alert(errorData.error || 'チェックに失敗しました')
        setCheckResults([])
      }
    } catch (error) {
      console.error('Error checking numbers:', error)
      alert('チェックに失敗しました')
    } finally {
      setChecking(false)
    }
  }

  const userNumbersList = registeredNumbers.map((item) => ({
    id: item.id,
    numbers: item.numbers,
  }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="grow container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          <section className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <Loto6NumberInput
                onRegister={handleRegister}
                loading={registerLoading}
              />

              <div className="divider"></div>

              <RegisteredNumbers
                numbers={registeredNumbers}
                onDelete={handleDelete}
                deleting={deleting || undefined}
              />
            </div>
          </section>

          <section className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">当選番号</h2>

              <div className="space-y-4">
                <div>
                  <p className="mb-2">チェックしたい期間を入力してください（入力しなくても最新の10件が表示されます）</p>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="date"
                      className="input input-bordered"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="開始日"
                    />
                    <span className="flex pt-3">～</span>
                    <div className="flex flex-col">
                      <input
                        type="date"
                        className="input input-bordered"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="終了日"
                      />
                      <span className="text-xs text-gray-500 mt-1">
                        入力がないときは最新までを検索します
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleCheck}
                  disabled={checking || registeredNumbers.length === 0}
                >
                  {checking ? 'チェック中...' : '当選番号チェック'}
                </button>
              </div>

              <div className="divider"></div>

              {checking && (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              )}

              {!checking && checkResults.length > 0 && (
                <WinningNumbersTable
                  results={checkResults}
                  userNumbersList={userNumbersList}
                />
              )}

              {!checking && checkResults.length === 0 && registeredNumbers.length > 0 && (
                <div className="text-gray-500 py-4">
                  当選番号がありません。期間を指定してチェックしてください。
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
