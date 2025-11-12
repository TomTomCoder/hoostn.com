'use server';

/**
 * Property Draft Management Server Actions
 * Auto-save functionality for property creation/editing
 */

import { createClient } from '@/lib/supabase/server';
import type { PropertyFormData } from '@/lib/validations/property';

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Property draft data from database
 */
export interface PropertyDraft {
  id: string;
  data: Partial<PropertyFormData>;
  created_at: string;
  updated_at: string;
}

/**
 * Draft metadata (without full data payload)
 */
export interface DraftMetadata {
  id: string;
  has_data: boolean;
  data_size: number;
  created_at: string;
  updated_at: string;
  age_minutes: number;
}

/**
 * Save a property draft (auto-save functionality)
 * Uses upsert pattern - one draft per user per organization
 *
 * @param draftData - Partial property form data to save
 * @returns Draft ID or error
 */
export async function saveDraft(
  draftData: Partial<PropertyFormData>
): Promise<ActionResult<{ draftId: string }>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to save drafts' };
    }

    // Use the database function to upsert draft
    // This handles the unique constraint and updates existing draft
    const { data, error } = await supabase.rpc('upsert_property_draft', {
      draft_data: draftData as unknown as Record<string, unknown>,
    });

    if (error) {
      console.error('Failed to save draft:', error);
      return {
        success: false,
        error: 'Failed to save draft. Please try again.',
      };
    }

    return {
      success: true,
      data: { draftId: data as string },
    };
  } catch (error) {
    console.error('Unexpected error saving draft:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Load the current user's property draft
 * Note: Users have one draft per organization
 *
 * @returns Draft data or error
 */
export async function loadDraft(): Promise<ActionResult<PropertyDraft | null>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to load drafts' };
    }

    // Use the database function to get user's draft
    const { data, error } = await supabase.rpc('get_my_property_draft');

    if (error) {
      console.error('Failed to load draft:', error);
      return {
        success: false,
        error: 'Failed to load draft. Please try again.',
      };
    }

    // If no draft exists, return null
    if (!data || data.length === 0) {
      return { success: true, data: null };
    }

    const draft = data[0];

    return {
      success: true,
      data: {
        id: draft.id,
        data: draft.data as Partial<PropertyFormData>,
        created_at: draft.created_at,
        updated_at: draft.updated_at,
      },
    };
  } catch (error) {
    console.error('Unexpected error loading draft:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Delete the current user's property draft
 *
 * @returns Success or error
 */
export async function deleteDraft(): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in to delete drafts' };
    }

    // Use the database function to clear user's draft
    const { data, error } = await supabase.rpc('clear_my_property_draft');

    if (error) {
      console.error('Failed to delete draft:', error);
      return {
        success: false,
        error: 'Failed to delete draft. Please try again.',
      };
    }

    return {
      success: true,
      data: { deleted: data as boolean },
    };
  } catch (error) {
    console.error('Unexpected error deleting draft:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Check if current user has a saved draft
 *
 * @returns True if draft exists, false otherwise
 */
export async function hasDraft(): Promise<ActionResult<{ hasDraft: boolean }>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in' };
    }

    // Use the database function to check for draft
    const { data, error } = await supabase.rpc('has_property_draft');

    if (error) {
      console.error('Failed to check for draft:', error);
      return {
        success: false,
        error: 'Failed to check for draft. Please try again.',
      };
    }

    return {
      success: true,
      data: { hasDraft: data as boolean },
    };
  } catch (error) {
    console.error('Unexpected error checking for draft:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Get draft metadata without loading full data
 * Useful for checking draft status and age
 *
 * @returns Draft metadata or error
 */
export async function getDraftMetadata(): Promise<ActionResult<DraftMetadata | null>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'You must be logged in' };
    }

    // Use the database function to get metadata
    const { data, error } = await supabase.rpc('get_property_draft_metadata');

    if (error) {
      console.error('Failed to get draft metadata:', error);
      return {
        success: false,
        error: 'Failed to get draft metadata. Please try again.',
      };
    }

    // If no draft exists, return null
    if (!data || data.length === 0) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: data[0] as DraftMetadata,
    };
  } catch (error) {
    console.error('Unexpected error getting draft metadata:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
