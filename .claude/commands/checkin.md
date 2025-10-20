---
description: Check in to claim files and start working on a task
argument-hint: [task description]
---

# Check In - Multi-Instance Coordination

You are starting work on a new task. Follow this protocol:

## Step 1: Parse User Intent
The user will provide their task description. Extract:
- **Task focus:** What feature/bug they're working on (e.g., "interview improvements", "PDF export")
- **Files mentioned:** Any specific files they mention (optional)

**Example inputs:**
- `/checkin Interview improvements - app/interview-chat/**`
- `/checkin Working on PDF export bug`
- `/checkin Navigation fixes`

## Step 2: Read Coordination Doc
Read `MULTI_INSTANCE_COORDINATION.md` to see what other instances are working on.

## Step 3: Auto-Detect Instance Number
**Smart instance detection:**
1. Look at the task focus keywords (interview, navigation, landing, PDF, prompt, etc.)
2. Match to existing instance sections by focus area
3. If match found: Use that instance number
4. If no match: Find first available instance number (1-5) or create new

**Example:**
- User says "interview improvements" → Match to "Instance 2: Guided Interview Enhancements"
- User says "PDF export" → Match to "Instance 5: PDF Export"
- User says "new feature X" → Find first empty slot or create Instance 6

## Step 4: Check for Conflicts
Look at the "Files Owned" sections for all **other** active instances (status 🔄 IN PROGRESS).

If ANY of the files you plan to work on are listed in another instance's "Files Owned" section:
- ⚠️ STOP and alert the user about the conflict
- List which files conflict and which instance owns them
- Ask the user how to proceed

## Step 5: Update Your Section
Update the coordination doc with:
- Status: 🔄 IN PROGRESS
- Files Owned: List the files you'll be working on (extract from user input or infer from task)
- Current Task: Brief description from user's message
- Update the Quick Status Dashboard table

## Step 6: Confirm and Start
Tell the user:
- ✅ "Checked in as Instance X: [Task Focus]"
- ✅ "Auto-detected from your task description"
- ✅ "No conflicts detected" (or list any warnings)
- ✅ "Files claimed: [list]"
- ✅ "Ready to start work!"

**Note:** User does NOT need to specify instance number - you figure it out from their task description.

Now you can begin your assigned work.
