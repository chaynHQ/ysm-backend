import { customAlphabet } from 'nanoid';
const nanoid = customAlphabet('1234567890abcdefghij', 10);

const id = nanoid();

export const authUser = {
  uid: `e2e-user-${id}`,
  name: `Test user ${id}`,
  email: `test${id}@example.org`,
};
