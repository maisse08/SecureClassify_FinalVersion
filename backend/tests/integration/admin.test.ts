
import request from 'supertest';
import { describe, test, expect, beforeAll } from '@jest/globals';
import app from '../../src/app';
import User from '../../src/models/User';
import Category from '../../src/models/Category';
import Department from '../../src/models/Department';
import DataType from '../../src/models/DataType';
import Data from '../../src/models/Data';
import Share from '../../src/models/Share';
import Trash from '../../src/models/Trash';
import { ROLES } from '../../src/constants/roles';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

describe('Admin Function Tests', () => {
  let adminToken: string;
  let userToken: string;
  let otherUserToken: string;
  let createdUserId: string;
  let createdCategoryId: string;
  let createdDepartmentId: string;
  let createdDataTypeId: string;
  let createdDataId: string;
  let createdShareId: string;
  let createdTrashId: string;

  beforeAll(async () => {
    // Clean up any existing test data
    await User.deleteMany({ email: { $in: ['admin@example.com', 'user@example.com', 'other@example.com'] } });
    await Category.deleteMany({});
    await Department.deleteMany({});
    await DataType.deleteMany({});
    await Data.deleteMany({});
    await Share.deleteMany({});
    await Trash.deleteMany({});

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('adminpass', 10);
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedAdminPassword,
      role: ROLES.ADMIN,
      permissions: [],
    });

    // Create regular users
    const hashedUserPassword = await bcrypt.hash('userpass', 10);
    const user = await User.create({
      firstName: 'Normal',
      lastName: 'User',
      email: 'user@example.com',
      password: hashedUserPassword,
      role: ROLES.EMPLOYEE,
      department: new mongoose.Types.ObjectId().toString(),
      permissions: [],
    });

    const hashedOtherPassword = await bcrypt.hash('otherpass', 10);
    const otherUser = await User.create({
      firstName: 'Other',
      lastName: 'User',
      email: 'other@example.com',
      password: hashedOtherPassword,
      role: ROLES.EMPLOYEE,
      department: new mongoose.Types.ObjectId().toString(),
      permissions: [],
    });

    // Login admin
    const adminLoginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'adminpass',
    });
    adminToken = adminLoginRes.body.data.token;

    // Login regular user
    const userLoginRes = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'userpass',
    });
    userToken = userLoginRes.body.data.token;

    // Login other user
    const otherLoginRes = await request(app).post('/api/auth/login').send({
      email: 'other@example.com',
      password: 'otherpass',
    });
    otherUserToken = otherLoginRes.body.data.token;

    createdUserId = user._id.toString();
  });

  describe('User Management', () => {
    test('admin can view all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3); // admin + 2 regular users
    });

    test('regular user cannot view all users without permission', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });

    test('admin can create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          password: 'newpass',
          role: 'EMPLOYEE',
          department: new mongoose.Types.ObjectId().toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('newuser@example.com');
    });

    test('admin can view specific user', async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('user@example.com');
    });

    test('admin can update user', async () => {
      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Updated');
    });

    test('admin can add permission to user', async () => {
      const res = await request(app)
        .post(`/api/users/${createdUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permission: 'users.create',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.permissions).toContain('users.create');
    });

    test('admin can remove permission from user', async () => {
      const res = await request(app)
        .delete(`/api/users/${createdUserId}/permissions/users.create`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.permissions).not.toContain('users.create');
    });

    test('non-admin cannot manage permissions', async () => {
      const addRes = await request(app)
        .post(`/api/users/${createdUserId}/permissions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          permission: 'users.create',
        });

      expect(addRes.status).toBe(403);
    });
  });

  describe('Category Management', () => {
    beforeAll(async () => {
      // Create a test category
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          description: 'Test description',
        });
      createdCategoryId = res.body.data._id;
    });

    test('admin can view all categories', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('admin can create category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Category',
          description: 'New category description',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Category');
    });

    test('admin can update category', async () => {
      const res = await request(app)
        .put(`/api/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Category');
    });

    test('admin can deactivate category', async () => {
      const res = await request(app)
        .patch(`/api/categories/${createdCategoryId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deactivated');
    });

    test('admin can activate category', async () => {
      const res = await request(app)
        .patch(`/api/categories/${createdCategoryId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('activated');
    });

    test('admin can view archived categories', async () => {
      // First deactivate the category
      await request(app)
        .patch(`/api/categories/${createdCategoryId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .get('/api/categories/archived')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('admin can permanently delete category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${createdCategoryId}/permanent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('permanently deleted');
    });
  });

  describe('Department Management', () => {
    beforeAll(async () => {
      // Create a test department
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Department',
          description: 'Test description',
        });
      createdDepartmentId = res.body.data._id;
    });

    test('admin can view all departments', async () => {
      const res = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('admin can create department', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Department',
          description: 'New department description',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Department');
    });

    test('admin can update department', async () => {
      const res = await request(app)
        .put(`/api/departments/${createdDepartmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Department',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Department');
    });

    test('admin can deactivate department', async () => {
      const res = await request(app)
        .patch(`/api/departments/${createdDepartmentId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deactivated');
    });

    test('admin can activate department', async () => {
      const res = await request(app)
        .patch(`/api/departments/${createdDepartmentId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('activated');
    });

    test('admin can view archived departments', async () => {
      // First deactivate the department
      await request(app)
        .patch(`/api/departments/${createdDepartmentId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .get('/api/departments/archived')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('admin can permanently delete department', async () => {
      const res = await request(app)
        .delete(`/api/departments/${createdDepartmentId}/permanent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('permanently deleted');
    });
  });

  describe('Data Type Management', () => {
    beforeAll(async () => {
      // Create a test data type
      const res = await request(app)
        .post('/api/datatypes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test DataType',
          description: 'Test description',
        });
      createdDataTypeId = res.body.data._id;
    });

    test('admin can view all data types', async () => {
      const res = await request(app)
        .get('/api/datatypes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('admin can create data type', async () => {
      const res = await request(app)
        .post('/api/datatypes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New DataType',
          description: 'New datatype description',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New DataType');
    });

    test('admin can update data type', async () => {
      const res = await request(app)
        .put(`/api/datatypes/${createdDataTypeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated DataType',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated DataType');
    });

    test('admin can deactivate data type', async () => {
      const res = await request(app)
        .patch(`/api/datatypes/${createdDataTypeId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deactivated');
    });

    test('admin can activate data type', async () => {
      const res = await request(app)
        .patch(`/api/datatypes/${createdDataTypeId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('activated');
    });

    test('admin can view archived data types', async () => {
      // First deactivate the data type
      await request(app)
        .patch(`/api/datatypes/${createdDataTypeId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app)
        .get('/api/datatypes/archived')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('admin can permanently delete data type', async () => {
      const res = await request(app)
        .delete(`/api/datatypes/${createdDataTypeId}/permanent`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('permanently deleted');
    });
  });

  describe('Data Management', () => {
    beforeAll(async () => {
      // Create test data as admin
      const res = await request(app)
        .post('/api/data')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titre', 'Admin Test Data')
        .field('description', 'Test data created by admin')
        .field('categorie', new mongoose.Types.ObjectId().toString())
        .field('type', new mongoose.Types.ObjectId().toString())
        .field('departement', new mongoose.Types.ObjectId().toString())
        .field('niveauCIA', JSON.stringify({ confidentialite: 3, integrite: 2, disponibilite: 1, methodeCalcul: 'MAX' }))
        .field('proprietaire', createdUserId)
        .attach('files', Buffer.from('test content'), { filename: 'test.txt', contentType: 'text/plain' });

      createdDataId = res.body.data._id;
    });

    test('admin can view all data', async () => {
      const res = await request(app)
        .get('/api/data')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('admin can view any user\'s data by ID', async () => {
      const res = await request(app)
        .get(`/api/data/${createdDataId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.titre).toBe('Admin Test Data');
    });

    test('admin can update any user\'s data', async () => {
      const res = await request(app)
        .put(`/api/data/${createdDataId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titre', 'Updated Admin Test Data')
        .field('description', 'Updated description');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.titre).toBe('Updated Admin Test Data');
    });

    test('admin can assign CIA assessment to any data', async () => {
      const res = await request(app)
        .patch(`/api/data/${createdDataId}/cia`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          niveauCIA: {
            confidentialite: 4,
            integrite: 3,
            disponibilite: 2,
            methodeCalcul: 'MAX'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.niveauCIA).toBeDefined();
    });

    test('admin can calculate classification for any data', async () => {
      const res = await request(app)
        .post(`/api/data/${createdDataId}/calculate-classification`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.niveauCIA?.niveauGlobal).toBeDefined();
    });

    test('admin can delete any user\'s data', async () => {
      const res = await request(app)
        .delete(`/api/data/${createdDataId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Share Management', () => {
    test('admin can view all shares endpoint', async () => {
      const res = await request(app)
        .get('/api/shares')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Trash Management', () => {
    beforeAll(async () => {
      // Create data and move to trash
      const dataRes = await request(app)
        .post('/api/data')
        .set('Authorization', `Bearer ${userToken}`)
        .field('titre', 'Trash Test Data')
        .field('description', 'Data for trash test')
        .field('categorie', new mongoose.Types.ObjectId().toString())
        .field('type', new mongoose.Types.ObjectId().toString())
        .field('departement', new mongoose.Types.ObjectId().toString())
        .attach('files', Buffer.from('test content'), { filename: 'test.txt', contentType: 'text/plain' });

      const dataId = dataRes.body.data._id;

      // Delete the data (moves to trash)
      await request(app)
        .delete(`/api/data/${dataId}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Get trash entry
      const trashRes = await request(app)
        .get('/api/trash')
        .set('Authorization', `Bearer ${userToken}`);

      if (trashRes.body.data && trashRes.body.data.length > 0) {
        createdTrashId = trashRes.body.data[0]._id;
      }
    });

    test('admin can view all trash entries', async () => {
      const res = await request(app)
        .get('/api/trash')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('admin can permanently delete any trash entry', async () => {
      if (!createdTrashId) {
        // Skip if no trash was created
        return;
      }

      const res = await request(app)
        .delete(`/api/trash/${createdTrashId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('permanently deleted');
    });

    test('admin can restore any trash entry', async () => {
      // Create and delete data again
      const dataRes = await request(app)
        .post('/api/data')
        .set('Authorization', `Bearer ${userToken}`)
        .field('titre', 'Restore Test Data')
        .field('description', 'Data for restore test')
        .field('categorie', new mongoose.Types.ObjectId().toString())
        .field('type', new mongoose.Types.ObjectId().toString())
        .field('departement', new mongoose.Types.ObjectId().toString())
        .attach('files', Buffer.from('test content'), { filename: 'test.txt', contentType: 'text/plain' });

      const dataId = dataRes.body.data._id;

      await request(app)
        .delete(`/api/data/${dataId}`)
        .set('Authorization', `Bearer ${userToken}`);

      const trashRes = await request(app)
        .get('/api/trash')
        .set('Authorization', `Bearer ${userToken}`);

      if (trashRes.body.data && trashRes.body.data.length > 0) {
        const trashId = trashRes.body.data[0]._id;

        // Admin restores the data
        const restoreRes = await request(app)
          .put(`/api/trash/${trashId}/restore`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(restoreRes.status).toBe(200);
        expect(restoreRes.body.success).toBe(true);
        expect(restoreRes.body.message).toContain('restored');
      }
    });
  });

  describe('History Management', () => {
    beforeAll(async () => {
      // Create data to generate history
      const dataRes = await request(app)
        .post('/api/data')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titre', 'History Test Data')
        .field('description', 'Data for history test')
        .field('categorie', new mongoose.Types.ObjectId().toString())
        .field('type', new mongoose.Types.ObjectId().toString())
        .field('departement', new mongoose.Types.ObjectId().toString())
        .attach('files', Buffer.from('test content'), { filename: 'test.txt', contentType: 'text/plain' });

      createdDataId = dataRes.body.data._id;
    });

    test('admin can view any data\'s history', async () => {
      const res = await request(app)
        .get(`/api/history/data/${createdDataId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('admin can view all data history', async () => {
      const res = await request(app)
        .get('/api/history/data')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('admin can view connection history', async () => {
      const res = await request(app)
        .get('/api/history/connections')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Dashboard Access', () => {
    test('admin can access dashboard', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('admin dashboard shows system-wide statistics', async () => {
      const res = await request(app)
        .get('/api/dashboard/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Dashboard should contain statistics
      expect(res.body.data).toBeDefined();
    });
  });

  describe('Permission Delegation', () => {
    test('admin can delegate user management permission', async () => {
      // Create a new user to delegate permissions to
      const userRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Delegate',
          lastName: 'User',
          email: 'delegate@example.com',
          password: 'delegatepass',
          role: 'EMPLOYEE',
          department: new mongoose.Types.ObjectId().toString(),
        });

      const delegateId = userRes.body.data.id;

      // Add permission
      const addRes = await request(app)
        .post(`/api/users/${delegateId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permission: 'categories.create',
        });

      expect(addRes.status).toBe(200);
      expect(addRes.body.data.permissions).toContain('categories.create');

      // Login as the delegated user
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'delegate@example.com',
        password: 'delegatepass',
      });
      const delegateToken = loginRes.body.data.token;

      // Verify delegated user can now create categories
      const createRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${delegateToken}`)
        .send({
          name: 'Delegated Category',
          description: 'Created by delegated user',
        });

      expect(createRes.status).toBe(201);
    });

    test('admin can delegate data management permission', async () => {
      const userRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Data',
          lastName: 'Manager',
          email: 'datamanager@example.com',
          password: 'datapass',
          role: 'EMPLOYEE',
          department: new mongoose.Types.ObjectId().toString(),
        });

      const managerId = userRes.body.data.id;

      // Add data.view.others permission
      const addRes = await request(app)
        .post(`/api/users/${managerId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          permission: 'data.view.others',
        });

      expect(addRes.status).toBe(200);
      expect(addRes.body.data.permissions).toContain('data.view.others');

      // Login as the delegated user
      const loginRes = await request(app).post('/api/auth/login').send({
        email: 'datamanager@example.com',
        password: 'datapass',
      });
      const managerToken = loginRes.body.data.token;

      // Verify delegated user can view all data
      const dataRes = await request(app)
        .get('/api/data')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(dataRes.status).toBe(200);
      expect(dataRes.body.success).toBe(true);
    });
  });

  describe('Cross-User Data Access', () => {
    test('admin can access data created by any user', async () => {
      // Create data as regular user
      const userDataRes = await request(app)
        .post('/api/data')
        .set('Authorization', `Bearer ${userToken}`)
        .field('titre', 'User Data')
        .field('description', 'Data created by regular user')
        .field('categorie', new mongoose.Types.ObjectId().toString())
        .field('type', new mongoose.Types.ObjectId().toString())
        .field('departement', new mongoose.Types.ObjectId().toString())
        .attach('files', Buffer.from('test content'), { filename: 'test.txt', contentType: 'text/plain' });

      const userDataId = userDataRes.body.data._id;

      // Admin can view it
      const adminViewRes = await request(app)
        .get(`/api/data/${userDataId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminViewRes.status).toBe(200);
      expect(adminViewRes.body.data.titre).toBe('User Data');

      // Admin can update it
      const adminUpdateRes = await request(app)
        .put(`/api/data/${userDataId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('titre', 'Admin Updated User Data');

      expect(adminUpdateRes.status).toBe(200);
      expect(adminUpdateRes.body.data.titre).toBe('Admin Updated User Data');
    });

    test('admin can view history of any user\'s data', async () => {
      const userDataRes = await request(app)
        .post('/api/data')
        .set('Authorization', `Bearer ${userToken}`)
        .field('titre', 'History Test')
        .field('description', 'Data for history test')
        .field('categorie', new mongoose.Types.ObjectId().toString())
        .field('type', new mongoose.Types.ObjectId().toString())
        .field('departement', new mongoose.Types.ObjectId().toString())
        .attach('files', Buffer.from('test content'), { filename: 'test.txt', contentType: 'text/plain' });

      const dataId = userDataRes.body.data._id;

      // Admin can view history
      const historyRes = await request(app)
        .get(`/api/history/data/${dataId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.success).toBe(true);
    });
  });

  describe('System-wide Operations', () => {
    test('admin can view all trash entries', async () => {
      const res = await request(app)
        .get('/api/trash')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

});
