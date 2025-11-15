import { useState, useRef } from "react";
import Header from './components/header';
import Buscador from "./components/Buscador";
import DraggableBoxes from "./components/DraggableBoxes";

function App() {
  const [mesaResaltada, setMesaResaltada] = useState<number | null>(null);

  // 👇 referencia al mapa para hacer scroll
  const mapaRef = useRef<HTMLDivElement>(null);

  const manejarSeleccionMesa = (id: number | null) => {
    setMesaResaltada(id);

    // limpiar el estado después de 2.1s
    if (id !== null) {
      setTimeout(() => {
        setMesaResaltada(null);
      }, 2100);
    }
  };

  // 👇 función que el Buscador va a llamar
  const scrollAlMapa = () => {
    if (mapaRef.current) {
      mapaRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  return (
    <div>
      <Header />

      {/* Buscador ahora recibe onScrollMapa */}
      <Buscador 
        onSeleccionarMesa={manejarSeleccionMesa}
        onScrollMapa={scrollAlMapa}     // 👈 agregado
      />

      {/* el mapa dentro de un div con ref */}
      <div ref={mapaRef}>
        <DraggableBoxes mesaDestacadaId={mesaResaltada} />
      </div>
    </div>
  );
}

export default App;
