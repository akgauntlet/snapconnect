# User Flow Document

This document defines the detailed user journeys through SnapConnect, covering all application features and their interconnections. The flows are designed with gamers as the primary persona while maintaining broad appeal and usability.

---

## User Persona

**Primary Target**: Gamers (PC, console, mobile gaming enthusiasts)
- Age: 16-35
- Tech-savvy, early adopters
- Value quick communication, visual content sharing
- Active in gaming communities and social platforms
- Appreciate AI-enhanced features and personalization
- Enjoy flashy visuals, sleek aesthetics, and RGB and/or cohesive neon color schemes

**Secondary Target**: General social media users seeking enhanced ephemeral messaging

---

## Entry Point Flows

### Flow 1: App Download & First Launch

#### 1.1 Initial Onboarding
```
1. User downloads app from app store
2. App launches → Splash screen with SnapConnect branding
3. Welcome screen appears with options:
   - "Sign Up" (primary CTA)
   - "Log In" (secondary CTA)
   - "Continue as Guest" (limited functionality)

**Error States:**
- Network unavailable → Show offline message with retry option
- App crashes on launch → Error reporting dialog
```

#### 1.2 Registration Flow
```
1. User taps "Sign Up"
2. Phone number entry screen
   - Input field for phone number
   - Country code selector
   - "Send Code" button
3. Phone verification
   - 6-digit code input
   - "Resend Code" option (60s cooldown)
   - "Use Email Instead" fallback
4. Profile creation
   - Display name input
   - Username input (with availability check)
   - Profile photo capture/upload (optional)
5. Privacy settings
   - Who can find you (Everyone/Friends/None)
   - Contact sync permission request
6. Tutorial introduction
   - Camera permissions request
   - Microphone permissions request
   - Notification permissions request

**Error States:**
- Invalid phone number → "Please enter a valid phone number"
- Code verification fails → "Invalid code, please try again"
- Username taken → Suggest alternatives with gaming-themed options
- Network timeout → "Connection lost, please try again"
- Permission denied → Explain impact and provide settings link
```

#### 1.3 Tutorial Flow
```
1. Interactive camera tutorial
   - "Take your first snap" prompt
   - AR filter discovery (gaming-themed filters prioritized)
   - "Tap to capture, hold for video"
2. Friend discovery
   - Contact sync results
   - Suggested users based on interests
3. First snap creation
   - Guided photo/video capture
   - Filter application demonstration
   - Caption suggestion (RAG-powered, gaming context aware)
4. Share options introduction
   - Send to friends
   - Add to story
   - Save to memories

**Error States:**
- Camera permission denied → Show manual permission instructions
- No contacts found → Skip to manual friend search
- Filter loading fails → Continue without filters, retry in background
```

### Flow 2: Friend Invitation Entry

#### 2.1 Invitation Link Flow
```
1. User receives invitation link (SMS, social media, gaming platform)
2. Link opens app or app store
3. If app installed:
   - Direct link to friend's profile
   - Auto-friend request option
   - View friend's recent story (if public)
4. If app not installed:
   - App store redirect
   - Post-install deep link to inviting friend

**Error States:**
- Expired invitation link → "This invitation has expired"
- Invalid link → Redirect to general onboarding
- Friend's account deleted → "User not found" message
```

---

## Primary User Flows

### Flow 3: Create & Share Photos/Videos

#### 3.1 Content Creation Flow
```
1. User opens camera (main screen default)
2. Camera interface displays:
   - Capture button (tap for photo, hold for video)
   - Front/rear camera toggle
   - Flash toggle
   - Filter carousel (bottom)
   - AR effects button
   - Gaming overlay toggle (controller UI, game stats, etc.)
3. Content capture:
   - Photo: Single tap, immediate preview
   - Video: Hold button, max 60s, timer visible
   - Gaming mode: Screen recording integration for mobile games
4. Post-capture editing:
   - Filters application
   - Text overlay with gaming fonts/styles
   - Stickers (gaming-themed collection)
   - Drawing tools
   - Crop/rotate tools
   - RAG-powered caption suggestions based on content analysis
5. AI Enhancement (RAG Phase 2):
   - Content analysis recognizes gaming elements
   - Suggests relevant hashtags (#gaming, #fps, #mobile, etc.)
   - Recommends similar content creators to tag
   - Provides context-aware captions

**Error States:**
- Camera fails to initialize → "Camera unavailable, please check permissions"
- Storage full → "Not enough storage space" with cleanup suggestions
- Video recording interrupted → Save partial video with recovery option
- Filter loading fails → Continue without filters, background retry
- RAG service unavailable → Fall back to basic suggestions
```

