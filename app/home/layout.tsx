import PCHeader from '../components/PCHeader'

export default function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <PCHeader />
            {children}
        </>
    )
}