// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Add BroadcastChannel polyfill for tests
global.BroadcastChannel = class BroadcastChannel {
  name: string;
  onmessage?: (event: MessageEvent) => void;
  onmessageerror?: (event: MessageEvent) => void;
  
  constructor(name: string) {
    this.name = name;
  }
  
  postMessage(data: any) {
    // Mock implementation - in real tests we can override this
  }
  
  close() {
    // Mock implementation
  }
  
  addEventListener(type: string, listener: EventListener) {
    // Mock implementation
  }
  
  removeEventListener(type: string, listener: EventListener) {
    // Mock implementation
  }
  
  dispatchEvent(event: Event): boolean {
    return true;
  }
};

// Add IndexedDB mock for database cleanup tests
const mockIndexedDB = {
  databases: () => Promise.resolve([]),
  deleteDatabase: (name: string) => Promise.resolve(),
};

(global as any).indexedDB = mockIndexedDB;