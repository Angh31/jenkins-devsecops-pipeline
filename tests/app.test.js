const request = require('supertest');
const app = require('../src/app');

describe('Todo API', () => {
  it('GET /todos - retorna array vacío al inicio', async () => {
    const res = await request(app).get('/todos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /todos - crea un todo correctamente', async () => {
    const res = await request(app)
      .post('/todos')
      .send({ title: 'Aprender Jenkins' });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Aprender Jenkins');
  });

  it('POST /todos - falla si no hay title', async () => {
    const res = await request(app).post('/todos').send({});
    expect(res.statusCode).toBe(400);
  });
});