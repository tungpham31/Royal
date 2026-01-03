# Minimalist Design System

A clean, professional design system using black, grey, and orange accent colors. Designed for financial applications but applicable to any project requiring a sophisticated, minimal aesthetic.

## Color Palette

### Core Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Black | `#0A0A0A` | `--foreground` | Primary text, headings |
| Dark Grey | `#525252` | `--chart-2` | Secondary text, chart elements |
| Grey | `#737373` | `--chart-3` | Tertiary elements |
| Medium Grey | `#A3A3A3` | `--chart-4`, `--muted-foreground` | Muted text, labels |
| Light Grey | `#D4D4D4` | `--chart-5` | Subtle backgrounds, borders |
| Orange | `#F97316` | `--primary` | Primary accent (use sparingly) |

### Extended Greys (for charts/data visualization)

| Name | Hex | Usage |
|------|-----|-------|
| Charcoal | `#404040` | Dark chart segments |
| Neutral Grey | `#858585` | Mid-tone chart segments |
| Silver Grey | `#BFBFBF` | Light chart segments |

### Semantic Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Error Red | `#EF4444` | `--destructive` | Error messages, form validation, danger zones ONLY |
| Background | `#FFFFFF` | `--background` | Page background |
| Border | `#E5E7EB` | `--border` | Card borders, dividers |

## Design Principles

### 1. No Semantic Color Coding for Data
- **DO NOT** use green for positive values or red for negative values
- All financial amounts use black text regardless of sign
- Use `+` and `-` prefixes to indicate direction instead of color

```tsx
// GOOD - Minimalist approach
<span className="font-semibold tabular-nums">
  {amount > 0 ? "-" : "+"}
  {formatAmount(Math.abs(amount))}
</span>

// BAD - Avoid semantic colors
<span className={amount > 0 ? "text-red-500" : "text-green-500"}>
  {formatAmount(amount)}
</span>
```

### 2. Orange Accent Used Sparingly
- Primary buttons and CTAs
- Active navigation items
- Chart primary data series
- Focus rings and interactive highlights
- **Never** for text content or status indicators

### 3. Grey Scale for Hierarchy
- Black (`#0A0A0A`) - Primary headings, important values
- Dark Grey (`#525252`) - Secondary text, body content
- Medium Grey (`#A3A3A3`) - Labels, captions, muted content
- Light Grey (`#D4D4D4`) - Borders, dividers, subtle backgrounds

### 4. Red Reserved for Errors Only
- Form validation errors
- Authentication failures
- Danger zone warnings (destructive actions)
- **Never** for negative financial values

## CSS Variables

Add these to your `globals.css`:

```css
:root {
  --radius: 0.5rem;

  /* Backgrounds */
  --background: #FFFFFF;
  --foreground: #111827;

  /* Card */
  --card: #FFFFFF;
  --card-foreground: #111827;

  /* Popover */
  --popover: #FFFFFF;
  --popover-foreground: #111827;

  /* Primary - Orange */
  --primary: #F97316;
  --primary-foreground: #FFFFFF;

  /* Secondary */
  --secondary: #F3F4F6;
  --secondary-foreground: #111827;

  /* Muted */
  --muted: #F9FAFB;
  --muted-foreground: #6B7280;

  /* Accent */
  --accent: #F3F4F6;
  --accent-foreground: #111827;

  /* Semantic Colors */
  --destructive: #EF4444; /* Keep red for errors only */
  --success: #0A0A0A; /* Black - no green for positive values */
  --warning: #A3A3A3; /* Grey */

  /* Border & Input */
  --border: #E5E7EB;
  --input: #E5E7EB;
  --ring: #F97316;

  /* Charts - Minimalist grey/orange palette */
  --chart-1: #F97316; /* Orange - primary accent */
  --chart-2: #525252; /* Dark grey */
  --chart-3: #737373; /* Grey */
  --chart-4: #A3A3A3; /* Medium grey */
  --chart-5: #D4D4D4; /* Light grey */

  /* Sidebar */
  --sidebar: #F9FAFB;
  --sidebar-foreground: #111827;
  --sidebar-primary: #F97316;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #F3F4F6;
  --sidebar-accent-foreground: #111827;
  --sidebar-border: #E5E7EB;
  --sidebar-ring: #F97316;
}
```

