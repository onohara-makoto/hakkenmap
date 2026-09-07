import { cookies } from 'next/headers'
import PCHeader from '../components/PCHeader'
import AppHeader from '../components/nav/AppHeader'
import BottomNav from '../components/nav/BottomNav'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
    await cookies()
    return (
        <>
            <PCHeader />
            <AppHeader />
            {children}
            <BottomNav />
        </>
    )
}
