import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import PhysicalCanvas3D from './PhysicalCanvas3D';

export function EditorialReveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0px)' : 'translateY(26px)',
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function StudioTurntableModal({ product, artistName, studioName, onClose, onAddToBag }) {
  const [rotation, setRotation] = useState({ x: -4, y: -16 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e) => {
    setIsDragging(true);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setRotation((prev) => ({
      x: Math.max(-42, Math.min(42, prev.x - dy * 0.45)),
      y: prev.y + dx * 0.65,
    }));
  };

  const handlePointerUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-50 bg-[#1C1917]/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#F6F2EB] border border-[#1C1917]/20 max-w-5xl w-full max-h-[92vh] overflow-y-auto grid lg:grid-cols-12">
        <div className="lg:col-span-7 bg-[#ECE6DB] border-b lg:border-b-0 lg:border-r border-[#1C1917]/12 p-6 sm:p-10 flex flex-col justify-between min-h-[460px] select-none">
          <div className="flex items-center justify-between">
            <span className="font-mono-meta text-[11px] uppercase tracking-[0.18em] text-[#6D645B]">
              3D STUDIO INSPECTION · DRAG TO ROTATE
            </span>
            <span className="font-mono-meta text-[11px] text-[#6D645B]">
              {Math.round(rotation.y % 360)}° Y
            </span>
          </div>

          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`my-8 flex items-center justify-center touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          >
            <PhysicalCanvas3D
              product={product}
              artistName={artistName}
              studioName={studioName}
              rotX={rotation.x}
              rotY={rotation.y}
              depth={24}
              widthClass="w-[240px] sm:w-[290px]"
              heightClass="h-[300px] sm:h-[362px]"
              smoothTransition={!isDragging}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Front', x: 0, y: 0 },
              { label: '3/4 Angle', x: -6, y: -28 },
              { label: 'Side Edge', x: 0, y: -74 },
              { label: 'Back & Certificate', x: 0, y: 180 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setRotation({ x: preset.x, y: preset.y })}
                className="px-3.5 py-1.5 border border-[#1C1917]/20 bg-[#FBF9F4] hover:bg-[#1C1917] hover:text-[#F6F2EB] font-mono-meta text-[11px] uppercase tracking-wider transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-9 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#1C1917]/12">
              <span className="font-mono-meta text-xs tracking-[0.16em] text-[#B54534] uppercase">
                {product.catalogNo} · {product.category}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 border border-[#1C1917]/15 hover:bg-[#1C1917] hover:text-[#F6F2EB] transition-colors"
                aria-label="Close inspection modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="font-serif-editorial text-3xl sm:text-4xl font-semibold text-[#1C1917] mt-5 leading-tight">
              {product.title}
            </h3>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-mono-meta text-2xl font-medium text-[#1C1917]">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </span>
              <span className="font-mono-meta text-[11px] uppercase tracking-widest text-[#6D645B]">
                {product.status}
              </span>
            </div>

            <p className="font-sans-clean text-sm text-[#6D645B] leading-relaxed mt-5">
              {product.description}
            </p>

            <dl className="mt-6 pt-5 border-t border-[#1C1917]/12 space-y-2.5 font-mono-meta text-[11px]">
              <div className="flex justify-between gap-4">
                <dt className="text-[#6D645B] uppercase">Department</dt>
                <dd className="text-[#1C1917] text-right">{product.department}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6D645B] uppercase">Material</dt>
                <dd className="text-[#1C1917] text-right">{product.material}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#6D645B] uppercase">Specifications</dt>
                <dd className="text-[#1C1917] text-right">{product.dimensions}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 pt-5 border-t border-[#1C1917]/12 flex flex-col gap-3">
            {product.status === 'Available' ? (
              <button
                type="button"
                onClick={() => {
                  onAddToBag(product);
                  onClose();
                }}
                className="w-full py-3.5 bg-[#1C1917] hover:bg-[#B54534] text-[#F6F2EB] font-sans-clean text-xs uppercase tracking-[0.18em] font-medium transition-colors"
              >
                Add to Bag — ₹{Number(product.price).toLocaleString('en-IN')}
              </button>
            ) : (
              <a
                href="#commissions"
                onClick={onClose}
                className="w-full py-3.5 bg-[#B54534] hover:bg-[#1C1917] text-[#F6F2EB] font-sans-clean text-xs uppercase tracking-[0.18em] font-medium text-center transition-colors"
              >
                Inquire for Commission
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}