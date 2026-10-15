PIZZA PIE PARLOR - UPDATED TEAM HANDOFF v2.5.0
==============================================
CURRENT BACKEND: v2.2.0 | REFERENCE FRONTEND: Sprint 7.1

This is an UPGRADE to the original Pizza Pie Parlor backend v2.1.3,
not a new project. It retains all original files, preserves the working
backend, and adds the interactive shopping-cart UI and validation tests.
The Pizza Planet-inspired website is a TEMPORARY visual demonstration;
other group members can replace its appearance without rebuilding its API.

START THE WEBSITE ON WINDOWS
----------------------------
1. Extract the ZIP. Open the folder containing package.json.
2. Open PowerShell in that folder. Run ONE COMMAND AT A TIME:

   $env:Path = "C:\Program Files\nodejs;$env:Path"
   npm.cmd ci
   npm.cmd test
   npm.cmd start

3. Keep the server window open. Open this address in a browser:

   http://127.0.0.1:3000/team-demo.html

4. Stop the server with Ctrl+C when finished.

You may also run run-tests.cmd after dependencies are installed, and
run-server.cmd to start the server. If the port is in use, stop the
previous server first. Do not open public/team-demo.html as a file:
it must be loaded from the Express server to reach /api endpoints.
The localhost link only works on the machine running the server.

WHAT IS COMPLETED
-----------------
7.1: Interactive shopping-cart interface: menu loading, customization,
     add, view, quantity changes, remove, and backend-based totals.
7.2: REST cart API: add, view, update, remove, and clear; input safety.
Extra demonstration: Promo editor beside the open cart and an ESTIMATED
     discounted total using backend promo validation. Promo input
     belongs to the separate Task 9.1 in the sprint plan.

The cart is stored in memory; it resets if the server restarts.
Promo estimates do not persist or recalculate checkout tax. There is
no real payment gateway. Team review and final design are still needed.

ORIGINAL WORK AND HISTORY HAVE BEEN PRESERVED
----------------------------------------------
The original v2.1.3 README documented Tasks 1.2, 6.2, and 9.2 and
explained the API, backend decisions, smoke tests, SQL starter files,
and portability. That original document remains available in full:

  docs\history\README_BACKEND_v2.1.3.txt   (for Notepad)
  docs\history\README_BACKEND_v2.1.3.md    (unaltered original)

Its original changelog is also archived in the same folder.
Read UPGRADE_FROM_v2.1.3.txt for what changed and how to merge it.
The latest setup steps in THIS README take precedence over archived ones.

EDIT THE LOOK WITHOUT EDITING BUSINESS LOGIC
---------------------------------------------
What to change                  Current file
------------------------------  -----------------------------------------
Theme/colors/cards/layout       public\cart-demo\css\planet-theme.css
Promo window/backdrop           public\cart-demo\css\promo-modal.css
Truck illustration/hero text    public\team-demo.html
Cart/promo labels               public\cart-demo\js\site-content.js
Dynamic item/cart markup        public\cart-demo\js\view.js (advanced)

Start with DESIGN_EDITING_GUIDE.txt for exact instructions.
Do not change api.js, cart.js, main.js or backend services merely
to adjust appearance. Do not remove HTML IDs used by JavaScript.
NOTE: cart-demo.html has a separate older reference style; its
css/theme.css, layout.css and cart.css are NOT active on team-demo.html.

READ THESE FILES IN NOTEPAD (NO MARKDOWN LINKS NECESSARY)
--------------------------------------------------------
  START_HERE.txt                  Short launch steps
  DESIGN_EDITING_GUIDE.txt        Which website files to edit safely
  UPGRADE_FROM_v2.1.3.txt         What's carried over, upgraded and added
  DOCUMENT_INDEX.txt              List of key files
  REQUIREMENTS_7_1_7_2.txt       Exact sprint task scope
  TROUBLESHOOTING.txt             Windows, server and browser fixes
  docs\TASK_7_2_CART_API.txt    API request/response details
  docs\FRONTEND_INTEGRATION.txt Team-facing API notes
  docs\TESTING.txt             Test instructions
  docs\history\README_BACKEND_v2.1.3.txt  Original explanations

For clickable LOCAL documentation links, double-click OPEN_HANDOFF.html.
Those links open files from the extracted folder in a browser. The live
demo link works only after the server starts.

BEFORE MERGING INTO THE TEAM REPOSITORY
---------------------------------------
- Run npm.cmd test and confirm all tests pass on a teammate's machine.
- Check four menu products, customization, cart quantity and removal.
- Validate PIZZA20; cart should stay open while modal is being used.
- Verify that discount is labeled ESTIMATED and resets on cart changes.
- Verify the browser Console and a smaller mobile screen.
- Review the current team repo for conflicting newer changes.
- Merge code and approve final visual styling as separate decisions.

See CHANGELOG.txt for release history. This handoff changes only
readable documentation relative to the corrected working handoff.
