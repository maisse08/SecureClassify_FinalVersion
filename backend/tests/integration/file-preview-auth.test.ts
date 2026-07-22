import request from 'supertest';
import { describe, test, expect } from '@jest/globals';
import app from '../../src/app';
import User from '../../src/models/User';
import Data from '../../src/models/Data';
import Share from '../../src/models/Share';
import { ROLES } from '../../src/constants/roles';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

describe('File preview/download authorization tests', () => {
  test('should handle file preview/download authorization checks', async () => {
    // Create test file in uploads directory
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const testFileName = 'test-file.txt';
    fs.writeFileSync(path.join(uploadDir, testFileName), 'test content');

    // Create admin
    const hashedAdmin = await bcrypt.hash('adminpass', 10);
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin-preview@example.com',
      password: hashedAdmin,
      role: ROLES.ADMIN,
      permissions: [],
      department: new mongoose.Types.ObjectId().toString(),
    });

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin-preview@example.com',
      password: 'adminpass',
    });
    expect(adminLogin.status).toBe(200);
    const adminToken = adminLogin.body.data.token;

    // Create owner
    const hashedOwner = await bcrypt.hash('ownerpass', 10);
    const owner = await User.create({
      firstName: 'Owner',
      lastName: 'User',
      email: 'owner-preview@example.com',
      password: hashedOwner,
      role: ROLES.EMPLOYEE,
      permissions: [],
      department: new mongoose.Types.ObjectId().toString(),
    });

    const ownerLogin = await request(app).post('/api/auth/login').send({
      email: 'owner-preview@example.com',
      password: 'ownerpass',
    });
    expect(ownerLogin.status).toBe(200);
    const ownerToken = ownerLogin.body.data.token;

    // Create shared user
    const hashedShared = await bcrypt.hash('sharedpass', 10);
    const sharedUser = await User.create({
      firstName: 'Shared',
      lastName: 'User',
      email: 'shared-preview@example.com',
      password: hashedShared,
      role: ROLES.EMPLOYEE,
      permissions: [],
      department: new mongoose.Types.ObjectId().toString(),
    });

    const sharedLogin = await request(app).post('/api/auth/login').send({
      email: 'shared-preview@example.com',
      password: 'sharedpass',
    });
    expect(sharedLogin.status).toBe(200);
    const sharedUserToken = sharedLogin.body.data.token;

    // Create unauthorized user
    const hashedUnauth = await bcrypt.hash('unauthpass', 10);
    const unauthUser = await User.create({
      firstName: 'Unauth',
      lastName: 'User',
      email: 'unauth-preview@example.com',
      password: hashedUnauth,
      role: ROLES.EMPLOYEE,
      permissions: [],
      department: new mongoose.Types.ObjectId().toString(),
    });

    const unauthLogin = await request(app).post('/api/auth/login').send({
      email: 'unauth-preview@example.com',
      password: 'unauthpass',
    });
    expect(unauthLogin.status).toBe(200);
    const unauthorizedToken = unauthLogin.body.data.token;

    // Create dataset as admin with owner
    const createRes = await request(app)
      .post('/api/data')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('titre', 'Preview Test Data')
      .field('description', 'Testing file preview')
      .field('categorie', new mongoose.Types.ObjectId().toString())
      .field('proprietaire', owner._id.toString())
      .attach('files', Buffer.from('test content'), { filename: testFileName, contentType: 'text/plain' });

    expect(createRes.status).toBe(201);
    const testDataId = createRes.body.data._id;

    // Verify file was added to importedFiles and get the actual filename
    const data = await Data.findById(testDataId);
    expect(data?.importedFiles).toBeDefined();
    expect(data?.importedFiles?.length).toBeGreaterThan(0);
    const actualFilename = data!.importedFiles![0].filename;

    // Test 1: Admin should be able to preview file
    const adminPreview = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminPreview.status).toBe(200);
    expect(adminPreview.headers['content-type']).toContain('text/plain');

    // Test 2: Owner should be able to preview file
    const ownerPreview = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(ownerPreview.status).toBe(200);
    expect(ownerPreview.headers['content-type']).toContain('text/plain');

    // Test 3: Shared user with Read access should be able to preview file
    const adminUser = await User.findOne({ email: 'admin-preview@example.com' });
    await Share.create({
      document: new mongoose.Types.ObjectId(testDataId),
      documentTitle: 'Preview Test Data',
      sender: adminUser!._id,
      senderEmail: 'admin-preview@example.com',
      receiver: sharedUser._id,
      receiverEmail: 'shared-preview@example.com',
      permission: 'Read',
      sharedDate: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Active',
    });

    const sharedPreview = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}`)
      .set('Authorization', `Bearer ${sharedUserToken}`);

    expect(sharedPreview.status).toBe(200);
    expect(sharedPreview.headers['content-type']).toContain('text/plain');

    // Test 4: Unauthorized user should receive 403
    const unauthPreview = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}`)
      .set('Authorization', `Bearer ${unauthorizedToken}`);

    expect(unauthPreview.status).toBe(403);
    expect(unauthPreview.body.success).toBe(false);

    // Test 5: Admin should be able to download file
    const adminDownload = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}?download=true`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminDownload.status).toBe(200);
    expect(adminDownload.headers['content-disposition']).toContain('attachment');

    // Test 6: Owner should be able to download file
    const ownerDownload = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}?download=true`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(ownerDownload.status).toBe(200);
    expect(ownerDownload.headers['content-disposition']).toContain('attachment');

    // Test 7: Shared user should be able to download file
    const sharedDownload = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}?download=true`)
      .set('Authorization', `Bearer ${sharedUserToken}`);

    expect(sharedDownload.status).toBe(200);
    expect(sharedDownload.headers['content-disposition']).toContain('attachment');

    // Test 8: Unauthorized user should receive 403 when downloading
    const unauthDownload = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}?download=true`)
      .set('Authorization', `Bearer ${unauthorizedToken}`);

    expect(unauthDownload.status).toBe(403);
    expect(unauthDownload.body.success).toBe(false);

    // Test 9: User with expired share should receive 403
    const hashedExpired = await bcrypt.hash('expiredpass', 10);
    const expiredUser = await User.create({
      firstName: 'Expired',
      lastName: 'User',
      email: 'expired-preview@example.com',
      password: hashedExpired,
      role: ROLES.EMPLOYEE,
      permissions: [],
      department: new mongoose.Types.ObjectId().toString(),
    });

    const expiredLogin = await request(app).post('/api/auth/login').send({
      email: 'expired-preview@example.com',
      password: 'expiredpass',
    });
    expect(expiredLogin.status).toBe(200);
    const expiredToken = expiredLogin.body.data.token;

    await Share.create({
      document: new mongoose.Types.ObjectId(testDataId),
      documentTitle: 'Preview Test Data',
      sender: adminUser!._id,
      senderEmail: 'admin-preview@example.com',
      receiver: expiredUser._id,
      receiverEmail: 'expired-preview@example.com',
      permission: 'Read',
      sharedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expirationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      status: 'Active',
    });

    const expiredPreview = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}`)
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(expiredPreview.status).toBe(403);
    expect(expiredPreview.body.success).toBe(false);

    // Test 10: User with revoked share should receive 403
    const hashedRevoked = await bcrypt.hash('revokedpass', 10);
    const revokedUser = await User.create({
      firstName: 'Revoked',
      lastName: 'User',
      email: 'revoked-preview@example.com',
      password: hashedRevoked,
      role: ROLES.EMPLOYEE,
      permissions: [],
      department: new mongoose.Types.ObjectId().toString(),
    });

    const revokedLogin = await request(app).post('/api/auth/login').send({
      email: 'revoked-preview@example.com',
      password: 'revokedpass',
    });
    expect(revokedLogin.status).toBe(200);
    const revokedToken = revokedLogin.body.data.token;

    const revokedShare = await Share.create({
      document: new mongoose.Types.ObjectId(testDataId),
      documentTitle: 'Preview Test Data',
      sender: adminUser!._id,
      senderEmail: 'admin-preview@example.com',
      receiver: revokedUser._id,
      receiverEmail: 'revoked-preview@example.com',
      permission: 'Read',
      sharedDate: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'Active',
    });

    revokedShare.status = 'Revoked';
    await revokedShare.save();

    const revokedPreview = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}`)
      .set('Authorization', `Bearer ${revokedToken}`);

    expect(revokedPreview.status).toBe(403);
    expect(revokedPreview.body.success).toBe(false);

    // Test 11: User with permanent share should be able to preview file
    const hashedPerm = await bcrypt.hash('permpass', 10);
    const permUser = await User.create({
      firstName: 'Permanent',
      lastName: 'User',
      email: 'perm-preview@example.com',
      password: hashedPerm,
      role: ROLES.EMPLOYEE,
      permissions: [],
      department: new mongoose.Types.ObjectId().toString(),
    });

    const permLogin = await request(app).post('/api/auth/login').send({
      email: 'perm-preview@example.com',
      password: 'permpass',
    });
    expect(permLogin.status).toBe(200);
    const permToken = permLogin.body.data.token;

    await Share.create({
      document: new mongoose.Types.ObjectId(testDataId),
      documentTitle: 'Preview Test Data',
      sender: adminUser!._id,
      senderEmail: 'admin-preview@example.com',
      receiver: permUser._id,
      receiverEmail: 'perm-preview@example.com',
      permission: 'Read',
      sharedDate: new Date(),
      expirationDate: new Date(Date.now() + 999 * 365 * 24 * 60 * 60 * 1000),
      status: 'Active',
    });

    const permPreview = await request(app)
      .get(`/api/data/${testDataId}/files/${actualFilename}`)
      .set('Authorization', `Bearer ${permToken}`);

    expect(permPreview.status).toBe(200);
    expect(permPreview.headers['content-type']).toContain('text/plain');
  });
});