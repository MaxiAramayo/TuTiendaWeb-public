import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfileStore } from '../api/profileStore';

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

describe('ProfileStore - Validations', () => {
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

  describe('Store Validation State', () => {
    it('should handle validation state correctly', () => {
      const { result } = renderHook(() => useProfileStore());
      
      // Initially not validating
      expect(result.current.isValidating).toBe(false);
      
      // Set validating state
      act(() => {
        useProfileStore.setState({ isValidating: true });
      });
      
      expect(result.current.isValidating).toBe(true);
    });

    it('should handle updating state correctly', () => {
      const { result } = renderHook(() => useProfileStore());
      
      // Initially not updating
      expect(result.current.isUpdating).toBe(false);
      
      // Set updating state
      act(() => {
        useProfileStore.setState({ isUpdating: true });
      });
      
      expect(result.current.isUpdating).toBe(true);
    });
  });

  describe('Section Validation', () => {
    it('should validate section configuration exists', () => {
      const { result } = renderHook(() => useProfileStore());
      
      const basicConfig = result.current.getSectionConfig('basic');
      expect(basicConfig).toBeTruthy();
      expect(basicConfig?.id).toBe('basic');
      
      const contactConfig = result.current.getSectionConfig('contact');
      expect(contactConfig).toBeTruthy();
      expect(contactConfig?.id).toBe('contact');
      
      const addressConfig = result.current.getSectionConfig('address');
      expect(addressConfig).toBeTruthy();
      expect(addressConfig?.id).toBe('address');
    });

    it('should handle invalid section configuration', () => {
      const { result } = renderHook(() => useProfileStore());
      
      const invalidConfig = result.current.getSectionConfig('invalid' as any);
      expect(invalidConfig).toBeNull();
    });
  });

  describe('Section State Validation', () => {
    it('should validate section state properties', () => {
      const { result } = renderHook(() => useProfileStore());
      
      const sectionState = result.current.getSectionState('basic');
      
      // Check all required properties exist
      expect(sectionState).toHaveProperty('isDirty');
      expect(sectionState).toHaveProperty('isSaving');
      expect(sectionState).toHaveProperty('lastSaved');
      expect(sectionState).toHaveProperty('error');
      
      // Check default values
      expect(sectionState.isDirty).toBe(false);
      expect(sectionState.isSaving).toBe(false);
      expect(sectionState.lastSaved).toBeNull();
      expect(sectionState.error).toBeNull();
    });

    it('should validate section state transitions', () => {
      const { result } = renderHook(() => useProfileStore());
      
      // Mark section as dirty
      act(() => {
        result.current.markSectionDirty('basic');
      });
      
      let sectionState = result.current.getSectionState('basic');
      expect(sectionState.isDirty).toBe(true);
      
      // Mark section as clean
      act(() => {
        result.current.markSectionClean('basic');
      });
      
      sectionState = result.current.getSectionState('basic');
      expect(sectionState.isDirty).toBe(false);
    });
  });

  describe('Store State Validation', () => {
    it('should validate error state handling', () => {
      const { result } = renderHook(() => useProfileStore());
      
      const errorMessage = 'Validation error';
      
      // Set error state
      act(() => {
        useProfileStore.setState({ error: errorMessage });
      });
      
      expect(result.current.error).toBe(errorMessage);
      
      // Clear error state
      act(() => {
        result.current.clearStatus();
      });
      
      expect(result.current.error).toBeNull();
    });

    it('should validate success state handling', () => {
      const { result } = renderHook(() => useProfileStore());
      
      // Set success state
      act(() => {
        useProfileStore.setState({ success: true });
      });
      
      expect(result.current.success).toBe(true);
      
      // Clear success state
      act(() => {
        result.current.clearStatus();
      });
      
      expect(result.current.success).toBe(false);
    });
  });

  describe('Section Data Validation', () => {
    it('should validate section data correctly', () => {
      const { result } = renderHook(() => useProfileStore());
      
      // Valid data for basic section
      const validBasicData = { name: 'Test Store' };
      const isValid = result.current.validateSectionData('basic', validBasicData);
      expect(isValid).toBe(true);
    });

    it('should reject invalid section data', () => {
      const { result } = renderHook(() => useProfileStore());
      
      // Invalid data for basic section (field not in section config)
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
});