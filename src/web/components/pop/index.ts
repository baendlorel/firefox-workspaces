import './pop-effect.css';

type OptionalHandler = (() => void) | undefined;
const empty = () => {};

/**
 * Create a handler to animate an element popping in or out
 */
export const popIn =
  (el: HTMLElement, onStart: OptionalHandler = empty, onEnd: OptionalHandler = empty) =>
  () => {
    // Remove any existing animation classes
    el.classList.remove('animate-in', 'animate-out');
    onStart();
    // Add entrance animation
    requestAnimationFrame(() => el.classList.add('animate-in'));
    setTimeout(onEnd, 250);
  };

/**
 * Create a handler to animate an element popping in or out
 */
export const popOut =
  (el: HTMLElement, onStart: OptionalHandler = empty, onEnd: OptionalHandler = empty) =>
  () => {
    // Add exit animation
    el.classList.remove('animate-in');
    el.classList.add('animate-out');
    onStart();

    // Close after animation completes
    setTimeout(() => {
      el.classList.remove('animate-out');
      onEnd();
    }, 250);
  };
