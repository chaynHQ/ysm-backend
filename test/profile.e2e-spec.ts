import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { FIREBASE } from './../src/firebase/firebase-factory';
import { FirebaseServices, Firestore } from './../src/firebase/firebase.types';
import { authUser } from './util/auth-user';
import { deleteUser } from './util/delete-user';
import { generateIdToken } from './util/generate-id-token';

// IMPORTANT – this e2e…
// - Generates and uses a real Firebase Auth token.
// – Persists and cleans up data in Firestore.
// The Firebase project it will talk to is defined by credentials set in the test environment
// (see the README for more details).

async function cleanupProfileDoc(firestore: Firestore, uid: string) {
  return firestore.doc(`profiles/${uid}`).delete();
}

describe('User Profile (e2e)', () => {
  let app: INestApplication;

  let firebaseServices: FirebaseServices;
  let authToken: string;

  let configService: ConfigService;

  afterAll(async () => {
    await deleteUser(firebaseServices.auth, authUser.uid);

    await app.close();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    firebaseServices = app.get<FirebaseServices>(FIREBASE);

    // Only set auth token once as we don't need it renewed on every test case.
    if (!authToken) {
      authToken = await generateIdToken(firebaseServices.auth, authUser.uid, authUser.email);
    }

    configService = app.get<ConfigService>(ConfigService);
  });

  beforeEach(async () => {
    await cleanupProfileDoc(firebaseServices.firestore, authUser.uid);
  });

  afterAll(async () => {
    await cleanupProfileDoc(firebaseServices.firestore, authUser.uid);
  });

  describe('unauthenticated', () => {
    describe('GET /profile', () => {
      it('should be unauthorized', () => {
        return request(app.getHttpServer())
          .get('/profile')
          .expect('Content-Type', /json/)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized: missing required Authorization token',
            error: 'Unauthorized',
          });
      });
    });

    describe('PUT /profile/terms/accept', () => {
      it('should be unauthorized', () => {
        return request(app.getHttpServer())
          .put(`/profile/terms/accept`)
          .expect('Content-Type', /json/)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized: missing required Authorization token',
            error: 'Unauthorized',
          });
      });
    });

    describe('PUT /profile/terms/unaccept', () => {
      it('should be unauthorized', () => {
        return request(app.getHttpServer())
          .put(`/profile/terms/unaccept`)
          .expect('Content-Type', /json/)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized: missing required Authorization token',
            error: 'Unauthorized',
          });
      });
    });

    describe('PUT /profile/bookmarks/resources/:resourceId', () => {
      it('should be unauthorized', () => {
        return request(app.getHttpServer())
          .put(`/profile/bookmarks/resources/12345`)
          .expect('Content-Type', /json/)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized: missing required Authorization token',
            error: 'Unauthorized',
          });
      });
    });

    describe('DELETE /profile/bookmarks/resources/:resourceId', () => {
      it('should be unauthorized', () => {
        return request(app.getHttpServer())
          .delete(`/profile/bookmarks/resources/12345`)
          .expect('Content-Type', /json/)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized: missing required Authorization token',
            error: 'Unauthorized',
          });
      });
    });

    describe('PUT /profile/state/resources/:resourceId', () => {
      it('should be unauthorized', () => {
        return request(app.getHttpServer())
          .put(`/profile/state/resources/12345`)
          .expect('Content-Type', /json/)
          .expect(401, {
            statusCode: 401,
            message: 'Unauthorized: missing required Authorization token',
            error: 'Unauthorized',
          });
      });
    });
  });

  describe('authenticated', () => {
    describe('GET /profile', () => {
      it("should return the authenticated user's profile", () => {
        return request(app.getHttpServer())
          .get('/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {},
          });
      });
    });

    describe('accepting and unaccepting terms', () => {
      it('should update the profile accordingly', async () => {
        const server = app.getHttpServer();
        const authHeader = `Bearer ${authToken}`;

        // Accept terms
        await request(server)
          .put('/profile/terms/accept')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: true,
            bookmarkedResources: [],
            resourceState: {},
          });

        // Should be idempotent
        await request(server)
          .put('/profile/terms/accept')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: true,
            bookmarkedResources: [],
            resourceState: {},
          });

        // Unaccept terms
        await request(server)
          .put('/profile/terms/unaccept')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {},
          });
      });
    });

    describe('adding and removing bookmarks', () => {
      it('should update the profile accordingly', async () => {
        const server = app.getHttpServer();
        const authHeader = `Bearer ${authToken}`;

        // Add a bookmark
        await request(server)
          .put('/profile/bookmarks/resources/12345')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: ['12345'],
            resourceState: {},
          });

        // Add another bookmark
        await request(server)
          .put('/profile/bookmarks/resources/67890')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: ['12345', '67890'],
            resourceState: {},
          });

        // Addition should be idempotent
        await request(server)
          .put('/profile/bookmarks/resources/12345')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: ['12345', '67890'],
            resourceState: {},
          });

        // Remove one of the bookmarks
        await request(server)
          .delete('/profile/bookmarks/resources/12345')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: ['67890'],
            resourceState: {},
          });

        // Removal should be idempotent
        await request(server)
          .delete('/profile/bookmarks/resources/12345')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: ['67890'],
            resourceState: {},
          });
      });
    });

    describe('updating resource state', () => {
      it('should update the profile accordingly', async () => {
        const server = app.getHttpServer();
        const authHeader = `Bearer ${authToken}`;

        // Update state for a resource
        await request(server)
          .put('/profile/state/resources/12345')
          .send({ a: 1 })
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {
              '12345': { a: 1 },
            },
          });

        // Update state for another resource
        await request(server)
          .put('/profile/state/resources/67890')
          .send({ b: 1 })
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {
              '12345': { a: 1 },
              '67890': { b: 1 },
            },
          });

        // Updates are idempotent
        await request(server)
          .put('/profile/state/resources/12345')
          .send({ a: 1 })
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {
              '12345': { a: 1 },
              '67890': { b: 1 },
            },
          });

        // Update state again for the first resource
        await request(server)
          .put('/profile/state/resources/12345')
          .send({ a: 2 })
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {
              '12345': { a: 2 },
              '67890': { b: 1 },
            },
          });

        // Set state to empty object
        await request(server)
          .put('/profile/state/resources/67890')
          .send({})
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {
              '12345': { a: 2 },
              '67890': {},
            },
          });

        // Make sure old fields within resource state are removed
        await request(server)
          .put('/profile/state/resources/12345')
          .send({ aa: 1 })
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {
              '12345': { aa: 1 },
              '67890': {},
            },
          });
      });
    });

    describe('multiple different updates to the profile', () => {
      it('should update the profile accordingly', async () => {
        const server = app.getHttpServer();
        const authHeader = `Bearer ${authToken}`;

        // Accept terms
        await request(server)
          .put('/profile/terms/accept')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: true,
            bookmarkedResources: [],
            resourceState: {},
          });

        // Add a bookmark
        await request(server)
          .put('/profile/bookmarks/resources/12345')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: true,
            bookmarkedResources: ['12345'],
            resourceState: {},
          });

        // Update state for a resource
        await request(server)
          .put('/profile/state/resources/12345')
          .send({ a: 1 })
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: true,
            bookmarkedResources: ['12345'],
            resourceState: {
              '12345': { a: 1 },
            },
          });

        // Remove the bookmark
        await request(server)
          .delete('/profile/bookmarks/resources/12345')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: true,
            bookmarkedResources: [],
            resourceState: {
              '12345': { a: 1 },
            },
          });

        // Set state to empty object
        await request(server)
          .put('/profile/state/resources/12345')
          .send({})
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: true,
            bookmarkedResources: [],
            resourceState: {
              '12345': {},
            },
          });

        // Unaccept terms
        await request(server)
          .put('/profile/terms/unaccept')
          .set('Authorization', authHeader)
          .expect(204);
        await request(server)
          .get('/profile')
          .set('Authorization', authHeader)
          .expect('Content-Type', /json/)
          .expect(200, {
            id: authUser.uid,
            termsAccepted: false,
            bookmarkedResources: [],
            resourceState: {
              '12345': {},
            },
          });
      });
    });
  });

  describe('with a spoofed token', () => {
    it('should not allow this token', () => {
      // A test private key used to sign the spoofed token
      const privateKey = `-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCXa5NxfjFLcQGB\nm/Z6TkbyvCNtf3F/fpQCsAW6svPrEH66A/mTDLyEpjeLCTS5A2cUIWY7GHpbl/nk\ni6VxtFDPirGhJMOyhTO+5GQCgxPzoGchdNx56wz7qcoF/y1Pcg29UmKj+S1HV6rj\nj71k4jCY8GFDrwoQkYv6pbd4qzK3CJ/cftXIJF8/uI/gLHmXjKM0k8yVKlEzwXfT\nZLtS/3zYZbg3xgEJZRv1waWR7H24nyvDd96OZT8WuwvSy1+B46g9lkefyfLqiWkv\nsSAS6LK//PIDqEI7Z6I7RBDcrau6lt++u77i/7XbW0dQ4RABoDE74ioQ5RubHPrP\nPKJDhS21AgMBAAECggEAcFwUSfhhLeEKRBnuWS1yujZfd6ZFG11bCW+CoNqf40MX\nNoMylCq0TR5mQtau98cNm0N5b8qnKQZqGWyCdRBfktIRI0l7qiHrlvA1QiPwDy1s\nucfUvudrd+ezEKYdAkHY7i6PIawKLFFiboBAAvdRJnvhQO9HYaoPHAwSTAmFlYk9\njeJP753O6mKxo4UfuPjzljpzaP/UkQrqMMUrcY6U5pv/9exDYOqw2bF3ICkRQm9n\ntSrm48oSUL+i/vZ1EnVVi5AQN2NK3Mr2akam+cVqCWbATCKy0CmVgm8+xhxGptXM\nzflmMfsJgsVdPoylzhkxhKJEu4tbzvFmPFvGNJpCgQKBgQDIzyxJrg7FzXHrt192\nnwRGbNarnPU/6fgwX38bHKWy2NWyDWeR0F1qaUQqrFT3DYqXUgd3PZpB2ujrFUPv\nSRqhd6LyZgkbnXlIqyJSShhXAhAkqgMXt1YJNXCtHgXkhMx/ELJRmRraG+RwSz6U\n9cELO2NPTwje9e2znPC979hBVQKBgQDBCWrLeM2hcmTQq/fsbI5MI6049LHh5AHJ\n0LphPoPpBNEUmv0RRzNjFxPJq9k/HDwTbUA51yOYMeM816cN95z4jiyApv3rX2oo\ni1p80eHHRJ08g3FBuecmRm2vfQxZxKrPgGP1ZAoppx5GrhJaJEFQ5R4unFDnbDGw\nKh8HKwy64QKBgHjUyLZxKOx3KeSHi8bp+n2SAj5zjNNvqusYm3gp7b7HYRbpn/eK\npJtiSiVPWzTpjgptzpY+mDKmUd8bBazXlVGxlng7U6GtSQykBVv0v96jHCmjr4a2\nx+t0n59b4HnYOuD+n/4fnZu+it/TNw4VLpremmxfh1v6KZUZi3cO+ladAoGAeDvZ\nXOrdiZWq3Z5/Sa9D4oDGQBeJRF20D3QG4tMBbn4ljGQNBFoI08tn89Ep+3kmoiMG\nQgCSlxVbqGXaE4ULLHXBmlBpD9XaVW6W6fAAZRGDrlFglcOpCdoML6X/r1oj2iLq\nH8oz2kXRQczieWrjk/NhnT6X1c06FbPmp5xUzYECgYBZ3+46o4IwzgwLGMlw01yI\nox7EZPIjT2Mlvu72elmdIB1vX8/iDczrdehUTbSJ6L4dtbC2EZQ0TNOAWNfzMyif\nUmFF3eAUi+p6qzsbTHZvoVBmFFOuwSGfVW5rRLb8kWKQ1+LS1YqJ8cQDOFWia6De\nwV53EofK3xmG6QX3WGQGxg==\n-----END PRIVATE KEY-----`;

      // Latest public key ID from: https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
      const keyId = 'd10c8f8b0dc7f55e2b3541f29e5ac3743f77ccee';

      const serviceAccount = configService.get('firebase.serviceAccount');
      const projectId = serviceAccount.project_id;

      const authTime = Date.now() - 5 * 60 * 1000; // 5 mins ago

      const spoofedToken = jwt.sign(
        {
          iat: authTime,
          auth_time: authTime,
          user_id: authUser.uid,
          name: authUser.name,
          email: authUser.email,
          email_verified: true,
          firebase: {
            identities: {
              email: [authUser.email],
            },
            sign_in_provider: 'password',
          },
        },
        privateKey,
        {
          algorithm: 'RS256',
          keyid: keyId,
          issuer: `https://securetoken.google.com/${projectId}`,
          audience: projectId,
          subject: authUser.uid,
          expiresIn: '10m',
        },
      );

      return request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${spoofedToken}`)
        .expect('Content-Type', /json/)
        .expect(401, {
          statusCode: 401,
          message: 'Unauthorized: token is expired or invalid',
          error: 'Unauthorized',
        });
    });
  });
});
