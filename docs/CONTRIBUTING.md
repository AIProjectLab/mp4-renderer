# Contributing to MP4 Renderer

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

---

## Getting Started

### 1. Fork & Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/yourusername/mp4-renderer.git
cd mp4-renderer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Development Workflow

### Creating a Feature Branch

```bash
# Create a new branch for your feature
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Making Changes

1. **Code Style** — Follow existing code patterns
2. **Comments** — Add comments for complex logic
3. **Testing** — Test your changes thoroughly
4. **Documentation** — Update docs if needed

### Committing Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add feature: description of what was added"

# Push to your fork
git push origin feature/your-feature-name
```

### Creating a Pull Request

1. Go to GitHub and create a Pull Request
2. Provide a clear title and description
3. Reference any related issues
4. Wait for review and feedback

---

## Types of Contributions

### Bug Fixes
- Identify the issue
- Create a test case
- Fix the bug
- Verify the fix works
- Submit PR with explanation

### New Features
- Discuss in Issues first
- Implement feature
- Add documentation
- Test thoroughly
- Submit PR with examples

### Documentation
- Fix typos or unclear sections
- Add examples
- Improve organization
- Update outdated information

### Scene Files
- Create new scene animations
- Place in `/scenes` folder
- Update `/scenes/README.md`
- Test with renderer

---

## Project Structure

```
mp4-renderer/
├── app.js                 # Main application logic
├── index.html             # Main interface
├── styles.css             # Global styles
├── docs/                  # Documentation
├── scenes/                # Scene animation files
├── public/                # Static assets
└── src/                   # Source code
```

### Key Files to Know

- **app.js** — Core rendering engine (1296 lines)
  - Resolution parsing
  - Muxer setup
  - Video/audio encoding
  - Subtitle rendering
  - SRT generation

- **index.html** — UI layout
  - Step 1: Scene File
  - Step 2: Audio
  - Step 3: Video Settings
  - Step 4: Scene Durations
  - Step 5: Subtitles

- **styles.css** — Component styling

---

## Common Tasks

### Adding a New Feature

1. **Identify the feature** — What problem does it solve?
2. **Plan the implementation** — Where in the code?
3. **Implement** — Write the code
4. **Test** — Verify it works
5. **Document** — Update docs
6. **Submit PR** — Create pull request

### Fixing a Bug

1. **Reproduce the bug** — Understand the issue
2. **Locate the code** — Find where it happens
3. **Fix the bug** — Make the change
4. **Test the fix** — Verify it works
5. **Check for side effects** — Ensure nothing else breaks
6. **Submit PR** — Create pull request

### Adding a Scene File

1. **Create HTML** — Define SCENES and RENDERERS
2. **Place in `/scenes`** — Save the file
3. **Update README** — Add to `/scenes/README.md`
4. **Test** — Upload and render
5. **Submit PR** — Create pull request

### Updating Documentation

1. **Identify the section** — What needs updating?
2. **Make changes** — Edit the markdown file
3. **Review** — Check for clarity and accuracy
4. **Submit PR** — Create pull request

---

## Testing

### Manual Testing

1. **Start dev server** — `npm run dev`
2. **Test the feature** — Use the app
3. **Check console** — Look for errors
4. **Test edge cases** — Try unusual inputs
5. **Verify output** — Check rendered video

### Testing Checklist

- [ ] Feature works as expected
- [ ] No console errors
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Code follows style guide

---

## Documentation Guidelines

### For Code Comments

```javascript
// Use clear, concise comments
// Explain WHY, not WHAT (code shows what)
const y = Math.min(h - 50, h * 0.85); // Clamp subtitle within visible bounds
```

### For Markdown Files

- Use clear headings
- Include examples
- Add code blocks with syntax highlighting
- Keep lines under 100 characters
- Use consistent formatting

### For Commit Messages

```
Add feature: Brief description

Longer explanation of what was changed and why.
- Bullet point 1
- Bullet point 2

Fixes #123
```

---

## Code Style

### JavaScript

```javascript
// Use const by default
const value = 42;

// Use let for variables that change
let counter = 0;

// Use arrow functions
const add = (a, b) => a + b;

// Use template literals
const message = `Hello, ${name}!`;

// Use descriptive names
const calculateSubtitlePosition = (height) => {
  return Math.min(height - 50, height * 0.85);
};
```

### HTML

```html
<!-- Use semantic HTML -->
<div class="step">
  <div class="step-header">
    <h2>Step Title</h2>
  </div>
  <div class="step-body">
    <!-- Content -->
  </div>
</div>
```

### CSS

```css
/* Use BEM naming convention */
.component { }
.component__element { }
.component--modifier { }

/* Use CSS variables */
:root {
  --accent: #e8b86d;
  --border: #333;
}

.button {
  background: var(--accent);
  border: 1px solid var(--border);
}
```

---

## Reporting Issues

### Bug Report

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Upload scene file
2. Click render
3. Error appears

## Expected Behavior
Video should render successfully

## Actual Behavior
Error: "Array buffer allocation failed"

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Scene: finalgrok.html
```

### Feature Request

```markdown
## Description
Brief description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives
Other ways to solve this?
```

---

## Review Process

### What Reviewers Look For

- ✅ Code quality and style
- ✅ No breaking changes
- ✅ Documentation updated
- ✅ Tests pass
- ✅ Clear commit messages

### Responding to Feedback

- Be open to suggestions
- Ask for clarification if needed
- Make requested changes
- Push updates to your branch
- Request re-review

---

## Merging

Once approved:

1. Reviewer merges the PR
2. Your branch is deleted
3. Your contribution is live!

---

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes
- Project README (for major contributions)

---

## Questions?

- 📖 Check [docs/](docs/) for detailed guides
- 💬 Open a GitHub Discussion
- 🐛 Create an Issue for bugs

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MP4 Renderer! 🎬
