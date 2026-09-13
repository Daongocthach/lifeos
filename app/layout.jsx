import './globals.css'
import './lifeos-polish.css'
import MoneyInputFormatter from './money-input-formatter'
import TablePagination from './table-pagination'

export default function RootLayout({children}) {
  return <html lang="vi"><body><MoneyInputFormatter /><TablePagination />{children}</body></html>
}
