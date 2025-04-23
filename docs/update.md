# NDISuite UI Enhancement Plan

## Design Goals
- Create a sleek, modern, and minimalistic UI
- Improve light mode with better contrast and visual harmony
- Implement a collapsible sidebar navigation
- Design a structured dashboard with feature territories
- Prepare placeholder sections for upcoming features

## Implementation Steps

### Phase 1: Light Mode Enhancement

- [ ] **Step 1.1:** Update color palette
  - [ ] Define a refined light mode color scheme with proper contrast
  - [ ] Create CSS variables for light mode colors in globals.css
  - [ ] Ensure background/text contrast meets accessibility standards

- [ ] **Step 1.2:** Improve component styling
  - [ ] Enhance button styles with consistent hover/focus states
  - [ ] Add subtle shadows and depth to cards and panels
  - [ ] Implement consistent spacing and alignment system

- [ ] **Step 1.3:** Typography improvements
  - [ ] Update font hierarchy for better readability
  - [ ] Define consistent text styles for headings and body text
  - [ ] Ensure sufficient contrast in all text elements

### Phase 2: Collapsible Sidebar Implementation

- [ ] **Step 2.1:** Create sidebar component structure
  - [ ] Build base sidebar container with collapsible functionality
  - [ ] Implement collapse/expand toggle button
  - [ ] Design sidebar header with NDISuite logo
  
- [ ] **Step 2.2:** Implement sidebar navigation items
  - [ ] Create Dashboard navigation item (active)
  - [ ] Create Report Panel navigation item (active)
  - [ ] Add greyed-out placeholder items for future features:
    - [ ] Scheduling
    - [ ] Billing
    - [ ] Clients
    - [ ] Team Hub
  - [ ] Add visual indicators for active/inactive state

- [ ] **Step 2.3:** Sidebar responsiveness
  - [ ] Make sidebar fully responsive across device sizes
  - [ ] Implement auto-collapse on smaller screens
  - [ ] Ensure smooth transitions for expand/collapse actions

### Phase 3: Dashboard Layout Implementation

- [ ] **Step 3.1:** Create main dashboard structure
  - [ ] Design grid-based layout for feature territories
  - [ ] Implement consistent card components for each section
  - [ ] Create header area with user info and actions

- [ ] **Step 3.2:** Implement Report Panel territory
  - [ ] Create Reports overview section with stats
  - [ ] Add "New Report" button with prominent styling
  - [ ] Design recent reports list with quick actions

- [ ] **Step 3.3:** Design placeholder territories
  - [ ] Create visually appealing but greyed-out sections for:
    - [ ] Scheduling (calendar visualization)
    - [ ] Billing (payment statistics preview)
    - [ ] Clients (client management preview)
    - [ ] Team Hub (collaboration tools preview)
  - [ ] Add "Coming Soon" overlays with subtle animations

### Phase 4: Integration and Testing

- [ ] **Step 4.1:** Connect sidebar navigation to views
  - [ ] Link Dashboard button to dashboard view
  - [ ] Link Report Panel button to reports view
  - [ ] Add tooltips to greyed-out features

- [ ] **Step 4.2:** Ensure theme compatibility
  - [ ] Test all components in both light and dark modes
  - [ ] Fix any contrast or visibility issues
  - [ ] Ensure smooth transitions between themes

- [ ] **Step 4.3:** Responsive testing
  - [ ] Test layout on various screen sizes
  - [ ] Ensure mobile-friendly navigation
  - [ ] Optimize for tablet experiences
