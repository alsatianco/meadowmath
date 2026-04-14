# Activity Architecture - Meadow Math

This document describes the shared architecture for all activity pages across grade levels.

## Directory Structure

```
meadowmath/
├── css/
│   ├── activity.css          # Shared activity styles (main)
│   ├── activity-shared.css   # Shared utility styles
│   └── ...
├── js/
│   ├── activity-base.js      # ActivityBase class
│   ├── activity-components.js # HTML component generators
│   ├── migration-helper.js   # Migration helper for refactoring
│   └── ...
├── prek/
│   └── activities/
│       ├── activity.css      # Imports ../../css/activity.css
│       ├── activity-shared.css # Imports ../../css/activity-shared.css
│       ├── activity-base.js  # Re-exports for backward compat
│       ├── activity-components.js # Pre-K specific wrapper
│       └── *.html            # Activity pages
├── grade1/
│   └── activities/
│       ├── activity.css      # Imports ../../css/activity.css
│       ├── activity-shared.css # Imports ../../css/activity-shared.css
│       ├── activity-base.js  # Re-exports for backward compat
│       ├── activity-components.js # Grade 1 specific wrapper
│       ├── migration-helper.js # Loads shared migration helper
│       └── *.html            # Activity pages
└── ...
```

## Shared Components

### ActivityBase Class (`js/activity-base.js`)

Base class for all activities providing:

- **Stats tracking**: `incrementCorrect()`, `incrementIncorrect()`
- **Progress indicator**: `renderProgress()`
- **Stats modal**: `showStats()`, `hideStats()`
- **Feedback messages**: `showFeedback()`, `hideFeedback()`
- **Auto-advance**: `autoAdvance(callback, delay)`
- **Translation support**: `t(key, fallback)`, `updateTranslations()`
- **Utility methods**: `randomInt()`, `shuffle()`, `escapeHtml()`, `disableButtons()`, `enableButtons()`

#### Basic Usage

```javascript
class MyActivity extends ActivityBase {
  constructor() {
    super({
      totalRounds: 8,
      activityId: 'my-activity',
      activityName: 'My Activity',
      gradeLevel: 'grade1',
      autoAdvanceDelay: 1500
    });
  }

  init() {
    super.init(); // Initialize base class
    this.nextRound();
  }

  startRound() {
    // Activity-specific logic
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const activity = new MyActivity();
  activity.init();
});
```

### ActivityComponents (`js/activity-components.js`)

Generates common HTML components:

- `getSidebarHTML(config)` - Sidebar navigation
- `getHamburgerHTML()` - Mobile hamburger menu
- `getStatsOverlayHTML(config)` - Stats modal
- `getActivityHeaderHTML(config)` - Activity header
- `getProgressHTML(total, current)` - Progress dots
- `getCommonCSSLinks(basePath)` - CSS link tags
- `getCommonScriptTags(basePath)` - Script tags

### Grade-Specific Wrappers

Each grade level has wrapper modules with pre-configured defaults:

- `prek/activities/activity-components.js` → `PreKComponents`
- `grade1/activities/activity-components.js` → `Grade1Components`

## CSS Architecture

### activity.css (Main Styles)

Contains all activity page styles:
- Activity wrapper and header
- Activity area
- Counting objects
- Counter display
- Feedback messages
- Stats overlay
- Action buttons
- Choice options
- Number buttons
- Comparison game
- Dice
- Progress indicator
- Responsive styles

### activity-shared.css (Utility Styles)

Additional utility styles:
- Enhanced progress indicator
- Hint banner
- Question display
- Choices container
- Common animations

## Migration Guide

### For Existing Activities

1. **Include shared scripts** (after common scripts):
   ```html
   <script src="../../js/activity-base.js"></script>
   <script src="../../js/activity-components.js"></script>
   ```

2. **Update CSS import** (already done for grade-level files):
   ```css
   @import url('../../css/activity.css');
   ```

3. **Refactor activity code**:
   - Remove duplicate utility functions
   - Extend `ActivityBase` or use its methods
   - Use base class for stats tracking, progress, feedback

### Using Migration Helper

```javascript
// Include migration-helper.js and run:
MigrationHelper.analyze();
MigrationHelper.generateTemplate('activity-id', 'Activity Name', 'grade1');
```

## Best Practices

1. **Prefer shared utilities** over duplicating code
2. **Use base class methods** for common functionality
3. **Override only what's necessary** in child classes
4. **Keep activity-specific code** in the activity file
5. **Use i18n keys** for all user-facing text
6. **Test on mobile** - all activities should be responsive

## File Size Comparison

### Before Refactoring
- `prek/activities/activity.css`: 17KB
- `grade1/activities/activity.css`: 17KB (duplicate)
- `grade1/activities/activity-base.js`: 7KB
- `prek/activities/activity-base.js`: 7KB (similar)

### After Refactoring
- `css/activity.css`: 17KB (shared)
- `css/activity-shared.css`: 6KB (shared)
- `js/activity-base.js`: 10KB (unified, more features)
- `js/activity-components.js`: 9KB (new)
- Grade-level files: ~300-500 bytes each (imports only)

**Total savings**: ~30KB+ of duplicate CSS/JS removed
