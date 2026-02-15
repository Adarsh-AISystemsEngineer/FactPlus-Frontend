
import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AnimatedFeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  index?: number;
}

export const AnimatedFeatureCard: React.FC<AnimatedFeatureCardProps> = ({
  icon: Icon,
  title,
  desc,
  index = 0,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -10 }}
      className="relative group cursor-pointer h-full"
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500"
        animate={{
          background: isHovered
            ? "radial-gradient(circle at 50% 50%, hsl(var(--primary)/0.3), transparent)"
            : "radial-gradient(circle at 50% 50%, hsl(var(--primary)/0), transparent)",
        }}
      />

      {/* Card content */}
      <div className="relative glass-panel p-6 rounded-2xl text-left border border-white/5 h-full backdrop-blur-sm transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-white/10">
        {/* Icon with animation */}
        <motion.div
          className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-colors"
          animate={{
            backgroundColor: isHovered ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.1)",
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-6 h-6 text-primary transition-all duration-300" />
        </motion.div>

        {/* Title with letter animation */}
        <motion.h3
          className="text-xl font-display font-bold text-white mb-2 inline-block"
          animate={{
            color: isHovered ? "hsl(var(--primary))" : "#ffffff",
          }}
          transition={{ duration: 0.3 }}
        >
          {title.split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: isHovered ? i * 0.03 : 0,
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </motion.h3>

        {/* Description with fade animation */}
        <motion.p
          className="text-muted-foreground"
          animate={{
            color: isHovered
              ? "rgb(148, 163, 184, 0.9)"
              : "rgb(148, 163, 184)",
            textShadow: isHovered
              ? "0 0 10px rgba(59, 130, 246, 0.3)"
              : "0 0 0px transparent",
          }}
          transition={{ duration: 0.3 }}
        >
          {desc}
        </motion.p>

        {/* Animated underline on hover */}
        <motion.div
          className="absolute bottom-0 left-6 h-1 bg-gradient-to-r from-primary to-transparent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: isHovered ? 80 : 0 }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </motion.div>
  );
};
