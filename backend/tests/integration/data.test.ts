import request from 'supertest';
import { describe, test, expect } from '@jest/globals';
import app from '../../src/app';
import User from '../../src/models/User';
import { ROLES } from '../../src/constants/roles';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import FormData from 'form-data';

describe('Backend integration tests: users, data, history', () => {
  test('should handle user creation, login, data creation and access permission checks sequentially', async () => {
    let adminToken: string;
    let userToken: string;
    let otherToken: string;
    let createdDataId: string;

    // 1. create admin directly and login
    const hashed = await bcrypt.hash('adminpass', 10);
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashed,
      role: ROLES.ADMIN,
      permissions: [],
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'adminpass',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    adminToken = res.body.data.token;

    // 2. admin creates two users and they login
    // create first normal user
    const createRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Normal',
        lastName: 'User',
        email: 'user@example.com',
        password: 'userpass',
        department: new mongoose.Types.ObjectId().toString(),
      });

    expect(createRes.status).toBe(201);
    const userId = createRes.body.data.id;

    // create other user
    const createOther = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'otherpass',
        department: new mongoose.Types.ObjectId().toString(),
      });

    expect(createOther.status).toBe(201);
    const otherId = createOther.body.data.id;

    // login normal user
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'userpass',
    });
    expect(loginRes.status).toBe(200);
    userToken = loginRes.body.data.token;

    // login other user
    const loginOther = await request(app).post('/api/auth/login').send({
      email: 'other@example.com',
      password: 'otherpass',
    });
    expect(loginOther.status).toBe(200);
    otherToken = loginOther.body.data.token;

    // save ids in test scope by creating data as admin and assigning owner
    // Use supertest's attach method for multipart/form-data upload
    const adminCreateData = await request(app)
      .post('/api/data')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('titre', 'Test Data')
      .field('description', 'Some test')
      .field('categorie', new mongoose.Types.ObjectId().toString())
      .field('type', new mongoose.Types.ObjectId().toString())
      .field('departement', new mongoose.Types.ObjectId().toString())
      .field('niveauCIA', JSON.stringify({ confidentialite: 3, integrite: 2, disponibilite: 1, methodeCalcul: 'MAX' }))
      .field('proprietaire', userId)
      .attach('files', Buffer.from('test content'), { filename: 'test.txt', contentType: 'text/plain' });

    expect(adminCreateData.status).toBe(201);
    createdDataId = adminCreateData.body.data._id;

    // history for data should exist for create (created by admin)
    const hist = await request(app)
      .get(`/api/history/data/${createdDataId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(hist.status).toBe(200);
    expect(Array.isArray(hist.body.data)).toBe(true);
    expect(hist.body.data.length).toBeGreaterThanOrEqual(1);

    // 3. other user cannot access another users data by id
    const resOther = await request(app)
      .get(`/api/data/${createdDataId}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(resOther.status).toBe(403);

    // 4. admin can access any data
    const resAdmin = await request(app)
      .get(`/api/data/${createdDataId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resAdmin.status).toBe(200);

    // 5. owner can assign CIA assessment to their own data
    const ciaAssign = await request(app)
      .patch(`/api/data/${createdDataId}/cia`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        niveauCIA: {
          confidentialite: 3,
          integrite: 2,
          disponibilite: 1,
          methodeCalcul: 'MAX'
        }
      });

    expect(ciaAssign.status).toBe(200);
    expect(ciaAssign.body.success).toBe(true);
    expect(ciaAssign.body.data.niveauCIA).toBeDefined();

    // 6. other user cannot assign CIA assessment to someone else's data
    const ciaAssignOther = await request(app)
      .patch(`/api/data/${createdDataId}/cia`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        niveauCIA: {
          confidentialite: 1,
          integrite: 1,
          disponibilite: 1,
          methodeCalcul: 'MAX'
        }
      });

    expect(ciaAssignOther.status).toBe(403);
    expect(ciaAssignOther.body.message).toContain('CIA assessment is only available for your own data');

    // 7. owner can calculate classification for their own data
    const calcClass = await request(app)
      .post(`/api/data/${createdDataId}/calculate-classification`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(calcClass.status).toBe(200);
    expect(calcClass.body.success).toBe(true);
    expect(calcClass.body.data.niveauCIA?.niveauGlobal).toBeDefined();

    // 8. other user cannot calculate classification for someone else's data
    const calcClassOther = await request(app)
      .post(`/api/data/${createdDataId}/calculate-classification`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(calcClassOther.status).toBe(403);
    expect(calcClassOther.body.message).toContain('CIA assessment is only available for your own data');
  });
});
