import { resourcePermissions } from './permissions';

describe('resourcePermissions', () => {
  it('urmează rolurile din rrm-api.yaml pentru adăugare, modificare și ștergere', () => {
    expect(resourcePermissions('STUDENT')).toEqual({
      canCreate: false,
      canEdit: false,
      canDelete: false,
    });
    expect(resourcePermissions('RESEARCHER').canEdit).toBe(false);
    expect(resourcePermissions('RESOURCE_ADMIN')).toEqual({
      canCreate: true,
      canEdit: true,
      canDelete: false,
    });
    expect(resourcePermissions('SYSTEM_ADMIN').canDelete).toBe(true);
  });

  it('cu rolul necunoscut lasă butoanele, iar serverul decide (403)', () => {
    expect(resourcePermissions(null)).toEqual({ canCreate: true, canEdit: true, canDelete: true });
  });
});
