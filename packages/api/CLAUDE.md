# API Package - Development Guidelines

---

# 🚨 CRITICAL REQUIREMENTS

> [!CAUTION]
> **RULE #1: Import Extensions**
>
> Always `.ts` extensions in imports. Never `.js` or no extension.
> ```typescript
> import { options } from './options.ts';  // ✅ CORRECT
> import { options } from './options.js';  // ❌ WRONG
> ```

> [!CAUTION]
> **RULE #2: Nullish Coalescing**
>
> Always `??` for defaults. Never `||` operator.
> ```typescript
> const port = config.port ?? 3000;  // ✅ CORRECT
> const port = config.port || 3000;  // ❌ WRONG (0 becomes 3000)
> ```

> [!WARNING]
> **RULE #3: Research Before Implementation**
>
> Always research new technologies. Never rely solely on training data.
>
> Steps: WebSearch → WebFetch docs → Verify sources → Implement

**→ Fix violations immediately without asking.**

---

## 🎯 Naming Conventions

### Imports
- **Use `type` imports** for TypeScript types when `verbatimModuleSyntax` is enabled:
  ```typescript
  import type { FastifyInstance } from 'fastify';  // ✅ Correct
  import { FastifyInstance } from 'fastify';       // ❌ Wrong (type-only)
  ```


## 📚 References

### Backend (API)
- [Fastify Documentation](https://fastify.dev/)
- [esbuild Documentation](https://esbuild.github.io/)
- [AWS SDK S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Frontend (macOS App)
- [Building a great Mac app with SwiftUI](https://developer.apple.com/documentation/swiftui/building-a-great-mac-app-with-swiftui)
- [NavigationSplitView Documentation](https://developer.apple.com/documentation/swiftui/navigationsplitview)
- [HSplitView Documentation](https://developer.apple.com/documentation/swiftui/hsplitview)
- [Configuring the macOS App Sandbox](https://developer.apple.com/documentation/xcode/configuring-the-macos-app-sandbox)
- [Accessing files from the macOS App Sandbox](https://developer.apple.com/documentation/security/accessing-files-from-the-macos-app-sandbox)
