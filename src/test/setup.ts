import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Create mock functions
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockGetDocs = vi.fn();
const mockDeleteDoc = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockServerTimestamp = vi.fn(() => new Date());

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => [])
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  collection: mockCollection,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  serverTimestamp: mockServerTimestamp,
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
    fromDate: (date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })
  }
}));

vi.mock('@/lib/firebase/client', () => ({
  db: {},
  doc: mockDoc,
  collection: mockCollection,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  updateDoc: mockUpdateDoc,
  query: mockQuery,
  where: mockWhere,
  getDocs: mockGetDocs,
  serverTimestamp: mockServerTimestamp
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn()
}));

// Export mocks for use in tests
(global as any).__mocks = {
  mockDoc,
  mockCollection,
  mockGetDoc,
  mockSetDoc,
  mockUpdateDoc,
  mockQuery,
  mockWhere,
  mockGetDocs,
  mockDeleteDoc,
  mockOrderBy,
  mockLimit,
  mockServerTimestamp
};

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams())
}))

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  },
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  }
}))

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})