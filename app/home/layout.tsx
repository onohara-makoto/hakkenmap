import { cookies } from 'next/headers'
import PCHeader from '../components/PCHeader'

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
    await cookies()
    return (
        <>
            <PCHeader />
            {children}
        </>
    )
}