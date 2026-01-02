# ESLint v9 Setup Guide

## 🎯 Overview

This project uses **ESLint v9** with the new **Flat Config** format, optimized for Vite + React + TypeScript + Tailwind CSS.

---

## 📦 Installed Plugins

### Core
- `@eslint/js` - Base JavaScript rules
- `typescript-eslint` - TypeScript linting and type checking
- `eslint-plugin-react` - React-specific rules
- `eslint-plugin-react-hooks` - React Hooks rules
- `eslint-plugin-react-refresh` - Fast Refresh / HMR rules

### Code Quality
- `eslint-plugin-import` - Import/export validation and ordering
- `eslint-import-resolver-typescript` - TypeScript path resolution

### Accessibility
- `eslint-plugin-jsx-a11y` - Accessibility best practices

### Styling
- `eslint-plugin-tailwindcss` - Tailwind CSS class ordering and validation

---

## 🔧 Configuration

### File: `eslint.config.js`

The configuration is organized into logical sections:

1. **Global Ignores** - Excludes build artifacts, node_modules, etc.
2. **Base JavaScript** - Rules for `.js` files
3. **TypeScript + React** - Main rules for `.ts`/`.tsx` files
4. **Test Files** - Relaxed rules for test files
5. **Prettier Overrides** - Prevents conflicts with Prettier

---

## 📝 Key Rules

### TypeScript
```javascript
'@typescript-eslint/no-unused-vars': 'warn'
// Warns on unused variables (allows _ prefix to ignore)

'@typescript-eslint/consistent-type-imports': 'warn'
// Enforces `import type` for type-only imports

'@typescript-eslint/no-explicit-any': 'warn'
// Discourages use of `any` type
```

### React
```javascript
'react/jsx-key': 'error'
// Requires key prop in lists

'react/self-closing-comp': 'warn'
// Enforces self-closing tags when no children

'react-refresh/only-export-components': 'warn'
// Ensures Fast Refresh works correctly
```

### React Hooks
```javascript
'react-hooks/rules-of-hooks': 'error'
// Enforces Rules of Hooks

'react-hooks/exhaustive-deps': 'warn'
// Checks effect dependencies
```

### Accessibility
```javascript
'jsx-a11y/anchor-is-valid': 'warn'
// Validates anchor elements

'jsx-a11y/click-events-have-key-events': 'warn'
// Requires keyboard events alongside click events

'jsx-a11y/no-static-element-interactions': 'warn'
// Prevents interactive elements without role
```

### Import Organization
```javascript
'import/order': 'warn'
// Enforces import order:
// 1. react
// 2. External packages
// 3. Internal (@/ paths)
// 4. Parent/sibling imports
// 5. Type imports
// Alphabetically sorted within each group
```

### Tailwind CSS
```javascript
'tailwindcss/classnames-order': 'warn'
// Enforces consistent class order

'tailwindcss/no-contradicting-classname': 'error'
// Catches conflicting classes (e.g., m-2 m-4)
```

---

## 🚀 Running ESLint

### Commands

```bash
# Lint all files
pnpm lint

# Auto-fix issues where possible
pnpm lint --fix

# Lint specific file
pnpm lint src/App.tsx

# Lint with debug info
pnpm lint --debug

# Check config
pnpm eslint --print-config src/App.tsx
```

### CI/CD Integration

```yaml
# .github/workflows/lint.yml
name: Lint

on: [push, pull_request]

jobs:
  eslint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
```

---

## 🎨 IDE Integration

### VS Code

**Recommended Extensions:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

**Settings (.vscode/settings.json):**
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.useFlatConfig": true
}
```

### Other IDEs

- **WebStorm/IntelliJ**: ESLint is built-in, enable in Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
- **Vim/Neovim**: Use ALE or nvim-lspconfig with eslint_d
- **Emacs**: Use flycheck-eslint

---

## 🔍 Common Issues & Fixes

### Issue: "Parsing error: Cannot read file 'tsconfig.json'"

**Solution:**
```bash
# Ensure tsconfig.json exists and is valid
pnpm tsc --noEmit
```

### Issue: Import resolution not working

**Solution:**
Check that paths in `tsconfig.json` match your project structure:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: Too many type-checking errors

**Solution:**
Temporarily disable type-aware rules:
```javascript
// In eslint.config.js, change:
...tseslint.configs.recommended.rules,
// to:
...tseslint.configs.recommendedTypeChecked.rules, // remove this
```

### Issue: Tailwind class order warnings

**Solution:**
Auto-fix with:
```bash
pnpm lint --fix
```

Or configure your cn() function in settings:
```javascript
tailwindcss: {
  callees: ['cn', 'clsx', 'cva'], // add your helpers
}
```

---

## 📊 Rule Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| `error` | Must be fixed | CI fails |
| `warn` | Should be reviewed | CI passes, shows warning |
| `off` | Disabled | No checks |

---

## 🎯 Customization

### Adding Rules

```javascript
// eslint.config.js
{
  files: ['**/*.{ts,tsx}'],
  rules: {
    // Add your custom rules here
    'no-restricted-imports': ['error', {
      patterns: ['../*'] // Prevent relative imports above current dir
    }],
  }
}
```

### Per-File Overrides

```javascript
// Relax rules for specific files
{
  files: ['src/legacy/**/*.ts'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  }
}
```

### Inline Overrides

```typescript
// Disable for next line
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();

