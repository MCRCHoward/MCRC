import '@testing-library/jest-dom'

// ResizeObserver is not available in jsdom; required by Radix UI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock

// scrollIntoView is not fully implemented in jsdom
Element.prototype.scrollIntoView = () => {}
