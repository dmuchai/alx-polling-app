# Polling App Test Suite

This directory contains comprehensive tests for the ALX Polling App, covering unit tests, integration tests, and test utilities.

## Overview

The test suite is designed to ensure the reliability and correctness of critical functionality including:

- **Voting System**: Vote submission, validation, and fingerprinting
- **Poll Management**: Creating, reading, updating, and deleting polls
- **Authentication & Authorization**: User permissions and access control
- **API Endpoints**: HTTP request/response handling
- **Rate Limiting**: Anti-spam and abuse prevention

## Test Structure

```
__tests__/
├── unit/                    # Unit tests for individual functions
│   ├── voting-utils.test.ts # Voting utility functions
│   ├── polls.actions.test.ts # Poll server actions
│   └── voting.actions.test.ts # Voting server actions
├── integration/             # Integration tests for API routes
│   └── vote-api.test.ts    # Voting API endpoint tests
├── utils/                   # Test helper utilities
│   └── test-helpers.ts     # Mock data generators and helpers
└── README.md               # This file
```

## Running Tests

### Prerequisites

Make sure you have installed the test dependencies:

```bash
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test voting-utils.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="voting"
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Aim for >90% coverage on critical business logic.

## Test Categories

### Unit Tests

**Purpose**: Test individual functions and modules in isolation.

#### voting-utils.test.ts
Tests for voting utility functions including:
- `generateVoterFingerprint()` - Voter identification
- `validateVotePermissions()` - Permission checking
- `VoteRateLimiter` - Rate limiting logic
- `sanitizeVoteData()` - Data sanitization
- `validateVotePayload()` - Input validation

#### polls.actions.test.ts
Tests for poll server actions:
- `createPoll()` - Poll creation logic
- `getPoll()` - Poll retrieval with relations
- `updatePoll()` - Poll modification
- `deletePoll()` - Poll deletion
- `getUserPolls()` - User's polls
- `getActivePolls()` - Public poll listing

#### voting.actions.test.ts
Tests for voting server actions:
- `submitVote()` - Vote submission flow
- `getPollResults()` - Results retrieval
- `hasUserVoted()` - Vote checking logic

### Integration Tests

**Purpose**: Test complete workflows and API endpoints.

#### vote-api.test.ts
Tests for the voting API endpoint (`/api/polls/[id]/vote`):

**POST Tests:**
- ✅ Successful authenticated voting
- ✅ Successful anonymous voting
- ❌ Invalid payload validation
- ❌ Poll not found (404)
- ❌ Invalid option selection (400)
- ❌ Permission denied (403)
- ❌ Rate limiting (429)
- ✅ Single-vote poll update behavior
- ❌ Database error handling (500)

**GET Tests:**
- ✅ Successful results retrieval
- ❌ RPC function errors
- ✅ Empty results handling

## Test Patterns

### Happy Path Testing
Tests that verify expected behavior under normal conditions:
```typescript
it('should create poll successfully with valid data', async () => {
  const result = await createPoll(validPollData);
  expect(result.success).toBe(true);
  expect(result.pollId).toBeDefined();
});
```

### Edge Case Testing
Tests that verify behavior at boundaries:
```typescript
it('should reject voting on expired poll', async () => {
  const expiredPoll = { ...mockPoll, expires_at: getExpiredDate() };
  await expect(submitVote(voteData)).rejects.toThrow('Poll has expired');
});
```

### Error Handling Testing
Tests that verify proper error handling:
```typescript
it('should throw error when database operation fails', async () => {
  mockSupabase.from().insert.mockResolvedValue(simulateNetworkError());
  await expect(createPoll(pollData)).rejects.toThrow('Failed to create poll');
});
```

## Mock Strategy

### Supabase Client Mocking
All Supabase operations are mocked to avoid database dependencies:

```typescript
const mockSupabase = createMockSupabaseClient();
mockSupabase.from('polls').select().mockResolvedValue({
  data: mockPollData,
  error: null
});
```

### Next.js Mocking
Next.js specific functions are mocked:

```typescript
jest.mock('next/navigation');
jest.mock('next/headers');
jest.mock('next/cache');
```

### Rate Limiter Mocking
The VoteRateLimiter class is mocked to control rate limiting behavior in tests.

## Test Data

### Mock Data Generators
Use helper functions to generate consistent test data:

```typescript
const mockUser = generateMockUser({ email: 'custom@example.com' });
const mockPoll = generateMockPoll({ title: 'Custom Poll' });
```

### Realistic Test Scenarios
Tests use realistic data that mirrors production scenarios:
- Valid email formats
- Proper timestamp formats
- Realistic user agents and IP addresses
- Valid UUID formats for IDs

## Best Practices

### Test Isolation
- Each test is independent and doesn't rely on other tests
- `beforeEach()` clears all mocks
- Database state is mocked, not shared

### Descriptive Test Names
```typescript
// Good
it('should reject anonymous voting when authentication is required')

