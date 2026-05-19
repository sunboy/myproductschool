'use client';

import { useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { CompanyArt } from '@/components/showcase/CompanyArt';
import { getReaderHeroImage } from '@/lib/autopsies/images';
import type { FeatureAutopsy } from '@/lib/autopsies/types';

interface ParallaxHeroProps {
  story: FeatureAutopsy;
  companyName: string;
  companyAccent?: string;
}

export function ParallaxHero({ story, companyName, companyAccent }: ParallaxHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const shouldReduce = useReducedMotion();
  const heroImage = getReaderHeroImage(story);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, shouldReduce ? 0 : 110]);
  const heroBlur = useTransform(scrollYProgress, [0, 1], [0, shouldReduce ? 0 : 8]);
  const heroFilter = useTransform(heroBlur, value => `blur(${value}px)`);

  return (
    <section ref={ref} className="sc-reader-hero">
      <motion.div
        className="sc-reader-hero-bg"
        style={{ y: heroY, filter: heroFilter }}
      >
        {heroImage && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage.src}
            alt={heroImage.alt}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <CompanyArt
            name={companyName}
            slug={story.companySlug}
            accent={companyAccent}
            variant="hero"
          />
        )}
      </motion.div>
      <div className="sc-reader-hero-shade" />
      <div className="sc-reader-hero-content">
        <div className="sc-reader-hero-kicker">
          <span className="sc-chip sc-chip--ink">
            <span
              className="sc-dot"
              style={{ background: companyAccent ?? 'var(--amber)' }}
              aria-hidden="true"
            />
            {companyName}
          </span>
          <span className="sc-chip sc-chip--ink">
            {story.storyType === 'company_teardown' ? 'Company teardown' : 'Feature autopsy'}
          </span>
        </div>
        <h1>{story.title}</h1>
        <p className="sc-reader-hero-dek">{story.dek}</p>
        <div className="sc-reader-meta">
          <span>{story.estimatedReadTime}</span>
          {story.tags.slice(0, 3).map(tag => (
            <span key={tag}>
              <span className="dot" aria-hidden="true" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
