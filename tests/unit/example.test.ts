describe('Example Test Suite', () => {
  it('should pass basic math test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const greeting = 'Hoostn';
    expect(greeting.toLowerCase()).toBe('hoostn');
  });
});
