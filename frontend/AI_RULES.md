# AI Coding Safeguards & Rules

> [!IMPORTANT]
> **CRITICAL RULE FOR ALL AI AGENTS WORKING ON THIS REPO**

## 1. NO "Lazy" Replacements (The "Existing Code" Trap)
**NEVER** replace a file's content with a block that contains abbreviations like:
- `// ... existing code ...`
- `/* ... logic here ... */`

**Reason:** The file writing tools (`replace_file_content`, `write_to_file`) are **literal**. If you write `// ... existing code ...`, you are literally deleting the application logic and replacing it with a comment.
**Action:** Always provide the **complete** code block you are replacing, or use `replace_file_content` on specific, smaller ranges (startLine/endLine) to avoid touching the rest of the file.

## 2. Verify Before Overwriting
Before using `write_to_file` with `Overwrite: true` or replacing a large function header, **READ** the file first (`view_file`). Ensure you are not deleting methods, states, or imports that you are unaware of.

## 3. Atomic Edits Preferred
Prefer multiple small `replace_file_content` calls over one giant rewrite, unless you are 100% sure you have the full, up-to-date file context in your context window.

## 4. Specific Safeguards
- **components/features/ChatBooking.jsx**: This file contains complex multi-step logic (Name, Age, DNI, Location, etc.). Do not reduce it to a skeleton.
