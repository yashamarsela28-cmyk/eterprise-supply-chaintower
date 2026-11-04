import React from 'react';
import { motion } from 'framer-motion';
import Card from './Card';

/**
 * Animated Card Component
 * Card with entrance animation and hover effects
 */
export function AnimatedCard({ children, hoverEffect = true, delay = 0, ...cardProps }) {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay,
        ease: [0.19, 1, 0.22, 1]
      }
    }
  };

  const hoverVariants = hoverEffect
    ? {
        y: -4,
        transition: { duration: 0.2, ease: [0.19, 1, 0.22, 1] }
      }
    : {};

  return (
    <motion.div variants={itemVariants} whileHover={hoverVariants}>
      <Card {...cardProps}>{children}</Card>
    </motion.div>
  );
}

export default AnimatedCard;
