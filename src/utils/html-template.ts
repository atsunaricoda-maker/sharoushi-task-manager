/**
 * HTML Template utility for TypeScript
 * Simple tagged template literal function for HTML content
 */

export function html(strings: TemplateStringsArray, ...values: any[]): string {
  let result = '';
  
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += String(values[i]);
    }
  }
  
  return result;
}