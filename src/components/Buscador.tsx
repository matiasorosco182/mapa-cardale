import { useState, useEffect } from "react";
import axios from "axios";

interface BuscadorProps {
  onSeleccionarMesa: (mesaId: number | null) => void;
  onScrollMapa: () => void;
}

export default function Buscador({ onSeleccionarMesa, onScrollMapa }: BuscadorProps) {
  const [nombre, setNombre] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [sugerencias, setSugerencias] = useState<any[]>([]);

  // 🔎 Buscar sugerencias mientras escribe
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (nombre.length < 2) {
        setSugerencias([]);
        return;
      }

      try {
        const res = await axios.get(`https://useful-book-endangered-floyd.trycloudflare.com/api/sugerencias?nombre=${nombre}`);
        setSugerencias(res.data);
      } catch (err) {
        console.error("Error obteniendo sugerencias:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [nombre]);

  // ✅ Marcar asistencia
  const marcarAsistencia = async () => {
    if (!resultado) return;

    try {
      const res = await axios.post("https://useful-book-endangered-floyd.trycloudflare.com/api/asistencia", {
  id: resultado.id,
});

      if (res.data.already) {
        alert("Esta persona ya había asistido.");
      } else {
        alert("Asistencia marcada.");
      }

      // 🟢 Actualizamos el estado
      setResultado({ ...resultado, asistencia: 1 });

    } catch (err) {
      console.error("Error marcando asistencia:", err);
    }
  };

  // 🔍 Buscar persona exacta
  const buscar = async (nombreForzado?: string) => {
    const texto = nombreForzado || nombre;
    if (!texto.trim()) return;

    try {
      const res = await axios.get(`https://useful-book-endangered-floyd.trycloudflare.com/api/buscar?nombre=${texto}`);
      setResultado(res.data);
      onSeleccionarMesa(res.data.mesa_id || null);

      // Hacer scroll hacia el mapa
      onScrollMapa();

    } catch (err) {
      console.error("Error al buscar:", err);
      setResultado(null);
      onSeleccionarMesa(null);
    }
  };

  const seleccionarSugerencia = (nombreElegido: string) => {
    setNombre(nombreElegido);
    setSugerencias([]);
    buscar(nombreElegido);

    // Solo lo ejecutamos una vez
    console.log("Ejecutando scroll al mapa");
    onScrollMapa();
  };

  return (
    <div className="p-6 flex flex-col items-center">
      <div className="relative w-72">

        {/* Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Escribí tu nombre..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="
              w-full bg-white border border-gray-300 rounded-lg 
              py-2.5 pr-10 pl-4 shadow-sm
              focus:border-blue-500 focus:ring-2 focus:ring-blue-300 
              outline-none transition-all duration-200
            "
          />
          <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>

        {/* Sugerencias */}
        {sugerencias.length > 0 && (
          <div className="
            absolute w-full bg-white border border-gray-200 rounded-lg 
            mt-1 shadow-lg z-20 animate-fadeIn
          ">
            {sugerencias.map((s) => (
              <div
                key={s.id}
                onClick={() => seleccionarSugerencia(s.nombre)}
                className="px-3 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
              >
                {s.nombre}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón Buscar */}
      <button
        onClick={() => buscar()}
        className="
          bg-blue-600 hover:bg-blue-700 
          text-white px-5 py-2.5 rounded-lg mt-3 
          shadow-md transition-all active:scale-95
        "
      >
        Buscar
      </button>

      {/* Resultado */}
      {resultado && (
        <div className="
          mt-6 bg-white rounded-xl p-5 w-72 text-center 
          shadow-[0_4px_12px_rgba(0,0,0,0.1)] 
          border border-gray-100 animate-fadeIn
        ">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {resultado.nombre}
          </h2>

          <p className="text-gray-700 mb-1">
            Mesa:{" "}
            <span className="font-semibold text-blue-600">
              {resultado.mesa_id}
            </span>
          </p>

          {resultado.especial_id && (
            <p className="text-gray-600 text-sm">
              {resultado.especial_id === 1
                ? "🌾 Celíaco"
                : resultado.especial_id === 2
                ? "🥦 Vegano"
                : resultado.especial_id === 3
                ? "🥗 Vegetariano"
                : resultado.especial_id === 4
                ? "🥗 Menu de niños de 9 años"
                : resultado.especial_id === 5
                ? "🍽️ Después de cena"
                : ""}
            </p>
          )}

          <p className="mt-2 text-gray-700">
            Personas:{" "}
            <span className="font-semibold text-gray-900">
              {resultado.cantidad}
            </span>
          </p>

          {/* Botón marcar asistencia */}
          <button
            onClick={marcarAsistencia}
            disabled={resultado.asistencia === 1}
            className={`
              mt-3 px-4 py-2 rounded-lg text-white font-semibold
              ${resultado.asistencia === 1
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"}
            `}
          >
            {resultado.asistencia === 1 ? "Ya asistió ✔️" : "Marcar asistencia"}
          </button>
        </div>
      )}
    </div>
  );
}
