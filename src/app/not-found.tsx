import { FileQuestion, Home, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-bold text-zinc-800 mb-4">404</div>
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-8 h-8 text-zinc-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Pagina nao encontrada</h1>
        <p className="text-zinc-400 mb-8">
          A pagina que voce procura nao existe ou foi movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir para Dashboard
          </Link>
          <Link
            href="/players"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            Buscar Jogadores
          </Link>
        </div>
      </div>
    </div>
  )
}
