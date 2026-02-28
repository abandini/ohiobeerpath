/**
 * Shared animation utilities and CSS
 */

export const animationStyles = `
  /* =========================
     Animation Utilities
     ========================= */

  /* Fade animations */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Bounce animations */
  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  /* Pulse animations */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes pulseScale {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  /* Shimmer effect for loading states */
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  /* Spin animation */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Slide animations */
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Star pop animation */
  @keyframes starPop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Ripple effect */
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  /* =========================
     Animation Classes
     ========================= */

  .animate-fade-in {
    animation: fadeIn 0.3s ease forwards;
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.4s ease forwards;
  }

  .animate-fade-in-down {
    animation: fadeInDown 0.4s ease forwards;
  }

  .animate-fade-in-scale {
    animation: fadeInScale 0.3s ease forwards;
  }

  .animate-bounce-in {
    animation: bounceIn 0.5s ease forwards;
  }

  .animate-bounce {
    animation: bounce 1s ease infinite;
  }

  .animate-pulse {
    animation: pulse 1.5s ease infinite;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  .animate-slide-in-left {
    animation: slideInLeft 0.3s ease forwards;
  }

  .animate-slide-in-right {
    animation: slideInRight 0.3s ease forwards;
  }

  /* Stagger children animations */
  .stagger-children > * {
    opacity: 0;
    animation: fadeInUp 0.4s ease forwards;
  }

  .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
  .stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
  .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
  .stagger-children > *:nth-child(4) { animation-delay: 0.2s; }
  .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
  .stagger-children > *:nth-child(6) { animation-delay: 0.3s; }
  .stagger-children > *:nth-child(7) { animation-delay: 0.35s; }
  .stagger-children > *:nth-child(8) { animation-delay: 0.4s; }

  /* =========================
     Loading States
     ========================= */

  /* Skeleton loading */
  .skeleton {
    background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  .skeleton-text {
    height: 1em;
    margin-bottom: 0.5em;
    border-radius: 4px;
  }

  .skeleton-text.short { width: 40%; }
  .skeleton-text.medium { width: 70%; }
  .skeleton-text.long { width: 100%; }

  .skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }

  .skeleton-image {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 8px;
  }

  .skeleton-card {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  /* Loading spinner */
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(0,0,0,0.1);
    border-left-color: #d97706;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-spinner.light {
    border-color: rgba(255,255,255,0.2);
    border-left-color: #fff;
  }

  .loading-spinner.large {
    width: 48px;
    height: 48px;
    border-width: 4px;
  }

  /* Loading overlay */
  .loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
  }

  .loading-overlay.active {
    opacity: 1;
    pointer-events: all;
  }

  /* =========================
     Interactive States
     ========================= */

  /* Button press effect */
  .btn-press {
    transition: transform 0.1s, box-shadow 0.1s;
  }

  .btn-press:active {
    transform: scale(0.97);
    box-shadow: none;
  }

  /* Card hover lift */
  .card-hover {
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  }

  /* Star rating interaction */
  .star-interactive {
    cursor: pointer;
    transition: transform 0.15s, color 0.15s;
  }

  .star-interactive:hover {
    transform: scale(1.2);
  }

  .star-interactive.selected {
    animation: starPop 0.3s ease;
  }

  /* Ripple effect container */
  .ripple-container {
    position: relative;
    overflow: hidden;
  }

  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    transform: scale(0);
    animation: ripple 0.6s linear;
    pointer-events: none;
  }

  /* =========================
     Toast Notifications
     ========================= */

  .toast-container {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 90vw;
  }

  .toast {
    background: #1f2937;
    color: #fff;
    padding: 12px 20px;
    border-radius: 12px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    animation: fadeInUp 0.3s ease forwards;
  }

  .toast.success {
    background: #10b981;
  }

  .toast.error {
    background: #ef4444;
  }

  .toast.warning {
    background: #f59e0b;
  }

  .toast.fade-out {
    animation: fadeOut 0.3s ease forwards;
  }

  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateY(20px);
    }
  }

  /* =========================
     Transition Utilities
     ========================= */

  .transition-fast {
    transition: all 0.15s ease;
  }

  .transition-medium {
    transition: all 0.3s ease;
  }

  .transition-slow {
    transition: all 0.5s ease;
  }

  /* Reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/**
 * Loading skeleton components
 */
export const skeletonComponents = {
  ratingCard: `
    <div class="skeleton-card">
      <div style="display: flex; gap: 16px;">
        <div class="skeleton" style="width: 80px; height: 80px; border-radius: 12px;"></div>
        <div style="flex: 1;">
          <div class="skeleton skeleton-text medium"></div>
          <div class="skeleton skeleton-text short"></div>
          <div style="display: flex; gap: 4px; margin-top: 8px;">
            ${Array(5).fill('<div class="skeleton" style="width: 20px; height: 20px; border-radius: 4px;"></div>').join('')}
          </div>
        </div>
      </div>
    </div>
  `,

  breweryCard: `
    <div class="skeleton-card">
      <div class="skeleton skeleton-image"></div>
      <div style="padding: 16px 0;">
        <div class="skeleton skeleton-text medium"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    </div>
  `,

  profileHeader: `
    <div style="display: flex; align-items: center; gap: 16px; padding: 24px;">
      <div class="skeleton skeleton-avatar" style="width: 80px; height: 80px;"></div>
      <div style="flex: 1;">
        <div class="skeleton skeleton-text medium"></div>
        <div class="skeleton skeleton-text short"></div>
      </div>
    </div>
  `
};

/**
 * JavaScript helpers for animations
 */
export const animationScripts = `
  // Toast notification system
  window.showToast = function(message, type = 'default', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // Ripple effect on buttons
  document.addEventListener('click', function(e) {
    const target = e.target.closest('.ripple-container');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = Math.max(rect.width, rect.height) + 'px';
    ripple.style.left = e.clientX - rect.left - ripple.offsetWidth / 2 + 'px';
    ripple.style.top = e.clientY - rect.top - ripple.offsetHeight / 2 + 'px';

    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  // Haptic feedback (if available)
  window.haptic = function(type = 'light') {
    if ('vibrate' in navigator) {
      switch(type) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(20); break;
        case 'heavy': navigator.vibrate(30); break;
        case 'success': navigator.vibrate([10, 50, 10]); break;
        case 'error': navigator.vibrate([30, 50, 30]); break;
      }
    }
  };

  // Intersection observer for scroll animations
  if ('IntersectionObserver' in window) {
    const animateOnScroll = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          animateOnScroll.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      animateOnScroll.observe(el);
    });
  }
`;
