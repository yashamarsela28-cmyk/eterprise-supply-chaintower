import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Page Wrapper Component
 * Provides consistent page transition animations across all module pages
 */
export function AnimatedPageWrapper({ children, className = '' }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.08
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`animated-page-wrapper ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedPageWrapper;