## Component Patterns

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg">Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-muted-foreground">Secondary text</p>
  </CardContent>
</Card>
```

### Financial Values
```tsx
// Large display value
<div className="text-2xl font-bold tabular-nums">
  {formatAmount(value)}
</div>

// With trend indicator (grey, not colored)
<div className="flex items-center gap-1 text-sm text-muted-foreground">
  <TrendingUp className="h-4 w-4" />
  <span>+{formatAmount(change)} ({percent}%)</span>
</div>
```

### Data Tables / Lists
```tsx
<div className="flex items-center justify-between">
  <div>
    <p className="font-medium">{title}</p>
    <p className="text-sm text-muted-foreground">{subtitle}</p>
  </div>
  <span className="font-semibold tabular-nums">
    {amount > 0 ? "-" : "+"}
    {formatAmount(Math.abs(amount))}
  </span>
</div>
```

### Icons
```tsx
// Primary icons (in headers, with accent)
<Icon className="h-5 w-5 text-primary" />

// Secondary icons (decorative, in lists)
<Icon className="h-5 w-5 text-muted-foreground" />
```

## Chart Configuration

### Recharts Color Palette
```tsx
const CHART_COLORS = [
  "#F97316", // Orange - primary/first series
  "#525252", // Dark grey
  "#737373", // Grey
  "#A3A3A3", // Medium grey
  "#D4D4D4", // Light grey
  "#404040", // Charcoal
  "#858585", // Neutral grey
  "#BFBFBF", // Silver grey
];
```

### Area Chart
```tsx
<AreaChart data={data}>
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
    </linearGradient>
  </defs>
  <Area
    type="monotone"
    dataKey="value"
    stroke="#F97316"
    strokeWidth={2}
    fill="url(#gradient)"
  />
</AreaChart>
```

### Bar Chart (Comparison)
```tsx
<BarChart data={data}>
  <Bar dataKey="primary" fill="#F97316" radius={[4, 4, 0, 0]} />
  <Bar dataKey="secondary" fill="#525252" radius={[4, 4, 0, 0]} />
</BarChart>
```

### Pie Chart
```tsx
const COLORS = [
  "#F97316", "#525252", "#737373", "#A3A3A3",
  "#D4D4D4", "#404040", "#858585", "#BFBFBF"
];

<PieChart>
  <Pie data={data} dataKey="value">
    {data.map((entry, index) => (
      <Cell key={index} fill={COLORS[index % COLORS.length]} />
    ))}
  </Pie>
</PieChart>
```

## Tailwind Utilities

Add these utility classes to your CSS:

```css
@layer utilities {
  /* Tabular numbers for financial data */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  /* Text utilities - both map to foreground (no color distinction) */
  .text-income {
    @apply text-foreground;
  }
  .text-expense {
    @apply text-foreground;
  }
}
```

## Quick Reference

### When to Use Each Color

| Element | Color | Class |
|---------|-------|-------|
| Primary headings | Black | `text-foreground` |
| Body text | Black | `text-foreground` |
| Labels, captions | Medium Grey | `text-muted-foreground` |
| Primary buttons | Orange | `bg-primary` |
| Active nav items | Orange | `text-primary` |
| Chart primary series | Orange | `#F97316` |
| Chart secondary series | Dark Grey | `#525252` |
| Borders | Light Grey | `border-border` |
| Error messages | Red | `text-destructive` |
| All financial amounts | Black | `text-foreground` or no class |

### What NOT to Do

- Don't use green for income/positive values
- Don't use red for expenses/negative values (except errors)
- Don't use blue, purple, pink, or other colors
- Don't use color to convey financial meaning
- Don't overuse the orange accent

## Implementation Checklist

When applying this design system to a new project:

- [ ] Update `globals.css` with CSS variables
- [ ] Remove all `text-success`, `text-green-*` classes from financial displays
- [ ] Remove all `text-destructive`, `text-red-*` classes from financial displays
- [ ] Add `+`/`-` prefix indicators instead of color
- [ ] Update chart libraries to use grey/orange palette
- [ ] Verify red is only used for actual errors
- [ ] Update icons to use `text-muted-foreground` or `text-primary`
