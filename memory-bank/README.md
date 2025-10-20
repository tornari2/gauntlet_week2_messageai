# Memory Bank

This directory contains structured context files that maintain project knowledge across development sessions. These files help AI assistants (and developers) quickly understand the project state, decisions, and current focus.

## Purpose

The memory-bank serves as:
- **Persistent Context** for AI agents across sessions
- **Onboarding Documentation** for new developers
- **Decision Log** tracking why choices were made
- **Living Documentation** that evolves with the project

## File Structure

### 📋 `projectBrief.md`
**Foundation document** - Start here!
- Project overview and goals
- Target platform and users
- Success criteria
- Timeline and scope
- What's in/out of MVP

**Update when:** Project scope changes, milestones shift

---

### 🎯 `productContext.md`
**Product and user perspective**
- User needs and use cases
- Feature requirements (must-have vs nice-to-have)
- UX principles
- Non-functional requirements
- Future enhancements

**Update when:** New features planned, requirements change

---

### 🏗️ `systemPatterns.md`
**Architecture and coding patterns**
- Design patterns (optimistic updates, real-time sync)
- Component communication patterns
- Code conventions and standards
- Testing patterns
- Performance optimization strategies

**Update when:** New patterns established, conventions defined

---

### 💻 `techContext.md`
**Technology stack and configuration**
- All dependencies and versions
- Project structure
- Environment configuration
- Firebase setup details
- Build and deployment commands

**Update when:** Dependencies added/updated, configuration changes

---

### ⚡ `activeContext.md`
**Current work focus** - Most frequently updated!
- What you're working on right now
- Next immediate steps
- Recent decisions
- Current blockers
- Questions to resolve
- Context for AI agents

**Update:** At start and end of each work session

---

### 📊 `progress.md`
**Status tracking and metrics**
- Overall project progress
- Completed vs pending PRs
- Time tracking
- Test coverage
- Recent accomplishments
- Upcoming work

**Update:** After completing PRs, at end of week

---

## How to Use

### Starting a New Development Session

1. **Read `activeContext.md`** first - Know where you left off
2. **Check `progress.md`** - See what's been completed
3. **Reference relevant docs** based on what you're working on:
   - Implementing a feature? → `systemPatterns.md`
   - Setting up dependencies? → `techContext.md`
   - Understanding requirements? → `productContext.md`

### Working with AI Agents

**Option 1: Explicit Reference**
```
"@activeContext.md what am I working on? Start PR #2"
```

**Option 2: Implicit Context (may work automatically)**
```
"Continue with authentication implementation"
# AI may automatically retrieve relevant context from memory-bank
```

**Option 3: Specific File Reference**
```
"Following patterns in @systemPatterns.md, implement the auth store"
```

### Ending a Development Session

1. **Update `activeContext.md`:**
   - Current PR status
   - Next steps
   - Any blockers encountered
   - Questions that arose

2. **Update `progress.md`:**
   - Mark completed tasks
   - Add time spent
   - Note accomplishments

3. **Update pattern docs if needed:**
   - New conventions established? → `systemPatterns.md`
   - New dependencies? → `techContext.md`

### When to Update Each File

| File | Update Frequency | Trigger |
|------|-----------------|---------|
| `projectBrief.md` | Rarely | Scope/timeline changes |
| `productContext.md` | Occasionally | New features, requirement changes |
| `systemPatterns.md` | As needed | New patterns established |
| `techContext.md` | When changed | Dependencies, config updates |
| `activeContext.md` | Daily | Start/end of sessions |
| `progress.md` | Weekly | PR completion, milestones |

## Tips for Effective Use

### ✅ DO:
- Keep `activeContext.md` current (most important!)
- Reference specific files when asking AI for help
- Update patterns when you establish new conventions
- Track decisions and why they were made
- Add lessons learned to `progress.md`

### ❌ DON'T:
- Let files get stale (especially `activeContext.md`)
- Duplicate information across files
- Include sensitive data (API keys, passwords)
- Write essays - keep it concise and scannable
- Forget to update progress tracking

## Quick Reference Commands

```bash
# View current focus
cat memory-bank/activeContext.md

# Check project status
cat memory-bank/progress.md

# See tech stack
cat memory-bank/techContext.md

# Review patterns
cat memory-bank/systemPatterns.md

# Understand product
cat memory-bank/productContext.md

# Read project brief
cat memory-bank/projectBrief.md
```

## Integration with Other Docs

```
memory-bank/           →  High-level context, current state
    ↓
ARCHITECTURE.md        →  Detailed system design, diagrams
    ↓
IMPLEMENTATION_PLAN.md →  Specific tasks, PR breakdown
    ↓
src/                   →  Actual implementation
```

**Use memory-bank for:** Context, decisions, current focus
**Use ARCHITECTURE.md for:** System design, data flows, patterns
**Use IMPLEMENTATION_PLAN.md for:** Task lists, PR details, tests
**Use src/ code for:** Actual implementation details

## Example Workflow

### Morning: Starting Work
```bash
# 1. Check where you are
cat memory-bank/activeContext.md

# 2. Review next PR
# (See IMPLEMENTATION_PLAN.md for PR #X)

# 3. Ask AI for help
"@activeContext.md @IMPLEMENTATION_PLAN.md Start PR #2"
```

### During Work
```bash
# Reference patterns as needed
"@systemPatterns.md show optimistic update pattern"

# Check tech details
"@techContext.md what's the Firebase structure?"
```

### Evening: End of Day
```bash
# Update active context
# Edit memory-bank/activeContext.md:
# - Current PR status
# - Tomorrow's tasks
# - Any blockers

# Update progress
# Edit memory-bank/progress.md:
# - Mark completed items
# - Log time spent
```

## Benefits

### For You
- **No context switching** - Quickly remember where you were
- **Faster AI help** - AI has context without re-explaining
- **Better decisions** - See past decisions and reasoning
- **Progress tracking** - Know exactly what's done/pending

### For AI Agents
- **Automatic context** - May retrieve relevant files automatically
- **Consistent responses** - Same information across sessions
- **Better suggestions** - Understands project patterns and conventions
- **Faster implementation** - Knows structure, patterns, tech stack

### For Future You (or Teammates)
- **Onboarding** - New developers can read memory-bank to get up to speed
- **Decision history** - Understand why choices were made
- **Pattern reference** - See established conventions
- **Status at a glance** - Know project state without digging through commits

## Maintenance

### Weekly
- Review all files for accuracy
- Archive old decisions to history section
- Update progress metrics
- Clean up completed items

### Monthly
- Consolidate lessons learned
- Update patterns based on what worked
- Refresh tech context if dependencies changed
- Archive old sprint goals

### Per PR
- Update `activeContext.md` when starting new PR
- Mark completed in `progress.md`
- Add new patterns to `systemPatterns.md` if established

## Getting Help

If you're unsure what to update or when, ask:
```
"What should I update in memory-bank after completing PR #3?"
"Help me update activeContext.md with my current status"
"Generate progress update based on what I've done today"
```

---

**Remember:** These files are **for you**. Update them in whatever way helps you work most effectively. The structure is a guide, not a rule.

**Last Updated:** October 20, 2025

