const app = require('../app.js')
const pool = require('../database.js')
const request = require('supertest')

const cleanDatabase = require('./cleanDatabase.js')

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createSpace = require('../modules/spaces/actions/createSpace.js');





let testUser = { username: 'test', email: 'test@example.com', password: '123' }

const fakeUserPayload = {
    id: 1,
    username: 'test'
};
const testUserSessionToken = jwt.sign(fakeUserPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

let testSpace = {}



// Estructura de objetos:
const spaceObj = expect.objectContaining({
    space_id: expect.any(Number),
    space_name: expect.any(String),
    space_description: expect.any(String),
    space_created_at: expect.any(String),
    space_members: expect.arrayContaining([
        expect.objectContaining({
            member_id: expect.any(Number),
            member_username: expect.any(String),
            member_avatarurl: expect.any(String),
            member_rol: expect.any(String)
        })
    ])
});

const userObj = expect.objectContaining({
    id: expect.any(Number),
    username: expect.any(String),
    email: expect.any(String),
    avatarurl: expect.any(String),
})







beforeAll(async () => {
    await cleanDatabase();


    // Crear registros de prueba
    
    // users/authRoutes.js
    const hashed = await bcrypt.hash(testUser.password, 10);
    const res = await pool.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
        [testUser.username, testUser.email, hashed]
    );
    const testUserId = res.rows[0].id
    testUser = { ...testUser, id: testUserId }

    // space/spaceRoutes.js
    const body = {userId: testUserId, spaceName: 'test space name', spaceDescription: 'test space description'}
    testSpace = await createSpace(body.userId, body.spaceName, body.spaceDescription)
    
});

afterAll(async () => {
    await cleanDatabase()

    await pool.end();
});

describe("Auth", () => {
    describe('Signup', () => {
        test('POST /signup valid credentials', async () => {
            const body = {
                username: 'test0',
                email: 'test0@example.com',
                password: '123',
                passwordConfirm: '123'
            }

            const res = await request(app)
                .post('/api/auth/signup')
                .send(body)

            expect(res.statusCode).toBe(201)
            expect(res.body).toEqual(expect.objectContaining({
                token: expect.any(String),
                user: userObj
            }));
        });

        test('POST /signup invalid credentials', async () => {
            const body = {
                username: '',
                email: '',
                password: '123',
                passwordConfirm: '123'
            }

            const res = await request(app)
                .post('/api/auth/signup')
                .send(body)

            expect(res.statusCode).toBe(400)
        });

        test('POST /signup password and confirm_password conflict', async () => {
            const body = {
                username: 'test1',
                email: 'test1@example.com',
                password: '123',
                passwordConfirm: '321'
            }

            const res = await request(app)
                .post('/api/auth/signup')
                .send(body)

            expect(res.statusCode).toBe(400)
        });

        test('POST /signup user already exists', async () => {
            const body = {
                username: 'test',
                email: 'test@example.com',
                password: '123',
                passwordConfirm: '123'
            }

            const res = await request(app)
                .post('/api/auth/signup')
                .send(body)

            expect(res.statusCode).toBe(409)
        });
    })

    describe('Login', () => {
        test('POST /login valid credentials', async () => {
            const body = {
                identifier: 'test',
                password: '123'
            }

            const res = await request(app)
                .post('/api/auth/login')
                .send(body)

            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual(expect.objectContaining({
                token: expect.any(String),
                user: userObj
            }));
        });

        test('POST /login invalid credentials', async () => {
            const body = {
                identifier: '',
                password: ''
            }

            const res = await request(app)
                .post('/api/auth/login')
                .send(body)

            expect(res.statusCode).toBe(400)
        });

        test('POST /login invalid password', async () => {
            const body = {
                identifier: 'test',
                password: '321'
            }

            const res = await request(app)
                .post('/api/auth/login')
                .send(body)

            expect(res.statusCode).toBe(401)
        });

        test('POST /login user not found', async () => {
            const body = {
                identifier: 'abc123test',
                password: '123'
            }

            const res = await request(app)
                .post('/api/auth/login')
                .send(body)

            expect(res.statusCode).toBe(404)
        });
    })

    describe('Get user', () => {
        test('GET /user valid credentials', async () => {
            const res = await request(app)
                .get(`/api/auth/user/${testUser.id}`)
                .set('Authorization', `Bearer ${testUserSessionToken}`)

            expect(res.statusCode).toBe(200)
            expect(res.body).toEqual(
                expect.objectContaining({
                    user: userObj,
                    spaces: expect.any(Array) // cualquier array, vacío o no
                })
            );
            // y solo si no está vacío, validás la forma de sus elementos:
            if (res.body.spaces.length > 0) {
                res.body.spaces.forEach(space => {
                    expect(space).toEqual(spaceObj);
                });
            }


        });

        test('GET /user invalid credentials', async () => {
            const res = await request(app)
                .get(`/api/auth/user/${testUser.id}`)
                .set('Authorization', `Bearer ${testUserSessionToken + 'abc'}`)

            expect(res.statusCode).toBe(401)
        });

        test('GET /user user not found', async () => {
            const res = await request(app)
                .get(`/api/auth/user/${testUser.id + 123}`)
                .set('Authorization', `Bearer ${testUserSessionToken}`)

            expect(res.statusCode).toBe(404)
        });
    })

    describe('Validate token', () => {
        test('GET /validate_token valid credentials', async () => {
            const res = await request(app)
                .get(`/api/auth/validate_token`)
                .set('Authorization', `Bearer ${testUserSessionToken}`)

            expect(res.statusCode).toBe(200)
        });

        test('GET /validate_token invalid credentials', async () => {
            const res = await request(app)
                .get(`/api/auth/validate_token`)
                .set('Authorization', `Bearer ${testUserSessionToken + 'abc'}`)

            expect(res.statusCode).toBe(401)
        });
    })
});

describe('teams', () => {

})