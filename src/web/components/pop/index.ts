import './pop-effect.css';

type OptionalHandler = ((...args: any[]) => void) | undefined;
const empty = () => {};

/**
 * Create a handler to animate an element popping in or out
 */
export const popIn =
  (el: HTMLElement, onStart: OptionalHandler = empty, onEnd: OptionalHandler = empty) =>
  (...args: any[]) => {
    // Remove any existing animation classes
    el.classList.remove('animate-in', 'animate-out');
    onStart(...args);
    // Add entrance animation
    requestAnimationFrame(() => el.classList.add('animate-in'));
    setTimeout(() => onEnd(...args), 250);
  };

/**
 * Create a handler to animate an element popping in or out
 */
export const popOut =
  (el: HTMLElement, onStart: OptionalHandler = empty, onEnd: OptionalHandler = empty) =>
  (...args: any[]) => {
    // Add exit animation
    el.classList.remove('animate-in');
    el.classList.add('animate-out');
    onStart(...args);

    // Close after animation completes
    setTimeout(() => {
      el.classList.remove('animate-out');
      onEnd(...args);
    }, 250);
  };

export const autoPopOutDialog = (
  el: HTMLDialogElement,
  onStart: OptionalHandler = empty,
  onEnd: OptionalHandler = empty
) =>
  el.addEventListener('click', (e) => {
    const rect = el.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (isInDialog) {
      return;
    }

    // Add exit animation
    el.classList.remove('animate-in');
    el.classList.add('animate-out');
    onStart(e);

    // Close after animation completes
    setTimeout(() => {
      el.classList.remove('animate-out');
      el.close();
      onEnd(e);
    }, 250);
  });