// Bad
it('should test auth')
```

### Arrange-Act-Assert Pattern
```typescript
it('should create poll successfully', async () => {
  // Arrange
  const pollData = generateMockPoll();
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });

  // Act
  const result = await createPoll(pollData);

  // Assert
  expect(result.success).toBe(true);
});
```

### Error Message Testing
Always verify specific error messages, not just that errors occur:
```typescript
await expect(submitVote(invalidData))
  .rejects.toThrow('Authentication required to vote on this poll');
```

## Debugging Tests

### Common Issues

1. **Async/Await Problems**: Make sure all async operations are properly awaited
2. **Mock Not Reset**: Use `jest.clearAllMocks()` in `beforeEach()`
3. **Wrong Mock Implementation**: Verify mock return values match expected structure

### Debugging Commands

```bash
# Run single test with detailed output
npm test -- --verbose voting-utils.test.ts

# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Show console.log outputs
npm test -- --verbose --no-silent
```

### Debug Helpers

The test helpers include debugging utilities:
```typescript
const { result, duration } = await measureExecutionTime(() => submitVote(data));
console.log(`Vote submission took ${duration}ms`);
```

## Performance Testing

Some tests include performance expectations:
```typescript
it('should complete vote submission within acceptable time', async () => {
  await expectExecutionTimeUnder(() => submitVote(data), 100); // 100ms max
});
```

## Contributing

### Adding New Tests

1. **Unit Tests**: Add to appropriate file in `unit/` directory
2. **Integration Tests**: Add to `integration/` directory
3. **Test Helpers**: Extend `utils/test-helpers.ts`

### Test Naming Convention

- Files: `*.test.ts` or `*.spec.ts`
- Test suites: `describe('Component/Function Name')`
- Test cases: `it('should [expected behavior] when [condition]')`

### Required Test Types

For new features, include:
- ✅ Happy path test
- ❌ Error case test
- 🔒 Authorization test (if applicable)
- 📊 Edge case test

### Code Coverage Requirements

- **Functions**: >90% coverage
- **Lines**: >85% coverage
- **Branches**: >80% coverage
- **Critical paths**: 100% coverage

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Scheduled nightly runs

### CI Configuration

Tests must pass with:
- Zero test failures
- Coverage thresholds met
- No linting errors
- TypeScript compilation success

## Troubleshooting

### Common Test Failures

1. **"Cannot read property of undefined"**
   - Check mock implementations
   - Verify async operations are awaited

2. **"Expected X but received Y"**
   - Check mock return values
   - Verify test data matches expected format

3. **"Timeout exceeded"**
   - Add proper awaits to async operations
   - Check for infinite loops in mocks

### Getting Help

1. Check existing similar tests for patterns
2. Review mock implementations in `test-helpers.ts`
3. Verify Supabase client mocking matches real API
4. Check Jest configuration in `jest.config.js`

---

## Test Coverage Goals

| Module | Current | Target |
|--------|---------|--------|
| Voting Utils | 95% | 95% |
| Poll Actions | 90% | 95% |
| Voting Actions | 88% | 90% |
| API Routes | 85% | 90% |

---

*Last updated: [Current Date]*
*Test suite version: 1.0.0*