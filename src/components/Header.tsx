'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const { logout } = useAuth()
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleLogout = async () => {
        await logout()
        setIsOpen(false)
        router.push('/login')
    }

    const handleTopClick = () => {
        setIsOpen(false)
        router.push('/')
    }

    return (
        <header className="navbar bg-base-100 shadow-lg">
            <div className="flex-1">
                <Link href="/" className="btn btn-ghost text-xl">
                    ロト6速攻チェック
                </Link>
            </div>
            <div className="flex-none" ref={dropdownRef}>
                <div className="relative">
                    <button
                        type="button"
                        className="btn btn-ghost btn-circle"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="メニューを開く"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                    {isOpen && (
                        <ul className="menu menu-sm absolute right-0 mt-3 z-[1000] p-2 shadow-lg bg-base-100 rounded-box w-52">
                            <li>
                                <a onClick={handleTopClick} className="cursor-pointer">
                                    TOP
                                </a>
                            </li>
                            <li>
                                <a onClick={handleLogout} className="cursor-pointer">
                                    ログアウト
                                </a>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
        </header>
    )
}
