'use client';

import { useState } from 'react';
import { getAutopsyImage } from '@/lib/autopsies/images';
import type { AutopsyImageRole, FeatureAutopsy } from '@/lib/autopsies/types';

interface EditorialImagePlateProps {
  story: FeatureAutopsy;
  role: AutopsyImageRole;
  variant?: 'staggered' | 'wide' | 'evidence' | 'principle';
  eyebrow?: string;
  title?: string;
  body?: string;
}

export function EditorialImagePlate({
  story,
  role,
  variant = 'wide',
  eyebrow,
  title,
  body,
}: EditorialImagePlateProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getAutopsyImage(story, role);
  if (!image || imageFailed) return null;

  const hasCopy = Boolean(eyebrow || title || body);

  return (
    <section className={`sc-editorial-plate sc-editorial-plate--${variant}`}>
      <div className="sc-editorial-plate__inner">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
          <figcaption>{image.caption}</figcaption>
        </figure>
        {hasCopy && (
          <div className="sc-editorial-plate__copy">
            {eyebrow && <div className="sc-eyebrow">{eyebrow}</div>}
            {title && <h3>{title}</h3>}
            {body && <p>{body}</p>}
          </div>
        )}
      </div>
    </section>
  );
}
