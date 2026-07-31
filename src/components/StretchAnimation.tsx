import React from 'react';
import { motion } from 'motion/react';

interface StretchAnimationProps {
  category: 'neck' | 'shoulder' | 'chest' | 'back' | 'wrist' | 'legs';
  isPlaying: boolean;
}

export default function StretchAnimation({ category, isPlaying }: StretchAnimationProps) {
  // Common animation variants that cycle smoothly
  const slowPulse = {
    animate: {
      scale: [1, 1.03, 1],
      opacity: [0.8, 1, 0.8],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const getSVGContent = () => {
    switch (category) {
      case 'neck':
        return (
          <svg viewBox="0 0 160 160" className="w-full h-full text-emerald-600 dark:text-emerald-400">
            {/* Background circles */}
            <circle cx="80" cy="80" r="70" className="fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-100 dark:stroke-emerald-900/50" strokeWidth="2" />
            <circle cx="80" cy="80" r="50" className="fill-emerald-100/30 dark:fill-emerald-900/10 stroke-emerald-200/50" strokeWidth="1" strokeDasharray="3 3" />
            
            {/* Torso/Shoulders */}
            <path d="M40,140 Q80,105 120,140" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            
            {/* Spine Neck */}
            <path d="M80,110 L80,75" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            
            {/* Animated Head (Gently tilts/rolls side to side) */}
            <motion.g
              animate={isPlaying ? {
                rotate: [-20, 20, -20],
                x: [-5, 5, -5],
                y: [0, -2, 0]
              } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "80px 75px" }}
            >
              {/* Head Outline */}
              <circle cx="80" cy="45" r="22" fill="none" stroke="currentColor" strokeWidth="6" />
              {/* Cute face line for guide of tilt direction */}
              <path d="M80,35 L80,45 L85,45" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              {/* Highlight cue arches representing stretch tension */}
              <motion.path
                d="M48,45 A 25 25 0 0 1 52,65"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={{ opacity: [0.1, 0.9, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.path
                d="M112,45 A 25 25 0 0 0 108,65"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                animate={{ opacity: [0.9, 0.1, 0.9] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.g>
          </svg>
        );

      case 'shoulder':
        return (
          <svg viewBox="0 0 160 160" className="w-full h-full text-emerald-600 dark:text-emerald-400">
            <circle cx="80" cy="80" r="70" className="fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-100 dark:stroke-emerald-900/50" strokeWidth="2" />
            
            {/* Head */}
            <circle cx="80" cy="35" r="16" fill="none" stroke="currentColor" strokeWidth="5" />
            
            {/* Core spine */}
            <line x1="80" y1="51" x2="80" y2="105" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            
            {/* Left and Right Shoulder joints, moving backward and forward */}
            <motion.path
              d="M35,110 L50,65 L80,60 L110,65 L125,110"
              fill="none"
              stroke="currentColor"
              strokeWidth="5.5"
              strokeLinecap="round"
              animate={isPlaying ? {
                d: [
                  "M35,110 L50,65 L80,60 L110,65 L125,110", // normal
                  "M45,105 L58,58 L80,63 L102,58 L115,105", // Squeezed back (chest forward, shoulder joints closer)
                  "M35,110 L50,65 L80,60 L110,65 L125,110"  // normal
                ]
              } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Back tension squeeze arrows */}
            <motion.path
              d="M48,60 Q80,52 112,60"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 2"
              animate={{ scaleY: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        );

      case 'chest':
        return (
          <svg viewBox="0 0 160 160" className="w-full h-full text-emerald-600 dark:text-emerald-400">
            <circle cx="80" cy="80" r="70" className="fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-100 dark:stroke-emerald-900/50" strokeWidth="2" />
            
            {/* Head */}
            <circle cx="80" cy="35" r="15" fill="none" stroke="currentColor" strokeWidth="5" />
            <line x1="80" y1="50" x2="80" y2="105" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            
            {/* Chest expand animation (arms going behind and chest expanding forward) */}
            <motion.g
              animate={isPlaying ? {
                scaleX: [1, 0.94, 1],
                x: [0, 1.5, 0]
              } : {}}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "80px 80px" }}
            >
              {/* Shoulders to Arms meeting in back */}
              <motion.path
                d="M42,65 Q80,55 118,65 L95,115 Q80,120 65,115 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                animate={isPlaying ? {
                  d: [
                    "M42,65 Q80,55 118,65 L95,110 Q80,120 65,110 Z",
                    "M40,63 Q80,48 120,63 L92,105 Q80,115 68,105 Z", // Arms pulled higher in back, chest arching
                    "M42,65 Q80,55 118,65 L95,110 Q80,120 65,110 Z"
                  ]
                } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>

            {/* Glowing Expansion waves on chest */}
            <motion.circle
              cx="80"
              cy="67"
              r="10"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              animate={{ scale: [1, 2.2], opacity: [0.8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            />
          </svg>
        );

      case 'back':
        return (
          <svg viewBox="0 0 160 160" className="w-full h-full text-emerald-600 dark:text-emerald-400">
            <circle cx="80" cy="80" r="70" className="fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-100 dark:stroke-emerald-900/50" strokeWidth="2" />
            
            {/* Chair outline representation */}
            <path d="M50,75 L110,75 M60,75 L60,115 M100,75 L100,115" stroke="currentColor" strokeWidth="2" opacity="0.3" strokeLinecap="round" />
            
            {/* Lower Body Sitting Stable */}
            <path d="M55,90 L105,90 M80,90 L80,115" stroke="currentColor" strokeWidth="5.5" opacity="0.8" />
            
            {/* Torso twisting around axis */}
            <motion.g
              animate={isPlaying ? {
                rotateY: [-35, 35, -35],
              } : {}}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "80px 80px" }}
            >
              {/* Head */}
              <circle cx="80" cy="38" r="14" fill="none" stroke="currentColor" strokeWidth="5" />
              {/* Twist Spine & Shoulders */}
              <line x1="80" y1="52" x2="80" y2="90" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="50" y1="62" x2="110" y2="62" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              
              {/* Arms twisted */}
              <path d="M50,62 Q40,80 60,95" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              <path d="M110,62 Q120,70 100,95" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </motion.g>

            {/* Circular rotating arrows signifying spinal twisting */}
            <motion.path
              d="M45,130 Q80,140 115,130"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </svg>
        );

      case 'wrist':
        return (
          <svg viewBox="0 0 160 160" className="w-full h-full text-emerald-600 dark:text-emerald-400">
            <circle cx="80" cy="80" r="70" className="fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-100 dark:stroke-emerald-900/50" strokeWidth="2" />
            
            {/* Forearm and Hand mimicking push pull */}
            <motion.g
              animate={isPlaying ? {
                x: [-6, 6, -6],
                y: [-2, 2, -2]
              } : {}}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Arm bone */}
              <line x1="30" y1="90" x2="90" y2="90" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
              
              {/* Flexor Wrist joint and fingers pointing up & being pulled backward */}
              <motion.g
                animate={isPlaying ? {
                  rotate: [15, -25, 15]
                } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "90px 90px" }}
              >
                {/* Hand Palm */}
                <path d="M90,90 L115,70 L125,75 M90,90 L115,100 L120,90" fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                {/* Fingers */}
                <line x1="115" y1="70" x2="135" y2="55" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" />
                <line x1="118" y1="78" x2="138" y2="65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                <line x1="115" y1="88" x2="135" y2="80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
              </motion.g>

              {/* Other hand pulling fingers slightly */}
              <path d="M125,40 Q138,55 125,75" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
            </motion.g>

            {/* Ripple focus around wrist joint */}
            <motion.circle
              cx="90"
              cy="90"
              r="8"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </svg>
        );

      case 'legs':
        return (
          <svg viewBox="0 0 160 160" className="w-full h-full text-emerald-600 dark:text-emerald-400">
            <circle cx="80" cy="80" r="70" className="fill-emerald-50 dark:fill-emerald-950/20 stroke-emerald-100 dark:stroke-emerald-900/50" strokeWidth="2" />
            
            {/* Ground line */}
            <line x1="30" y1="130" x2="130" y2="130" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            
            {/* Lower legs + feet rising up on tip toes */}
            <motion.g
              animate={isPlaying ? {
                y: [0, -14, 0]
              } : {}}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Thigh (horizontal/bent slightly) */}
              <path d="M45,45 Q65,42 85,50" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.4" />
              {/* Calf leg bone */}
              <path d="M85,50 L85,100" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
              
              {/* Foot (tilting down as heel lifts off the floor) */}
              <motion.path
                d="M85,100 L115,115"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                animate={isPlaying ? {
                  d: [
                    "M85,100 L115,102",  // Flat calf foot
                    "M85,100 L102,122",  // Tip toe calf foot
                    "M85,100 L115,102"
                  ]
                } : {}}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "85px 100px" }}
              />
            </motion.g>

            {/* Glowing UP action arrows */}
            <motion.g
              animate={{ y: [4, -8, 4], opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path d="M125,95 L125,80 M120,85 L125,80 L130,85" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </motion.g>
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-56 h-56 mx-auto relative flex items-center justify-center p-3">
      {getSVGContent()}
    </div>
  );
}
