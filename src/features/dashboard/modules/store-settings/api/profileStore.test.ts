import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfileStore } from './profileStore';

// Mock toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Firebase
vi.mock('@/lib/firebase/client', () => ({
  db: {},
  doc: vi.fn(),
  collection: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn()
}));

const mockStoreProfile = {
  id: 'store_123456',
  name: 'Test Store',
  description: 'Test Description'
};

describe('ProfileStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useProfileStore.setState({
      isUpdating: false,
      isValidating: false,
      error: null,
      success: false,
      sections: {}
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Store State Management', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useProfileStore());
      
      expect(result.current.isUpdating).toBe(false);
      expect(result.current.isValidating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(false);
      expect(result.current.sections).toEqual({});
    });

    it('should update state correctly', () => {
      const { result } = renderHook(() => useProfileStore());
      
      act(() => {
        useProfileStore.setState({ isUpdating: true });
      });
      
      expect(result.current.isUpdating).toBe(true);
    });

    it('should clear status correctly', () => {
      const { result } = renderHook(() => useProfileStore());
      
      // Set error and success
      act(() => {
        useProfileStore.setState({ 
          error: 'Test error',
          success: true 
        });
      });
      
      // Clear status
      act(() => {
        result.current.clearStatus();
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe(false);
    });
  });

  describe('Section State Management', () => {
    it('should mark section as dirty', () => {
      const { result } = renderHook(() => useProfileStore());
      
      act(() => {
        result.current.markSectionDirty('basic');
      });
      
      const sectionState = result.current.getSectionState('basic');
      expect(sectionState.isDirty).toBe(true);
    });

    it('should mark section as clean', () => {
      const { result } = renderHook(() => useProfileStore());
      
      // First mark as dirty
      act(() => {
        result.current.markSectionDirty('basic');
      });
      
      // Then mark as clean
      act(() => {
        result.current.markSectionClean('basic');
      });
      
      const sectionState = result.current.getSectionState('basic');
      expect(sectionState.isDirty).toBe(false);
    });

    it('should get section configuration', () => {
      const { result } = renderHook(() => useProfileStore());

      const config = result.current.getSectionConfig('basic');
      expect(config).toBeTruthy();
      expect(config?.id).toBe('basic');
    });

    it('should get section state with defaults', () => {
      const { result } = renderHook(() => useProfileStore());

      const sectionState = result.current.getSectionState('basic');
      expect(sectionState).toBeTruthy();
      expect(sectionState.isDirty).toBe(false);
      expect(sectionState.isSaving).toBe(false);
      expect(sectionState.error).toBeNull();
    });
  });

  describe('Data Validation', () => {
    it('should validate section data correctly', () => {
      const { result } = renderHook(() => useProfileStore());
      
      const validData = { name: 'Test Store' };
      const isValid = result.current.validateSectionData('basic', validData);
      expect(isValid).toBe(true);
    });

    it('should reject invalid section data', () => {
      const { result } = renderHook(() => useProfileStore());
      
      const invalidData = { invalidField: 'test' } as any;
      const isValid = result.current.validateSectionData('basic', invalidData);
      expect(isValid).toBe(false);
    });

    it('should handle invalid section ID', () => {
      const { result } = renderHook(() => useProfileStore());
      
      const data = { name: 'Test' };
      const isValid = result.current.validateSectionData('invalid', data);
      expect(isValid).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', () => {
      const { result } = renderHook(() => useProfileStore());
      
      const errorMessage = 'Validation failed';
      
      act(() => {
        useProfileStore.setState({ error: errorMessage });
      });
      
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle success state', () => {
      const { result } = renderHook(() => useProfileStore());
      
      act(() => {
        useProfileStore.setState({ success: true });
      });
      
      expect(result.current.success).toBe(true);
    });
  });
});