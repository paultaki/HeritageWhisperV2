# Check In - Multi-Instance Coordination

You are starting work on a new task. Follow this protocol:

## Step 1: Read Coordination Doc
Read the file `MULTI_INSTANCE_COORDINATION.md` to see what other instances are working on.

## Step 2: Check for Conflicts
Look at the "Files Owned" sections for all active instances (status 🔄 IN PROGRESS).

If ANY of the files you plan to work on are listed in another instance's "Files Owned" section:
- ⚠️ STOP and alert the user about the conflict
- List which files conflict and which instance owns them
- Ask the user how to proceed

## Step 3: Find Your Instance Section
Ask the user which instance number you are (1-5, or create a new one if needed).

## Step 4: Update Your Section
Update the coordination doc with:
- Status: 🔄 IN PROGRESS
- Files Owned: List the files you'll be working on
- Current Task: Brief description of what you're doing
- Update the Quick Status Dashboard table

## Step 5: Confirm and Start
Tell the user:
- ✅ "Checked in as Instance X"
- ✅ "No conflicts detected" (or list any warnings)
- ✅ "Ready to start work on: [task description]"

Now you can begin your assigned work.