// Disable for entire file
/* eslint-disable @typescript-eslint/no-explicit-any */

// Disable specific rule for block
/* eslint-disable react-hooks/exhaustive-deps */
useEffect(() => {
  // ...
}, []); // deps intentionally omitted
/* eslint-enable react-hooks/exhaustive-deps */
```

---

## 🧪 Testing Configuration

Test files have relaxed rules:

```javascript
{
  files: ['**/*.{test,spec}.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
  }
}
```

---

## 🔄 Migration from ESLint v8

### Key Differences

1. **Flat Config** - No more `.eslintrc.json`
2. **Different plugin syntax** - `plugins: { name: plugin }`
3. **Type-aware linting** - Requires `parserOptions.project`
4. **Simplified extends** - Directly spread rule objects

### Migration Steps

1. ✅ Remove `.eslintrc.json` or `.eslintrc.js`
2. ✅ Create `eslint.config.js` (this file)
3. ✅ Update dependencies to v9 compatible versions
4. ✅ Update IDE settings to use flat config
5. ✅ Test: `pnpm lint`

---

## 📈 Performance Tips

### 1. **Disable Type-Aware Rules for Speed**

Type-aware rules are slower. If linting is too slow:

```javascript
// Use base recommended instead of recommendedTypeChecked
...tseslint.configs.recommended.rules,
```

### 2. **Cache Results**

```bash
pnpm lint --cache
```

### 3. **Lint Staged Files Only**

```bash
# In pre-commit hook
git diff --cached --name-only --diff-filter=ACM | \
  grep -E '\.(ts|tsx)$' | \
  xargs pnpm eslint
```

### 4. **Use eslint_d**

```bash
# Install globally
npm i -g eslint_d

# Use in IDE
eslint_d src/App.tsx
```

---

## 📚 Rule Categories

### Safety (Errors)
- Prevent bugs
- TypeScript type safety
- React Hooks rules

### Code Quality (Warnings)
- Unused variables
- Consistent imports
- Component best practices

### Style (Warnings)
- Import order
- Tailwind class order
- Self-closing tags

### Accessibility (Warnings/Errors)
- ARIA attributes
- Keyboard navigation
- Semantic HTML

---

## 🎓 Best Practices

### 1. **Fix Warnings Regularly**
Don't let warnings accumulate. Fix them in batches.

### 2. **Understand Rules**
When a rule triggers, read why:
```bash
pnpm eslint --print-config src/App.tsx | grep "rule-name"
```

### 3. **Auto-Fix First**
Most issues can be auto-fixed:
```bash
pnpm lint --fix
```

### 4. **Team Alignment**
Discuss rule changes with the team before adding.

### 5. **Progressive Enhancement**
Start with recommended rules, add stricter ones gradually.

---

## 🔗 Resources

- [ESLint v9 Docs](https://eslint.org/docs/latest/)
- [TypeScript ESLint](https://typescript-eslint.io/)
- [React Hooks Rules](https://react.dev/reference/react/hooks#rules-of-hooks)
- [JSX a11y Rules](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [Tailwind ESLint Plugin](https://github.com/francoismassart/eslint-plugin-tailwindcss)

---

## 📝 Quick Reference

### Fix All Auto-Fixable Issues
```bash
pnpm lint --fix
```

### Check Specific File
```bash
pnpm lint src/components/MyComponent.tsx
```

### See What Rules Apply
```bash
pnpm eslint --print-config src/App.tsx
```

### Disable Rule Inline
```typescript
// eslint-disable-next-line rule-name
```

### Disable Rule for File
```typescript
/* eslint-disable rule-name */
```

---

**Last Updated:** October 8, 2025  
**ESLint Version:** 9.x  
**Config Format:** Flat Config (eslint.config.js)

