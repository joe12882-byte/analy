# Security Specification

## Data Invariants
1. `users/{userId}`: A user can only write to their own profile, except for the `role` field.
2. `users/{userId}/sessions/{sessionId}`: A user can only access their own sessions.
3. `vocabulary/{vocabId}`: Admin users can create/update vocabulary. Normal users can read it.

## The "Dirty Dozen" Payloads
1. User creating another user's profile (`ownerId` mismatch)
2. User spoofing `role` to 'admin'
3. User attempting to delete another user's profile
4. Malicious user pushing 2MB string to username
5. Session created with mismatching `ownerId`
6. Accessing session of another user via direct path
7. Appending more than max fields to a valid update
8. Creating a user with `missing required fields`
9. Pushing incorrect type to `isAnonymous` inside user
10. Tampering with `createdAt` timestamp during update
11. Not verified user writing data
12. Admin modifying sys-fields explicitly

## The Test Runner (firestore.rules.test.ts)
This will be output shortly.
