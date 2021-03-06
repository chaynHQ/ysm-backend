import { Inject, Injectable } from '@nestjs/common';
import { FIREBASE } from '../firebase/firebase-factory';
import { firebase, FirebaseServices } from '../firebase/firebase.types';
import { Profile, ResourceState } from './profile.types';

@Injectable()
export class ProfileService {
  constructor(@Inject(FIREBASE) private firebase: FirebaseServices) {}

  async get(id: string): Promise<Profile> {
    const doc = await this.profileDocRef(id).get();

    let termsAccepted = false;
    let bookmarkedResources = [];
    let resourceState = {};

    if (doc.exists) {
      const data = doc.data();
      termsAccepted = data.termsAccepted || false;
      bookmarkedResources = data.bookmarkedResources || [];
      resourceState = data.resourceState || {};
    }

    return {
      id,
      termsAccepted,
      bookmarkedResources,
      resourceState,
    };
  }

  async acceptTerms(userId: string): Promise<void> {
    const promise = this.profileDocRef(userId).set(
      {
        termsAccepted: true,
      },
      { merge: true },
    );
    return this.handleWrite(promise);
  }

  async unacceptTerms(userId: string): Promise<void> {
    const promise = this.profileDocRef(userId).set(
      {
        termsAccepted: false,
      },
      { merge: true },
    );
    return this.handleWrite(promise);
  }

  async addBookmarkForResource(userId: string, resourceId: string): Promise<void> {
    const promise = this.profileDocRef(userId).set(
      {
        bookmarkedResources: firebase.firestore.FieldValue.arrayUnion(resourceId),
      },
      { merge: true },
    );
    return this.handleWrite(promise);
  }

  async removeBookmarkForResource(userId: string, resourceId: string): Promise<void> {
    const promise = this.profileDocRef(userId).set(
      {
        bookmarkedResources: firebase.firestore.FieldValue.arrayRemove(resourceId),
      },
      { merge: true },
    );
    return this.handleWrite(promise);
  }

  async updateResourceState(
    userId: string,
    resourceId: string,
    state: ResourceState,
  ): Promise<void> {
    const promise = this.profileDocRef(userId).set(
      {
        resourceState: {
          [resourceId]: state,
        },
      },
      { mergeFields: [`resourceState.${resourceId}`] },
    );
    return this.handleWrite(promise);
  }

  private profileDocRef(id: string): firebase.firestore.DocumentReference {
    return this.firebase.firestore.doc(`profiles/${id}`);
  }

  private async handleWrite(promise: Promise<firebase.firestore.WriteResult>): Promise<void> {
    await promise;

    // TODO: may want to consider logging the successful write operations in the future.

    return;
  }
}
