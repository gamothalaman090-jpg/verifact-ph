import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HeroScanner() {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pin the container and animate the scanner bar across the text
      gsap.to(scannerRef.current, {
        top: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=100%',
          scrub: true,
          pin: true,
        }
      });
      
      // Reveal the "fake" keywords dynamically
      gsap.fromTo(".fake-highlight", 
        { backgroundColor: 'transparent', color: 'inherit' },
        { 
          backgroundColor: 'var(--color-highlighter-yellow)', 
          color: 'var(--color-ink-black)', 
          stagger: 0.1,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: '+=100%',
            scrub: true,
          }
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-ink-black text-newsprint-white">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-highlighter-yellow shadow-[0_0_15px_var(--color-highlighter-yellow)] z-10" ref={scannerRef}></div>
      
      <div className="max-w-4xl text-center px-6">
        <h1 className="font-serif text-5xl md:text-7xl mb-8 tracking-tight">The algorithm relies on <span className="fake-highlight px-2 transition-colors">unverified claims</span> to spread.</h1>
        <p className="font-mono text-xl md:text-2xl text-gray-400" ref={textRef}>
          Our RoBERTa-based engine cross-references real-time data against known sources, isolating <span className="fake-highlight px-2 transition-colors">sensationalism</span> and extracting fact from fiction.
        </p>
      </div>
    </div>
  );
}
