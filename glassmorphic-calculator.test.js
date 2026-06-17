const { calculate, formatMathResult } = require('../../calculator/script.js');

describe('Glassmorphic Calculator Mathematics Unit Tests', () => {

  test('1. Basic Arithmetic Operations', () => {
    expect(calculate('10', '5', '+')).toBe('15');
    expect(calculate('10', '5', '-')).toBe('5');
    expect(calculate('10', '5', '*')).toBe('50');
    expect(calculate('10', '5', '/')).toBe('2');
  });

  test('2. Floating Point Precision Rounding', () => {
    // Standard Javascript floating point errors:
    // 0.1 + 0.2 = 0.30000000000000004
    expect(calculate('0.1', '0.2', '+')).toBe('0.3');
    
    // 0.7 + 0.1 = 0.7999999999999999
    expect(calculate('0.7', '0.1', '+')).toBe('0.8');

    // Multiplication precision
    expect(calculate('0.1', '0.1', '*')).toBe('0.01');
    expect(calculate('1.0000000001', '2', '*')).toBe('2.0000000002');
  });

  test('3. Division by Zero Safety', () => {
    expect(calculate('12', '0', '/')).toBe('Error: Division by Zero');
    expect(calculate('0', '0', '/')).toBe('Error: Division by Zero');
    expect(calculate('-5', '0', '/')).toBe('Error: Division by Zero');
  });

  test('4. Input Validation & Error Handling', () => {
    expect(calculate('abc', '5', '+')).toBe('Error');
    expect(calculate('10', 'xyz', '-')).toBe('Error');
    expect(calculate('NaN', '2', '*')).toBe('Error');
  });

  test('5. Decimal Result Formatting limits', () => {
    // Test formatMathResult direct limit
    expect(formatMathResult(0.3333333333333333)).toBe('0.3333333333');
    expect(formatMathResult(1.23456789012345)).toBe('1.2345678901');
    expect(formatMathResult(100)).toBe('100');
    expect(formatMathResult(Infinity)).toBe('Error');
  });
});
