import { FaWhatsapp } from "react-icons/fa";
import { MdEmail } from "react-icons/md";

export default function Footer() {
  return (
    <footer className="w-full py-4 bg-black">
      <div className="w-full px-6">
        <div className="flex items-center justify-between">
          {/* Contact info on the left */}
          <div className="flex items-center gap-4">
            <a
              href="https://wa.me/5551980265155"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              <FaWhatsapp size={20} />
            </a>
            <a
              href="mailto:contato@datenconsultoria.com.br"
              className="text-gray-300 hover:text-blue-400 transition-colors"
            >
              <MdEmail size={20} />
            </a>
          </div>
          
          {/* Company name on the right */}
          <div className="text-gray-300 text-sm font-medium">
            Daten consultoria
          </div>
        </div>
      </div>
    </footer>
  );
}