#### 3.2 Sharing Options Flow
```
1. After content creation, sharing screen appears:
   - Friend list (recent contacts prioritized)
   - "My Story" option
   - Group chat options
   - "Save to Memories" option
2. Friend selection:
   - Search bar for quick friend finding
   - Gaming buddy category
   - Recent interactions prioritized
   - Group creation option
3. Send options:
   - Timer selection (1s, 3s, 5s, 10s, ∞)
   - View once option
   - Screenshot notification toggle
4. RAG-Enhanced Targeting:
   - AI suggests optimal friends based on content
   - Recommends relevant gaming groups
   - Suggests best posting times based on friend activity

**Error States:**
- No friends to send to → Prompt to add friends from contacts
- Send fails → Retry mechanism with offline queue
- Friend's inbox full → Notification with suggested alternative contacts
```

### Flow 4: Stories Feature

#### 4.1 Story Creation Flow
```
1. User accesses story creation:
   - Camera → capture → "Add to Story"
   - Profile → "Add Story" button
   - Stories feed → "Your Story" circle
2. Story-specific editing:
   - Multiple media compilation
   - Story templates (gaming highlights, daily updates)
   - Music integration (gaming soundtracks)
3. Privacy settings:
   - Public (all followers)
   - Gaming buddies only
   - Close friends
   - Custom list selection
4. RAG Enhancement:
   - Auto-generate story highlights from gaming sessions
   - Suggest story themes based on recent gaming activity
   - Recommend optimal posting schedule
   - Content gap analysis (e.g., "You haven't posted FPS content lately")

**Error States:**
- Story upload fails → Save as draft with retry option
- Music licensing unavailable → Suggest alternatives
```

#### 4.2 Story Consumption Flow
```
1. Stories feed display:
   - Friend stories prioritized by engagement
   - Gaming community stories
   - Discover section with gaming content
2. Story viewing:
   - Tap to advance, hold to pause
   - Swipe up for more from user
   - React with gaming-themed emojis
   - Reply directly to story creator
3. Discovery features:
   - Hashtag following (#gaming trends)
   - Featured gaming creator stories
4. RAG Personalization:
   - AI curates story feed based on gaming preferences
   - Suggests stories from similar gamers
   - Identifies trending gaming content
   - Personalizes story order based on engagement patterns

**Error States:**
- Story failed to load → Show placeholder with retry option
- Network interruption → Cache stories for offline viewing
- User blocked/privacy changed → Remove from feed gracefully
```

### Flow 5: Group Messaging

#### 5.1 Group Creation Flow
```
1. User initiates group creation:
   - Messages tab → "New Group" button
   - Friend profile → "Create Group" option
   - Story reply → "Add to Group"
2. Group setup:
   - Group name input (gaming clan suggestions)
   - Group photo selection/capture
   - Member selection (gaming buddies highlighted)
   - Privacy settings (invite permissions)
3. Gaming-specific features:
   - Tournament organization tools
   - Shared gaming calendar
4. RAG Enhancement:
   - Suggest group names based on gaming interests
   - Recommend optimal group size and composition
   - Auto-generate group rules and guidelines
   - Suggest group activities based on member preferences

**Error States:**
- Group creation fails → Save draft and retry
- Member invitation fails → Skip failed invites, notify user
- Name already taken → Suggest alternatives
```

