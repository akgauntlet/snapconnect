# Base Components Migration Guide

This guide shows how to replace existing UI elements with the new gaming-themed base components.

## Quick Reference

| Old Component                   | New Component    | Benefits                                    |
| ------------------------------- | ---------------- | ------------------------------------------- |
| `TouchableOpacity` + `Text`     | `CyberButton`    | Gaming aesthetics, loading states, variants |
| `TextInput`                     | `GamingInput`    | RGB borders, validation states, icons       |
| `ActivityIndicator`             | `LoadingSpinner` | Gaming animations, customizable             |
| `TouchableOpacity` + `Ionicons` | `IconButton`     | Consistent styling, active states           |
| Custom cards                    | `GameCard`       | Gaming rarity system, status indicators     |

## Migration Examples

### 1. Button Migration

**Before:**

```tsx
<TouchableOpacity
  onPress={handlePress}
  className="bg-cyan-500 py-3 px-6 rounded-lg"
>
  <Text className="text-white font-bold text-center">Sign In</Text>
</TouchableOpacity>
```

**After:**

```tsx
<CyberButton variant="primary" onPress={handlePress} icon="log-in">
  Sign In
</CyberButton>
```

### 2. Input Migration

**Before:**

```tsx
<TextInput
  value={email}
  onChangeText={setEmail}
  placeholder="Enter email"
  className="border border-gray-300 p-3 rounded"
  keyboardType="email-address"
/>
```

**After:**

```tsx
<GamingInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="Enter email"
  keyboardType="email-address"
  leftIcon="mail-outline"
  variant="default"
/>
```

### 3. Loading Indicator Migration

**Before:**

```tsx
<ActivityIndicator size="large" color="#00ffff" />
```

**After:**

```tsx
<LoadingSpinner
  variant="cyber"
  size="large"
  message="Loading..."
  color="#00ffff"
/>
```

### 4. Icon Button Migration

**Before:**

```tsx
<TouchableOpacity onPress={handleEdit} className="p-2">
  <Ionicons name="create-outline" size={24} color="#00ffff" />
</TouchableOpacity>
```

**After:**

```tsx
<IconButton icon="create-outline" variant="primary" onPress={handleEdit} />
```

### 5. Card Migration

**Before:**

```tsx
<View className="bg-gray-800 p-4 rounded-lg">
  <Text className="text-white font-bold">{title}</Text>
  <Text className="text-gray-300">{subtitle}</Text>
  <View className="flex-row justify-between mt-2">
    <Text className="text-cyan-400">{stat1}</Text>
    <Text className="text-cyan-400">{stat2}</Text>
  </View>
</View>
```

**After:**

```tsx
<GameCard
  title={title}
  subtitle={subtitle}
  type="stats"
  rarity="common"
  stats={[
    { label: "Wins", value: stat1, icon: "trophy" },
    { label: "Score", value: stat2, icon: "star" },
  ]}
/>
```

## Step-by-Step Migration

### 1. Import the Components

Add to your imports:

```tsx
import {
  CyberButton,
  GameCard,
  GamingInput,
  IconButton,
  LoadingSpinner,
} from "@/components/common";
```

### 2. Replace Components Gradually

Start with the most commonly used components:

1. Replace `TouchableOpacity` buttons with `CyberButton`
2. Replace `TextInput` with `GamingInput`
3. Replace `ActivityIndicator` with `LoadingSpinner`
4. Add `GameCard` for data display
5. Use `IconButton` for action buttons

### 3. Update Props

Each component has specific props. Refer to the TypeScript interfaces:

- `CyberButtonProps` for buttons
- `GamingInputProps` for inputs
- `GameCardProps` for cards
- `IconButtonProps` for icon buttons
- `LoadingSpinnerProps` for spinners

### 4. Test Gaming Variants

Try different variants to match your use case:

**CyberButton variants:**

- `primary` - Main actions (cyan)
- `secondary` - Secondary actions (magenta)
- `success` - Positive actions (green)
- `danger` - Destructive actions (red)
- `legendary` - Premium actions (gold)
- `ghost` - Subtle actions (transparent)

**GameCard rarities:**

- `common` - Basic content (gray)
- `rare` - Important content (blue)
- `epic` - Special content (purple)
- `legendary` - Premium content (gold)
- `mythic` - Ultra-rare content (cyan)

## Best Practices

### 1. Consistent Variants

Use the same variants for similar actions across your app:

```tsx
// All primary actions use primary variant
<CyberButton variant="primary">Save</CyberButton>
<CyberButton variant="primary">Submit</CyberButton>

// All destructive actions use danger variant
<CyberButton variant="danger">Delete</CyberButton>
<CyberButton variant="danger">Remove</CyberButton>
```

### 2. Gaming Context

Use appropriate rarity levels for content hierarchy:

```tsx
// User stats - common
<GameCard title="Daily Stats" rarity="common" />

// Achievements - epic or legendary
<GameCard title="Master Achievement" rarity="legendary" />

// Tournament results - mythic
<GameCard title="Tournament Winner" rarity="mythic" />
```

### 3. Loading States

Always provide loading states for async actions:

```tsx
<CyberButton variant="primary" loading={isSubmitting} onPress={handleSubmit}>
  {isSubmitting ? "Submitting..." : "Submit"}
</CyberButton>
```

### 4. Validation States

Use input variants to show validation:

```tsx
<GamingInput
  value={email}
  onChangeText={setEmail}
  variant={emailError ? "error" : isValidEmail ? "success" : "default"}
  error={emailError}
  success={isValidEmail ? "Valid email" : undefined}
/>
```

## Testing Your Migration

1. **Visual Testing**: Verify the gaming aesthetic is consistent
2. **Interaction Testing**: Test all button states and interactions
3. **Loading States**: Verify loading spinners work correctly
4. **Validation**: Test input validation states
5. **Accessibility**: Ensure components are accessible

## Performance Considerations

- Base components are optimized for 60fps gaming performance
- Use `loading` prop instead of conditional rendering for better UX
- `GameCard` supports lazy loading for lists
- `LoadingSpinner` uses React Native Reanimated for smooth animations

## Getting Help

- Check component TypeScript interfaces for available props
- See `BaseComponentsDemo.tsx` for usage examples
- Refer to individual component files for detailed documentation
