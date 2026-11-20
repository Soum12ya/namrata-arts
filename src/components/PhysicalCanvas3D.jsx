import React from 'react';
import ArtPieceRenderer from './ArtPieceRenderer';

export default function PhysicalCanvas3D({
  product,
  artistName,
  studioName,
  rotX = 0,
  rotY = 0,
  depth = 22,
  widthClass = 'w-[280px] sm:w-[330px]',
  heightClass = 'h-[350px] sm:h-[412px]',
  smoothTransition = true,
}) {
  const halfDepth = depth / 2;
  const shadowX = (-rotY * 0.9 + 14).toFixed(1);
  const shadowY = (rotX * 0.9 + 22).toFixed(1);

  return (
    <div className="relative flex items-center justify-center" style={{ perspective: '1400px' }}>
      <div
        className={`pointer-events-none absolute ${widthClass} ${heightClass} bg-[#1C1917]/20 blur-xl`}
        style={{
          transform: `translate3d(${shadowX}px, ${shadowY}px, -40px) scale(0.95)`,
          transition: smoothTransition ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      />

      <div
        className={`relative ${widthClass} ${heightClass}`}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: smoothTransition ? 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
        }}
      >
        {/* FRONT FACE */}
        <div
          className="absolute inset-0 bg-[#FBF9F4] p-3 border border-[#1C1917]/15"
          style={{ transform: `translateZ(${halfDepth}px)`, backfaceVisibility: 'hidden' }}
        >
          <div className="w-full h-full overflow-hidden border border-[#1C1917]/10 relative">
            <ArtPieceRenderer styleKey={product.styleKey} imageUrl={product.imageUrl} title={product.title} />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 45%, rgba(28,25,23,0.08) 100%)',
              }}
            />
          </div>
        </div>

        {/* BACK FACE: Wooden Stretcher Bars & Wax-Sealed Certificate */}
        <div
          className="absolute inset-0 bg-[#E6DAC8] border-[14px] border-[#C9B396] p-5 flex flex-col justify-between text-[#1C1917]"
          style={{
            transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
            backfaceVisibility: 'hidden',
            boxShadow: 'inset 0 0 24px rgba(28,25,23,0.16)',
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-3 bg-[#C9B396]/55 border-x border-[#1C1917]/10" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 bg-[#C9B396]/55 border-y border-[#1C1917]/10" />

          <div className="relative z-10 bg-[#FBF9F4] border border-[#1C1917]/20 p-4 h-full flex flex-col justify-between text-left">
            <div className="flex items-start justify-between border-b border-[#1C1917]/12 pb-2.5">
              <div>
                <p className="font-mono-meta text-[9px] tracking-[0.2em] uppercase text-[#6D645B]">
                  {studioName} · ARCHIVE
                </p>
                <p className="font-serif-editorial text-lg font-semibold leading-tight mt-0.5">
                  Certificate of Authenticity
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#B54534] text-[#FBF9F4] flex items-center justify-center font-serif-editorial italic text-xs font-bold border border-[#8E3224] shrink-0">
                KS
              </div>
            </div>

            <div className="space-y-1.5 my-2">
              <p className="font-mono-meta text-[10px] text-[#6D645B] uppercase">
                {product.catalogNo} · {product.edition || 'ORIGINAL WORK'}
              </p>
              <p className="font-serif-editorial text-base font-semibold text-[#1C1917]">
                {product.title}
              </p>
              <p className="font-sans-clean text-[11px] text-[#6D645B] leading-relaxed">
                Handcrafted individually by {artistName}. Keep away from direct harsh sunlight and dampness; spot-clean woolen pieces gently in cold water.
              </p>
            </div>

            <div className="border-t border-[#1C1917]/12 pt-2.5 flex items-end justify-between">
              <div>
                <p className="font-mono-meta text-[9px] uppercase text-[#6D645B]">Artist Signature</p>
                <p className="font-serif-editorial italic text-lg text-[#1C1917] leading-none mt-0.5">
                  {artistName}
                </p>
              </div>
              <span className="font-mono-meta text-[9px] text-[#6D645B] uppercase">
                {(product.dimensions || '').split('·')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* 4 EXTRUDED WOODEN STRETCHER SIDES */}
        <div
          className="absolute top-0 right-0 h-full bg-gradient-to-b from-[#C9B396] via-[#B89F7F] to-[#A68B6A] border-y border-[#1C1917]/20"
          style={{ width: `${depth}px`, transform: `rotateY(90deg) translateZ(${halfDepth}px)`, right: `-${halfDepth}px`, transformOrigin: 'center' }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-b from-[#D7C5AC] via-[#C3AC8D] to-[#B09777] border-y border-[#1C1917]/20"
          style={{ width: `${depth}px`, transform: `rotateY(-90deg) translateZ(${halfDepth}px)`, left: `-${halfDepth}px`, transformOrigin: 'center' }}
        />
        <div
          className="absolute top-0 left-0 w-full bg-gradient-to-r from-[#DFCEB8] to-[#C8B294] border-x border-[#1C1917]/20"
          style={{ height: `${depth}px`, transform: `rotateX(90deg) translateZ(${halfDepth}px)`, top: `-${halfDepth}px`, transformOrigin: 'center' }}
        />
        <div
          className="absolute bottom-0 left-0 w-full bg-gradient-to-r from-[#9F8565] to-[#8C7253] border-x border-[#1C1917]/20"
          style={{ height: `${depth}px`, transform: `rotateX(-90deg) translateZ(${halfDepth}px)`, bottom: `-${halfDepth}px`, transformOrigin: 'center' }}
        />
      </div>
    </div>
  );
}