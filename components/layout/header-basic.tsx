import Image from 'next/image'
import logoSolara from '../../public/images/logo_solara.jpg'

export default function Header() {
  return (
    <header className="w-full bg-black shadow-lg">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-center">
          <div className="flex items-center">
            <Image
              src={logoSolara}
              alt="Solara"
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </header>
  )
}

