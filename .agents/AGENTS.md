# Agent Rules & Instructions

## MCP & UI/UX Skill Integration Guidelines

### 21st.dev MCP, Annnimate MCP & `ui-ux-pro-max` Skill Coordination

When designing or building User Interfaces, components, or interactive web pages:

1. **Step 1: Design System & UX Strategy (`ui-ux-pro-max` skill)**
   - Run `python .agents/skills/ui-ux-pro-max/scripts/search.py "<product_type> <keywords>" --design-system` to generate the core design system (color palette, font pairings, visual style, density, and UX guidelines).
   - Use `ui-ux-pro-max` recommendations for theme contrast, responsive spacing, and accessibility standards.

2. **Step 2: Component & Motion Discovery (`21st` & `annnimate` MCP Servers)**
   - Use the `21st` MCP server tools (`21st/search`, `21st/get_component`, `21st/get_theme`, `21st/get_inspiration`, `21st/search_logo`) to discover and import production-ready React / Tailwind / shadcn UI components.
   - Use the `annnimate` MCP server (`https://annnimate.com/api/mcp`) for micro-animations, GSAP motion choreography, and smooth entrance reveals matching the established design system.

3. **Step 3: Verification & Polish**
   - Apply the pre-delivery checklist from `ui-ux-pro-max` (touch targets >=44pt, WCAG contrast standards >=4.5:1, vector icons, no emojis as structural icons).
