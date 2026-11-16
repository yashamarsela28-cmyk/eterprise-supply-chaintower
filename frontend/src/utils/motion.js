/** Shared motion language for every module. */
export const EASE = [0.22, 1, 0.36, 1];

export const pageStagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.055, delayChildren: 0.04 } }
};

export const riseIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: EASE } }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: EASE } }
};

export const rowIn = {
  hidden: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } }
};

export const drawerSlide = {
  hidden: { x: 28, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: EASE } },
  exit: { x: 28, opacity: 0, transition: { duration: 0.18 } }
};

export const popIn = {
  hidden: { opacity: 0, y: 6, scale: 0.99 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease: EASE } },
  exit: { opacity: 0, y: 4, transition: { duration: 0.16 } }
};
