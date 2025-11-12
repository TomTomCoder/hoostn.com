/**
 * RLS Tests for Properties Table
 * 
 * Tests Row Level Security policies for multi-tenant isolation
 * and role-based access control on the properties table.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  createAuthenticatedClient,
  testOrgIsolation,
  testCrossOrgAccessDenied,
  testRolePermission,
  TEST_USERS,
} from './rls-test-utils';

// Test data IDs (these should match your test database)
const TEST_DATA = {
  orgA: {
    propertyId: '11111111-1111-1111-1111-111111111111',
    orgId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  },
  orgB: {
    propertyId: '22222222-2222-2222-2222-222222222222',
    orgId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  },
};

describe('Properties Table RLS', () => {
  describe('Organization Isolation', () => {
    it('should only show properties from user\'s organization', async () => {
      const client = await createAuthenticatedClient('orgA_owner');

      const { data, error } = await client.from('properties').select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // All properties should belong to org A
      expect(data?.every((p) => p.org_id === TEST_DATA.orgA.orgId)).toBe(true);
    });

    it('should prevent access to other organization\'s properties', async () => {
      const client = await createAuthenticatedClient('orgA_owner');

      const { data, error } = await client
        .from('properties')
        .select('*')
        .eq('id', TEST_DATA.orgB.propertyId)
        .single();

      // Should either return null or error
      expect(data).toBeNull();
    });

    it('should isolate org A and org B completely', async () => {
      const clientA = await createAuthenticatedClient('orgA_owner');
      const clientB = await createAuthenticatedClient('orgB_owner');

      const [resultA, resultB] = await Promise.all([
        clientA.from('properties').select('org_id'),
        clientB.from('properties').select('org_id'),
      ]);

      // Each should only see their own org
      expect(
        resultA.data?.every((p) => p.org_id === TEST_DATA.orgA.orgId)
      ).toBe(true);
      expect(
        resultB.data?.every((p) => p.org_id === TEST_DATA.orgB.orgId)
      ).toBe(true);
    });
  });

  describe('Role-Based Access Control - SELECT', () => {
    it('should allow owner to view properties', async () => {
      const client = await createAuthenticatedClient('orgA_owner');
      const { data, error } = await client.from('properties').select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('should allow admin to view properties', async () => {
      const client = await createAuthenticatedClient('orgA_admin');
      const { data, error } = await client.from('properties').select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('should allow employee to view properties', async () => {
      const client = await createAuthenticatedClient('orgA_employee');
      const { data, error } = await client.from('properties').select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });
  });

  describe('Role-Based Access Control - INSERT', () => {
    const newProperty = {
      org_id: TEST_DATA.orgA.orgId,
      name: 'Test Property',
      address: '123 Test St',
      city: 'Paris',
      country: 'FR',
    };

    it('should allow owner to create properties', async () => {
      const client = await createAuthenticatedClient('orgA_owner');
      const { data, error } = await client
        .from('properties')
        .insert(newProperty)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.name).toBe(newProperty.name);

      // Cleanup
      if (data?.id) {
        await client.from('properties').delete().eq('id', data.id);
      }
    });

    it('should allow admin to create properties', async () => {
      const client = await createAuthenticatedClient('orgA_admin');
      const { data, error } = await client
        .from('properties')
        .insert(newProperty)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Cleanup
      if (data?.id) {
        await client.from('properties').delete().eq('id', data.id);
      }
    });

    it('should prevent employee from creating properties', async () => {
      const client = await createAuthenticatedClient('orgA_employee');
      const { data, error } = await client
        .from('properties')
        .insert(newProperty)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.message).toContain('policy');
      expect(data).toBeNull();
    });

    it('should prevent creating property with wrong org_id', async () => {
      const client = await createAuthenticatedClient('orgA_owner');
      const { data, error } = await client
        .from('properties')
        .insert({ ...newProperty, org_id: TEST_DATA.orgB.orgId })
        .select()
        .single();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('Role-Based Access Control - UPDATE', () => {
    it('should allow owner to update properties', async () => {
      const client = await createAuthenticatedClient('orgA_owner');
      
      // First, get a property to update
      const { data: properties } = await client
        .from('properties')
        .select('*')
        .limit(1)
        .single();

      if (!properties) {
        throw new Error('No properties found for test');
      }

      const { data, error } = await client
        .from('properties')
        .update({ name: 'Updated Name' })
        .eq('id', properties.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.name).toBe('Updated Name');

      // Restore original name
      await client
        .from('properties')
        .update({ name: properties.name })
        .eq('id', properties.id);
    });

    it('should allow admin to update properties', async () => {
      const client = await createAuthenticatedClient('orgA_admin');
      
      const { data: properties } = await client
        .from('properties')
        .select('*')
        .limit(1)
        .single();

      if (!properties) {
        throw new Error('No properties found for test');
      }

      const { data, error } = await client
        .from('properties')
        .update({ name: 'Updated by Admin' })
        .eq('id', properties.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.name).toBe('Updated by Admin');

      // Restore
      await client
        .from('properties')
        .update({ name: properties.name })
        .eq('id', properties.id);
    });

    it('should prevent employee from updating properties', async () => {
      const client = await createAuthenticatedClient('orgA_employee');
      
      // Get property ID (we can read it as employee)
      const { data: properties } = await client
        .from('properties')
        .select('id')
        .limit(1)
        .single();

      if (!properties) {
        throw new Error('No properties found for test');
      }

      const { data, error } = await client
        .from('properties')
        .update({ name: 'Should Fail' })
        .eq('id', properties.id)
        .select()
        .single();

      expect(error).toBeDefined();
      expect(error?.message).toContain('policy');
      expect(data).toBeNull();
    });
  });

  describe('Role-Based Access Control - DELETE', () => {
    it('should allow owner to delete properties', async () => {
      const client = await createAuthenticatedClient('orgA_owner');
      
      // Create a test property
      const { data: newProp } = await client
        .from('properties')
        .insert({
          org_id: TEST_DATA.orgA.orgId,
          name: 'To Delete',
          address: '123 Delete St',
          city: 'Paris',
          country: 'FR',
        })
        .select()
        .single();

      if (!newProp) {
        throw new Error('Failed to create test property');
      }

      // Delete it
      const { error } = await client
        .from('properties')
        .delete()
        .eq('id', newProp.id);

      expect(error).toBeNull();
    });

    it('should prevent admin from deleting properties', async () => {
      const client = await createAuthenticatedClient('orgA_admin');
      
      // Create a test property (use owner client)
      const ownerClient = await createAuthenticatedClient('orgA_owner');
      const { data: newProp } = await ownerClient
        .from('properties')
        .insert({
          org_id: TEST_DATA.orgA.orgId,
          name: 'Admin Cannot Delete',
          address: '123 Safe St',
          city: 'Paris',
          country: 'FR',
        })
        .select()
        .single();

      if (!newProp) {
        throw new Error('Failed to create test property');
      }

      // Try to delete as admin
      const { error } = await client
        .from('properties')
        .delete()
        .eq('id', newProp.id);

      expect(error).toBeDefined();
      expect(error?.message).toContain('policy');

      // Cleanup as owner
      await ownerClient.from('properties').delete().eq('id', newProp.id);
    });

    it('should prevent employee from deleting properties', async () => {
      const client = await createAuthenticatedClient('orgA_employee');
      
      // Create a test property (use owner client)
      const ownerClient = await createAuthenticatedClient('orgA_owner');
      const { data: newProp } = await ownerClient
        .from('properties')
        .insert({
          org_id: TEST_DATA.orgA.orgId,
          name: 'Employee Cannot Delete',
          address: '123 Safe St',
          city: 'Paris',
          country: 'FR',
        })
        .select()
        .single();

      if (!newProp) {
        throw new Error('Failed to create test property');
      }

      // Try to delete as employee
      const { error } = await client
        .from('properties')
        .delete()
        .eq('id', newProp.id);

      expect(error).toBeDefined();
      expect(error?.message).toContain('policy');

      // Cleanup as owner
      await ownerClient.from('properties').delete().eq('id', newProp.id);
    });
  });
});
