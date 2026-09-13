import './globals.css'
import './lifeos-polish.css'
import MoneyInputFormatter from './money-input-formatter'

export default function RootLayout({children}) {
  return <html lang="vi"><body><MoneyInputFormatter />{children}</body></html>
}
