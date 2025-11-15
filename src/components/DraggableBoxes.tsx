import React, { useState, useRef, useEffect } from "react";
import "../assets/DraggableBoxesStyle.css";

type Box = {
  id: number;
  x: number;
  y: number;
  nombre_mesa: string;
  color?: string;
  diferente?: number;
};

interface DraggableBoxesProps {
  mesaDestacadaId?: number | null;
}

const DraggableBoxes: React.FC<DraggableBoxesProps> = ({ mesaDestacadaId }) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: number; offsetX: number; offsetY: number } | null>(null);
  const [destacada, setDestacada] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const BOX_RATIO = 50 / 1200;

  // Fetch mesas
  useEffect(() => {
    const fetchBoxes = async () => {
      try {
        const res = await fetch("https://useful-book-endangered-floyd.trycloudflare.com/getmesas");
        if (!res.ok) throw new Error("Error al obtener las mesas");
        const data: Omit<Box, "color">[] = await res.json();

        const colors = ["#4ECDC4"];
        const withColors = data.map((box, i) => ({
          ...box,
          color: colors[i % colors.length],
        }));

        setBoxes(withColors);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBoxes();
  }, []);

  // Destacar mesa cuando cambia la búsqueda
  useEffect(() => {
    if (mesaDestacadaId != null) {
      setDestacada(null);
      setTimeout(() => {
        setDestacada(mesaDestacadaId);
        setTimeout(() => setDestacada(null), 2000);
      }, 50);
    }
  }, [mesaDestacadaId]);

  // Dragging functions
  const startDragging = (clientX: number, clientY: number, id: number) => {
    if (locked) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const box = boxes.find((b) => b.id === id);
    if (!box) return;

    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const absX = box.x * containerWidth;
    const absY = box.y * containerHeight;

    setDragging({
      id,
      offsetX: clientX - rect.left - absX,
      offsetY: clientY - rect.top - absY,
    });
  };

  const moveDragging = (clientX: number, clientY: number) => {
    if (locked) return;
    if (!dragging) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const containerWidth = rect.width;
    const containerHeight = rect.height;
    const boxSize = containerWidth * BOX_RATIO;

    let newX = clientX - rect.left - dragging.offsetX;
    let newY = clientY - rect.top - dragging.offsetY;

    newX = Math.max(0, Math.min(newX, containerWidth - boxSize));
    newY = Math.max(0, Math.min(newY, containerHeight - boxSize));

    setBoxes((prev) =>
      prev.map((b) =>
        b.id === dragging.id
          ? { ...b, x: newX / containerWidth, y: newY / containerHeight }
          : b
      )
    );
  };

  const actualizarCoordenadas = async (id: number, x: number, y: number) => {
    if (locked) return;

    try {
      await fetch("http://localhost:3000/api/actualizar-coordenadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, x, y }),
      });
    } catch (err) {
      console.error("❌ Error al actualizar coordenadas:", err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: number) =>
    startDragging(e.clientX, e.clientY, id);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) =>
    moveDragging(e.clientX, e.clientY);

  const handleMouseUp = () => {
    if (!locked && dragging) {
      const movedBox = boxes.find((b) => b.id === dragging.id);
      if (movedBox) actualizarCoordenadas(movedBox.id, movedBox.x, movedBox.y);
    }
    setDragging(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, id: number) => {
    const touch = e.touches[0];
    startDragging(touch.clientX, touch.clientY, id);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!dragging || locked) return;
    const touch = e.touches[0];
    moveDragging(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    if (!locked && dragging) {
      const movedBox = boxes.find((b) => b.id === dragging.id);
      if (movedBox) actualizarCoordenadas(movedBox.id, movedBox.x, movedBox.y);
    }
    setDragging(null);
  };

  if (loading) return <p>Cargando mesas...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <>
      {/* BOTÓN BLOQUEAR */}
      <button
        className="flex flex-col items-center"
        onClick={() => setLocked(!locked)}
        style={{
          padding: "8px 16px",
          marginBottom: "10px",
          backgroundColor: locked ? "red" : "green",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {locked ? "Desbloquear mesas" : "Bloquear mesas"}
      </button>

      <div
        className="container"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {boxes.map((box) => {
          const containerWidth = containerRef.current?.offsetWidth || 1200;
          const containerHeight = containerRef.current?.offsetHeight || 700;
          const boxSize = containerWidth * BOX_RATIO;

          const absX = box.x * containerWidth;
          const absY = box.y * containerHeight;
          const isDestacada = box.id === destacada;
          const isDiferente = box.diferente === 1;

          const boxWidth = isDiferente ? boxSize * 2.8 : boxSize;
          const boxHeight = isDiferente ? boxSize * 1.2 : boxSize;

          return (
            <div
              key={box.id}
              className={`box ${isDestacada ? "highlight" : ""} ${isDiferente ? "diferente" : ""}`}
              style={{
                width: boxWidth,
                height: boxHeight,
                transform: `translate(${absX}px, ${absY}px)`,
                backgroundColor: isDestacada ? "yellow" : isDiferente ? "#FF6347" : box.color,
                transition: "all 0.3s ease",
                cursor: locked ? "not-allowed" : "grab",
              }}
              onMouseDown={(e) => handleMouseDown(e, box.id)}
              onTouchStart={(e) => handleTouchStart(e, box.id)}
            >
              <span className="label">{box.nombre_mesa}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default DraggableBoxes;