#### 5.2 Group Messaging Flow
```
1. Group conversation interface:
   - Message input with gaming emoji shortcuts
   - Photo/video capture quick access
   - Voice message button
2. Message types:
   - Text with gaming references auto-completion
   - Ephemeral photos/videos
   - Voice messages
   - Gaming clips and screenshots
3. Group management:
   - Add/remove members
   - Admin controls
   - Group settings modification
   - Archive/delete group
4. RAG Features:
   - Smart reply suggestions based on gaming context
   - Auto-summarize long conversations
   - Suggest relevant gaming content to share
   - Identify and highlight important gaming announcements

**Error States:**
- Message fails to send → Show retry button with offline queue
- Member left group → Update group info gracefully
- Group deleted by admin → Archive conversation locally
- Network issues → Show connection status, enable offline mode
```

---

## Secondary Flows

### Flow 6: Profile Management

#### 6.1 Profile Viewing (Self)
```
1. Profile access via bottom navigation
2. Profile elements display:
   - Profile photo and display name
   - Username and gaming tags
   - Story highlights
   - Snap score and achievements
   - Privacy settings quick access
3. RAG Personalization:
   - Gaming achievement suggestions
   - Profile optimization recommendations
   - Content performance insights
   - Friend recommendation improvements

**Error States:**
- Profile data fails to load → Show cached version with refresh option
```

#### 6.2 Profile Viewing (Others)
```
1. Friend profile access:
   - From friend list
   - From message conversation
   - From story viewing
   - From search results
2. Profile actions:
   - Send snap
   - Chat
   - View story
   - Add to close friends
   - Block/report options
3. Gaming integration:
   - Recent gaming achievements
   - Shared gaming history
   - Mutual gaming friends

**Error States:**
- Profile unavailable → "User not found" or "Profile private"
- Blocked user → Hide profile gracefully
- Network issues → Show cached profile data
```

### Flow 7: Search & Discovery

#### 7.1 Friend Search Flow
```
1. Search interface access:
   - Friends tab search bar
   - Add friends button
2. Search methods:
   - Username search
   - Display name search
   - QR code scanning
   - Contact sync results
3. RAG Enhancement:
   - Smart search suggestions
   - Gaming community recommendations
   - Mutual friend analysis
   - Similar gamer identification

**Error States:**
- No search results → Suggest alternative search terms
- Search service unavailable → Fall back to local cache
- Invalid QR code → Provide manual entry option
```

#### 7.2 Content Discovery Flow
```
1. Discover section features:
   - Trending gaming content
   - Featured creators
   - Hashtag exploration
   - Gaming event coverage
2. Personalized recommendations:
   - Based on gaming preferences
   - Friend activity analysis
   - Trending in gaming community
3. RAG-Powered Discovery:
   - Content recommendation engine
   - Gaming trend prediction
   - Creator matching based on interests
   - Event discovery and suggestions

**Error States:**
- Discovery feed fails to load → Show cached content
- Recommendation service down → Fall back to trending content
- No personalized content → Show general gaming trends
```

---

## Error Handling & Edge Cases

### System-Level Error Flows

#### Network Connectivity Issues
```
1. Connection lost detection
2. User notification: "No internet connection"
3. Offline mode activation:
   - Cache recent conversations
   - Queue outgoing messages
   - Allow viewing cached stories
   - Disable camera features requiring upload
4. Connection restored:
   - Auto-sync queued messages
   - Refresh all feeds
   - Re-enable full functionality
```

#### Account Security Issues
```
1. Suspicious activity detection
2. Account temporarily locked
3. Security verification flow:
   - SMS verification
   - Email verification
4. Password/security reset options
5. Account recovery options
```



---

## RAG Integration Points

### Phase 2 Enhancement Details

#### Content Intelligence
- Real-time gaming content recognition
- Auto-tagging with gaming terminology
- Smart cropping for optimal gaming content display
- Performance analytics for gaming creators

#### Personalization Engine
- Gaming preference learning
- Friend recommendation optimization
- Content feed curation based on gaming behavior
- Tournament suggestions

#### Communication Enhancement
- Gaming context-aware auto-replies
- Smart notification filtering for gaming sessions
- Voice-to-text with gaming terminology
- Translation with gaming slang preservation

#### Community Building
- Gaming group formation suggestions
- Tournament and event organization tools
- Gaming achievement celebration automation

---

This document serves as the foundational guide for implementing user journeys that seamlessly blend core social features with RAG-enhanced gaming experiences, ensuring both mainstream appeal and specialized gaming community value. 
