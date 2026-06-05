// ─────────────────────────────────────────────
// EditorialHero — Monumental typography intro
// Full viewport, parallax fade on scroll
// ─────────────────────────────────────────────

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function EditorialHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const chevronRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title stagger reveal
      const titleLines = titleRef.current?.querySelectorAll('.hero-line');
      if (titleLines) {
        gsap.fromTo(
          titleLines,
          { y: 80, opacity: 0, skewY: 3 },
          {
            y: 0,
            opacity: 1,
            skewY: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: 'power3.out',
            delay: 0.3,
          },
        );
      }

      // Subtitle fade
      gsap.fromTo(
        subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.9, ease: 'power2.out' },
      );

      // Parallax fade out on scroll
      gsap.to(sectionRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=60%',
          scrub: true,
        },
        opacity: 0,
        y: -120,
        ease: 'none',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="editorial-hero"
      className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden"
    >

      {/* Title */}
      <h1
        ref={titleRef}
        className="text-center px-6 md:px-12 max-w-[1200px] leading-[0.9] tracking-[-0.04em]"
      >
        <span className="hero-line block font-display text-[clamp(3rem,10vw,9rem)] font-extrabold text-newsprint">
          EVERY
        </span>
        <span className="hero-line block font-display text-[clamp(3rem,10vw,9rem)] font-extrabold text-newsprint">
          SATISFYING{' '}
          <span className="text-verdict-yellow">LIE</span>
        </span>
        <span className="hero-line block font-serif text-[clamp(2rem,6vw,5.5rem)] italic text-newsprint-dim font-normal mt-2">
          has an expiry date.
        </span>
      </h1>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        className="font-mono text-xs md:text-sm text-newsprint-dim tracking-[0.12em] uppercase max-w-lg text-center px-6"
        style={{ lineHeight: 2, marginTop: 'clamp(48px, 8vh, 96px)' }}
      >
        AI-powered verification engine — isolating misinformation
        <br className="hidden md:block" /> from fact, one claim at a time.
      </p>

      {/* Scroll indicator */}
      <div
        ref={chevronRef}
        className="absolute bottom-10 flex flex-col items-center gap-2 animate-pulse"
      >
        <span className="font-mono text-[10px] tracking-[0.3em] text-newsprint-dim uppercase">
          Scroll
        </span>
        <ChevronDown className="w-5 h-5 text-newsprint-dim" strokeWidth={1} />
      </div>
    </section>
  );
}
